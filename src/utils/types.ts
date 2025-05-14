/**
 * Types used throughout the application
 */

// Message types for communication between content script, background script, and popup
export type MessageType =
    | "GET_SELECTED_TEXT"
    | "GET_DOCUMENT_CONTENT"
    | "ADD_COMMENT"
    | "GENERATE_WRITING_SUGGESTION"
    | "ANALYZE_DOCUMENT"
    | "TOGGLE_SIDEBAR"
    | "CLOSE_SIDEBAR"
    | "OPEN_SIDEBAR"
    | "CHAT_REQUEST"
    | "SAVE_API_KEY"
    | "GET_API_KEY"
    | "SAVE_AI_SETTINGS"
    | "GET_AI_SETTINGS"
    | "RELOAD_SETTINGS";

// Message structure
export interface Message {
    type: MessageType;
    payload?: any;
}

// Response structure
export interface Response {
    success: boolean;
    data?: any;
    error?: string;
}

// Writing suggestion
export interface WritingSuggestion {
    id: string;
    originalText: string;
    suggestion: string;
    reason: string;
    timestamp: number;
    isError?: boolean; // Flag to indicate this is an error message
}

// Chat message
export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

// Settings
export interface Settings {
    openaiApiKey: string;
    useDarkMode: boolean;
    autoSuggest: boolean;
    aiProvider: "openai" | "ollama";
    aiModel: string;
    ollamaBaseUrl: string;
}
