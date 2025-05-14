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

    // Add our custom UI elements
    addVibeWriteUI();

    // Set up message handling
    setupMessageHandlers();
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
    chrome.runtime.onMessage.addListener(
        (
            message: Message,
            sender,
            sendResponse: (response: Response) => void
        ) => {
            console.log("Content script received message:", message);
            switch (message.type) {
                case "TOGGLE_SIDEBAR":
                    toggleSidebar();
                    sendResponse({ success: true });
                    break;

                case "RELOAD_SETTINGS":
                    console.log("Reloading settings in content script");
                    // Forward the message to the sidebar iframe
                    const sidebarIframe = document.querySelector(
                        "#vibewrite-sidebar iframe"
                    );
                    if (sidebarIframe) {
                        (
                            sidebarIframe as HTMLIFrameElement
                        ).contentWindow?.postMessage(
                            { type: "RELOAD_SETTINGS" },
                            "*"
                        );
                    }
                    sendResponse({ success: true });
                    break;

                case "GET_SELECTED_TEXT":
                    const selectedText = GoogleDocsAPI.getSelectedText();
                    sendResponse({ success: true, data: selectedText });
                    break;

                case "GET_DOCUMENT_CONTENT":
                    const documentContent = GoogleDocsAPI.getDocumentContent();
                    sendResponse({ success: true, data: documentContent });
                    break;

                case "ADD_COMMENT":
                    if (message.payload && message.payload.commentText) {
                        const success = GoogleDocsAPI.addComment(
                            message.payload.commentText
                        );
                        sendResponse({ success });
                    } else {
                        sendResponse({
                            success: false,
                            error: "No comment text provided",
                        });
                    }
                    break;

                default:
                    sendResponse({
                        success: false,
                        error: "Unknown message type",
                    });
            }

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
