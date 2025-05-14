/**
 * Google Docs API utility functions
 * Provides methods to interact with the Google Docs API
 */

/**
 * Extract the document ID from the current URL
 * @returns The Google Docs document ID or null if not found
 */
export function extractDocumentId(): string | null {
    const match = window.location.href.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    return match?.[1] || null;
}

/**
 * Fetch document content via Google Docs API
 * @param docId The Google Docs document ID
 * @returns Promise resolving to the document content
 */
export async function fetchDocumentContent(docId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "GET_DOCUMENT_CONTENT_API",
                data: { docId },
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (response?.success && response.data?.content) {
                    resolve(response.data.content);
                } else {
                    reject(
                        new Error(
                            response?.error ||
                                "Failed to fetch document content"
                        )
                    );
                }
            }
        );
    });
}

/**
 * Process the document content from Google Docs API response
 * @param docContent The raw document content from the API
 * @returns Processed text content ready for analysis
 */
export function processDocumentContent(docContent: any): string {
    let content = "";

    try {
        // Extract text content from Google Docs API structure
        if (docContent.body?.content) {
            for (const element of docContent.body.content) {
                if (element.paragraph) {
                    for (const paragraphElement of element.paragraph.elements ||
                        []) {
                        if (paragraphElement.textRun?.content) {
                            content += paragraphElement.textRun.content;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error processing document content:", error);
    }

    return content;
}
