/**
 * Background Script for VibeWrite extension
 *
 * This script runs in the background and handles communication between
 * popup, content scripts, and the server.
 */

import { Message, Response } from "../utils/types";

// Listen for installation events
chrome.runtime.onInstalled.addListener((details) => {
    console.log("VibeWrite installed:", details); // Set default settings
    chrome.storage.sync
        .set({
            useDarkMode: false,
            autoSuggest: false,
            aiProvider: "openai",
            aiModel: "gpt-4",
            ollamaBaseUrl: "http://localhost:11434",
        })
        .then(() => {
            console.log("Default settings initialized");

            // Test Ollama connectivity on install
            checkOllamaConnection("http://localhost:11434");
        })
        .catch((error) => {
            console.error("Error initializing settings:", error);
        });
});

// Helper function to check if Ollama server is accessible
async function checkOllamaConnection(baseUrl: string) {
    try {
        console.log("Testing connection to Ollama server at", baseUrl);
        const response = await fetch(`${baseUrl}/api/tags`);

        if (response.ok) {
            const data = await response.json();
            console.log(
                "Ollama connection successful. Available models:",
                data.models?.map((m: any) => m.name).join(", ")
            );
            return true;
        } else {
            console.warn(
                `Ollama server returned status ${response.status}: ${response.statusText}`
            );
            return false;
        }
    } catch (error) {
        console.warn("Could not connect to Ollama server:", error);
        return false;
    }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message, "from:", sender);

    // Handle different message types
    switch (message.type) {
        case "CHECK_OLLAMA_CONNECTION": {
            console.log("Checking Ollama connection");
            const url = message.data?.baseUrl || "http://localhost:11434";

            checkOllamaConnection(url)
                .then((isConnected) => {
                    console.log("Ollama connection result:", isConnected);
                    sendResponse({
                        success: true,
                        isConnected: isConnected,
                    });
                })
                .catch((error) => {
                    console.error("Error checking Ollama connection:", error);
                    sendResponse({
                        success: false,
                        isConnected: false,
                        error: error.message,
                    });
                });

            return true; // Important: indicates we'll respond asynchronously
        }

        case "GET_OLLAMA_MODELS": {
            // Get available models from Ollama
            console.log("Getting available Ollama models");
            const modelUrl = message.data?.baseUrl || "http://localhost:11434";

            fetch(`${modelUrl}/api/tags`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Ollama server returned ${response.status}: ${response.statusText}`
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Available Ollama models:", data);
                    sendResponse({
                        success: true,
                        models: data.models || [],
                    });
                })
                .catch((error) => {
                    console.error("Error getting Ollama models:", error);
                    sendResponse({
                        success: false,
                        error: error.message,
                    });
                });

            return true; // Important: indicates we'll respond asynchronously
        }

        case "GET_DOCUMENT_CONTENT_API": {
            console.log(
                "Background: received GET_DOCUMENT_CONTENT_API for doc",
                message.data?.docId
            );
            const docId = message.data?.docId;

            // Exchange OAuth token and call Google Docs REST API
            chrome.identity.getAuthToken(
                { interactive: true },
                async function (token) {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "Error getting auth token:",
                            chrome.runtime.lastError
                        );
                        sendResponse({
                            success: false,
                            error: chrome.runtime.lastError.message,
                        });
                        return;
                    }

                    try {
                        // Make authenticated request to Google Docs API
                        const resp = await fetch(
                            `https://docs.googleapis.com/v1/documents/${docId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        if (!resp.ok) {
                            throw new Error(
                                `Google Docs API returned ${resp.status}: ${resp.statusText}`
                            );
                        }

                        const json = await resp.json();
                        console.log(
                            "API response received, processing document content"
                        );

                        // Flatten body content to text
                        let content = "";
                        if (json.body && json.body.content) {
                            for (const structuralElement of json.body.content) {
                                if (structuralElement.paragraph) {
                                    for (const elem of structuralElement
                                        .paragraph.elements || []) {
                                        if (
                                            elem.textRun &&
                                            elem.textRun.content
                                        ) {
                                            content += elem.textRun.content;
                                        }
                                    }
                                }
                            }
                        }

                        console.log(
                            `Extracted ${content.length} characters from document`
                        );
                        sendResponse({ success: true, data: { content } });
                    } catch (err) {
                        console.error("Error fetching document via API:", err);
                        const errorMessage =
                            err instanceof Error ? err.message : String(err);
                        sendResponse({
                            success: false,
                            error: errorMessage,
                        });
                    }
                }
            );
            return true;
        }

        case "GET_DOCUMENT_CONTENT_RELAY": {
            console.log(
                "Background script relaying document content request to active tab"
            );
            if (sender.tab && sender.tab.id) {
                // Forward the request to content script in the active tab
                chrome.tabs.sendMessage(
                    sender.tab.id,
                    { type: "GET_DOCUMENT_CONTENT_RELAY" },
                    (response) => {
                        console.log("Relay response received:", response);
                        sendResponse(response);
                    }
                );
            } else {
                // Try to find active tab if sender tab not available
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                        if (tabs.length > 0 && tabs[0].id) {
                            chrome.tabs.sendMessage(
                                tabs[0].id,
                                { type: "GET_DOCUMENT_CONTENT_RELAY" },
                                (response) => {
                                    console.log(
                                        "Relay response from query:",
                                        response
                                    );
                                    sendResponse(response);
                                }
                            );
                        } else {
                            sendResponse({
                                success: false,
                                error: "Could not find active tab for relay",
                            });
                        }
                    }
                );
            }
            return true;
        }

        case "OLLAMA_API_REQUEST": {
            console.log("Processing Ollama API request in background");

            // Extract Ollama API request details
            const { baseUrl, model, prompt } = message.data || {};

            // Make the Ollama API call from the background script to avoid CORS
            fetch(`${baseUrl}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 500,
                    },
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Ollama server returned ${response.status}: ${response.statusText}`
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Ollama API response received:", data);
                    sendResponse({
                        success: true,
                        data: data,
                    });
                })
                .catch((error) => {
                    console.error("Error in Ollama API call:", error);
                    sendResponse({
                        success: false,
                        error: error.message,
                    });
                });

            return true; // Important: indicates we'll respond asynchronously
        }

        case "GET_API_KEY": {
            chrome.storage.sync
                .get("openaiApiKey")
                .then((result) => {
                    sendResponse({
                        success: true,
                        data: result.openaiApiKey || "",
                    });
                })
                .catch((error) => {
                    console.error("Error getting API key:", error);
                    sendResponse({
                        success: false,
                        error: "Failed to retrieve API key",
                    });
                });
            return true; // Important: indicates we'll respond asynchronously
        }

        default: {
            console.log("Unhandled message type:", message.type);
            sendResponse({
                success: false,
                error: `Unhandled message type: ${message.type}`,
            });
            return false;
        }
    }
});
