/**
 * Content Script for VibeWrite - Google Docs Integration
 *
 * This script is injected into Google Docs pages and handles:
 * - Adding UI elements to the Google Docs interface
 * - Creating and managing the sidebar
 * - Communicating with the Google Docs document
 * - Sending document content to the background script
 */

import { GoogleDocsAPI } from "../utils/google-docs-api";
import { Message, Response } from "../utils/types";

// Flag to prevent duplicate injections
declare global {
    interface Window {
        vibeWriteInjected?: boolean;
    }
}

// If already injected, exit early
if (window.vibeWriteInjected) {
    console.log("VibeWrite already injected, skipping...");
} else {
    window.vibeWriteInjected = true;
    console.log("VibeWrite content script loaded");

    // Initialize VibeWrite after the page has fully loaded
    window.addEventListener("load", initVibeWrite);
}

// Main initialization function
async function initVibeWrite() {
    console.log("Initializing VibeWrite...");

    // Only run on Google Docs document pages
    if (!GoogleDocsAPI.isInGoogleDocs()) {
        console.log("Not in a Google Docs document, exiting...");
        return;
    }

    // Wait for the Google Docs UI to fully load
    await waitForElement(".docs-titlebar-buttons");

    // Start periodic document content monitoring for debugging
    startDocumentMonitoring();

    // Add our custom UI elements
    addVibeWriteUI();

    // Set up message handling
    setupMessageHandlers();
}

// Monitor document content availability
function startDocumentMonitoring() {
    debugLog("Starting document content monitoring...");

    // Enable debug logging in GoogleDocsAPI
    GoogleDocsAPI.startDebugLogging();

    // Also perform our own check to ensure document is accessible
    let checkCount = 0;
    const maxChecks = 20;

    const checkInterval = setInterval(() => {
        checkCount++;

        try {
            const content = GoogleDocsAPI.getDocumentContent();
            if (content) {
                debugLog(
                    `Document content monitoring: Content accessible (${content.length} chars)`
                );
                clearInterval(checkInterval);
                GoogleDocsAPI.stopDebugLogging(); // Stop logging once we confirm it works
            } else {
                debugLog(
                    `Document content monitoring: No content available (check ${checkCount}/${maxChecks})`
                );
            }
        } catch (err) {
            debugLog(
                "Document content monitoring: Error accessing content",
                err
            );
        }

        // Stop checking after maxChecks
        if (checkCount >= maxChecks) {
            debugLog(
                "Document content monitoring: Max checks reached, stopping monitoring"
            );
            clearInterval(checkInterval);
        }
    }, 3000);
}

// Function to create and add the VibeWrite UI to Google Docs
function addVibeWriteUI() {
    try {
        // Create the sidebar container
        const sidebarContainer = document.createElement("div");
        sidebarContainer.className = "vibewrite-sidebar-container";
        sidebarContainer.id = "vibewrite-sidebar";
        document.body.appendChild(sidebarContainer);

        debugLog("Sidebar container created and added to DOM", {
            id: sidebarContainer.id,
            className: sidebarContainer.className,
            parentElement: sidebarContainer.parentElement?.tagName,
        });

        // Create the sidebar iframe
        const sidebarIframe = document.createElement("iframe");
        sidebarIframe.id = "vibewrite-sidebar-iframe"; // Add a specific ID for easier selection
        sidebarIframe.style.width = "100%";
        sidebarIframe.style.height = "100%";
        sidebarIframe.style.border = "none";
        sidebarIframe.allow = "clipboard-read; clipboard-write"; // Add permissions
        sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
        sidebarContainer.appendChild(sidebarIframe);

        // Store iframe reference in window for easy access from anywhere
        (window as any).vibeWriteSidebarIframe = sidebarIframe;

        // Add a load event listener to verify the iframe loaded properly
        sidebarIframe.addEventListener("load", () => {
            debugLog("Sidebar iframe loaded", {
                src: sidebarIframe.src,
                hasContentWindow: !!sidebarIframe.contentWindow,
                readyState:
                    sidebarIframe.contentDocument?.readyState || "unknown",
            });
        });

        // Add VibeWrite buttons to the Google Docs toolbar
        const toolbarContainer = document.querySelector(
            ".docs-titlebar-buttons"
        );
        if (toolbarContainer) {
            // Create container for our buttons
            const vibeWriteToolbar = document.createElement("div");
            vibeWriteToolbar.className = "vibewrite-toolbar";
            vibeWriteToolbar.style.display = "inline-flex";
            vibeWriteToolbar.style.alignItems = "center"; // Create toggle sidebar button
            const toggleSidebarButton = document.createElement("button");
            toggleSidebarButton.className = "vibewrite-button";
            toggleSidebarButton.textContent = "VibeWrite";
            toggleSidebarButton.style.backgroundColor = "#1a73e8";
            toggleSidebarButton.style.color = "white";
            toggleSidebarButton.style.padding = "8px 12px";
            toggleSidebarButton.style.border = "none";
            toggleSidebarButton.style.borderRadius = "4px";
            toggleSidebarButton.style.cursor = "pointer";
            toggleSidebarButton.style.marginRight = "10px";
            toggleSidebarButton.addEventListener("click", toggleSidebar);

            // Create analyze button
            const analyzeButton = document.createElement("button");
            analyzeButton.className = "vibewrite-button";
            analyzeButton.textContent = "Analyze";
            analyzeButton.addEventListener("click", analyzeDocument);

            // Create feedback button
            const feedbackButton = document.createElement("button");
            feedbackButton.className = "vibewrite-button";
            feedbackButton.textContent = "Add Feedback";
            feedbackButton.addEventListener("click", addFeedback);

            // Add buttons to the toolbar
            vibeWriteToolbar.appendChild(toggleSidebarButton);
            vibeWriteToolbar.appendChild(analyzeButton);
            vibeWriteToolbar.appendChild(feedbackButton);

            // Insert our toolbar before the share button
            toolbarContainer.insertBefore(
                vibeWriteToolbar,
                toolbarContainer.firstChild
            );

            debugLog("VibeWrite UI added successfully");
        }
    } catch (error) {
        debugLog("Error adding VibeWrite UI:", error);
    }
}

// Function to toggle the sidebar
function toggleSidebar() {
    const sidebar = document.getElementById("vibewrite-sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

// Function to analyze the document and show suggestions
function analyzeDocument() {
    // Make sure the sidebar is open
    const sidebar = document.getElementById("vibewrite-sidebar");
    if (sidebar && !sidebar.classList.contains("open")) {
        sidebar.classList.add("open");
    }

    // Send the analyze message directly to the sidebar iframe
    const sidebarIframe = document.querySelector("#vibewrite-sidebar iframe");
    if (sidebarIframe) {
        debugLog("Sending ANALYZE_DOCUMENT to sidebar iframe");
        (sidebarIframe as HTMLIFrameElement).contentWindow?.postMessage(
            { type: "ANALYZE_DOCUMENT" },
            "*"
        );
    } else {
        debugLog("Could not find sidebar iframe");
        // Fallback to sending via chrome runtime messaging
        chrome.runtime.sendMessage({ type: "ANALYZE_DOCUMENT" });
    }
}

// Function to add feedback to selected text
function addFeedback() {
    // Get the selected text
    const selectedText = GoogleDocsAPI.getSelectedText();

    if (!selectedText) {
        alert("Please select some text to give feedback on.");
        return;
    }

    // Open the sidebar
    const sidebar = document.getElementById("vibewrite-sidebar");
    if (sidebar && !sidebar.classList.contains("open")) {
        sidebar.classList.add("open");
    }

    // Send a message to the sidebar to analyze the selected text
    chrome.runtime.sendMessage({
        type: "CHAT_REQUEST",
        payload: {
            message: `Please review and improve the following text: "${selectedText}"`,
            selectedText,
        },
    });
}

// Set up message handlers
function setupMessageHandlers() {
    debugLog("Setting up message handlers...");

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener(
        (
            message: Message,
            sender,
            sendResponse: (response: Response) => void
        ) => {
            debugLog("Content script received message:", message);

            switch (message.type) {
                case "ANALYZE_DOCUMENT":
                    debugLog("Received ANALYZE_DOCUMENT message");
                    postMessageToSidebar({ type: "ANALYZE_DOCUMENT" });
                    sendResponse({ success: true });
                    break;
                case "GET_DOCUMENT_CONTENT":
                    debugLog(
                        "Received GET_DOCUMENT_CONTENT message from chrome.runtime"
                    );
                    // Try standard method first
                    let content = GoogleDocsAPI.getDocumentContent();

                    // If that fails, try forced retrieval
                    if (!content) {
                        debugLog(
                            "Standard retrieval failed, trying forced method..."
                        );
                        content = GoogleDocsAPI.forceGetDocumentContent();
                    }

                    sendResponse({
                        success: !!content,
                        data: { content: content || "" },
                        error: !content
                            ? "Could not retrieve document content"
                            : undefined,
                    });
                    break;
                case "GET_DOCUMENT_CONTENT_RELAY":
                    console.log(
                        "Content script received relay request from background"
                    );
                    // Get content and broadcast it to any listening iframes
                    try {
                        const content = GoogleDocsAPI.forceGetDocumentContent();
                        debugLog("Got document content via relay", {
                            contentLength: content?.length || 0,
                        });

                        // Broadcast to any potential listeners
                        window.postMessage(
                            {
                                type: "DOCUMENT_CONTENT_RESPONSE",
                                content: content || "",
                                source: "content-relay",
                            },
                            "*"
                        );

                        // Also try to send directly to the iframe if we have a reference
                        const sidebarIframe = document.getElementById(
                            "vibewrite-sidebar-iframe"
                        ) as HTMLIFrameElement;
                        if (sidebarIframe?.contentWindow) {
                            sidebarIframe.contentWindow.postMessage(
                                {
                                    type: "DOCUMENT_CONTENT_RESPONSE",
                                    content: content || "",
                                    source: "content-direct",
                                },
                                "*"
                            );
                        }

                        sendResponse({ success: true });
                    } catch (error) {
                        console.error(
                            "Error relaying document content:",
                            error
                        );
                        sendResponse({
                            success: false,
                            error: "Failed to relay document content",
                        });
                    }
                    break;
                default:
                    debugLog("Unknown message type:", message.type);
                    sendResponse({
                        success: false,
                        error: "Unknown message type",
                    });
            }

            return true; // Important: indicates we'll respond asynchronously
        }
    ); // Also listen for messages from the sidebar iframe
    window.addEventListener("message", (event) => {
        // Accept messages from the sidebar iframe, but log and debug them regardless of source
        debugLog(
            "Content script received window message:",
            event.data,
            "Source:",
            event.source
        );

        // Debug sidebar iframe element
        const sidebarIframe =
            document.querySelector<HTMLIFrameElement>("#vibewrite-sidebar");
        debugLog(
            "Sidebar iframe element:",
            sidebarIframe,
            "with contentWindow:",
            sidebarIframe?.contentWindow
        );

        // Check event source but don't block messages during development
        const isFromSidebar = event.source === sidebarIframe?.contentWindow;
        if (!isFromSidebar) {
            debugLog(
                "Message not from sidebar iframe, but processing anyway for debugging"
            );
            // Remove this comment and the next line to enforce strict source checking in production
            // return;
        }

        if (event.data && event.data.type === "GET_DOCUMENT_CONTENT") {
            debugLog("Processing GET_DOCUMENT_CONTENT request from sidebar");

            try {
                // First try regular method
                let content = GoogleDocsAPI.getDocumentContent();

                // If that fails, try forced retrieval
                if (!content) {
                    debugLog(
                        "Standard content retrieval failed, trying forced method..."
                    );
                    content = GoogleDocsAPI.forceGetDocumentContent();
                }

                // If we still don't have content, try one more approach with a delay
                if (!content) {
                    debugLog("Trying delayed retrieval as last resort...");
                    setTimeout(() => {
                        const lastResortContent =
                            GoogleDocsAPI.forceGetDocumentContent();
                        postMessageToSidebar({
                            type: "DOCUMENT_CONTENT_RESPONSE",
                            content:
                                lastResortContent ||
                                "Empty document or content cannot be accessed",
                        });
                    }, 1000);
                    // Return early, the delayed function will handle sending the message
                    return;
                }

                // Send the content back to the sidebar
                postMessageToSidebar({
                    type: "DOCUMENT_CONTENT_RESPONSE",
                    content: content || "",
                });

                debugLog(
                    `Sent document content to sidebar (${
                        content?.length || 0
                    } characters)`
                );
            } catch (error) {
                debugLog("Error getting document content:", error);

                // Try forced retrieval as a last resort
                try {
                    const emergencyContent =
                        GoogleDocsAPI.forceGetDocumentContent();
                    if (emergencyContent) {
                        postMessageToSidebar({
                            type: "DOCUMENT_CONTENT_RESPONSE",
                            content: emergencyContent,
                        });
                        debugLog(
                            `Sent emergency document content to sidebar (${emergencyContent.length} characters)`
                        );
                        return;
                    }
                } catch (e) {
                    debugLog("Emergency content retrieval also failed:", e);
                }

                // Send error back to the sidebar
                postMessageToSidebar({
                    type: "DOCUMENT_CONTENT_RESPONSE",
                    error: "Failed to retrieve document content",
                });
            }
        } else if (event.data && event.data.type === "GET_SELECTED_TEXT") {
            debugLog("Processing GET_SELECTED_TEXT request from sidebar");

            try {
                // Get selected text using GoogleDocsAPI
                const selectedText = GoogleDocsAPI.getSelectedText();

                // Send the text back to the sidebar
                postMessageToSidebar({
                    type: "SELECTED_TEXT_RESPONSE",
                    text: selectedText || "",
                });

                debugLog(
                    `Sent selected text to sidebar (${
                        selectedText?.length || 0
                    } characters)`
                );
            } catch (error) {
                debugLog("Error getting selected text:", error);

                // Send error back to the sidebar
                postMessageToSidebar({
                    type: "SELECTED_TEXT_RESPONSE",
                    text: "",
                    error: "Failed to retrieve selected text",
                });
            }
        }
    });
}

// Helper function to post messages to the sidebar iframe
function postMessageToSidebar(message: any) {
    debugLog("Attempting to post message to sidebar:", message);

    // First try the direct sidebar ID with iframe
    const sidebarIframeInContainer = document.querySelector<HTMLIFrameElement>(
        "#vibewrite-sidebar iframe"
    );
    if (sidebarIframeInContainer?.contentWindow) {
        debugLog("Found iframe inside sidebar container, posting message");
        sidebarIframeInContainer.contentWindow.postMessage(message, "*");
        return;
    }

    // Then try the sidebar container itself
    const sidebarContainer =
        document.querySelector<HTMLIFrameElement>("#vibewrite-sidebar");
    if (sidebarContainer?.contentWindow) {
        debugLog("Found sidebar container with contentWindow, posting message");
        sidebarContainer.contentWindow.postMessage(message, "*");
        return;
    }

    // Try fallback selectors
    const fallbackSelectors = [
        ".vibewrite-sidebar-container iframe",
        ".vibewrite-sidebar",
        "iframe[src*='sidebar.html']",
        "iframe", // Last resort, try any iframe
    ];

    for (const selector of fallbackSelectors) {
        const element = document.querySelector<HTMLIFrameElement>(selector);
        if (element?.contentWindow) {
            debugLog(
                `Found element using fallback selector "${selector}", posting message`
            );
            element.contentWindow.postMessage(message, "*");
            return;
        }
    }

    // If all else fails, broadcast to all potential windows
    debugLog("Could not find sidebar iframe, broadcasting message");

    // Try parent and top windows as last resort
    if (window.parent && window.parent !== window) {
        debugLog("Broadcasting message to parent window");
        window.parent.postMessage(message, "*");
    }

    if (window.top && window.top !== window && window.top !== window.parent) {
        debugLog("Broadcasting message to top window");
        window.top.postMessage(message, "*");
    }

    debugLog("Could not find any suitable target for message");
}

// Helper function to wait for an element to be present in the DOM
function waitForElement(selector: string, timeout = 10000): Promise<Element> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        function checkElement() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout waiting for element: ${selector}`));
            } else {
                setTimeout(checkElement, 100);
            }
        }

        checkElement();
    });
}

// Helper function for enhanced debug logging
function debugLog(context: string, ...args: any[]) {
    const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
    console.log(`[VibeWrite Debug ${timestamp}] ${context}:`, ...args);

    // Also log DOM state for debugging
    if (context.includes("document content")) {
        logDOMState();
    }
}

// Log the current DOM state for debugging
function logDOMState() {
    try {
        // Log DOM structure information
        const sidebarElement = document.querySelector("#vibewrite-sidebar");
        const sidebarIframe = document.querySelector(
            "#vibewrite-sidebar iframe"
        );
        const paragraphs = document.querySelectorAll(".kix-paragraphrenderer");

        debugLog("DOM State", {
            url: window.location.href,
            isGoogleDocs: window.location.hostname === "docs.google.com",
            sidebarExists: !!sidebarElement,
            sidebarIframeExists: !!sidebarIframe,
            paragraphCount: paragraphs.length,
            bodyChildCount: document.body.childElementCount,
            hasEditorElement: !!document.querySelector(
                ".docs-editor-container"
            ),
        });

        // Check if any content retrieval method works
        const standardContent = GoogleDocsAPI.getDocumentContent();
        const forcedContent = GoogleDocsAPI.forceGetDocumentContent();

        debugLog("Content Retrieval Test", {
            standardContentWorks: !!standardContent,
            standardContentLength: standardContent?.length || 0,
            forcedContentWorks: !!forcedContent,
            forcedContentLength: forcedContent?.length || 0,
        });
    } catch (err) {
        console.error("Error logging DOM state:", err);
    }
}
