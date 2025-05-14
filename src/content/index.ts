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
    console.log("Starting document content monitoring...");

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
                console.log(
                    `Document content monitoring: Content accessible (${content.length} chars)`
                );
                clearInterval(checkInterval);
                GoogleDocsAPI.stopDebugLogging(); // Stop logging once we confirm it works
            } else {
                console.warn(
                    `Document content monitoring: No content available (check ${checkCount}/${maxChecks})`
                );
            }
        } catch (err) {
            console.error(
                "Document content monitoring: Error accessing content",
                err
            );
        }

        // Stop checking after maxChecks
        if (checkCount >= maxChecks) {
            console.warn(
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

        // Create the sidebar iframe
        const sidebarIframe = document.createElement("iframe");
        sidebarIframe.style.width = "100%";
        sidebarIframe.style.height = "100%";
        sidebarIframe.style.border = "none";
        sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
        sidebarContainer.appendChild(sidebarIframe);

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

            console.log("VibeWrite UI added successfully");
        }
    } catch (error) {
        console.error("Error adding VibeWrite UI:", error);
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
        console.log("Sending ANALYZE_DOCUMENT to sidebar iframe");
        (sidebarIframe as HTMLIFrameElement).contentWindow?.postMessage(
            { type: "ANALYZE_DOCUMENT" },
            "*"
        );
    } else {
        console.error("Could not find sidebar iframe");
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
    console.log("Setting up message handlers...");

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse: (response: Response) => void) => {
        console.log("Content script received message:", message);

        switch (message.type) {
            case "ANALYZE_DOCUMENT":
                console.log("Received ANALYZE_DOCUMENT message");
                postMessageToSidebar({ type: "ANALYZE_DOCUMENT" });
                sendResponse({ success: true });
                break;

            case "GET_DOCUMENT_CONTENT":
                console.log("Received GET_DOCUMENT_CONTENT message");
                const content = GoogleDocsAPI.getDocumentContent();
                sendResponse({ 
                    success: true, 
                    data: { content }
                });
                break;

            default:
                console.warn("Unknown message type:", message.type);
                sendResponse({ 
                    success: false, 
                    error: "Unknown message type" 
                });
        }

        return true; // Important: indicates we'll respond asynchronously
    });

    // Also listen for messages from the sidebar iframe
    window.addEventListener("message", (event) => {
        // Only accept messages from the sidebar iframe
        if (event.source !== document.querySelector<HTMLIFrameElement>("#vibewrite-sidebar")?.contentWindow) {
            return;
        }

        console.log("Content script received window message from sidebar:", event.data);

        if (event.data && event.data.type === "GET_DOCUMENT_CONTENT") {
            console.log("Processing GET_DOCUMENT_CONTENT request from sidebar");
            
            try {
                // Get document content using GoogleDocsAPI
                const content = GoogleDocsAPI.getDocumentContent();
                
                // Send the content back to the sidebar
                postMessageToSidebar({
                    type: "DOCUMENT_CONTENT_RESPONSE",
                    content: content || ""
                });
                
                console.log(`Sent document content to sidebar (${content?.length || 0} characters)`);
            } catch (error) {
                console.error("Error getting document content:", error);
                
                // Send error back to the sidebar

            return true; // Indicates we'll respond asynchronously
        }
    );
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
