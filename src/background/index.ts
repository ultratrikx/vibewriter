/**
 * Background Script for VibeWrite extension
 *
 * This script runs in the background and handles communication between
 * popup, content scripts, and the server.
 */

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
        case "CHECK_OLLAMA_CONNECTION":
            console.log("Checking Ollama connection");
            const url = message.data.baseUrl || "http://localhost:11434";

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

        case "GET_OLLAMA_MODELS":
            // Get available models from Ollama
            console.log("Getting available Ollama models");
            const modelUrl = message.data.baseUrl || "http://localhost:11434";

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

        case "OLLAMA_API_REQUEST":
            console.log("Processing Ollama API request in background");

            // Extract Ollama API request details
            const { baseUrl, model, prompt } = message.data;

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

        case "GET_API_KEY":
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

        case "ANALYZE_DOCUMENT":
            // Forward the analyze document message to the content script
            if (sender.tab && sender.tab.id) {
                chrome.tabs
                    .sendMessage(sender.tab.id, { type: "ANALYZE_DOCUMENT" })
                    .then(() => {
                        console.log(
                            "Forwarded ANALYZE_DOCUMENT message to content script"
                        );
                        sendResponse({ success: true });
                    })
                    .catch((error: Error) => {
                        console.error(
                            "Error forwarding ANALYZE_DOCUMENT message:",
                            error
                        );
                        sendResponse({
                            success: false,
                            error: "Failed to forward message",
                        });
                    });
            } else {
                // We're receiving from the content script, forward to the active tab
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                        if (tabs[0]?.id) {
                            chrome.tabs
                                .sendMessage(tabs[0].id, {
                                    type: "ANALYZE_DOCUMENT",
                                })
                                .then(() => {
                                    console.log(
                                        "Forwarded ANALYZE_DOCUMENT to active tab"
                                    );
                                    sendResponse({ success: true });
                                })
                                .catch((error: Error) => {
                                    console.error(
                                        "Error forwarding to active tab:",
                                        error
                                    );
                                    sendResponse({
                                        success: false,
                                        error: "Failed to forward message",
                                    });
                                });
                        } else {
                            sendResponse({
                                success: false,
                                error: "No active tab found",
                            });
                        }
                    }
                );
                return true;
            }
            return true;

        case "TOGGLE_SIDEBAR":
            // Handle toggling the sidebar in the content script
            if (sender.tab?.id) {
                chrome.tabs
                    .sendMessage(sender.tab.id, { type: "TOGGLE_SIDEBAR" })
                    .then((response) => {
                        sendResponse(response);
                    })
                    .catch((error: Error) => {
                        console.error("Error toggling sidebar:", error);
                        sendResponse({
                            success: false,
                            error: "Failed to toggle sidebar",
                        });
                    });
            } else {
                // Inject content script if not already present
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                        if (!tabs[0]?.id) {
                            sendResponse({
                                success: false,
                                error: "No active tab found",
                            });
                            return;
                        }

                        // Check if content script is already injected
                        chrome.tabs
                            .sendMessage(tabs[0].id, { type: "PING" })
                            .then(() => {
                                // Content script is already injected, toggle sidebar
                                return chrome.tabs.sendMessage(tabs[0].id!, {
                                    type: "TOGGLE_SIDEBAR",
                                });
                            })
                            .then((response) => {
                                sendResponse(response);
                            })
                            .catch(() => {
                                // Content script not injected, check if we're on Google Docs
                                if (
                                    tabs[0].url?.startsWith(
                                        "https://docs.google.com/document/"
                                    )
                                ) {
                                    // Inject content script
                                    chrome.scripting
                                        .executeScript({
                                            target: { tabId: tabs[0].id! },
                                            files: ["content.js"],
                                        })
                                        .then(() => {
                                            // Wait a bit for content script to initialize
                                            setTimeout(() => {
                                                chrome.tabs
                                                    .sendMessage(tabs[0].id!, {
                                                        type: "TOGGLE_SIDEBAR",
                                                    })
                                                    .then((response) => {
                                                        sendResponse(response);
                                                    })
                                                    .catch((error: Error) => {
                                                        console.error(
                                                            "Error after script injection:",
                                                            error
                                                        );
                                                        sendResponse({
                                                            success: false,
                                                            error: "Failed after script injection",
                                                        });
                                                    });
                                            }, 500);
                                        })
                                        .catch((error: Error) => {
                                            console.error(
                                                "Error injecting content script:",
                                                error
                                            );
                                            sendResponse({
                                                success: false,
                                                error: "Failed to inject content script",
                                            });
                                        });
                                } else {
                                    sendResponse({
                                        success: false,
                                        error: "Not a Google Docs page",
                                    });
                                }
                            });
                    }
                );
            }
            return true;

        case "GET_DOCUMENT_CONTENT_FROM_BACKGROUND":
            console.log(
                "Background script received GET_DOCUMENT_CONTENT_FROM_BACKGROUND"
            );
            // Since the background script can't access the document directly,
            // we'll need to relay this to the content script in the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    console.log(
                        `Sending GET_DOCUMENT_CONTENT to tab ${tabs[0].id}`
                    );
                    chrome.tabs
                        .sendMessage(tabs[0].id, {
                            type: "GET_DOCUMENT_CONTENT",
                        })
                        .then((response) => {
                            console.log(
                                "Got response from content script:",
                                response
                            );
                            if (response?.success && response?.data?.content) {
                                sendResponse({
                                    success: true,
                                    data: { content: response.data.content },
                                });
                            } else {
                                sendResponse({
                                    success: false,
                                    data: {
                                        error: "Failed to retrieve document content",
                                    },
                                });
                            }
                        })
                        .catch((error) => {
                            console.error(
                                "Error sending message to content script:",
                                error
                            );
                            sendResponse({
                                success: false,
                                data: {
                                    error: "Communication with content script failed",
                                },
                            });
                        });
                } else {
                    console.error("No active tab found");
                    sendResponse({
                        success: false,
                        data: { error: "No active tab found" },
                    });
                }
            });
            return true; // We will send response asynchronously

        case "GET_DOCUMENT_CONTENT_RELAY":
            console.log(
                "Background script relaying document content request to active tab"
            );
            // Find active tab and relay the message
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs
                        .sendMessage(tabs[0].id, {
                            type: "GET_DOCUMENT_CONTENT_RELAY",
                            source: "background",
                        })
                        .catch((error) => {
                            console.error(
                                "Error relaying message to tab:",
                                error
                            );
                        });
                }
            });
            return false; // No response needed

        default:
            console.log("Unknown message type:", message.type);
            sendResponse({ success: false, error: "Unknown message type" });
            return true;
    }
});
