/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/google-docs-api.ts":
/*!**************************************!*\
  !*** ./src/utils/google-docs-api.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GoogleDocsAPI: () => (/* binding */ GoogleDocsAPI)
/* harmony export */ });
// API for interacting with Google Docs
class GoogleDocsAPI {
    /**
     * Start periodic logging of document state
     */
    static startDebugLogging() {
        // Don't start multiple debug intervals
        if (this.debugInterval !== null)
            return;
        console.log("Starting GoogleDocsAPI debug logging");
        this.debugInterval = window.setInterval(() => {
            var _a;
            const now = Date.now();
            // Only log every 5 seconds at most to avoid spamming the console
            if (now - this.lastDebugTime > 5000) {
                this.lastDebugTime = now;
                const isInDocs = this.isInGoogleDocs();
                const paragraphs = document.querySelectorAll(".kix-paragraphrenderer");
                console.log(`[GoogleDocsAPI Debug] isInGoogleDocs: ${isInDocs}`);
                console.log(`[GoogleDocsAPI Debug] paragraphs found: ${(paragraphs === null || paragraphs === void 0 ? void 0 : paragraphs.length) || 0}`);
                if (paragraphs && paragraphs.length > 0) {
                    const firstPara = (_a = paragraphs[0].textContent) === null || _a === void 0 ? void 0 : _a.substring(0, 50);
                    console.log(`[GoogleDocsAPI Debug] First paragraph starts with: ${firstPara}...`);
                }
            }
        }, 1000);
    }
    /**
     * Stop periodic logging
     */
    static stopDebugLogging() {
        if (this.debugInterval !== null) {
            window.clearInterval(this.debugInterval);
            this.debugInterval = null;
            console.log("Stopped GoogleDocsAPI debug logging");
        }
    }
    /**
     * Check if we're currently in a Google Docs document editor
     */
    static isInGoogleDocs() {
        try {
            // Check for Google Docs specific elements
            const isInDocs = window.location.hostname === "docs.google.com" &&
                (document.querySelector(".kix-paragraphrenderer") !== null ||
                    document.querySelector(".docs-editor") !== null);
            return isInDocs;
        }
        catch (error) {
            console.error("Error checking if in Google Docs:", error);
            return false;
        }
    }
    /**
     * Retrieves the entire document content from Google Docs
     * @param maxRetries Number of retry attempts
     * @param delayMs Delay between retries in milliseconds
     * @returns Document content as string or empty string if not found
     */ static getDocumentContent(maxRetries = 3) {
        var _a, _b, _c;
        try {
            console.log("Attempting to retrieve document content...");
            // Check if we're in a Google Docs document editor
            if (!this.isInGoogleDocs()) {
                console.error("Not in a Google Docs document");
                return "";
            }
            // Try direct document access through Google Docs API if available
            try {
                if (typeof ((_a = window.googTernaryParent) === null || _a === void 0 ? void 0 : _a.getDoc) ===
                    "function") {
                    const docContent = ((_c = (_b = window.googTernaryParent
                        .getDoc()) === null || _b === void 0 ? void 0 : _b.getBody()) === null || _c === void 0 ? void 0 : _c.getText()) || "";
                    if (docContent) {
                        console.log("Retrieved document content via Google Docs internal API");
                        return docContent;
                    }
                }
            }
            catch (e) {
                console.log("Failed to access Google Docs API directly:", e);
            }
            // Get all text content from the document
            const paragraphs = document.querySelectorAll(".kix-paragraphrenderer");
            if (!paragraphs || paragraphs.length === 0) {
                console.error("Could not find paragraph elements in document, DOM might not be ready");
                // Start debug logging when we can't find paragraph elements
                this.startDebugLogging();
                // If we have retries left, try a different selector
                if (maxRetries > 0) {
                    console.log(`Trying alternative selectors (${maxRetries} retries left)`);
                    // Try MORE alternative selectors for Google Docs content - expanded list
                    const alternatives = [
                        // Google Docs document content containers
                        ".kix-page-content-wrapper",
                        ".docs-texteventtarget-iframe",
                        ".docs-editor-container",
                        ".kix-appview-editor",
                        ".kix-canvas-tile-content",
                        // Specific content elements
                        ".goog-inline-block.kix-lineview-text-block",
                        ".kix-lineview",
                        ".kix-lineview-content",
                        // Editable areas
                        "[contenteditable='true']",
                        ".docs-text-ui-cursor-blink",
                        // Any iframe that might contain content
                        "iframe.docs-texteventtarget-iframe",
                        ".docs-text-ui-editor-window",
                    ];
                    for (const selector of alternatives) {
                        const elements = document.querySelectorAll(selector);
                        if (elements && elements.length > 0) {
                            console.log(`Found ${elements.length} elements with selector ${selector}`); // Try to get the content from these elements
                            const content = Array.from(elements)
                                .map((element) => {
                                // Check if it's an iframe and handle accordingly with better error handling
                                if (element instanceof HTMLIFrameElement) {
                                    try {
                                        // Try accessing contentDocument (may fail due to cross-origin)
                                        if (element.contentDocument) {
                                            return element.contentDocument
                                                .body.textContent;
                                        }
                                        // If iframe is same-origin but contentDocument not available yet
                                        if (!element.contentDocument &&
                                            element.src &&
                                            element.src.startsWith(window.location.origin)) {
                                            console.log("Same-origin iframe found but content not ready");
                                            // Will be picked up in next retry
                                        }
                                    }
                                    catch (e) {
                                        // Cross-origin iframe, we can't access content directly
                                        console.log("Cross-origin iframe access error:", e);
                                    }
                                }
                                return element.textContent;
                            })
                                .filter(Boolean)
                                .join("\n");
                            if (content) {
                                console.log(`Retrieved ${content.length} characters using alternative selector ${selector}`);
                                return content;
                            }
                        }
                    } // If alternatives didn't work, try accessing document directly
                    try {
                        const docText = document.body.innerText ||
                            document.documentElement.innerText;
                        if (docText && docText.trim().length > 0) {
                            console.log(`Retrieved ${docText.length} characters from document body`);
                            return docText;
                        }
                    }
                    catch (e) {
                        console.log("Error accessing document body text:", e);
                    }
                    // Try an alternative approach - look for text nodes in the document
                    try {
                        let textContent = "";
                        const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
                        let n;
                        while ((n = textWalker.nextNode())) {
                            if (n.textContent && n.textContent.trim()) {
                                textContent += n.textContent + "\n";
                            }
                        }
                        if (textContent && textContent.length > 100) {
                            console.log(`Retrieved ${textContent.length} characters from text nodes`);
                            return textContent;
                        }
                    }
                    catch (e) {
                        console.log("Error using TreeWalker:", e);
                    }
                    // If all alternatives failed, return empty and retry later
                    console.log(`No content found with any method. Returning empty string.`);
                    return "";
                }
                return "";
            }
            // Extract content
            const documentContent = Array.from(paragraphs)
                .map((element) => element.textContent)
                .join("\n");
            if (!documentContent) {
                console.warn("Document content appears to be empty");
                this.startDebugLogging();
            }
            else {
                // Content retrieved successfully, we can stop debug logging
                this.stopDebugLogging();
            }
            console.log(`Retrieved ${documentContent.length} characters from document`);
            return documentContent;
        }
        catch (error) {
            console.error("Error getting document content:", error);
            this.startDebugLogging();
            return "";
        }
    }
    /**
     * Get document content without checking if we're in Google Docs.
     * This is used as a fallback method for the message passing architecture.
     */
    static forceGetDocumentContent() {
        try {
            console.log("Attempting forced document content retrieval...");
            // First try to inject a hook directly into the Google Docs page
            // This aggressive approach may help access the inner document
            try {
                const scriptElement = document.createElement("script");
                scriptElement.textContent = `
                    try {
                        // Try to access Google Docs internal data
                        if (window.IS_INTEGRATION_ADAPTER_RUNNING__) {
                            // Store document text in a global variable
                            window.vibeWriteExtractedContent = document.body.innerText || document.documentElement.innerText;
                            console.log("Document content extracted by injected script");
                        }
                    } catch(e) {
                        console.error("Injected script error:", e);
                    }
                `;
                document.head.appendChild(scriptElement);
                // Wait a moment for script to execute
                setTimeout(() => {
                    document.head.removeChild(scriptElement);
                }, 500);
                // Check if script managed to extract content
                const extractedContent = window
                    .vibeWriteExtractedContent;
                if (extractedContent && extractedContent.length > 100) {
                    console.log(`Retrieved ${extractedContent.length} characters via injected script`);
                    return extractedContent;
                }
            }
            catch (e) {
                console.error("Script injection approach failed:", e);
            }
            // Try multiple selectors to find document content
            const selectors = [
                ".kix-paragraphrenderer",
                ".kix-page-content-wrapper",
                ".docs-editor-container",
                ".kix-appview-editor",
                ".docs-texteventtarget-iframe",
                ".kix-canvas-tile-content",
                ".goog-inline-block.kix-lineview-text-block",
                "[contenteditable='true']",
                ".docs-text-ui-cursor-blink", // Try to find cursor position
                ".kix-canvas-tile-content", // Try to find canvas elements
                ".goog-inline-block", // Generic Google Docs element
            ];
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements && elements.length > 0) {
                    console.log(`Found ${elements.length} elements with selector ${selector}`);
                    const content = Array.from(elements)
                        .map((element) => element.textContent)
                        .filter(Boolean)
                        .join("\n");
                    if (content) {
                        console.log(`Retrieved ${content.length} characters using selector ${selector}`);
                        return content;
                    }
                }
            }
            // If all selectors fail, try to get any text from the document
            const allText = document.body.textContent;
            if (allText && allText.length > 100) {
                // Only use if substantial content
                console.log(`Retrieved ${allText.length} characters from document.body.textContent`);
                return allText;
            }
            console.error("Forced document content retrieval failed - no content found");
            return "";
        }
        catch (error) {
            console.error("Error in forced document content retrieval:", error);
            return "";
        }
    }
    /**
     * Gets the current selected text in Google Docs
     */
    static getSelectedText() {
        try {
            // Using the Google Docs selection functionality
            if (window.getSelection) {
                const selection = window.getSelection();
                if (selection) {
                    return selection.toString();
                }
            }
            return "";
        }
        catch (error) {
            console.error("Error getting selected text:", error);
            return "";
        }
    }
    /**
     * Add a Google Docs comment at the current selection
     * @param commentText - Text to add as a comment
     */
    static addComment(commentText) {
        try {
            // First, need to make sure something is selected
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                console.warn("No text selected to add a comment to");
                return false;
            }
            // Simulate clicking the "Add comment" button or menu item
            const commentButton = document.querySelector('[aria-label="Add comment"]');
            if (commentButton) {
                commentButton.click();
                // Wait for the comment box to appear
                setTimeout(() => {
                    var _a, _b;
                    // Find the comment input box and insert our text
                    const commentBox = document.querySelector(".docos-input-textarea");
                    if (commentBox) {
                        // Set the value of the comment box
                        (_b = (_a = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")) === null || _a === void 0 ? void 0 : _a.set) === null || _b === void 0 ? void 0 : _b.call(commentBox, commentText);
                        // Trigger input event to ensure Google Docs recognizes the change
                        commentBox.dispatchEvent(new Event("input", { bubbles: true }));
                        // Submit the comment - find the "Comment" button and click it
                        setTimeout(() => {
                            const commentSubmitButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Comment");
                            if (commentSubmitButton) {
                                commentSubmitButton.click();
                                return true;
                            }
                        }, 300);
                    }
                }, 500);
            }
            return false;
        }
        catch (error) {
            console.error("Error adding comment:", error);
            return false;
        }
    }
    /**
     * Check if a URL is a Google Docs document URL
     */
    static isGoogleDocsUrl(url) {
        return url.startsWith("https://docs.google.com/document/");
    }
    /**
     * Get the current document's title
     */
    static getDocumentTitle() {
        try {
            const titleElement = document.querySelector(".docs-title-input");
            if (titleElement) {
                return titleElement.textContent || "Untitled Document";
            }
            return "Untitled Document";
        }
        catch (error) {
            console.error("Error getting document title:", error);
            return "Untitled Document";
        }
    }
}
GoogleDocsAPI.debugInterval = null;
GoogleDocsAPI.lastDebugTime = 0;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./src/content/index.ts ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/google-docs-api */ "./src/utils/google-docs-api.ts");
/**
 * Content Script for VibeWrite - Google Docs Integration
 *
 * This script is injected into Google Docs pages and handles:
 * - Adding UI elements to the Google Docs interface
 * - Creating and managing the sidebar
 * - Communicating with the Google Docs document
 * - Sending document content to the background script
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

// If already injected, exit early
if (window.vibeWriteInjected) {
    console.log("VibeWrite already injected, skipping...");
}
else {
    window.vibeWriteInjected = true;
    console.log("VibeWrite content script loaded");
    // Initialize VibeWrite after the page has fully loaded
    window.addEventListener("load", initVibeWrite);
}
// Main initialization function
function initVibeWrite() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Initializing VibeWrite...");
        // Only run on Google Docs document pages
        if (!_utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.isInGoogleDocs()) {
            console.log("Not in a Google Docs document, exiting...");
            return;
        }
        // Wait for the Google Docs UI to fully load
        yield waitForElement(".docs-titlebar-buttons");
        // Start periodic document content monitoring for debugging
        startDocumentMonitoring();
        // Add our custom UI elements
        addVibeWriteUI();
        // Set up message handling
        setupMessageHandlers();
    });
}
// Monitor document content availability
function startDocumentMonitoring() {
    debugLog("Starting document content monitoring...");
    // Enable debug logging in GoogleDocsAPI
    _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.startDebugLogging();
    // Also perform our own check to ensure document is accessible
    let checkCount = 0;
    const maxChecks = 20;
    let hasFoundContent = false;
    // Try using MutationObserver to detect when document structure changes
    try {
        const docsContainer = document.querySelector(".docs-editor-container");
        if (docsContainer) {
            const observer = new MutationObserver((mutations) => {
                if (hasFoundContent)
                    return;
                debugLog("Document mutation detected, checking for content");
                try {
                    const content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getDocumentContent() ||
                        _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
                    if (content) {
                        hasFoundContent = true;
                        debugLog(`Document content found after DOM mutation: ${content.length} chars`);
                        _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.stopDebugLogging();
                        observer.disconnect();
                    }
                }
                catch (err) {
                    debugLog("Error checking for content after mutation", err);
                }
            });
            observer.observe(docsContainer, {
                childList: true,
                subtree: true,
            });
            debugLog("MutationObserver set up for document content");
        }
    }
    catch (err) {
        debugLog("Error setting up MutationObserver", err);
    }
    // Also use interval checking as a backup method
    const checkInterval = setInterval(() => {
        checkCount++;
        try {
            // Try both regular and forced content retrieval
            const content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getDocumentContent() ||
                _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
            if (content) {
                hasFoundContent = true;
                debugLog(`Document content monitoring: Content accessible (${content.length} chars)`);
                clearInterval(checkInterval);
                _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.stopDebugLogging(); // Stop logging once we confirm it works
            }
            else {
                debugLog(`Document content monitoring: No content available (check ${checkCount}/${maxChecks})`);
            }
        }
        catch (err) {
            debugLog("Document content monitoring: Error accessing content", err);
        }
        // Stop checking after maxChecks
        if (checkCount >= maxChecks) {
            debugLog("Document content monitoring: Max checks reached, stopping monitoring");
            clearInterval(checkInterval);
        }
    }, 3000);
}
// Function to create and add the VibeWrite UI to Google Docs
function addVibeWriteUI() {
    var _a;
    try {
        // Create the sidebar container
        const sidebarContainer = document.createElement("div");
        sidebarContainer.className = "vibewrite-sidebar-container";
        sidebarContainer.id = "vibewrite-sidebar";
        // Ensure the element has the base styles even if CSS hasn't loaded yet
        sidebarContainer.style.position = "fixed";
        sidebarContainer.style.top = "64px";
        sidebarContainer.style.right = "0";
        sidebarContainer.style.width = "350px";
        sidebarContainer.style.height = "calc(100vh - 64px)";
        sidebarContainer.style.backgroundColor = "white";
        sidebarContainer.style.boxShadow = "-4px 0 8px rgba(0, 0, 0, 0.15)";
        sidebarContainer.style.zIndex = "9999";
        sidebarContainer.style.display = "flex";
        sidebarContainer.style.flexDirection = "column";
        sidebarContainer.style.transition = "transform 0.3s ease";
        sidebarContainer.style.transform = "translateX(100%)";
        sidebarContainer.style.borderLeft = "1px solid #dadce0";
        sidebarContainer.style.overflow = "hidden";
        document.body.appendChild(sidebarContainer);
        debugLog("Sidebar container created and added to DOM", {
            id: sidebarContainer.id,
            className: sidebarContainer.className,
            parentElement: (_a = sidebarContainer.parentElement) === null || _a === void 0 ? void 0 : _a.tagName,
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
        window.vibeWriteSidebarIframe = sidebarIframe;
        // Add a load event listener to verify the iframe loaded properly
        sidebarIframe.addEventListener("load", () => {
            var _a;
            debugLog("Sidebar iframe loaded", {
                src: sidebarIframe.src,
                hasContentWindow: !!sidebarIframe.contentWindow,
                readyState: ((_a = sidebarIframe.contentDocument) === null || _a === void 0 ? void 0 : _a.readyState) || "unknown",
            });
            // Send a ready message to the sidebar
            if (sidebarIframe.contentWindow) {
                sidebarIframe.contentWindow.postMessage({ type: "SIDEBAR_READY" }, "*");
            }
        });
        // Add VibeWrite buttons to the Google Docs toolbar
        const toolbarContainer = document.querySelector(".docs-titlebar-buttons");
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
            toggleSidebarButton.addEventListener("click", (e) => {
                debugLog("VibeWrite button clicked");
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
            });
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
            toolbarContainer.insertBefore(vibeWriteToolbar, toolbarContainer.firstChild);
            debugLog("VibeWrite UI added successfully");
        }
    }
    catch (error) {
        debugLog("Error adding VibeWrite UI:", error);
    }
}
// Function to toggle the sidebar
function toggleSidebar() {
    let sidebar = document.getElementById("vibewrite-sidebar");
    // If sidebar doesn't exist, create it first
    if (!sidebar) {
        debugLog("Sidebar not found, creating it first");
        try {
            addVibeWriteUI();
            sidebar = document.getElementById("vibewrite-sidebar");
            debugLog("Sidebar created successfully:", sidebar);
        }
        catch (error) {
            debugLog("Error creating sidebar:", error);
            // Show an alert to the user that something went wrong
            alert("VibeWrite: Could not create sidebar. Please reload the page and try again.");
        }
    }
    if (sidebar) {
        const isCurrentlyOpen = sidebar.classList.contains("open");
        // Log current state for debugging
        debugLog("Sidebar state before toggle:", {
            isOpen: isCurrentlyOpen,
            classList: Array.from(sidebar.classList),
            computedTransform: window.getComputedStyle(sidebar).transform,
            display: window.getComputedStyle(sidebar).display,
        });
        sidebar.classList.toggle("open");
        // Log state after toggle
        debugLog("Sidebar state after toggle:", {
            isOpen: sidebar.classList.contains("open"),
            classList: Array.from(sidebar.classList),
            computedTransform: window.getComputedStyle(sidebar).transform,
        });
        // Apply transform directly to ensure it works even if CSS is delayed
        if (sidebar.classList.contains("open")) {
            sidebar.style.transform = "translateX(0)";
        }
        else {
            sidebar.style.transform = "translateX(100%)";
        }
        debugLog(`Sidebar ${isCurrentlyOpen ? "closed" : "opened"}`);
        return true;
    }
    else {
        debugLog("Failed to find or create sidebar");
        return false;
    }
}
// Function to analyze the document and show suggestions
function analyzeDocument() {
    // Make sure the sidebar is created and opened first
    const sidebar = document.getElementById("vibewrite-sidebar");
    if (!sidebar) {
        debugLog("Sidebar not found, creating it first");
        addVibeWriteUI();
    }
    // Now get the sidebar (whether it existed before or was just created)
    const sidebarElement = document.getElementById("vibewrite-sidebar");
    if (sidebarElement && !sidebarElement.classList.contains("open")) {
        sidebarElement.classList.add("open");
        // Force a redraw
        sidebarElement.style.display = "none";
        sidebarElement.offsetHeight; // Force a reflow
        sidebarElement.style.display = "flex";
    }
    // Send the analyze message directly to the sidebar iframe
    const sidebarIframe = document.getElementById("vibewrite-sidebar-iframe");
    if (sidebarIframe === null || sidebarIframe === void 0 ? void 0 : sidebarIframe.contentWindow) {
        debugLog("Sending ANALYZE_DOCUMENT to sidebar iframe");
        sidebarIframe.contentWindow.postMessage({ type: "ANALYZE_DOCUMENT" }, "*");
    }
    else {
        debugLog("Could not find sidebar iframe, trying broadcast");
        // Broadcast the message to any window that might be listening
        window.postMessage({
            type: "ANALYZE_DOCUMENT",
            source: "content-script",
        }, "*");
        // Also try via chrome runtime messaging as final fallback
        chrome.runtime.sendMessage({ type: "ANALYZE_DOCUMENT" });
    }
}
// Function to add feedback to selected text
function addFeedback() {
    // Get the selected text
    const selectedText = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getSelectedText();
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
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        debugLog("Content script received message:", message);
        switch (message.type) {
            case "ANALYZE_DOCUMENT":
                debugLog("Received ANALYZE_DOCUMENT message");
                postMessageToSidebar({ type: "ANALYZE_DOCUMENT" });
                sendResponse({ success: true });
                break;
            case "GET_DOCUMENT_CONTENT":
                debugLog("Received GET_DOCUMENT_CONTENT message from chrome.runtime");
                // Try standard method first
                let content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getDocumentContent();
                // If that fails, try forced retrieval
                if (!content) {
                    debugLog("Standard retrieval failed, trying forced method...");
                    content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
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
                console.log("Content script received relay request from background");
                // Get content and broadcast it to any listening iframes
                try {
                    const content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
                    debugLog("Got document content via relay", {
                        contentLength: (content === null || content === void 0 ? void 0 : content.length) || 0,
                    });
                    // Broadcast to any potential listeners
                    window.postMessage({
                        type: "DOCUMENT_CONTENT_RESPONSE",
                        content: content || "",
                        source: "content-relay",
                    }, "*");
                    // Also try to send directly to the iframe if we have a reference
                    const sidebarIframe = document.getElementById("vibewrite-sidebar-iframe");
                    if (sidebarIframe === null || sidebarIframe === void 0 ? void 0 : sidebarIframe.contentWindow) {
                        sidebarIframe.contentWindow.postMessage({
                            type: "DOCUMENT_CONTENT_RESPONSE",
                            content: content || "",
                            source: "content-direct",
                        }, "*");
                    }
                    sendResponse({ success: true });
                }
                catch (error) {
                    console.error("Error relaying document content:", error);
                    sendResponse({
                        success: false,
                        error: "Failed to relay document content",
                    });
                }
                break;
            case "TOGGLE_SIDEBAR":
                debugLog("Toggling sidebar visibility");
                toggleSidebar();
                sendResponse({ success: true });
                break;
            default:
                debugLog("Unknown message type:", message.type);
                sendResponse({
                    success: false,
                    error: "Unknown message type",
                });
        }
        return true; // Important: indicates we'll respond asynchronously
    }); // Also listen for messages from the sidebar iframe
    window.addEventListener("message", (event) => {
        // Accept messages from the sidebar iframe, but log and debug them regardless of source
        debugLog("Content script received window message:", event.data, "Source:", event.source);
        // Debug sidebar iframe element
        const sidebarIframe = document.querySelector("#vibewrite-sidebar");
        debugLog("Sidebar iframe element:", sidebarIframe, "with contentWindow:", sidebarIframe === null || sidebarIframe === void 0 ? void 0 : sidebarIframe.contentWindow);
        // Check event source but don't block messages during development
        const isFromSidebar = event.source === (sidebarIframe === null || sidebarIframe === void 0 ? void 0 : sidebarIframe.contentWindow);
        if (!isFromSidebar) {
            debugLog("Message not from sidebar iframe, but processing anyway for debugging");
            // Remove this comment and the next line to enforce strict source checking in production
            // return;
        }
        if (event.data && event.data.type === "GET_DOCUMENT_CONTENT") {
            debugLog("Processing GET_DOCUMENT_CONTENT request from sidebar");
            try {
                // First try regular method
                let content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getDocumentContent();
                // If that fails, try forced retrieval
                if (!content) {
                    debugLog("Standard content retrieval failed, trying forced method...");
                    content = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
                }
                // If we still don't have content, try one more approach with a delay
                if (!content) {
                    debugLog("Trying delayed retrieval as last resort...");
                    setTimeout(() => {
                        const lastResortContent = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
                        postMessageToSidebar({
                            type: "DOCUMENT_CONTENT_RESPONSE",
                            content: lastResortContent ||
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
                debugLog(`Sent document content to sidebar (${(content === null || content === void 0 ? void 0 : content.length) || 0} characters)`);
            }
            catch (error) {
                debugLog("Error getting document content:", error);
                // Try forced retrieval as a last resort
                try {
                    const emergencyContent = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
                    if (emergencyContent) {
                        postMessageToSidebar({
                            type: "DOCUMENT_CONTENT_RESPONSE",
                            content: emergencyContent,
                        });
                        debugLog(`Sent emergency document content to sidebar (${emergencyContent.length} characters)`);
                        return;
                    }
                }
                catch (e) {
                    debugLog("Emergency content retrieval also failed:", e);
                }
                // Send error back to the sidebar
                postMessageToSidebar({
                    type: "DOCUMENT_CONTENT_RESPONSE",
                    error: "Failed to retrieve document content",
                });
            }
        }
        else if (event.data && event.data.type === "GET_SELECTED_TEXT") {
            debugLog("Processing GET_SELECTED_TEXT request from sidebar");
            try {
                // Get selected text using GoogleDocsAPI
                const selectedText = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getSelectedText();
                // Send the text back to the sidebar
                postMessageToSidebar({
                    type: "SELECTED_TEXT_RESPONSE",
                    text: selectedText || "",
                });
                debugLog(`Sent selected text to sidebar (${(selectedText === null || selectedText === void 0 ? void 0 : selectedText.length) || 0} characters)`);
            }
            catch (error) {
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
function postMessageToSidebar(message) {
    debugLog("Attempting to post message to sidebar:", message);
    // First try the direct sidebar ID with iframe
    const sidebarIframeInContainer = document.querySelector("#vibewrite-sidebar iframe");
    if (sidebarIframeInContainer === null || sidebarIframeInContainer === void 0 ? void 0 : sidebarIframeInContainer.contentWindow) {
        debugLog("Found iframe inside sidebar container, posting message");
        sidebarIframeInContainer.contentWindow.postMessage(message, "*");
        return;
    } // Try the specific sidebar iframe by ID
    const sidebarIframe = document.querySelector("#vibewrite-sidebar-iframe");
    if (sidebarIframe === null || sidebarIframe === void 0 ? void 0 : sidebarIframe.contentWindow) {
        debugLog("Found sidebar iframe by ID, posting message");
        sidebarIframe.contentWindow.postMessage(message, "*");
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
        const element = document.querySelector(selector);
        if (element === null || element === void 0 ? void 0 : element.contentWindow) {
            debugLog(`Found element using fallback selector "${selector}", posting message`);
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
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        function checkElement() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            }
            else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }
            else {
                setTimeout(checkElement, 100);
            }
        }
        checkElement();
    });
}
// Helper function for enhanced debug logging
function debugLog(context, ...args) {
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
        const sidebarIframe = document.querySelector("#vibewrite-sidebar iframe");
        const paragraphs = document.querySelectorAll(".kix-paragraphrenderer");
        debugLog("DOM State", {
            url: window.location.href,
            isGoogleDocs: window.location.hostname === "docs.google.com",
            sidebarExists: !!sidebarElement,
            sidebarIframeExists: !!sidebarIframe,
            paragraphCount: paragraphs.length,
            bodyChildCount: document.body.childElementCount,
            hasEditorElement: !!document.querySelector(".docs-editor-container"),
        });
        // Check if any content retrieval method works
        const standardContent = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.getDocumentContent();
        const forcedContent = _utils_google_docs_api__WEBPACK_IMPORTED_MODULE_0__.GoogleDocsAPI.forceGetDocumentContent();
        debugLog("Content Retrieval Test", {
            standardContentWorks: !!standardContent,
            standardContentLength: (standardContent === null || standardContent === void 0 ? void 0 : standardContent.length) || 0,
            forcedContentWorks: !!forcedContent,
            forcedContentLength: (forcedContent === null || forcedContent === void 0 ? void 0 : forcedContent.length) || 0,
        });
    }
    catch (err) {
        console.error("Error logging DOM state:", err);
    }
}

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBYTtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aWJld3JpdGUvLi9zcmMvdXRpbHMvZ29vZ2xlLWRvY3MtYXBpLnRzIiwid2VicGFjazovL3ZpYmV3cml0ZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly92aWJld3JpdGUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3ZpYmV3cml0ZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3ZpYmV3cml0ZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3ZpYmV3cml0ZS8uL3NyYy9jb250ZW50L2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEFQSSBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBHb29nbGUgRG9jc1xuZXhwb3J0IGNsYXNzIEdvb2dsZURvY3NBUEkge1xuICAgIC8qKlxuICAgICAqIFN0YXJ0IHBlcmlvZGljIGxvZ2dpbmcgb2YgZG9jdW1lbnQgc3RhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgc3RhcnREZWJ1Z0xvZ2dpbmcoKSB7XG4gICAgICAgIC8vIERvbid0IHN0YXJ0IG11bHRpcGxlIGRlYnVnIGludGVydmFsc1xuICAgICAgICBpZiAodGhpcy5kZWJ1Z0ludGVydmFsICE9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlN0YXJ0aW5nIEdvb2dsZURvY3NBUEkgZGVidWcgbG9nZ2luZ1wiKTtcbiAgICAgICAgdGhpcy5kZWJ1Z0ludGVydmFsID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAvLyBPbmx5IGxvZyBldmVyeSA1IHNlY29uZHMgYXQgbW9zdCB0byBhdm9pZCBzcGFtbWluZyB0aGUgY29uc29sZVxuICAgICAgICAgICAgaWYgKG5vdyAtIHRoaXMubGFzdERlYnVnVGltZSA+IDUwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3REZWJ1Z1RpbWUgPSBub3c7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNJbkRvY3MgPSB0aGlzLmlzSW5Hb29nbGVEb2NzKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYWdyYXBocyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIua2l4LXBhcmFncmFwaHJlbmRlcmVyXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbR29vZ2xlRG9jc0FQSSBEZWJ1Z10gaXNJbkdvb2dsZURvY3M6ICR7aXNJbkRvY3N9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtHb29nbGVEb2NzQVBJIERlYnVnXSBwYXJhZ3JhcGhzIGZvdW5kOiAkeyhwYXJhZ3JhcGhzID09PSBudWxsIHx8IHBhcmFncmFwaHMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHBhcmFncmFwaHMubGVuZ3RoKSB8fCAwfWApO1xuICAgICAgICAgICAgICAgIGlmIChwYXJhZ3JhcGhzICYmIHBhcmFncmFwaHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdFBhcmEgPSAoX2EgPSBwYXJhZ3JhcGhzWzBdLnRleHRDb250ZW50KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtHb29nbGVEb2NzQVBJIERlYnVnXSBGaXJzdCBwYXJhZ3JhcGggc3RhcnRzIHdpdGg6ICR7Zmlyc3RQYXJhfS4uLmApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0b3AgcGVyaW9kaWMgbG9nZ2luZ1xuICAgICAqL1xuICAgIHN0YXRpYyBzdG9wRGVidWdMb2dnaW5nKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1Z0ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmRlYnVnSW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3RvcHBlZCBHb29nbGVEb2NzQVBJIGRlYnVnIGxvZ2dpbmdcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgd2UncmUgY3VycmVudGx5IGluIGEgR29vZ2xlIERvY3MgZG9jdW1lbnQgZWRpdG9yXG4gICAgICovXG4gICAgc3RhdGljIGlzSW5Hb29nbGVEb2NzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIEdvb2dsZSBEb2NzIHNwZWNpZmljIGVsZW1lbnRzXG4gICAgICAgICAgICBjb25zdCBpc0luRG9jcyA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gXCJkb2NzLmdvb2dsZS5jb21cIiAmJlxuICAgICAgICAgICAgICAgIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmtpeC1wYXJhZ3JhcGhyZW5kZXJlclwiKSAhPT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRvY3MtZWRpdG9yXCIpICE9PSBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBpc0luRG9jcztcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjaGVja2luZyBpZiBpbiBHb29nbGUgRG9jczpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgZW50aXJlIGRvY3VtZW50IGNvbnRlbnQgZnJvbSBHb29nbGUgRG9jc1xuICAgICAqIEBwYXJhbSBtYXhSZXRyaWVzIE51bWJlciBvZiByZXRyeSBhdHRlbXB0c1xuICAgICAqIEBwYXJhbSBkZWxheU1zIERlbGF5IGJldHdlZW4gcmV0cmllcyBpbiBtaWxsaXNlY29uZHNcbiAgICAgKiBAcmV0dXJucyBEb2N1bWVudCBjb250ZW50IGFzIHN0cmluZyBvciBlbXB0eSBzdHJpbmcgaWYgbm90IGZvdW5kXG4gICAgICovIHN0YXRpYyBnZXREb2N1bWVudENvbnRlbnQobWF4UmV0cmllcyA9IDMpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRpbmcgdG8gcmV0cmlldmUgZG9jdW1lbnQgY29udGVudC4uLlwiKTtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlJ3JlIGluIGEgR29vZ2xlIERvY3MgZG9jdW1lbnQgZWRpdG9yXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbkdvb2dsZURvY3MoKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJOb3QgaW4gYSBHb29nbGUgRG9jcyBkb2N1bWVudFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRyeSBkaXJlY3QgZG9jdW1lbnQgYWNjZXNzIHRocm91Z2ggR29vZ2xlIERvY3MgQVBJIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgoX2EgPSB3aW5kb3cuZ29vZ1Rlcm5hcnlQYXJlbnQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXREb2MpID09PVxuICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jQ29udGVudCA9ICgoX2MgPSAoX2IgPSB3aW5kb3cuZ29vZ1Rlcm5hcnlQYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC5nZXREb2MoKSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEJvZHkoKSkgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmdldFRleHQoKSkgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY0NvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmV0cmlldmVkIGRvY3VtZW50IGNvbnRlbnQgdmlhIEdvb2dsZSBEb2NzIGludGVybmFsIEFQSVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBhY2Nlc3MgR29vZ2xlIERvY3MgQVBJIGRpcmVjdGx5OlwiLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEdldCBhbGwgdGV4dCBjb250ZW50IGZyb20gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICBjb25zdCBwYXJhZ3JhcGhzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5raXgtcGFyYWdyYXBocmVuZGVyZXJcIik7XG4gICAgICAgICAgICBpZiAoIXBhcmFncmFwaHMgfHwgcGFyYWdyYXBocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGZpbmQgcGFyYWdyYXBoIGVsZW1lbnRzIGluIGRvY3VtZW50LCBET00gbWlnaHQgbm90IGJlIHJlYWR5XCIpO1xuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGRlYnVnIGxvZ2dpbmcgd2hlbiB3ZSBjYW4ndCBmaW5kIHBhcmFncmFwaCBlbGVtZW50c1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnREZWJ1Z0xvZ2dpbmcoKTtcbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIHJldHJpZXMgbGVmdCwgdHJ5IGEgZGlmZmVyZW50IHNlbGVjdG9yXG4gICAgICAgICAgICAgICAgaWYgKG1heFJldHJpZXMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUcnlpbmcgYWx0ZXJuYXRpdmUgc2VsZWN0b3JzICgke21heFJldHJpZXN9IHJldHJpZXMgbGVmdClgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IE1PUkUgYWx0ZXJuYXRpdmUgc2VsZWN0b3JzIGZvciBHb29nbGUgRG9jcyBjb250ZW50IC0gZXhwYW5kZWQgbGlzdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbHRlcm5hdGl2ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgRG9jcyBkb2N1bWVudCBjb250ZW50IGNvbnRhaW5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLmtpeC1wYWdlLWNvbnRlbnQtd3JhcHBlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIuZG9jcy10ZXh0ZXZlbnR0YXJnZXQtaWZyYW1lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIi5kb2NzLWVkaXRvci1jb250YWluZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLmtpeC1hcHB2aWV3LWVkaXRvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIua2l4LWNhbnZhcy10aWxlLWNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNwZWNpZmljIGNvbnRlbnQgZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLmdvb2ctaW5saW5lLWJsb2NrLmtpeC1saW5ldmlldy10ZXh0LWJsb2NrXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIi5raXgtbGluZXZpZXdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLmtpeC1saW5ldmlldy1jb250ZW50XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFZGl0YWJsZSBhcmVhc1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJbY29udGVudGVkaXRhYmxlPSd0cnVlJ11cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiLmRvY3MtdGV4dC11aS1jdXJzb3ItYmxpbmtcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFueSBpZnJhbWUgdGhhdCBtaWdodCBjb250YWluIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaWZyYW1lLmRvY3MtdGV4dGV2ZW50dGFyZ2V0LWlmcmFtZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCIuZG9jcy10ZXh0LXVpLWVkaXRvci13aW5kb3dcIixcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBhbHRlcm5hdGl2ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudHMgJiYgZWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2VsZW1lbnRzLmxlbmd0aH0gZWxlbWVudHMgd2l0aCBzZWxlY3RvciAke3NlbGVjdG9yfWApOyAvLyBUcnkgdG8gZ2V0IHRoZSBjb250ZW50IGZyb20gdGhlc2UgZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gQXJyYXkuZnJvbShlbGVtZW50cylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBpdCdzIGFuIGlmcmFtZSBhbmQgaGFuZGxlIGFjY29yZGluZ2x5IHdpdGggYmV0dGVyIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTElGcmFtZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IGFjY2Vzc2luZyBjb250ZW50RG9jdW1lbnQgKG1heSBmYWlsIGR1ZSB0byBjcm9zcy1vcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY29udGVudERvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmNvbnRlbnREb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmJvZHkudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGlmcmFtZSBpcyBzYW1lLW9yaWdpbiBidXQgY29udGVudERvY3VtZW50IG5vdCBhdmFpbGFibGUgeWV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlbGVtZW50LmNvbnRlbnREb2N1bWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNyYyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNyYy5zdGFydHNXaXRoKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2FtZS1vcmlnaW4gaWZyYW1lIGZvdW5kIGJ1dCBjb250ZW50IG5vdCByZWFkeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2lsbCBiZSBwaWNrZWQgdXAgaW4gbmV4dCByZXRyeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3Jvc3Mtb3JpZ2luIGlmcmFtZSwgd2UgY2FuJ3QgYWNjZXNzIGNvbnRlbnQgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyb3NzLW9yaWdpbiBpZnJhbWUgYWNjZXNzIGVycm9yOlwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZXRyaWV2ZWQgJHtjb250ZW50Lmxlbmd0aH0gY2hhcmFjdGVycyB1c2luZyBhbHRlcm5hdGl2ZSBzZWxlY3RvciAke3NlbGVjdG9yfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gLy8gSWYgYWx0ZXJuYXRpdmVzIGRpZG4ndCB3b3JrLCB0cnkgYWNjZXNzaW5nIGRvY3VtZW50IGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2NUZXh0ID0gZG9jdW1lbnQuYm9keS5pbm5lclRleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuaW5uZXJUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1RleHQgJiYgZG9jVGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZXRyaWV2ZWQgJHtkb2NUZXh0Lmxlbmd0aH0gY2hhcmFjdGVycyBmcm9tIGRvY3VtZW50IGJvZHlgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBhY2Nlc3NpbmcgZG9jdW1lbnQgYm9keSB0ZXh0OlwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgYW4gYWx0ZXJuYXRpdmUgYXBwcm9hY2ggLSBsb29rIGZvciB0ZXh0IG5vZGVzIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRXYWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGRvY3VtZW50LmJvZHksIE5vZGVGaWx0ZXIuU0hPV19URVhULCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChuID0gdGV4dFdhbGtlci5uZXh0Tm9kZSgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLnRleHRDb250ZW50ICYmIG4udGV4dENvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50ICs9IG4udGV4dENvbnRlbnQgKyBcIlxcblwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudCAmJiB0ZXh0Q29udGVudC5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmV0cmlldmVkICR7dGV4dENvbnRlbnQubGVuZ3RofSBjaGFyYWN0ZXJzIGZyb20gdGV4dCBub2Rlc2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciB1c2luZyBUcmVlV2Fsa2VyOlwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBhbGwgYWx0ZXJuYXRpdmVzIGZhaWxlZCwgcmV0dXJuIGVtcHR5IGFuZCByZXRyeSBsYXRlclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm8gY29udGVudCBmb3VuZCB3aXRoIGFueSBtZXRob2QuIFJldHVybmluZyBlbXB0eSBzdHJpbmcuYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEV4dHJhY3QgY29udGVudFxuICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRDb250ZW50ID0gQXJyYXkuZnJvbShwYXJhZ3JhcGhzKVxuICAgICAgICAgICAgICAgIC5tYXAoKGVsZW1lbnQpID0+IGVsZW1lbnQudGV4dENvbnRlbnQpXG4gICAgICAgICAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgICBpZiAoIWRvY3VtZW50Q29udGVudCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkRvY3VtZW50IGNvbnRlbnQgYXBwZWFycyB0byBiZSBlbXB0eVwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGVidWdMb2dnaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDb250ZW50IHJldHJpZXZlZCBzdWNjZXNzZnVsbHksIHdlIGNhbiBzdG9wIGRlYnVnIGxvZ2dpbmdcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3BEZWJ1Z0xvZ2dpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZXRyaWV2ZWQgJHtkb2N1bWVudENvbnRlbnQubGVuZ3RofSBjaGFyYWN0ZXJzIGZyb20gZG9jdW1lbnRgKTtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2V0dGluZyBkb2N1bWVudCBjb250ZW50OlwiLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0RGVidWdMb2dnaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgZG9jdW1lbnQgY29udGVudCB3aXRob3V0IGNoZWNraW5nIGlmIHdlJ3JlIGluIEdvb2dsZSBEb2NzLlxuICAgICAqIFRoaXMgaXMgdXNlZCBhcyBhIGZhbGxiYWNrIG1ldGhvZCBmb3IgdGhlIG1lc3NhZ2UgcGFzc2luZyBhcmNoaXRlY3R1cmUuXG4gICAgICovXG4gICAgc3RhdGljIGZvcmNlR2V0RG9jdW1lbnRDb250ZW50KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0aW5nIGZvcmNlZCBkb2N1bWVudCBjb250ZW50IHJldHJpZXZhbC4uLlwiKTtcbiAgICAgICAgICAgIC8vIEZpcnN0IHRyeSB0byBpbmplY3QgYSBob29rIGRpcmVjdGx5IGludG8gdGhlIEdvb2dsZSBEb2NzIHBhZ2VcbiAgICAgICAgICAgIC8vIFRoaXMgYWdncmVzc2l2ZSBhcHByb2FjaCBtYXkgaGVscCBhY2Nlc3MgdGhlIGlubmVyIGRvY3VtZW50XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgICAgIHNjcmlwdEVsZW1lbnQudGV4dENvbnRlbnQgPSBgXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGFjY2VzcyBHb29nbGUgRG9jcyBpbnRlcm5hbCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuSVNfSU5URUdSQVRJT05fQURBUFRFUl9SVU5OSU5HX18pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGRvY3VtZW50IHRleHQgaW4gYSBnbG9iYWwgdmFyaWFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy52aWJlV3JpdGVFeHRyYWN0ZWRDb250ZW50ID0gZG9jdW1lbnQuYm9keS5pbm5lclRleHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmlubmVyVGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRG9jdW1lbnQgY29udGVudCBleHRyYWN0ZWQgYnkgaW5qZWN0ZWQgc2NyaXB0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmplY3RlZCBzY3JpcHQgZXJyb3I6XCIsIGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGA7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAvLyBXYWl0IGEgbW9tZW50IGZvciBzY3JpcHQgdG8gZXhlY3V0ZVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKHNjcmlwdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc2NyaXB0IG1hbmFnZWQgdG8gZXh0cmFjdCBjb250ZW50XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0cmFjdGVkQ29udGVudCA9IHdpbmRvd1xuICAgICAgICAgICAgICAgICAgICAudmliZVdyaXRlRXh0cmFjdGVkQ29udGVudDtcbiAgICAgICAgICAgICAgICBpZiAoZXh0cmFjdGVkQ29udGVudCAmJiBleHRyYWN0ZWRDb250ZW50Lmxlbmd0aCA+IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmV0cmlldmVkICR7ZXh0cmFjdGVkQ29udGVudC5sZW5ndGh9IGNoYXJhY3RlcnMgdmlhIGluamVjdGVkIHNjcmlwdGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkQ29udGVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTY3JpcHQgaW5qZWN0aW9uIGFwcHJvYWNoIGZhaWxlZDpcIiwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgc2VsZWN0b3JzIHRvIGZpbmQgZG9jdW1lbnQgY29udGVudFxuICAgICAgICAgICAgY29uc3Qgc2VsZWN0b3JzID0gW1xuICAgICAgICAgICAgICAgIFwiLmtpeC1wYXJhZ3JhcGhyZW5kZXJlclwiLFxuICAgICAgICAgICAgICAgIFwiLmtpeC1wYWdlLWNvbnRlbnQtd3JhcHBlclwiLFxuICAgICAgICAgICAgICAgIFwiLmRvY3MtZWRpdG9yLWNvbnRhaW5lclwiLFxuICAgICAgICAgICAgICAgIFwiLmtpeC1hcHB2aWV3LWVkaXRvclwiLFxuICAgICAgICAgICAgICAgIFwiLmRvY3MtdGV4dGV2ZW50dGFyZ2V0LWlmcmFtZVwiLFxuICAgICAgICAgICAgICAgIFwiLmtpeC1jYW52YXMtdGlsZS1jb250ZW50XCIsXG4gICAgICAgICAgICAgICAgXCIuZ29vZy1pbmxpbmUtYmxvY2sua2l4LWxpbmV2aWV3LXRleHQtYmxvY2tcIixcbiAgICAgICAgICAgICAgICBcIltjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiLFxuICAgICAgICAgICAgICAgIFwiLmRvY3MtdGV4dC11aS1jdXJzb3ItYmxpbmtcIiwgLy8gVHJ5IHRvIGZpbmQgY3Vyc29yIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgXCIua2l4LWNhbnZhcy10aWxlLWNvbnRlbnRcIiwgLy8gVHJ5IHRvIGZpbmQgY2FudmFzIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgXCIuZ29vZy1pbmxpbmUtYmxvY2tcIiwgLy8gR2VuZXJpYyBHb29nbGUgRG9jcyBlbGVtZW50XG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50cyAmJiBlbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2VsZW1lbnRzLmxlbmd0aH0gZWxlbWVudHMgd2l0aCBzZWxlY3RvciAke3NlbGVjdG9yfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gQXJyYXkuZnJvbShlbGVtZW50cylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsZW1lbnQpID0+IGVsZW1lbnQudGV4dENvbnRlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZXRyaWV2ZWQgJHtjb250ZW50Lmxlbmd0aH0gY2hhcmFjdGVycyB1c2luZyBzZWxlY3RvciAke3NlbGVjdG9yfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiBhbGwgc2VsZWN0b3JzIGZhaWwsIHRyeSB0byBnZXQgYW55IHRleHQgZnJvbSB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgIGNvbnN0IGFsbFRleHQgPSBkb2N1bWVudC5ib2R5LnRleHRDb250ZW50O1xuICAgICAgICAgICAgaWYgKGFsbFRleHQgJiYgYWxsVGV4dC5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHVzZSBpZiBzdWJzdGFudGlhbCBjb250ZW50XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJldHJpZXZlZCAke2FsbFRleHQubGVuZ3RofSBjaGFyYWN0ZXJzIGZyb20gZG9jdW1lbnQuYm9keS50ZXh0Q29udGVudGApO1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGxUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZvcmNlZCBkb2N1bWVudCBjb250ZW50IHJldHJpZXZhbCBmYWlsZWQgLSBubyBjb250ZW50IGZvdW5kXCIpO1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW4gZm9yY2VkIGRvY3VtZW50IGNvbnRlbnQgcmV0cmlldmFsOlwiLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBjdXJyZW50IHNlbGVjdGVkIHRleHQgaW4gR29vZ2xlIERvY3NcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0U2VsZWN0ZWRUZXh0KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVXNpbmcgdGhlIEdvb2dsZSBEb2NzIHNlbGVjdGlvbiBmdW5jdGlvbmFsaXR5XG4gICAgICAgICAgICBpZiAod2luZG93LmdldFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIHNlbGVjdGVkIHRleHQ6XCIsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZCBhIEdvb2dsZSBEb2NzIGNvbW1lbnQgYXQgdGhlIGN1cnJlbnQgc2VsZWN0aW9uXG4gICAgICogQHBhcmFtIGNvbW1lbnRUZXh0IC0gVGV4dCB0byBhZGQgYXMgYSBjb21tZW50XG4gICAgICovXG4gICAgc3RhdGljIGFkZENvbW1lbnQoY29tbWVudFRleHQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEZpcnN0LCBuZWVkIHRvIG1ha2Ugc3VyZSBzb21ldGhpbmcgaXMgc2VsZWN0ZWRcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkVGV4dCA9IHRoaXMuZ2V0U2VsZWN0ZWRUZXh0KCk7XG4gICAgICAgICAgICBpZiAoIXNlbGVjdGVkVGV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIHRleHQgc2VsZWN0ZWQgdG8gYWRkIGEgY29tbWVudCB0b1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTaW11bGF0ZSBjbGlja2luZyB0aGUgXCJBZGQgY29tbWVudFwiIGJ1dHRvbiBvciBtZW51IGl0ZW1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1lbnRCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYXJpYS1sYWJlbD1cIkFkZCBjb21tZW50XCJdJyk7XG4gICAgICAgICAgICBpZiAoY29tbWVudEJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGNvbW1lbnRCdXR0b24uY2xpY2soKTtcbiAgICAgICAgICAgICAgICAvLyBXYWl0IGZvciB0aGUgY29tbWVudCBib3ggdG8gYXBwZWFyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvbW1lbnQgaW5wdXQgYm94IGFuZCBpbnNlcnQgb3VyIHRleHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWVudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZG9jb3MtaW5wdXQtdGV4dGFyZWFcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21tZW50Qm94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHZhbHVlIG9mIHRoZSBjb21tZW50IGJveFxuICAgICAgICAgICAgICAgICAgICAgICAgKF9iID0gKF9hID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgXCJ2YWx1ZVwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnNldCkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoY29tbWVudEJveCwgY29tbWVudFRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBpbnB1dCBldmVudCB0byBlbnN1cmUgR29vZ2xlIERvY3MgcmVjb2duaXplcyB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50Qm94LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1Ym1pdCB0aGUgY29tbWVudCAtIGZpbmQgdGhlIFwiQ29tbWVudFwiIGJ1dHRvbiBhbmQgY2xpY2sgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1lbnRTdWJtaXRCdXR0b24gPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikpLmZpbmQoKGJ1dHRvbikgPT4gYnV0dG9uLnRleHRDb250ZW50ID09PSBcIkNvbW1lbnRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnRTdWJtaXRCdXR0b24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudFN1Ym1pdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhZGRpbmcgY29tbWVudDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgVVJMIGlzIGEgR29vZ2xlIERvY3MgZG9jdW1lbnQgVVJMXG4gICAgICovXG4gICAgc3RhdGljIGlzR29vZ2xlRG9jc1VybCh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHVybC5zdGFydHNXaXRoKFwiaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZG9jdW1lbnQvXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgZG9jdW1lbnQncyB0aXRsZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXREb2N1bWVudFRpdGxlKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGl0bGVFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kb2NzLXRpdGxlLWlucHV0XCIpO1xuICAgICAgICAgICAgaWYgKHRpdGxlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aXRsZUVsZW1lbnQudGV4dENvbnRlbnQgfHwgXCJVbnRpdGxlZCBEb2N1bWVudFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiVW50aXRsZWQgRG9jdW1lbnRcIjtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIGRvY3VtZW50IHRpdGxlOlwiLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gXCJVbnRpdGxlZCBEb2N1bWVudFwiO1xuICAgICAgICB9XG4gICAgfVxufVxuR29vZ2xlRG9jc0FQSS5kZWJ1Z0ludGVydmFsID0gbnVsbDtcbkdvb2dsZURvY3NBUEkubGFzdERlYnVnVGltZSA9IDA7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8qKlxuICogQ29udGVudCBTY3JpcHQgZm9yIFZpYmVXcml0ZSAtIEdvb2dsZSBEb2NzIEludGVncmF0aW9uXG4gKlxuICogVGhpcyBzY3JpcHQgaXMgaW5qZWN0ZWQgaW50byBHb29nbGUgRG9jcyBwYWdlcyBhbmQgaGFuZGxlczpcbiAqIC0gQWRkaW5nIFVJIGVsZW1lbnRzIHRvIHRoZSBHb29nbGUgRG9jcyBpbnRlcmZhY2VcbiAqIC0gQ3JlYXRpbmcgYW5kIG1hbmFnaW5nIHRoZSBzaWRlYmFyXG4gKiAtIENvbW11bmljYXRpbmcgd2l0aCB0aGUgR29vZ2xlIERvY3MgZG9jdW1lbnRcbiAqIC0gU2VuZGluZyBkb2N1bWVudCBjb250ZW50IHRvIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdFxuICovXG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmltcG9ydCB7IEdvb2dsZURvY3NBUEkgfSBmcm9tIFwiLi4vdXRpbHMvZ29vZ2xlLWRvY3MtYXBpXCI7XG4vLyBJZiBhbHJlYWR5IGluamVjdGVkLCBleGl0IGVhcmx5XG5pZiAod2luZG93LnZpYmVXcml0ZUluamVjdGVkKSB7XG4gICAgY29uc29sZS5sb2coXCJWaWJlV3JpdGUgYWxyZWFkeSBpbmplY3RlZCwgc2tpcHBpbmcuLi5cIik7XG59XG5lbHNlIHtcbiAgICB3aW5kb3cudmliZVdyaXRlSW5qZWN0ZWQgPSB0cnVlO1xuICAgIGNvbnNvbGUubG9nKFwiVmliZVdyaXRlIGNvbnRlbnQgc2NyaXB0IGxvYWRlZFwiKTtcbiAgICAvLyBJbml0aWFsaXplIFZpYmVXcml0ZSBhZnRlciB0aGUgcGFnZSBoYXMgZnVsbHkgbG9hZGVkXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGluaXRWaWJlV3JpdGUpO1xufVxuLy8gTWFpbiBpbml0aWFsaXphdGlvbiBmdW5jdGlvblxuZnVuY3Rpb24gaW5pdFZpYmVXcml0ZSgpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYWxpemluZyBWaWJlV3JpdGUuLi5cIik7XG4gICAgICAgIC8vIE9ubHkgcnVuIG9uIEdvb2dsZSBEb2NzIGRvY3VtZW50IHBhZ2VzXG4gICAgICAgIGlmICghR29vZ2xlRG9jc0FQSS5pc0luR29vZ2xlRG9jcygpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCBpbiBhIEdvb2dsZSBEb2NzIGRvY3VtZW50LCBleGl0aW5nLi4uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBHb29nbGUgRG9jcyBVSSB0byBmdWxseSBsb2FkXG4gICAgICAgIHlpZWxkIHdhaXRGb3JFbGVtZW50KFwiLmRvY3MtdGl0bGViYXItYnV0dG9uc1wiKTtcbiAgICAgICAgLy8gU3RhcnQgcGVyaW9kaWMgZG9jdW1lbnQgY29udGVudCBtb25pdG9yaW5nIGZvciBkZWJ1Z2dpbmdcbiAgICAgICAgc3RhcnREb2N1bWVudE1vbml0b3JpbmcoKTtcbiAgICAgICAgLy8gQWRkIG91ciBjdXN0b20gVUkgZWxlbWVudHNcbiAgICAgICAgYWRkVmliZVdyaXRlVUkoKTtcbiAgICAgICAgLy8gU2V0IHVwIG1lc3NhZ2UgaGFuZGxpbmdcbiAgICAgICAgc2V0dXBNZXNzYWdlSGFuZGxlcnMoKTtcbiAgICB9KTtcbn1cbi8vIE1vbml0b3IgZG9jdW1lbnQgY29udGVudCBhdmFpbGFiaWxpdHlcbmZ1bmN0aW9uIHN0YXJ0RG9jdW1lbnRNb25pdG9yaW5nKCkge1xuICAgIGRlYnVnTG9nKFwiU3RhcnRpbmcgZG9jdW1lbnQgY29udGVudCBtb25pdG9yaW5nLi4uXCIpO1xuICAgIC8vIEVuYWJsZSBkZWJ1ZyBsb2dnaW5nIGluIEdvb2dsZURvY3NBUElcbiAgICBHb29nbGVEb2NzQVBJLnN0YXJ0RGVidWdMb2dnaW5nKCk7XG4gICAgLy8gQWxzbyBwZXJmb3JtIG91ciBvd24gY2hlY2sgdG8gZW5zdXJlIGRvY3VtZW50IGlzIGFjY2Vzc2libGVcbiAgICBsZXQgY2hlY2tDb3VudCA9IDA7XG4gICAgY29uc3QgbWF4Q2hlY2tzID0gMjA7XG4gICAgbGV0IGhhc0ZvdW5kQ29udGVudCA9IGZhbHNlO1xuICAgIC8vIFRyeSB1c2luZyBNdXRhdGlvbk9ic2VydmVyIHRvIGRldGVjdCB3aGVuIGRvY3VtZW50IHN0cnVjdHVyZSBjaGFuZ2VzXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9jc0NvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZG9jcy1lZGl0b3ItY29udGFpbmVyXCIpO1xuICAgICAgICBpZiAoZG9jc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc0ZvdW5kQ29udGVudClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGRlYnVnTG9nKFwiRG9jdW1lbnQgbXV0YXRpb24gZGV0ZWN0ZWQsIGNoZWNraW5nIGZvciBjb250ZW50XCIpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBHb29nbGVEb2NzQVBJLmdldERvY3VtZW50Q29udGVudCgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBHb29nbGVEb2NzQVBJLmZvcmNlR2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNGb3VuZENvbnRlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdMb2coYERvY3VtZW50IGNvbnRlbnQgZm91bmQgYWZ0ZXIgRE9NIG11dGF0aW9uOiAke2NvbnRlbnQubGVuZ3RofSBjaGFyc2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgR29vZ2xlRG9jc0FQSS5zdG9wRGVidWdMb2dnaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIkVycm9yIGNoZWNraW5nIGZvciBjb250ZW50IGFmdGVyIG11dGF0aW9uXCIsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3NDb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGVidWdMb2coXCJNdXRhdGlvbk9ic2VydmVyIHNldCB1cCBmb3IgZG9jdW1lbnQgY29udGVudFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGRlYnVnTG9nKFwiRXJyb3Igc2V0dGluZyB1cCBNdXRhdGlvbk9ic2VydmVyXCIsIGVycik7XG4gICAgfVxuICAgIC8vIEFsc28gdXNlIGludGVydmFsIGNoZWNraW5nIGFzIGEgYmFja3VwIG1ldGhvZFxuICAgIGNvbnN0IGNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGNoZWNrQ291bnQrKztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFRyeSBib3RoIHJlZ3VsYXIgYW5kIGZvcmNlZCBjb250ZW50IHJldHJpZXZhbFxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IEdvb2dsZURvY3NBUEkuZ2V0RG9jdW1lbnRDb250ZW50KCkgfHxcbiAgICAgICAgICAgICAgICBHb29nbGVEb2NzQVBJLmZvcmNlR2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgICAgICAgIGhhc0ZvdW5kQ29udGVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZGVidWdMb2coYERvY3VtZW50IGNvbnRlbnQgbW9uaXRvcmluZzogQ29udGVudCBhY2Nlc3NpYmxlICgke2NvbnRlbnQubGVuZ3RofSBjaGFycylgKTtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGNoZWNrSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIEdvb2dsZURvY3NBUEkuc3RvcERlYnVnTG9nZ2luZygpOyAvLyBTdG9wIGxvZ2dpbmcgb25jZSB3ZSBjb25maXJtIGl0IHdvcmtzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhgRG9jdW1lbnQgY29udGVudCBtb25pdG9yaW5nOiBObyBjb250ZW50IGF2YWlsYWJsZSAoY2hlY2sgJHtjaGVja0NvdW50fS8ke21heENoZWNrc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZGVidWdMb2coXCJEb2N1bWVudCBjb250ZW50IG1vbml0b3Jpbmc6IEVycm9yIGFjY2Vzc2luZyBjb250ZW50XCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RvcCBjaGVja2luZyBhZnRlciBtYXhDaGVja3NcbiAgICAgICAgaWYgKGNoZWNrQ291bnQgPj0gbWF4Q2hlY2tzKSB7XG4gICAgICAgICAgICBkZWJ1Z0xvZyhcIkRvY3VtZW50IGNvbnRlbnQgbW9uaXRvcmluZzogTWF4IGNoZWNrcyByZWFjaGVkLCBzdG9wcGluZyBtb25pdG9yaW5nXCIpO1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChjaGVja0ludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH0sIDMwMDApO1xufVxuLy8gRnVuY3Rpb24gdG8gY3JlYXRlIGFuZCBhZGQgdGhlIFZpYmVXcml0ZSBVSSB0byBHb29nbGUgRG9jc1xuZnVuY3Rpb24gYWRkVmliZVdyaXRlVUkoKSB7XG4gICAgdmFyIF9hO1xuICAgIHRyeSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2lkZWJhciBjb250YWluZXJcbiAgICAgICAgY29uc3Qgc2lkZWJhckNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHNpZGViYXJDb250YWluZXIuY2xhc3NOYW1lID0gXCJ2aWJld3JpdGUtc2lkZWJhci1jb250YWluZXJcIjtcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5pZCA9IFwidmliZXdyaXRlLXNpZGViYXJcIjtcbiAgICAgICAgLy8gRW5zdXJlIHRoZSBlbGVtZW50IGhhcyB0aGUgYmFzZSBzdHlsZXMgZXZlbiBpZiBDU1MgaGFzbid0IGxvYWRlZCB5ZXRcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIjtcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5zdHlsZS50b3AgPSBcIjY0cHhcIjtcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5zdHlsZS5yaWdodCA9IFwiMFwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLndpZHRoID0gXCIzNTBweFwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IFwiY2FsYygxMDB2aCAtIDY0cHgpXCI7XG4gICAgICAgIHNpZGViYXJDb250YWluZXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ3aGl0ZVwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLmJveFNoYWRvdyA9IFwiLTRweCAwIDhweCByZ2JhKDAsIDAsIDAsIDAuMTUpXCI7XG4gICAgICAgIHNpZGViYXJDb250YWluZXIuc3R5bGUuekluZGV4ID0gXCI5OTk5XCI7XG4gICAgICAgIHNpZGViYXJDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSBcImNvbHVtblwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLnRyYW5zaXRpb24gPSBcInRyYW5zZm9ybSAwLjNzIGVhc2VcIjtcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoMTAwJSlcIjtcbiAgICAgICAgc2lkZWJhckNvbnRhaW5lci5zdHlsZS5ib3JkZXJMZWZ0ID0gXCIxcHggc29saWQgI2RhZGNlMFwiO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzaWRlYmFyQ29udGFpbmVyKTtcbiAgICAgICAgZGVidWdMb2coXCJTaWRlYmFyIGNvbnRhaW5lciBjcmVhdGVkIGFuZCBhZGRlZCB0byBET01cIiwge1xuICAgICAgICAgICAgaWQ6IHNpZGViYXJDb250YWluZXIuaWQsXG4gICAgICAgICAgICBjbGFzc05hbWU6IHNpZGViYXJDb250YWluZXIuY2xhc3NOYW1lLFxuICAgICAgICAgICAgcGFyZW50RWxlbWVudDogKF9hID0gc2lkZWJhckNvbnRhaW5lci5wYXJlbnRFbGVtZW50KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EudGFnTmFtZSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2lkZWJhciBpZnJhbWVcbiAgICAgICAgY29uc3Qgc2lkZWJhcklmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgIHNpZGViYXJJZnJhbWUuaWQgPSBcInZpYmV3cml0ZS1zaWRlYmFyLWlmcmFtZVwiOyAvLyBBZGQgYSBzcGVjaWZpYyBJRCBmb3IgZWFzaWVyIHNlbGVjdGlvblxuICAgICAgICBzaWRlYmFySWZyYW1lLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgIHNpZGViYXJJZnJhbWUuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgICAgIHNpZGViYXJJZnJhbWUuc3R5bGUuYm9yZGVyID0gXCJub25lXCI7XG4gICAgICAgIHNpZGViYXJJZnJhbWUuYWxsb3cgPSBcImNsaXBib2FyZC1yZWFkOyBjbGlwYm9hcmQtd3JpdGVcIjsgLy8gQWRkIHBlcm1pc3Npb25zXG4gICAgICAgIHNpZGViYXJJZnJhbWUuc3JjID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKFwic2lkZWJhci5odG1sXCIpO1xuICAgICAgICBzaWRlYmFyQ29udGFpbmVyLmFwcGVuZENoaWxkKHNpZGViYXJJZnJhbWUpO1xuICAgICAgICAvLyBTdG9yZSBpZnJhbWUgcmVmZXJlbmNlIGluIHdpbmRvdyBmb3IgZWFzeSBhY2Nlc3MgZnJvbSBhbnl3aGVyZVxuICAgICAgICB3aW5kb3cudmliZVdyaXRlU2lkZWJhcklmcmFtZSA9IHNpZGViYXJJZnJhbWU7XG4gICAgICAgIC8vIEFkZCBhIGxvYWQgZXZlbnQgbGlzdGVuZXIgdG8gdmVyaWZ5IHRoZSBpZnJhbWUgbG9hZGVkIHByb3Blcmx5XG4gICAgICAgIHNpZGViYXJJZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgZGVidWdMb2coXCJTaWRlYmFyIGlmcmFtZSBsb2FkZWRcIiwge1xuICAgICAgICAgICAgICAgIHNyYzogc2lkZWJhcklmcmFtZS5zcmMsXG4gICAgICAgICAgICAgICAgaGFzQ29udGVudFdpbmRvdzogISFzaWRlYmFySWZyYW1lLmNvbnRlbnRXaW5kb3csXG4gICAgICAgICAgICAgICAgcmVhZHlTdGF0ZTogKChfYSA9IHNpZGViYXJJZnJhbWUuY29udGVudERvY3VtZW50KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVhZHlTdGF0ZSkgfHwgXCJ1bmtub3duXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFNlbmQgYSByZWFkeSBtZXNzYWdlIHRvIHRoZSBzaWRlYmFyXG4gICAgICAgICAgICBpZiAoc2lkZWJhcklmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgc2lkZWJhcklmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKHsgdHlwZTogXCJTSURFQkFSX1JFQURZXCIgfSwgXCIqXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gQWRkIFZpYmVXcml0ZSBidXR0b25zIHRvIHRoZSBHb29nbGUgRG9jcyB0b29sYmFyXG4gICAgICAgIGNvbnN0IHRvb2xiYXJDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRvY3MtdGl0bGViYXItYnV0dG9uc1wiKTtcbiAgICAgICAgaWYgKHRvb2xiYXJDb250YWluZXIpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb250YWluZXIgZm9yIG91ciBidXR0b25zXG4gICAgICAgICAgICBjb25zdCB2aWJlV3JpdGVUb29sYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHZpYmVXcml0ZVRvb2xiYXIuY2xhc3NOYW1lID0gXCJ2aWJld3JpdGUtdG9vbGJhclwiO1xuICAgICAgICAgICAgdmliZVdyaXRlVG9vbGJhci5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtZmxleFwiO1xuICAgICAgICAgICAgdmliZVdyaXRlVG9vbGJhci5zdHlsZS5hbGlnbkl0ZW1zID0gXCJjZW50ZXJcIjsgLy8gQ3JlYXRlIHRvZ2dsZSBzaWRlYmFyIGJ1dHRvblxuICAgICAgICAgICAgY29uc3QgdG9nZ2xlU2lkZWJhckJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICB0b2dnbGVTaWRlYmFyQnV0dG9uLmNsYXNzTmFtZSA9IFwidmliZXdyaXRlLWJ1dHRvblwiO1xuICAgICAgICAgICAgdG9nZ2xlU2lkZWJhckJ1dHRvbi50ZXh0Q29udGVudCA9IFwiVmliZVdyaXRlXCI7XG4gICAgICAgICAgICB0b2dnbGVTaWRlYmFyQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiIzFhNzNlOFwiO1xuICAgICAgICAgICAgdG9nZ2xlU2lkZWJhckJ1dHRvbi5zdHlsZS5jb2xvciA9IFwid2hpdGVcIjtcbiAgICAgICAgICAgIHRvZ2dsZVNpZGViYXJCdXR0b24uc3R5bGUucGFkZGluZyA9IFwiOHB4IDEycHhcIjtcbiAgICAgICAgICAgIHRvZ2dsZVNpZGViYXJCdXR0b24uc3R5bGUuYm9yZGVyID0gXCJub25lXCI7XG4gICAgICAgICAgICB0b2dnbGVTaWRlYmFyQnV0dG9uLnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNHB4XCI7XG4gICAgICAgICAgICB0b2dnbGVTaWRlYmFyQnV0dG9uLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICAgICAgdG9nZ2xlU2lkZWJhckJ1dHRvbi5zdHlsZS5tYXJnaW5SaWdodCA9IFwiMTBweFwiO1xuICAgICAgICAgICAgdG9nZ2xlU2lkZWJhckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIlZpYmVXcml0ZSBidXR0b24gY2xpY2tlZFwiKTtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB0b2dnbGVTaWRlYmFyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbmFseXplIGJ1dHRvblxuICAgICAgICAgICAgY29uc3QgYW5hbHl6ZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgICAgICBhbmFseXplQnV0dG9uLmNsYXNzTmFtZSA9IFwidmliZXdyaXRlLWJ1dHRvblwiO1xuICAgICAgICAgICAgYW5hbHl6ZUJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQW5hbHl6ZVwiO1xuICAgICAgICAgICAgYW5hbHl6ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYW5hbHl6ZURvY3VtZW50KTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBmZWVkYmFjayBidXR0b25cbiAgICAgICAgICAgIGNvbnN0IGZlZWRiYWNrQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgICAgIGZlZWRiYWNrQnV0dG9uLmNsYXNzTmFtZSA9IFwidmliZXdyaXRlLWJ1dHRvblwiO1xuICAgICAgICAgICAgZmVlZGJhY2tCdXR0b24udGV4dENvbnRlbnQgPSBcIkFkZCBGZWVkYmFja1wiO1xuICAgICAgICAgICAgZmVlZGJhY2tCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFkZEZlZWRiYWNrKTtcbiAgICAgICAgICAgIC8vIEFkZCBidXR0b25zIHRvIHRoZSB0b29sYmFyXG4gICAgICAgICAgICB2aWJlV3JpdGVUb29sYmFyLmFwcGVuZENoaWxkKHRvZ2dsZVNpZGViYXJCdXR0b24pO1xuICAgICAgICAgICAgdmliZVdyaXRlVG9vbGJhci5hcHBlbmRDaGlsZChhbmFseXplQnV0dG9uKTtcbiAgICAgICAgICAgIHZpYmVXcml0ZVRvb2xiYXIuYXBwZW5kQ2hpbGQoZmVlZGJhY2tCdXR0b24pO1xuICAgICAgICAgICAgLy8gSW5zZXJ0IG91ciB0b29sYmFyIGJlZm9yZSB0aGUgc2hhcmUgYnV0dG9uXG4gICAgICAgICAgICB0b29sYmFyQ29udGFpbmVyLmluc2VydEJlZm9yZSh2aWJlV3JpdGVUb29sYmFyLCB0b29sYmFyQ29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgZGVidWdMb2coXCJWaWJlV3JpdGUgVUkgYWRkZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBkZWJ1Z0xvZyhcIkVycm9yIGFkZGluZyBWaWJlV3JpdGUgVUk6XCIsIGVycm9yKTtcbiAgICB9XG59XG4vLyBGdW5jdGlvbiB0byB0b2dnbGUgdGhlIHNpZGViYXJcbmZ1bmN0aW9uIHRvZ2dsZVNpZGViYXIoKSB7XG4gICAgbGV0IHNpZGViYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZpYmV3cml0ZS1zaWRlYmFyXCIpO1xuICAgIC8vIElmIHNpZGViYXIgZG9lc24ndCBleGlzdCwgY3JlYXRlIGl0IGZpcnN0XG4gICAgaWYgKCFzaWRlYmFyKSB7XG4gICAgICAgIGRlYnVnTG9nKFwiU2lkZWJhciBub3QgZm91bmQsIGNyZWF0aW5nIGl0IGZpcnN0XCIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYWRkVmliZVdyaXRlVUkoKTtcbiAgICAgICAgICAgIHNpZGViYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZpYmV3cml0ZS1zaWRlYmFyXCIpO1xuICAgICAgICAgICAgZGVidWdMb2coXCJTaWRlYmFyIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5OlwiLCBzaWRlYmFyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nKFwiRXJyb3IgY3JlYXRpbmcgc2lkZWJhcjpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgLy8gU2hvdyBhbiBhbGVydCB0byB0aGUgdXNlciB0aGF0IHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICAgICAgICBhbGVydChcIlZpYmVXcml0ZTogQ291bGQgbm90IGNyZWF0ZSBzaWRlYmFyLiBQbGVhc2UgcmVsb2FkIHRoZSBwYWdlIGFuZCB0cnkgYWdhaW4uXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzaWRlYmFyKSB7XG4gICAgICAgIGNvbnN0IGlzQ3VycmVudGx5T3BlbiA9IHNpZGViYXIuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3BlblwiKTtcbiAgICAgICAgLy8gTG9nIGN1cnJlbnQgc3RhdGUgZm9yIGRlYnVnZ2luZ1xuICAgICAgICBkZWJ1Z0xvZyhcIlNpZGViYXIgc3RhdGUgYmVmb3JlIHRvZ2dsZTpcIiwge1xuICAgICAgICAgICAgaXNPcGVuOiBpc0N1cnJlbnRseU9wZW4sXG4gICAgICAgICAgICBjbGFzc0xpc3Q6IEFycmF5LmZyb20oc2lkZWJhci5jbGFzc0xpc3QpLFxuICAgICAgICAgICAgY29tcHV0ZWRUcmFuc2Zvcm06IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHNpZGViYXIpLnRyYW5zZm9ybSxcbiAgICAgICAgICAgIGRpc3BsYXk6IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHNpZGViYXIpLmRpc3BsYXksXG4gICAgICAgIH0pO1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC50b2dnbGUoXCJvcGVuXCIpO1xuICAgICAgICAvLyBMb2cgc3RhdGUgYWZ0ZXIgdG9nZ2xlXG4gICAgICAgIGRlYnVnTG9nKFwiU2lkZWJhciBzdGF0ZSBhZnRlciB0b2dnbGU6XCIsIHtcbiAgICAgICAgICAgIGlzT3Blbjogc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoXCJvcGVuXCIpLFxuICAgICAgICAgICAgY2xhc3NMaXN0OiBBcnJheS5mcm9tKHNpZGViYXIuY2xhc3NMaXN0KSxcbiAgICAgICAgICAgIGNvbXB1dGVkVHJhbnNmb3JtOiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzaWRlYmFyKS50cmFuc2Zvcm0sXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBBcHBseSB0cmFuc2Zvcm0gZGlyZWN0bHkgdG8gZW5zdXJlIGl0IHdvcmtzIGV2ZW4gaWYgQ1NTIGlzIGRlbGF5ZWRcbiAgICAgICAgaWYgKHNpZGViYXIuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3BlblwiKSkge1xuICAgICAgICAgICAgc2lkZWJhci5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoMClcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNpZGViYXIuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKDEwMCUpXCI7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWdMb2coYFNpZGViYXIgJHtpc0N1cnJlbnRseU9wZW4gPyBcImNsb3NlZFwiIDogXCJvcGVuZWRcIn1gKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkZWJ1Z0xvZyhcIkZhaWxlZCB0byBmaW5kIG9yIGNyZWF0ZSBzaWRlYmFyXCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLy8gRnVuY3Rpb24gdG8gYW5hbHl6ZSB0aGUgZG9jdW1lbnQgYW5kIHNob3cgc3VnZ2VzdGlvbnNcbmZ1bmN0aW9uIGFuYWx5emVEb2N1bWVudCgpIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIHNpZGViYXIgaXMgY3JlYXRlZCBhbmQgb3BlbmVkIGZpcnN0XG4gICAgY29uc3Qgc2lkZWJhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmliZXdyaXRlLXNpZGViYXJcIik7XG4gICAgaWYgKCFzaWRlYmFyKSB7XG4gICAgICAgIGRlYnVnTG9nKFwiU2lkZWJhciBub3QgZm91bmQsIGNyZWF0aW5nIGl0IGZpcnN0XCIpO1xuICAgICAgICBhZGRWaWJlV3JpdGVVSSgpO1xuICAgIH1cbiAgICAvLyBOb3cgZ2V0IHRoZSBzaWRlYmFyICh3aGV0aGVyIGl0IGV4aXN0ZWQgYmVmb3JlIG9yIHdhcyBqdXN0IGNyZWF0ZWQpXG4gICAgY29uc3Qgc2lkZWJhckVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZpYmV3cml0ZS1zaWRlYmFyXCIpO1xuICAgIGlmIChzaWRlYmFyRWxlbWVudCAmJiAhc2lkZWJhckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3BlblwiKSkge1xuICAgICAgICBzaWRlYmFyRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwib3BlblwiKTtcbiAgICAgICAgLy8gRm9yY2UgYSByZWRyYXdcbiAgICAgICAgc2lkZWJhckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBzaWRlYmFyRWxlbWVudC5vZmZzZXRIZWlnaHQ7IC8vIEZvcmNlIGEgcmVmbG93XG4gICAgICAgIHNpZGViYXJFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICB9XG4gICAgLy8gU2VuZCB0aGUgYW5hbHl6ZSBtZXNzYWdlIGRpcmVjdGx5IHRvIHRoZSBzaWRlYmFyIGlmcmFtZVxuICAgIGNvbnN0IHNpZGViYXJJZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZpYmV3cml0ZS1zaWRlYmFyLWlmcmFtZVwiKTtcbiAgICBpZiAoc2lkZWJhcklmcmFtZSA9PT0gbnVsbCB8fCBzaWRlYmFySWZyYW1lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzaWRlYmFySWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgZGVidWdMb2coXCJTZW5kaW5nIEFOQUxZWkVfRE9DVU1FTlQgdG8gc2lkZWJhciBpZnJhbWVcIik7XG4gICAgICAgIHNpZGViYXJJZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiQU5BTFlaRV9ET0NVTUVOVFwiIH0sIFwiKlwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGRlYnVnTG9nKFwiQ291bGQgbm90IGZpbmQgc2lkZWJhciBpZnJhbWUsIHRyeWluZyBicm9hZGNhc3RcIik7XG4gICAgICAgIC8vIEJyb2FkY2FzdCB0aGUgbWVzc2FnZSB0byBhbnkgd2luZG93IHRoYXQgbWlnaHQgYmUgbGlzdGVuaW5nXG4gICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcIkFOQUxZWkVfRE9DVU1FTlRcIixcbiAgICAgICAgICAgIHNvdXJjZTogXCJjb250ZW50LXNjcmlwdFwiLFxuICAgICAgICB9LCBcIipcIik7XG4gICAgICAgIC8vIEFsc28gdHJ5IHZpYSBjaHJvbWUgcnVudGltZSBtZXNzYWdpbmcgYXMgZmluYWwgZmFsbGJhY2tcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiBcIkFOQUxZWkVfRE9DVU1FTlRcIiB9KTtcbiAgICB9XG59XG4vLyBGdW5jdGlvbiB0byBhZGQgZmVlZGJhY2sgdG8gc2VsZWN0ZWQgdGV4dFxuZnVuY3Rpb24gYWRkRmVlZGJhY2soKSB7XG4gICAgLy8gR2V0IHRoZSBzZWxlY3RlZCB0ZXh0XG4gICAgY29uc3Qgc2VsZWN0ZWRUZXh0ID0gR29vZ2xlRG9jc0FQSS5nZXRTZWxlY3RlZFRleHQoKTtcbiAgICBpZiAoIXNlbGVjdGVkVGV4dCkge1xuICAgICAgICBhbGVydChcIlBsZWFzZSBzZWxlY3Qgc29tZSB0ZXh0IHRvIGdpdmUgZmVlZGJhY2sgb24uXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIE9wZW4gdGhlIHNpZGViYXJcbiAgICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2aWJld3JpdGUtc2lkZWJhclwiKTtcbiAgICBpZiAoc2lkZWJhciAmJiAhc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoXCJvcGVuXCIpKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZChcIm9wZW5cIik7XG4gICAgfVxuICAgIC8vIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBzaWRlYmFyIHRvIGFuYWx5emUgdGhlIHNlbGVjdGVkIHRleHRcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwiQ0hBVF9SRVFVRVNUXCIsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBQbGVhc2UgcmV2aWV3IGFuZCBpbXByb3ZlIHRoZSBmb2xsb3dpbmcgdGV4dDogXCIke3NlbGVjdGVkVGV4dH1cImAsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQsXG4gICAgICAgIH0sXG4gICAgfSk7XG59XG4vLyBTZXQgdXAgbWVzc2FnZSBoYW5kbGVyc1xuZnVuY3Rpb24gc2V0dXBNZXNzYWdlSGFuZGxlcnMoKSB7XG4gICAgZGVidWdMb2coXCJTZXR0aW5nIHVwIG1lc3NhZ2UgaGFuZGxlcnMuLi5cIik7XG4gICAgLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIHRoZSBleHRlbnNpb25cbiAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGRlYnVnTG9nKFwiQ29udGVudCBzY3JpcHQgcmVjZWl2ZWQgbWVzc2FnZTpcIiwgbWVzc2FnZSk7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQU5BTFlaRV9ET0NVTUVOVFwiOlxuICAgICAgICAgICAgICAgIGRlYnVnTG9nKFwiUmVjZWl2ZWQgQU5BTFlaRV9ET0NVTUVOVCBtZXNzYWdlXCIpO1xuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlVG9TaWRlYmFyKHsgdHlwZTogXCJBTkFMWVpFX0RPQ1VNRU5UXCIgfSk7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJHRVRfRE9DVU1FTlRfQ09OVEVOVFwiOlxuICAgICAgICAgICAgICAgIGRlYnVnTG9nKFwiUmVjZWl2ZWQgR0VUX0RPQ1VNRU5UX0NPTlRFTlQgbWVzc2FnZSBmcm9tIGNocm9tZS5ydW50aW1lXCIpO1xuICAgICAgICAgICAgICAgIC8vIFRyeSBzdGFuZGFyZCBtZXRob2QgZmlyc3RcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IEdvb2dsZURvY3NBUEkuZ2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhhdCBmYWlscywgdHJ5IGZvcmNlZCByZXRyaWV2YWxcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdMb2coXCJTdGFuZGFyZCByZXRyaWV2YWwgZmFpbGVkLCB0cnlpbmcgZm9yY2VkIG1ldGhvZC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IEdvb2dsZURvY3NBUEkuZm9yY2VHZXREb2N1bWVudENvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogISFjb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGNvbnRlbnQ6IGNvbnRlbnQgfHwgXCJcIiB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogIWNvbnRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCJDb3VsZCBub3QgcmV0cmlldmUgZG9jdW1lbnQgY29udGVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJHRVRfRE9DVU1FTlRfQ09OVEVOVF9SRUxBWVwiOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29udGVudCBzY3JpcHQgcmVjZWl2ZWQgcmVsYXkgcmVxdWVzdCBmcm9tIGJhY2tncm91bmRcIik7XG4gICAgICAgICAgICAgICAgLy8gR2V0IGNvbnRlbnQgYW5kIGJyb2FkY2FzdCBpdCB0byBhbnkgbGlzdGVuaW5nIGlmcmFtZXNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gR29vZ2xlRG9jc0FQSS5mb3JjZUdldERvY3VtZW50Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIkdvdCBkb2N1bWVudCBjb250ZW50IHZpYSByZWxheVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50TGVuZ3RoOiAoY29udGVudCA9PT0gbnVsbCB8fCBjb250ZW50ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjb250ZW50Lmxlbmd0aCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJyb2FkY2FzdCB0byBhbnkgcG90ZW50aWFsIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJET0NVTUVOVF9DT05URU5UX1JFU1BPTlNFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBjb250ZW50IHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IFwiY29udGVudC1yZWxheVwiLFxuICAgICAgICAgICAgICAgICAgICB9LCBcIipcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFsc28gdHJ5IHRvIHNlbmQgZGlyZWN0bHkgdG8gdGhlIGlmcmFtZSBpZiB3ZSBoYXZlIGEgcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpZGViYXJJZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInZpYmV3cml0ZS1zaWRlYmFyLWlmcmFtZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpZGViYXJJZnJhbWUgPT09IG51bGwgfHwgc2lkZWJhcklmcmFtZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2lkZWJhcklmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlYmFySWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiRE9DVU1FTlRfQ09OVEVOVF9SRVNQT05TRVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IFwiY29udGVudC1kaXJlY3RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIFwiKlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHJlbGF5aW5nIGRvY3VtZW50IGNvbnRlbnQ6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IFwiRmFpbGVkIHRvIHJlbGF5IGRvY3VtZW50IGNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRPR0dMRV9TSURFQkFSXCI6XG4gICAgICAgICAgICAgICAgZGVidWdMb2coXCJUb2dnbGluZyBzaWRlYmFyIHZpc2liaWxpdHlcIik7XG4gICAgICAgICAgICAgICAgdG9nZ2xlU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGRlYnVnTG9nKFwiVW5rbm93biBtZXNzYWdlIHR5cGU6XCIsIG1lc3NhZ2UudHlwZSk7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBcIlVua25vd24gbWVzc2FnZSB0eXBlXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIEltcG9ydGFudDogaW5kaWNhdGVzIHdlJ2xsIHJlc3BvbmQgYXN5bmNocm9ub3VzbHlcbiAgICB9KTsgLy8gQWxzbyBsaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIHNpZGViYXIgaWZyYW1lXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICAgICAgICAvLyBBY2NlcHQgbWVzc2FnZXMgZnJvbSB0aGUgc2lkZWJhciBpZnJhbWUsIGJ1dCBsb2cgYW5kIGRlYnVnIHRoZW0gcmVnYXJkbGVzcyBvZiBzb3VyY2VcbiAgICAgICAgZGVidWdMb2coXCJDb250ZW50IHNjcmlwdCByZWNlaXZlZCB3aW5kb3cgbWVzc2FnZTpcIiwgZXZlbnQuZGF0YSwgXCJTb3VyY2U6XCIsIGV2ZW50LnNvdXJjZSk7XG4gICAgICAgIC8vIERlYnVnIHNpZGViYXIgaWZyYW1lIGVsZW1lbnRcbiAgICAgICAgY29uc3Qgc2lkZWJhcklmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmliZXdyaXRlLXNpZGViYXJcIik7XG4gICAgICAgIGRlYnVnTG9nKFwiU2lkZWJhciBpZnJhbWUgZWxlbWVudDpcIiwgc2lkZWJhcklmcmFtZSwgXCJ3aXRoIGNvbnRlbnRXaW5kb3c6XCIsIHNpZGViYXJJZnJhbWUgPT09IG51bGwgfHwgc2lkZWJhcklmcmFtZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2lkZWJhcklmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgICAgLy8gQ2hlY2sgZXZlbnQgc291cmNlIGJ1dCBkb24ndCBibG9jayBtZXNzYWdlcyBkdXJpbmcgZGV2ZWxvcG1lbnRcbiAgICAgICAgY29uc3QgaXNGcm9tU2lkZWJhciA9IGV2ZW50LnNvdXJjZSA9PT0gKHNpZGViYXJJZnJhbWUgPT09IG51bGwgfHwgc2lkZWJhcklmcmFtZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2lkZWJhcklmcmFtZS5jb250ZW50V2luZG93KTtcbiAgICAgICAgaWYgKCFpc0Zyb21TaWRlYmFyKSB7XG4gICAgICAgICAgICBkZWJ1Z0xvZyhcIk1lc3NhZ2Ugbm90IGZyb20gc2lkZWJhciBpZnJhbWUsIGJ1dCBwcm9jZXNzaW5nIGFueXdheSBmb3IgZGVidWdnaW5nXCIpO1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoaXMgY29tbWVudCBhbmQgdGhlIG5leHQgbGluZSB0byBlbmZvcmNlIHN0cmljdCBzb3VyY2UgY2hlY2tpbmcgaW4gcHJvZHVjdGlvblxuICAgICAgICAgICAgLy8gcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5kYXRhICYmIGV2ZW50LmRhdGEudHlwZSA9PT0gXCJHRVRfRE9DVU1FTlRfQ09OVEVOVFwiKSB7XG4gICAgICAgICAgICBkZWJ1Z0xvZyhcIlByb2Nlc3NpbmcgR0VUX0RPQ1VNRU5UX0NPTlRFTlQgcmVxdWVzdCBmcm9tIHNpZGViYXJcIik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEZpcnN0IHRyeSByZWd1bGFyIG1ldGhvZFxuICAgICAgICAgICAgICAgIGxldCBjb250ZW50ID0gR29vZ2xlRG9jc0FQSS5nZXREb2N1bWVudENvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGF0IGZhaWxzLCB0cnkgZm9yY2VkIHJldHJpZXZhbFxuICAgICAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIlN0YW5kYXJkIGNvbnRlbnQgcmV0cmlldmFsIGZhaWxlZCwgdHJ5aW5nIGZvcmNlZCBtZXRob2QuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBHb29nbGVEb2NzQVBJLmZvcmNlR2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHdlIHN0aWxsIGRvbid0IGhhdmUgY29udGVudCwgdHJ5IG9uZSBtb3JlIGFwcHJvYWNoIHdpdGggYSBkZWxheVxuICAgICAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIlRyeWluZyBkZWxheWVkIHJldHJpZXZhbCBhcyBsYXN0IHJlc29ydC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0UmVzb3J0Q29udGVudCA9IEdvb2dsZURvY3NBUEkuZm9yY2VHZXREb2N1bWVudENvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlVG9TaWRlYmFyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkRPQ1VNRU5UX0NPTlRFTlRfUkVTUE9OU0VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBsYXN0UmVzb3J0Q29udGVudCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkVtcHR5IGRvY3VtZW50IG9yIGNvbnRlbnQgY2Fubm90IGJlIGFjY2Vzc2VkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBlYXJseSwgdGhlIGRlbGF5ZWQgZnVuY3Rpb24gd2lsbCBoYW5kbGUgc2VuZGluZyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNlbmQgdGhlIGNvbnRlbnQgYmFjayB0byB0aGUgc2lkZWJhclxuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlVG9TaWRlYmFyKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJET0NVTUVOVF9DT05URU5UX1JFU1BPTlNFXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhgU2VudCBkb2N1bWVudCBjb250ZW50IHRvIHNpZGViYXIgKCR7KGNvbnRlbnQgPT09IG51bGwgfHwgY29udGVudCA9PT0gdm9pZCAwID8gdm9pZCAwIDogY29udGVudC5sZW5ndGgpIHx8IDB9IGNoYXJhY3RlcnMpYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZyhcIkVycm9yIGdldHRpbmcgZG9jdW1lbnQgY29udGVudDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIC8vIFRyeSBmb3JjZWQgcmV0cmlldmFsIGFzIGEgbGFzdCByZXNvcnRcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWVyZ2VuY3lDb250ZW50ID0gR29vZ2xlRG9jc0FQSS5mb3JjZUdldERvY3VtZW50Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1lcmdlbmN5Q29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2VUb1NpZGViYXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiRE9DVU1FTlRfQ09OVEVOVF9SRVNQT05TRVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGVtZXJnZW5jeUNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nKGBTZW50IGVtZXJnZW5jeSBkb2N1bWVudCBjb250ZW50IHRvIHNpZGViYXIgKCR7ZW1lcmdlbmN5Q29udGVudC5sZW5ndGh9IGNoYXJhY3RlcnMpYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdMb2coXCJFbWVyZ2VuY3kgY29udGVudCByZXRyaWV2YWwgYWxzbyBmYWlsZWQ6XCIsIGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTZW5kIGVycm9yIGJhY2sgdG8gdGhlIHNpZGViYXJcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZVRvU2lkZWJhcih7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiRE9DVU1FTlRfQ09OVEVOVF9SRVNQT05TRVwiLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcmV0cmlldmUgZG9jdW1lbnQgY29udGVudFwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2ZW50LmRhdGEgJiYgZXZlbnQuZGF0YS50eXBlID09PSBcIkdFVF9TRUxFQ1RFRF9URVhUXCIpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nKFwiUHJvY2Vzc2luZyBHRVRfU0VMRUNURURfVEVYVCByZXF1ZXN0IGZyb20gc2lkZWJhclwiKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gR2V0IHNlbGVjdGVkIHRleHQgdXNpbmcgR29vZ2xlRG9jc0FQSVxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkVGV4dCA9IEdvb2dsZURvY3NBUEkuZ2V0U2VsZWN0ZWRUZXh0KCk7XG4gICAgICAgICAgICAgICAgLy8gU2VuZCB0aGUgdGV4dCBiYWNrIHRvIHRoZSBzaWRlYmFyXG4gICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2VUb1NpZGViYXIoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlNFTEVDVEVEX1RFWFRfUkVTUE9OU0VcIixcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogc2VsZWN0ZWRUZXh0IHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGVidWdMb2coYFNlbnQgc2VsZWN0ZWQgdGV4dCB0byBzaWRlYmFyICgkeyhzZWxlY3RlZFRleHQgPT09IG51bGwgfHwgc2VsZWN0ZWRUZXh0ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzZWxlY3RlZFRleHQubGVuZ3RoKSB8fCAwfSBjaGFyYWN0ZXJzKWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgZGVidWdMb2coXCJFcnJvciBnZXR0aW5nIHNlbGVjdGVkIHRleHQ6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIGVycm9yIGJhY2sgdG8gdGhlIHNpZGViYXJcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZVRvU2lkZWJhcih7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiU0VMRUNURURfVEVYVF9SRVNQT05TRVwiLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogXCJGYWlsZWQgdG8gcmV0cmlldmUgc2VsZWN0ZWQgdGV4dFwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gcG9zdCBtZXNzYWdlcyB0byB0aGUgc2lkZWJhciBpZnJhbWVcbmZ1bmN0aW9uIHBvc3RNZXNzYWdlVG9TaWRlYmFyKG1lc3NhZ2UpIHtcbiAgICBkZWJ1Z0xvZyhcIkF0dGVtcHRpbmcgdG8gcG9zdCBtZXNzYWdlIHRvIHNpZGViYXI6XCIsIG1lc3NhZ2UpO1xuICAgIC8vIEZpcnN0IHRyeSB0aGUgZGlyZWN0IHNpZGViYXIgSUQgd2l0aCBpZnJhbWVcbiAgICBjb25zdCBzaWRlYmFySWZyYW1lSW5Db250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpYmV3cml0ZS1zaWRlYmFyIGlmcmFtZVwiKTtcbiAgICBpZiAoc2lkZWJhcklmcmFtZUluQ29udGFpbmVyID09PSBudWxsIHx8IHNpZGViYXJJZnJhbWVJbkNvbnRhaW5lciA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2lkZWJhcklmcmFtZUluQ29udGFpbmVyLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgZGVidWdMb2coXCJGb3VuZCBpZnJhbWUgaW5zaWRlIHNpZGViYXIgY29udGFpbmVyLCBwb3N0aW5nIG1lc3NhZ2VcIik7XG4gICAgICAgIHNpZGViYXJJZnJhbWVJbkNvbnRhaW5lci5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1lc3NhZ2UsIFwiKlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gLy8gVHJ5IHRoZSBzcGVjaWZpYyBzaWRlYmFyIGlmcmFtZSBieSBJRFxuICAgIGNvbnN0IHNpZGViYXJJZnJhbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3ZpYmV3cml0ZS1zaWRlYmFyLWlmcmFtZVwiKTtcbiAgICBpZiAoc2lkZWJhcklmcmFtZSA9PT0gbnVsbCB8fCBzaWRlYmFySWZyYW1lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzaWRlYmFySWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgZGVidWdMb2coXCJGb3VuZCBzaWRlYmFyIGlmcmFtZSBieSBJRCwgcG9zdGluZyBtZXNzYWdlXCIpO1xuICAgICAgICBzaWRlYmFySWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobWVzc2FnZSwgXCIqXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFRyeSBmYWxsYmFjayBzZWxlY3RvcnNcbiAgICBjb25zdCBmYWxsYmFja1NlbGVjdG9ycyA9IFtcbiAgICAgICAgXCIudmliZXdyaXRlLXNpZGViYXItY29udGFpbmVyIGlmcmFtZVwiLFxuICAgICAgICBcIi52aWJld3JpdGUtc2lkZWJhclwiLFxuICAgICAgICBcImlmcmFtZVtzcmMqPSdzaWRlYmFyLmh0bWwnXVwiLFxuICAgICAgICBcImlmcmFtZVwiLCAvLyBMYXN0IHJlc29ydCwgdHJ5IGFueSBpZnJhbWVcbiAgICBdO1xuICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgZmFsbGJhY2tTZWxlY3RvcnMpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICBpZiAoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBlbGVtZW50LmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nKGBGb3VuZCBlbGVtZW50IHVzaW5nIGZhbGxiYWNrIHNlbGVjdG9yIFwiJHtzZWxlY3Rvcn1cIiwgcG9zdGluZyBtZXNzYWdlYCk7XG4gICAgICAgICAgICBlbGVtZW50LmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobWVzc2FnZSwgXCIqXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIGFsbCBlbHNlIGZhaWxzLCBicm9hZGNhc3QgdG8gYWxsIHBvdGVudGlhbCB3aW5kb3dzXG4gICAgZGVidWdMb2coXCJDb3VsZCBub3QgZmluZCBzaWRlYmFyIGlmcmFtZSwgYnJvYWRjYXN0aW5nIG1lc3NhZ2VcIik7XG4gICAgLy8gVHJ5IHBhcmVudCBhbmQgdG9wIHdpbmRvd3MgYXMgbGFzdCByZXNvcnRcbiAgICBpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpIHtcbiAgICAgICAgZGVidWdMb2coXCJCcm9hZGNhc3RpbmcgbWVzc2FnZSB0byBwYXJlbnQgd2luZG93XCIpO1xuICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKG1lc3NhZ2UsIFwiKlwiKTtcbiAgICB9XG4gICAgaWYgKHdpbmRvdy50b3AgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHdpbmRvdy50b3AgIT09IHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgZGVidWdMb2coXCJCcm9hZGNhc3RpbmcgbWVzc2FnZSB0byB0b3Agd2luZG93XCIpO1xuICAgICAgICB3aW5kb3cudG9wLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIFwiKlwiKTtcbiAgICB9XG4gICAgZGVidWdMb2coXCJDb3VsZCBub3QgZmluZCBhbnkgc3VpdGFibGUgdGFyZ2V0IGZvciBtZXNzYWdlXCIpO1xufVxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHdhaXQgZm9yIGFuIGVsZW1lbnQgdG8gYmUgcHJlc2VudCBpbiB0aGUgRE9NXG5mdW5jdGlvbiB3YWl0Rm9yRWxlbWVudChzZWxlY3RvciwgdGltZW91dCA9IDEwMDAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tFbGVtZW50KCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBUaW1lb3V0IHdhaXRpbmcgZm9yIGVsZW1lbnQ6ICR7c2VsZWN0b3J9YCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0VsZW1lbnQsIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tFbGVtZW50KCk7XG4gICAgfSk7XG59XG4vLyBIZWxwZXIgZnVuY3Rpb24gZm9yIGVuaGFuY2VkIGRlYnVnIGxvZ2dpbmdcbmZ1bmN0aW9uIGRlYnVnTG9nKGNvbnRleHQsIC4uLmFyZ3MpIHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMTEsIDE5KTsgLy8gSEg6TU06U1NcbiAgICBjb25zb2xlLmxvZyhgW1ZpYmVXcml0ZSBEZWJ1ZyAke3RpbWVzdGFtcH1dICR7Y29udGV4dH06YCwgLi4uYXJncyk7XG4gICAgLy8gQWxzbyBsb2cgRE9NIHN0YXRlIGZvciBkZWJ1Z2dpbmdcbiAgICBpZiAoY29udGV4dC5pbmNsdWRlcyhcImRvY3VtZW50IGNvbnRlbnRcIikpIHtcbiAgICAgICAgbG9nRE9NU3RhdGUoKTtcbiAgICB9XG59XG4vLyBMb2cgdGhlIGN1cnJlbnQgRE9NIHN0YXRlIGZvciBkZWJ1Z2dpbmdcbmZ1bmN0aW9uIGxvZ0RPTVN0YXRlKCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIExvZyBET00gc3RydWN0dXJlIGluZm9ybWF0aW9uXG4gICAgICAgIGNvbnN0IHNpZGViYXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN2aWJld3JpdGUtc2lkZWJhclwiKTtcbiAgICAgICAgY29uc3Qgc2lkZWJhcklmcmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmliZXdyaXRlLXNpZGViYXIgaWZyYW1lXCIpO1xuICAgICAgICBjb25zdCBwYXJhZ3JhcGhzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5raXgtcGFyYWdyYXBocmVuZGVyZXJcIik7XG4gICAgICAgIGRlYnVnTG9nKFwiRE9NIFN0YXRlXCIsIHtcbiAgICAgICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICBpc0dvb2dsZURvY3M6IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gXCJkb2NzLmdvb2dsZS5jb21cIixcbiAgICAgICAgICAgIHNpZGViYXJFeGlzdHM6ICEhc2lkZWJhckVsZW1lbnQsXG4gICAgICAgICAgICBzaWRlYmFySWZyYW1lRXhpc3RzOiAhIXNpZGViYXJJZnJhbWUsXG4gICAgICAgICAgICBwYXJhZ3JhcGhDb3VudDogcGFyYWdyYXBocy5sZW5ndGgsXG4gICAgICAgICAgICBib2R5Q2hpbGRDb3VudDogZG9jdW1lbnQuYm9keS5jaGlsZEVsZW1lbnRDb3VudCxcbiAgICAgICAgICAgIGhhc0VkaXRvckVsZW1lbnQ6ICEhZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kb2NzLWVkaXRvci1jb250YWluZXJcIiksXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBDaGVjayBpZiBhbnkgY29udGVudCByZXRyaWV2YWwgbWV0aG9kIHdvcmtzXG4gICAgICAgIGNvbnN0IHN0YW5kYXJkQ29udGVudCA9IEdvb2dsZURvY3NBUEkuZ2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IGZvcmNlZENvbnRlbnQgPSBHb29nbGVEb2NzQVBJLmZvcmNlR2V0RG9jdW1lbnRDb250ZW50KCk7XG4gICAgICAgIGRlYnVnTG9nKFwiQ29udGVudCBSZXRyaWV2YWwgVGVzdFwiLCB7XG4gICAgICAgICAgICBzdGFuZGFyZENvbnRlbnRXb3JrczogISFzdGFuZGFyZENvbnRlbnQsXG4gICAgICAgICAgICBzdGFuZGFyZENvbnRlbnRMZW5ndGg6IChzdGFuZGFyZENvbnRlbnQgPT09IG51bGwgfHwgc3RhbmRhcmRDb250ZW50ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzdGFuZGFyZENvbnRlbnQubGVuZ3RoKSB8fCAwLFxuICAgICAgICAgICAgZm9yY2VkQ29udGVudFdvcmtzOiAhIWZvcmNlZENvbnRlbnQsXG4gICAgICAgICAgICBmb3JjZWRDb250ZW50TGVuZ3RoOiAoZm9yY2VkQ29udGVudCA9PT0gbnVsbCB8fCBmb3JjZWRDb250ZW50ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBmb3JjZWRDb250ZW50Lmxlbmd0aCkgfHwgMCxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGxvZ2dpbmcgRE9NIHN0YXRlOlwiLCBlcnIpO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==