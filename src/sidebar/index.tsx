import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import {
    AIService,
    StorageService,
    OllamaHelper,
    AIModelConfig,
    AIProvider,
} from "../utils/services";
import { ChatMessage, WritingSuggestion } from "../utils/types";
import { GoogleDocsAPI } from "../utils/google-docs-api";
import { extractDocumentId, fetchDocumentContent } from "../utils/docs-api";

// Component for a single chat message
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div
            className={`message ${
                message.role === "user" ? "user" : "assistant"
            }`}
        >
            <div className="message-content">{message.content}</div>
            <div className="message-time">{formatTime(message.timestamp)}</div>
        </div>
    );
};

// Component for a single writing suggestion
const SuggestionCard: React.FC<{
    suggestion: WritingSuggestion;
    onApply: (suggestion: WritingSuggestion) => void;
    onDismiss: (id: string) => void;
    onRetry?: () => void; // Added optional retry handler
}> = ({ suggestion, onApply, onDismiss, onRetry }) => {
    // Special handling for error suggestions
    if (suggestion.isError) {
        return (
            <div
                className="suggestion-card"
                style={{ borderColor: "#ea4335", backgroundColor: "#fdeded" }}
            >
                <div className="suggestion-title" style={{ color: "#ea4335" }}>
                    Error
                </div>
                <div className="suggestion-content">
                    <strong>{suggestion.originalText}</strong>
                </div>
                <div className="suggestion-content">
                    {suggestion.suggestion}
                </div>
                <div className="suggestion-reason" style={{ color: "#d93025" }}>
                    {suggestion.reason}
                </div>
                <div className="suggestion-actions">
                    <button onClick={() => onDismiss(suggestion.id)}>
                        Dismiss
                    </button>
                    <button
                        onClick={onRetry || (() => window.location.reload())}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Normal suggestion card
    return (
        <div className="suggestion-card">
            <div className="suggestion-title">Suggested Improvement</div>
            <div className="suggestion-content">
                <strong>Original:</strong> "{suggestion.originalText}"
            </div>
            <div className="suggestion-content">
                <strong>Suggestion:</strong> "{suggestion.suggestion}"
            </div>
            <div className="suggestion-reason">{suggestion.reason}</div>
            <div className="suggestion-actions">
                <button onClick={() => onDismiss(suggestion.id)}>
                    Dismiss
                </button>
                <button onClick={() => onApply(suggestion)}>Apply</button>
            </div>
        </div>
    );
};

// Ollama status bar component
const OllamaStatusBar: React.FC = () => {
    const storageService = new StorageService();
    const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
        "http://localhost:11434"
    );
    const [connectionStatus, setConnectionStatus] = useState<
        "checking" | "connected" | "disconnected"
    >("checking");

    useEffect(() => {
        const loadSettings = async () => {
            const aiSettings = await storageService.getAISettings();
            if (aiSettings.baseUrl) {
                setOllamaBaseUrl(aiSettings.baseUrl);
            }
        };

        loadSettings();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkOllamaStatus = async () => {
            if (!isMounted) return;
            setConnectionStatus("checking");

            const isConnected = await OllamaHelper.checkConnection(
                ollamaBaseUrl
            );
            if (isMounted) {
                setConnectionStatus(isConnected ? "connected" : "disconnected");
            }
        };

        checkOllamaStatus();

        // Periodically check connection
        const interval = setInterval(checkOllamaStatus, 30000); // every 30 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [ollamaBaseUrl]);

    return (
        <div
            className="ollama-info-notice"
            style={{
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "4px",
                padding: "8px 12px",
                margin: "0 0 10px 0",
                fontSize: "11px",
            }}
        >
            <p
                style={{
                    margin: "0 0 4px 0",
                    fontWeight: "bold",
                    color: "#3B82F6",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                            connectionStatus === "connected"
                                ? "#34a853"
                                : connectionStatus === "disconnected"
                                ? "#ea4335"
                                : "#fbbc05",
                        marginRight: "6px",
                        display: "inline-block",
                    }}
                ></span>
                Using Ollama (Local AI) -{" "}
                {connectionStatus === "connected"
                    ? "Connected"
                    : connectionStatus === "disconnected"
                    ? "Disconnected"
                    : "Checking connection..."}
            </p>
            <p style={{ margin: "0", fontSize: "11px", color: "#1F2937" }}>
                Messages are processed on your computer using Ollama.{" "}
                {connectionStatus === "disconnected" && (
                    <div
                        style={{
                            color: "#ea4335",
                            fontWeight: "bold",
                            marginTop: "5px",
                        }}
                    >
                        Ollama connection failed. Please ensure:
                        <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                            <li>Ollama is running</li>
                            <li>
                                CORS is enabled by starting with:{" "}
                                <code
                                    style={{
                                        background: "#f0f0f0",
                                        padding: "2px 4px",
                                    }}
                                >
                                    OLLAMA_ORIGINS=* ollama serve
                                </code>
                            </li>
                        </ul>
                    </div>
                )}
            </p>
        </div>
    );
};

// Loading spinner component
const Loading: React.FC = () => (
    <div className="loading">
        <div className="spinner"></div>
    </div>
);

// Main Sidebar component
const Sidebar: React.FC<{}> = () => {
    const [activeTab, setActiveTab] = useState<"chat" | "suggestions">("chat");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [apiKey, setApiKey] = useState<string>("");
    const [aiProvider, setAiProvider] = useState<AIProvider>("openai");

    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const aiService = useRef<AIService>(new AIService());
    const storageService = new StorageService();

    // Create a helper function to handle document content retrieval failures
    const handleDocumentContentError = (error: Error) => {
        console.error("Document content error:", error);
        setSuggestions([
            {
                id: Date.now().toString(),
                originalText: "Document Access Error",
                suggestion: "Unable to access Google Docs content",
                reason: "VibeWrite needs permission to access the document content. Please refresh the page and ensure you're in edit mode with the document fully loaded.",
                timestamp: Date.now(),
                isError: true,
            },
        ]);
        setIsLoading(false);
    };

    // Create a function to retry document content retrieval
    const retryDocumentAccess = () => {
        setIsLoading(true);
        setSuggestions([
            {
                id: Date.now().toString(),
                originalText: "Retrying...",
                suggestion: "Attempting to reconnect to document",
                reason: "Please wait while we try to access the document again.",
                timestamp: Date.now(),
                isError: false,
            },
        ]);

        // Small delay before retry
        setTimeout(() => {
            analyzeDocument();
        }, 1000);
    };

    // Load the API settings when the sidebar is opened
    const loadAISettings = async () => {
        const aiSettings = await storageService.getAISettings();
        console.log("Loading AI settings in sidebar:", aiSettings);

        if (
            (aiSettings.provider === "openai" && aiSettings.apiKey) ||
            aiSettings.provider === "ollama"
        ) {
            setApiKey(aiSettings.apiKey || "");
            setAiProvider(aiSettings.provider);
            aiService.current.initClient(aiSettings);

            // Only add welcome message if there are no messages yet
            if (chatMessages.length === 0) {
                const welcomeMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content:
                        "Hello! I'm your writing assistant. How can I help you with your document today?",
                    timestamp: Date.now(),
                };

                setChatMessages([welcomeMessage]);
            }
        }
    };

    // Analyze the document to generate suggestions
    const analyzeDocument = async () => {
        // Don't require API key for Ollama
        if (aiProvider === "openai" && !apiKey) return;

        setActiveTab("suggestions");
        setIsLoading(true);

        try {
            console.log("Starting document analysis...");

            // Show loading indicator
            setSuggestions([
                {
                    id: Date.now().toString(),
                    originalText: "Document Loading",
                    suggestion: "Retrieving document content...",
                    reason: "Please wait while we access the document content.",
                    timestamp: Date.now(),
                    isError: false,
                },
            ]); // Use message passing to get document content from content script with retry mechanism
            let documentContent = "";
            try {
                // First attempt to get content
                console.log("Initial attempt to retrieve document content");
                documentContent = await getDocumentContentWithRetry(15000); // 15 second timeout for first attempt

                // If content is empty or too short, try again with a longer timeout
                if (!documentContent || documentContent.length < 50) {
                    console.log(
                        "First attempt returned empty/short content, retrying..."
                    );
                    setSuggestions([
                        {
                            id: Date.now().toString(),
                            originalText: "Connecting to document...",
                            suggestion: "Retrying content retrieval...",
                            reason: "The initial attempt did not return sufficient document content. Making another attempt.",
                            timestamp: Date.now(),
                            isError: false,
                        },
                    ]);

                    // Second attempt with longer timeout
                    documentContent = await getDocumentContentWithRetry(20000);
                }

                // If still empty after second attempt, try a different approach
                if (!documentContent || documentContent.length < 50) {
                    console.log(
                        "Second attempt failed, trying through Google Docs REST API..."
                    );
                    try {
                        // Extract document ID from URL
                        const docId = extractDocumentId();
                        if (!docId) {
                            throw new Error(
                                "Could not extract document ID from URL"
                            );
                        }

                        setSuggestions([
                            {
                                id: Date.now().toString(),
                                originalText: "Connecting to document...",
                                suggestion:
                                    "Attempting to access via Google Docs API...",
                                reason: "Using Google's official API for reliable access.",
                                timestamp: Date.now(),
                                isError: false,
                            },
                        ]);

                        // Request content via the Google Docs API
                        documentContent = await fetchDocumentContent(docId);
                        console.log(
                            "Successfully retrieved content via Google Docs API:",
                            documentContent
                                ? `${documentContent.length} chars`
                                : "No content"
                        );
                    } catch (apiError) {
                        console.error(
                            "Google Docs REST API approach failed:",
                            apiError
                        );

                        // Last resort: try the relay approach through the background script
                        try {
                            console.log("Trying relay as final approach...");

                            // Send relay request through background script
                            chrome.runtime.sendMessage({
                                type: "GET_DOCUMENT_CONTENT_RELAY",
                                id: Date.now().toString(),
                            });

                            // Wait a short time for relay to complete
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000)
                            );
                        } catch (relayError) {
                            console.error(
                                "Relay approach also failed:",
                                relayError
                            );
                        }
                    }
                }

                // Function to get document content with a specified timeout
                async function getDocumentContentWithRetry(
                    timeoutMs: number
                ): Promise<string> {
                    return new Promise((resolve, reject) => {
                        const messageId = Date.now().toString(); // Unique ID for this request

                        // Create timeout for retrieval
                        const timeout = setTimeout(() => {
                            window.removeEventListener(
                                "message",
                                messageHandler
                            );
                            reject(
                                new Error(
                                    `Timed out after ${timeoutMs}ms waiting for document content`
                                )
                            );
                        }, timeoutMs);

                        // Message handler function
                        function messageHandler(event: MessageEvent) {
                            if (
                                event.data &&
                                event.data.type === "DOCUMENT_CONTENT_RESPONSE"
                            ) {
                                console.log(
                                    "Received document content response:",
                                    event.data.content
                                        ? `${event.data.content.length} chars`
                                        : "No content",
                                    event.data.error
                                        ? `Error: ${event.data.error}`
                                        : "No error"
                                );

                                clearTimeout(timeout);
                                window.removeEventListener(
                                    "message",
                                    messageHandler
                                );

                                if (event.data.error) {
                                    reject(new Error(event.data.error));
                                } else {
                                    resolve(event.data.content || "");
                                }
                            }
                        }

                        // Listen for response
                        window.addEventListener("message", messageHandler);
                        // Send request to parent window (content script)
                        console.log(
                            `Sending GET_DOCUMENT_CONTENT request with timeout ${timeoutMs}ms`
                        );

                        // Try all possible methods to communicate with the content script
                        try {
                            // Method 1: Send via parent
                            window.parent.postMessage(
                                {
                                    type: "GET_DOCUMENT_CONTENT",
                                    id: messageId,
                                    source: "vibewrite-sidebar",
                                },
                                "*"
                            );

                            // Method 2: Top frame
                            if (window.top && window.top !== window.parent) {
                                console.log(
                                    "Also sending request to top window as fallback"
                                );
                                window.top.postMessage(
                                    {
                                        type: "GET_DOCUMENT_CONTENT",
                                        id: messageId,
                                        source: "vibewrite-sidebar",
                                    },
                                    "*"
                                );
                            }

                            // Method 3: Broadcast to all frames
                            window.postMessage(
                                {
                                    type: "GET_DOCUMENT_CONTENT",
                                    id: messageId,
                                    source: "vibewrite-sidebar-broadcast",
                                },
                                "*"
                            );

                            // Method 4: Try to use Chrome extension messaging
                            // This will be caught by the background script which can relay to content script
                            chrome.runtime.sendMessage({
                                type: "GET_DOCUMENT_CONTENT_RELAY",
                                id: messageId,
                            });
                        } catch (err) {
                            console.error(
                                "Error trying to send document content request:",
                                err
                            );
                        }
                    });
                }

                console.log(
                    `Document content received, length: ${documentContent.length} characters`
                );

                if (!documentContent) {
                    throw new Error("Empty document content received");
                }
            } catch (contentError: any) {
                console.error(
                    "Failed to retrieve document content:",
                    contentError
                );
                handleDocumentContentError(contentError);
                return;
            }

            // Generate suggestions by sending content to OpenAI or Ollama
            let prompt;

            if (aiProvider === "ollama") {
                // More explicit formatting instructions for Ollama models
                prompt = `
        You are a helpful writing assistant. Please review the following text and provide 3 specific writing suggestions for improvement.
        
        Your response MUST be formatted as a valid JSON array with objects containing these exact keys:
        1. "originalText" - The exact text to improve (brief, under 20 words)
        2. "suggestion" - Your suggested improvement
        3. "reason" - Brief explanation why this is better
        
        EXAMPLE FORMAT:
        [
          {
            "originalText": "The man walked quickly.",
            "suggestion": "The man strode purposefully.",
            "reason": "More descriptive and conveys intent."
          },
          {
            "originalText": "She was very happy.",
            "suggestion": "She beamed with joy.",
            "reason": "Shows rather than tells the emotion."
          }
        ]
        
        Here's the text to analyze:
        ${documentContent.substring(0, 2000)}
        
        Respond ONLY with the JSON array and nothing else.
      `;
            } else {
                // Standard prompt for OpenAI
                prompt = `
        Please review the following text and provide 3 specific writing suggestions for improvement.
        Format your response as a JSON array with objects containing:
        1. originalText - The exact text to improve (keep it brief, under 20 words)
        2. suggestion - Your suggested improvement
        3. reason - A brief explanation why this is better
          Here's the text to analyze:
        ${documentContent.substring(0, 3000)}
      `;
            }

            const aiResponse = await aiService.current.generateCompletion(
                prompt
            );

            if (aiResponse.error) {
                const error = new Error(aiResponse.error);
                if (aiResponse.helpText) {
                    // Preserve the helpText for more informative error display
                    (error as any).helpText = aiResponse.helpText;
                }
                throw error;
            }

            // Parse the JSON response
            try {
                // Attempt to parse response as JSON, but handle non-JSON responses from Ollama gracefully
                let suggestionsData;
                try {
                    suggestionsData = JSON.parse(aiResponse.text);
                } catch (parseError) {
                    console.warn(
                        "Failed to parse AI response as JSON:",
                        parseError
                    );

                    // If Ollama response is not valid JSON, try to extract suggestions manually
                    if (aiProvider === "ollama") {
                        console.log(
                            "Attempting to extract suggestions from Ollama text response"
                        );

                        // Create a simplified structure from the text response
                        const suggestions = [];
                        const lines = aiResponse.text.split("\n");
                        let currentSuggestion: any = {};

                        for (const line of lines) {
                            if (line.includes("originalText:")) {
                                currentSuggestion.originalText = line
                                    .replace("originalText:", "")
                                    .trim();
                            } else if (line.includes("suggestion:")) {
                                currentSuggestion.suggestion = line
                                    .replace("suggestion:", "")
                                    .trim();
                            } else if (line.includes("reason:")) {
                                currentSuggestion.reason = line
                                    .replace("reason:", "")
                                    .trim();

                                // If we have all three parts, add to suggestions
                                if (
                                    currentSuggestion.originalText &&
                                    currentSuggestion.suggestion &&
                                    currentSuggestion.reason
                                ) {
                                    suggestions.push({ ...currentSuggestion });
                                    currentSuggestion = {};
                                }
                            }
                        }

                        // If we found any suggestions, use them
                        if (suggestions.length > 0) {
                            suggestionsData = suggestions;
                        } else {
                            throw new Error(
                                "Could not extract structured suggestions from Ollama response"
                            );
                        }
                    } else {
                        throw parseError;
                    }
                }

                // Map the suggestions to our format
                const formattedSuggestions: WritingSuggestion[] =
                    suggestionsData.map((item: any) => ({
                        id:
                            Date.now().toString() +
                            Math.random().toString(36).substring(2, 9),
                        originalText: item.originalText || "Text selection",
                        suggestion: item.suggestion || "No specific suggestion",
                        reason: item.reason || "Improvement recommended",
                        timestamp: Date.now(),
                    }));

                setSuggestions(formattedSuggestions);
            } catch (error) {
                console.error("Failed to parse suggestions:", error);
                setSuggestions([]);
            }
        } catch (error: any) {
            console.error("Failed to analyze document:", error); // Create an error suggestion to show to the user
            const errorSuggestion: WritingSuggestion = {
                id: Date.now().toString(),
                originalText: "Error analyzing document",
                suggestion: error.message?.includes("document content")
                    ? "Could not access document content"
                    : aiProvider === "ollama"
                    ? "Check that Ollama is running correctly"
                    : "Check your API key and try again",
                reason: error.message?.includes("document content")
                    ? "VibeWrite could not access the document content. Try refreshing the page and making sure you're in edit mode."
                    : (error as any).helpText ||
                      error.message ||
                      "An error occurred while analyzing your document",
                timestamp: Date.now(),
                isError: true,
            };

            setSuggestions([errorSuggestion]);

            // Log detailed info for debugging
            if (error.message && error.message.includes("JSON")) {
                console.log(
                    "Response parsing issue - model may not be following instructions correctly"
                );
            } else if (error.message && error.message.includes("network")) {
                console.log("Network connectivity issue detected");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Send a message in the chat
    const sendMessage = async () => {
        // Don't require API key for Ollama
        if (!inputText.trim() || (aiProvider === "openai" && !apiKey)) return;

        // Add the user message to the chat
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputText,
            timestamp: Date.now(),
        };

        setChatMessages((prevMessages) => [...prevMessages, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            // Get context from the document using message passing
            let documentContent = "";
            let selectedText = "";

            try {
                // Request document content
                window.parent.postMessage(
                    { type: "GET_DOCUMENT_CONTENT" },
                    "*"
                );

                // Wait for response with timeout
                documentContent = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        // Don't reject here, just resolve with empty content
                        // This prevents errors from showing in the chat
                        resolve("");
                    }, 3000);

                    const messageHandler = (event: MessageEvent) => {
                        if (
                            event.data &&
                            event.data.type === "DOCUMENT_CONTENT_RESPONSE"
                        ) {
                            clearTimeout(timeout);
                            window.removeEventListener(
                                "message",
                                messageHandler
                            );
                            resolve(event.data.content || "");
                        }
                    };

                    window.addEventListener("message", messageHandler);
                });

                // Request selected text
                window.parent.postMessage({ type: "GET_SELECTED_TEXT" }, "*");

                // Wait for response with timeout
                selectedText = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        resolve("");
                    }, 1000);

                    const messageHandler = (event: MessageEvent) => {
                        if (
                            event.data &&
                            event.data.type === "SELECTED_TEXT_RESPONSE"
                        ) {
                            clearTimeout(timeout);
                            window.removeEventListener(
                                "message",
                                messageHandler
                            );
                            resolve(event.data.text || "");
                        }
                    };

                    window.addEventListener("message", messageHandler);
                });
            } catch (error) {
                console.warn(
                    "Failed to get document content/selected text via messaging:",
                    error
                );
                // Fallback to direct method
                documentContent = GoogleDocsAPI.getDocumentContent() || "";
                selectedText = GoogleDocsAPI.getSelectedText() || "";
            }

            // Construct prompt with context
            const prompt = `
        User message: ${inputText}
        
        ${selectedText ? `Selected text in document: ${selectedText}\n\n` : ""}
        
        ${
            documentContent
                ? `Context from document: ${documentContent.substring(
                      0,
                      1000
                  )}...\n\n`
                : ""
        }
        
        Please provide helpful writing advice based on this context.
      `; // Generate AI response
            const aiResponse = await aiService.current.generateCompletion(
                prompt
            );

            if (aiResponse.error) {
                const error = new Error(aiResponse.error);
                if (aiResponse.helpText) {
                    // Preserve the helpText for more informative error display
                    (error as any).helpText = aiResponse.helpText;
                }
                throw error;
            }

            // Add the AI response to the chat
            const assistantMessage: ChatMessage = {
                id: Date.now().toString(),
                role: "assistant",
                content: aiResponse.text,
                timestamp: Date.now(),
            };

            setChatMessages((prevMessages) => [
                ...prevMessages,
                assistantMessage,
            ]);
        } catch (error: any) {
            console.error("Failed to send message:", error);

            // Create a more specific error message based on what went wrong
            let errorContent =
                "Sorry, I encountered an error processing your request.";

            if (error.message && error.message.includes("403")) {
                errorContent =
                    "Error: Access to Ollama server is forbidden (403 error). Make sure Ollama is running with proper permissions and CORS is enabled.";
            } else if (error.message && error.message.includes("Ollama")) {
                errorContent = error.message;
            } else if (aiProvider === "openai") {
                errorContent =
                    "OpenAI API error. Please check your API key and try again.";
            } else if (aiProvider === "ollama") {
                errorContent =
                    "Could not connect to Ollama server. Please make sure Ollama is running at the configured URL and accessible from the browser.";
            }

            // Add the error message to the chat
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                role: "assistant",
                content: errorContent,
                timestamp: Date.now(),
            };

            setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Apply a suggestion by adding a comment to the document
    const applySuggestion = (suggestion: WritingSuggestion) => {
        const commentText = `Suggestion: "${suggestion.suggestion}"\n\nReason: ${suggestion.reason}`;

        // Add the comment to the document
        const success = GoogleDocsAPI.addComment(commentText);

        if (success) {
            // Remove the suggestion from the list
            setSuggestions((prevSuggestions: WritingSuggestion[]) =>
                prevSuggestions.filter(
                    (s: WritingSuggestion) => s.id !== suggestion.id
                )
            );
        }
    };

    // Dismiss a suggestion
    const dismissSuggestion = (id: string) => {
        setSuggestions((prevSuggestions: WritingSuggestion[]) =>
            prevSuggestions.filter((s: WritingSuggestion) => s.id !== id)
        );
    };

    // Handle key press in the input field (send message on Enter)
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        loadAISettings();

        // Set up message listener for Chrome messages
        const chromeMessageListener = (message: any) => {
            if (message.type === "ANALYZE_DOCUMENT") {
                analyzeDocument();
            }
        };

        // Set up message listener for window messages (from parent iframe)
        const windowMessageListener = (event: MessageEvent) => {
            console.log("Sidebar received window message:", event.data);
            if (event.data && event.data.type === "RELOAD_SETTINGS") {
                console.log("Sidebar received RELOAD_SETTINGS message");
                loadAISettings();
            } else if (event.data && event.data.type === "ANALYZE_DOCUMENT") {
                console.log("Sidebar received ANALYZE_DOCUMENT message");
                analyzeDocument();
            }
        };

        chrome.runtime.onMessage.addListener(chromeMessageListener);
        window.addEventListener("message", windowMessageListener);

        return () => {
            chrome.runtime.onMessage.removeListener(chromeMessageListener);
            window.removeEventListener("message", windowMessageListener);
        };
    }, []);

    // Scroll to bottom of chat when messages change
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop =
                chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                <h1>VibeWrite</h1>
                {aiProvider === "openai" && !apiKey ? (
                    <small style={{ color: "#d93025" }}>
                        Please set OpenAI API key in extension popup
                    </small>
                ) : (
                    <small style={{ color: "#34a853" }}>
                        Using {aiProvider === "openai" ? "OpenAI" : "Ollama"} ✓
                    </small>
                )}
            </div>
            <div className="sidebar-tabs">
                <div
                    className={`tab ${activeTab === "chat" ? "active" : ""}`}
                    onClick={() => setActiveTab("chat")}
                >
                    Chat
                </div>
                <div
                    className={`tab ${
                        activeTab === "suggestions" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("suggestions")}
                >
                    Suggestions
                </div>
            </div>
            <div className="sidebar-content">
                {activeTab === "chat" ? (
                    <div className="chat-container">
                        {aiProvider === "ollama" && <OllamaStatusBar />}
                        <div className="chat-messages" ref={chatMessagesRef}>
                            {chatMessages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                />
                            ))}
                            {isLoading && activeTab === "chat" && <Loading />}
                        </div>

                        <div className="chat-input">
                            <div className="chat-input-box">
                                <textarea
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type a message..."
                                    disabled={
                                        (aiProvider === "openai" && !apiKey) ||
                                        isLoading
                                    }
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={
                                        !inputText.trim() ||
                                        (aiProvider === "openai" && !apiKey) ||
                                        isLoading
                                    }
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="suggestions-container">
                        {aiProvider === "ollama" &&
                            !isLoading &&
                            suggestions.length === 0 && (
                                <div
                                    className="ollama-info-notice"
                                    style={{
                                        backgroundColor: "#EFF6FF",
                                        border: "1px solid #BFDBFE",
                                        borderRadius: "4px",
                                        padding: "8px 12px",
                                        margin: "0 0 10px 0",
                                        fontSize: "11px",
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: "0 0 4px 0",
                                            fontWeight: "bold",
                                            color: "#3B82F6",
                                        }}
                                    >
                                        Using Ollama for Suggestions
                                    </p>
                                    <p
                                        style={{
                                            margin: "0",
                                            fontSize: "11px",
                                            color: "#1F2937",
                                        }}
                                    >
                                        The quality of suggestions may depend on
                                        the Ollama model selected. For best
                                        results, use a model with strong writing
                                        capabilities.
                                    </p>
                                </div>
                            )}
                        {isLoading ? (
                            <Loading />
                        ) : suggestions.length > 0 ? (
                            suggestions.map((suggestion) => (
                                <SuggestionCard
                                    key={suggestion.id}
                                    suggestion={suggestion}
                                    onApply={applySuggestion}
                                    onDismiss={dismissSuggestion}
                                    onRetry={
                                        suggestion.isError
                                            ? retryDocumentAccess
                                            : undefined
                                    }
                                />
                            ))
                        ) : (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "20px 0",
                                }}
                            >
                                <p>No suggestions yet.</p>
                                <button
                                    style={{
                                        backgroundColor: "#1a73e8",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        cursor: "pointer",
                                    }}
                                    onClick={analyzeDocument}
                                    disabled={
                                        aiProvider === "openai" && !apiKey
                                    }
                                >
                                    Analyze Document
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="sidebar-footer">
                <div>VibeWrite v1.0.0</div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor:
                            aiProvider === "openai" ? "#f0f7f5" : "#f0f1ff",
                        borderRadius: "12px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        border: `1px solid ${
                            aiProvider === "openai" ? "#74aa9c" : "#7C83FD"
                        }`,
                    }}
                >
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                                aiProvider === "openai" ? "#74aa9c" : "#7C83FD",
                            display: "inline-block",
                            marginRight: "5px",
                        }}
                    ></span>
                    Powered by{" "}
                    {aiProvider === "openai" ? "OpenAI" : "Ollama (Local)"}
                </div>
            </div>
        </div>
    );
};

// Create root and render the app
const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <Sidebar />
    </React.StrictMode>
);
