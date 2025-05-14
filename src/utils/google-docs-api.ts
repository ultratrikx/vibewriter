// API for interacting with Google Docs
export class GoogleDocsAPI {
    /**
     * Retrieves the entire document content from Google Docs
     */
    static getDocumentContent(): string {
        try {
            // Get all text content from the document
            const documentContent = Array.from(
                document.querySelectorAll(".kix-paragraphrenderer")
            )
                .map((element) => element.textContent)
                .join("\n");

            return documentContent;
        } catch (error) {
            console.error("Error getting document content:", error);
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
     * Check if we're in a Google Docs document
     */
    static isInGoogleDocs(): boolean {
        return window.location.href.startsWith(
            "https://docs.google.com/document/"
        );
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
