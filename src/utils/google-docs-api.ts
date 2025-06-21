// API for interacting with Google Docs
export class GoogleDocsAPI {
    private static debugInterval: number | null = null;
    private static lastDebugTime: number = 0;

    /**
     * Start periodic logging of document state
     */
    static startDebugLogging() {
        // Don't start multiple debug intervals
        if (this.debugInterval !== null) return;

        console.log("Starting GoogleDocsAPI debug logging");
        this.debugInterval = window.setInterval(() => {
            const now = Date.now();
            // Only log every 5 seconds at most to avoid spamming the console
            if (now - this.lastDebugTime > 5000) {
                this.lastDebugTime = now;

                const isInDocs = this.isInGoogleDocs();
                const paragraphs = document.querySelectorAll(
                    ".kix-paragraphrenderer"
                );

                console.log(
                    `[GoogleDocsAPI Debug] isInGoogleDocs: ${isInDocs}`
                );
                console.log(
                    `[GoogleDocsAPI Debug] paragraphs found: ${
                        paragraphs?.length || 0
                    }`
                );

                if (paragraphs && paragraphs.length > 0) {
                    const firstPara = paragraphs[0].textContent?.substring(
                        0,
                        50
                    );
                    console.log(
                        `[GoogleDocsAPI Debug] First paragraph starts with: ${firstPara}...`
                    );
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
    static isInGoogleDocs(): boolean {
        try {
            // Check for Google Docs specific elements
            const isInDocs =
                window.location.hostname === "docs.google.com" &&
                (document.querySelector(".kix-paragraphrenderer") !== null ||
                    document.querySelector(".docs-editor") !== null);

            return isInDocs;
        } catch (error) {
            console.error("Error checking if in Google Docs:", error);
            return false;
        }
    }
    /**
     * Retrieves the entire document content from Google Docs
     * @param maxRetries Number of retry attempts
     * @param delayMs Delay between retries in milliseconds
     * @returns Document content as string or empty string if not found
     */ static getDocumentContent(maxRetries = 3): string {
        try {
            console.log("Attempting to retrieve document content...");

            // Check if we're in a Google Docs document editor
            if (!this.isInGoogleDocs()) {
                console.error("Not in a Google Docs document");
                return "";
            }

            // Try direct document access through Google Docs API if available
            try {
                if (
                    typeof (window as any).googTernaryParent?.getDoc ===
                    "function"
                ) {
                    const docContent =
                        (window as any).googTernaryParent
                            .getDoc()
                            ?.getBody()
                            ?.getText() || "";
                    if (docContent) {
                        console.log(
                            "Retrieved document content via Google Docs internal API"
                        );
                        return docContent;
                    }
                }
            } catch (e) {
                console.log("Failed to access Google Docs API directly:", e);
            }

            // Get all text content from the document
            const paragraphs = document.querySelectorAll(
                ".kix-paragraphrenderer"
            );

            if (!paragraphs || paragraphs.length === 0) {
                console.error(
                    "Could not find paragraph elements in document, DOM might not be ready"
                );

                // Start debug logging when we can't find paragraph elements
                this.startDebugLogging();

                // If we have retries left, try a different selector
                if (maxRetries > 0) {
                    console.log(
                        `Trying alternative selectors (${maxRetries} retries left)`
                    );

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
                            console.log(
                                `Found ${elements.length} elements with selector ${selector}`
                            ); // Try to get the content from these elements
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
                                            if (
                                                !element.contentDocument &&
                                                element.src &&
                                                element.src.startsWith(
                                                    window.location.origin
                                                )
                                            ) {
                                                console.log(
                                                    "Same-origin iframe found but content not ready"
                                                );
                                                // Will be picked up in next retry
                                            }
                                        } catch (e) {
                                            // Cross-origin iframe, we can't access content directly
                                            console.log(
                                                "Cross-origin iframe access error:",
                                                e
                                            );
                                        }
                                    }
                                    return element.textContent;
                                })
                                .filter(Boolean)
                                .join("\n");

                            if (content) {
                                console.log(
                                    `Retrieved ${content.length} characters using alternative selector ${selector}`
                                );
                                return content;
                            }
                        }
                    } // If alternatives didn't work, try accessing document directly
                    try {
                        const docText =
                            document.body.innerText ||
                            document.documentElement.innerText;
                        if (docText && docText.trim().length > 0) {
                            console.log(
                                `Retrieved ${docText.length} characters from document body`
                            );
                            return docText;
                        }
                    } catch (e) {
                        console.log("Error accessing document body text:", e);
                    }

                    // Try an alternative approach - look for text nodes in the document
                    try {
                        let textContent = "";
                        const textWalker = document.createTreeWalker(
                            document.body,
                            NodeFilter.SHOW_TEXT,
                            null
                        );
                        let n: Node | null;
                        while ((n = textWalker.nextNode())) {
                            if (n.textContent && n.textContent.trim()) {
                                textContent += n.textContent + "\n";
                            }
                        }

                        if (textContent && textContent.length > 100) {
                            console.log(
                                `Retrieved ${textContent.length} characters from text nodes`
                            );
                            return textContent;
                        }
                    } catch (e) {
                        console.log("Error using TreeWalker:", e);
                    }

                    // If all alternatives failed, return empty and retry later
                    console.log(
                        `No content found with any method. Returning empty string.`
                    );
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
            } else {
                // Content retrieved successfully, we can stop debug logging
                this.stopDebugLogging();
            }

            console.log(
                `Retrieved ${documentContent.length} characters from document`
            );
            return documentContent;
        } catch (error) {
            console.error("Error getting document content:", error);
            this.startDebugLogging();
            return "";
        }
    }
    /**
     * Get document content without checking if we're in Google Docs.
     * This is used as a fallback method for the message passing architecture.
     */
    static forceGetDocumentContent(): string {
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
                const extractedContent = (window as any)
                    .vibeWriteExtractedContent;
                if (extractedContent && extractedContent.length > 100) {
                    console.log(
                        `Retrieved ${extractedContent.length} characters via injected script`
                    );
                    return extractedContent;
                }
            } catch (e) {
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
                    console.log(
                        `Found ${elements.length} elements with selector ${selector}`
                    );

                    const content = Array.from(elements)
                        .map((element) => element.textContent)
                        .filter(Boolean)
                        .join("\n");

                    if (content) {
                        console.log(
                            `Retrieved ${content.length} characters using selector ${selector}`
                        );
                        return content;
                    }
                }
            }

            // If all selectors fail, try to get any text from the document
            const allText = document.body.textContent;
            if (allText && allText.length > 100) {
                // Only use if substantial content
                console.log(
                    `Retrieved ${allText.length} characters from document.body.textContent`
                );
                return allText;
            }

            console.error(
                "Forced document content retrieval failed - no content found"
            );
            return "";
        } catch (error) {
            console.error("Error in forced document content retrieval:", error);
            return "";
        }
    }

    /**
     * Gets the current selected text in Google Docs
     */
    static getSelectedText(): string {
        try {
            // Using the Google Docs selection functionality
            if (window.getSelection) {
                const selection = window.getSelection();
                if (selection) {
                    return selection.toString();
                }
            }
            return "";
        } catch (error) {
            console.error("Error getting selected text:", error);
            return "";
        }
    }

    /**
     * Add a Google Docs comment at the current selection
     * @param commentText - Text to add as a comment
     */
    static addComment(commentText: string): boolean {
        try {
            // First, need to make sure something is selected
            const selectedText = this.getSelectedText();
            if (!selectedText) {
                console.warn("No text selected to add a comment to");
                return false;
            }

            // Simulate clicking the "Add comment" button or menu item
            const commentButton = document.querySelector(
                '[aria-label="Add comment"]'
            ) as HTMLElement;
            if (commentButton) {
                commentButton.click();

                // Wait for the comment box to appear
                setTimeout(() => {
                    // Find the comment input box and insert our text
                    const commentBox = document.querySelector(
                        ".docos-input-textarea"
                    );
                    if (commentBox) {
                        // Set the value of the comment box
                        Object.getOwnPropertyDescriptor(
                            HTMLTextAreaElement.prototype,
                            "value"
                        )?.set?.call(commentBox, commentText);

                        // Trigger input event to ensure Google Docs recognizes the change
                        commentBox.dispatchEvent(
                            new Event("input", { bubbles: true })
                        );

                        // Submit the comment - find the "Comment" button and click it
                        setTimeout(() => {
                            const commentSubmitButton = Array.from(
                                document.querySelectorAll("button")
                            ).find(
                                (button) => button.textContent === "Comment"
                            ) as HTMLElement;

                            if (commentSubmitButton) {
                                commentSubmitButton.click();
                                return true;
                            }
                        }, 300);
                    }
                }, 500);
            }

            return false;
        } catch (error) {
            console.error("Error adding comment:", error);
            return false;
        }
    }

    /**
     * Check if a URL is a Google Docs document URL
     */
    static isGoogleDocsUrl(url: string): boolean {
        return url.startsWith("https://docs.google.com/document/");
    }

    /**
     * Get the current document's title
     */
    static getDocumentTitle(): string {
        try {
            const titleElement = document.querySelector(".docs-title-input");
            if (titleElement) {
                return titleElement.textContent || "Untitled Document";
            }
            return "Untitled Document";
        } catch (error) {
            console.error("Error getting document title:", error);
            return "Untitled Document";
        }
    }
}
