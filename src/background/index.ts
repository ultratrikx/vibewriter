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
        })
        .catch((error) => {
            console.error("Error initializing settings:", error);
        });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message, "from:", sender);

    // Handle different message types
    switch (message.type) {
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
                    .catch((error) => {
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
                                .catch((error) => {
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
            }
            return true;

        default:
            console.log("Unhandled message type:", message.type);
            sendResponse({ success: false, error: "Unknown message type" });
    }
});

// Handle tab activation - inject content script if on Google Docs
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs
        .get(activeInfo.tabId)
        .then((tab) => {
            if (tab.url?.startsWith("https://docs.google.com/document/")) {
                // Check if we need to inject the content script
                chrome.scripting
                    .executeScript({
                        target: { tabId: activeInfo.tabId },
                        func: () => {
                            // Check if our content script is already injected
                            return window.hasOwnProperty("vibeWriteInjected");
                        },
                    })
                    .then((results) => {
                        if (results[0]?.result !== true) {
                            console.log(
                                "Content script not detected, injecting..."
                            );
                            chrome.scripting
                                .executeScript({
                                    target: { tabId: activeInfo.tabId },
                                    files: ["content.js"],
                                })
                                .catch((error) => {
                                    console.error(
                                        "Failed to inject content script:",
                                        error
                                    );
                                });

                            chrome.scripting
                                .insertCSS({
                                    target: { tabId: activeInfo.tabId },
                                    files: ["content.css"],
                                })
                                .catch((error) => {
                                    console.error(
                                        "Failed to inject CSS:",
                                        error
                                    );
                                });
                        }
                    })
                    .catch((error) => {
                        console.error(
                            "Error checking for content script:",
                            error
                        );
                    });
            }
        })
        .catch((error) => {
            console.error("Error getting tab info:", error);
        });
});

// Logging to help debug
console.log("VibeWrite background script loaded");
