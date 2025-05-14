import axios from "axios";
import { OpenAI } from "openai";

// Types
export interface AIResponse {
    text: string;
    error?: string;
}

// AI Provider type
export type AIProvider = "openai" | "ollama";

// AI Model configuration
export interface AIModelConfig {
    provider: AIProvider;
    model: string;
    apiKey?: string;
    baseUrl?: string;
}

// AI Service
export class AIService {
    private openAIClient: OpenAI | null = null;
    private provider: AIProvider = "openai";
    private modelName: string = "gpt-4";
    private ollamaBaseUrl: string = "http://localhost:11434";

    constructor(config?: AIModelConfig) {
        if (config) {
            this.initClient(config);
        }
    }

    initClient(config: AIModelConfig) {
        this.provider = config.provider;
        this.modelName = config.model;

        if (this.provider === "openai" && config.apiKey) {
            try {
                this.openAIClient = new OpenAI({
                    apiKey: config.apiKey,
                    dangerouslyAllowBrowser: true, // For client-side use (not recommended for production)
                });
                return true;
            } catch (error) {
                console.error("Failed to initialize OpenAI client:", error);
                return false;
            }
        } else if (this.provider === "ollama") {
            if (config.baseUrl) {
                this.ollamaBaseUrl = config.baseUrl;
            }
            // Ollama doesn't need initialization, just set the base URL
            return true;
        }
        return false;
    }

    async generateCompletion(prompt: string): Promise<AIResponse> {
        if (this.provider === "openai") {
            return this.generateOpenAICompletion(prompt);
        } else if (this.provider === "ollama") {
            return this.generateOllamaCompletion(prompt);
        } else {
            return {
                text: "",
                error: "Unknown AI provider. Please configure a valid provider.",
            };
        }
    }

    private async generateOpenAICompletion(
        prompt: string
    ): Promise<AIResponse> {
        if (!this.openAIClient) {
            return {
                text: "",
                error: "OpenAI client not initialized. Please set your API key.",
            };
        }

        try {
            const response = await this.openAIClient.chat.completions.create({
                model: this.modelName,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful writing assistant. Provide concise, useful feedback on text.",
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            return { text: response.choices[0].message.content || "" };
        } catch (error) {
            console.error("OpenAI API error:", error);
            return {
                text: "",
                error: "Failed to generate completion. Please try again.",
            };
        }
    }    private async generateOllamaCompletion(
        prompt: string
    ): Promise<AIResponse> {
        try {
            console.log(`Connecting to Ollama at: ${this.ollamaBaseUrl}`);
            
            // Use a more detailed config for better error handling
            const response = await axios.post(
                `${this.ollamaBaseUrl}/api/generate`,
                {
                    model: this.modelName,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 500,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // Allow from chrome extension origin
                        'Access-Control-Allow-Origin': chrome.runtime.getURL(''),
                    },
                    timeout: 60000, // 60 second timeout
                }
            );

            if (response.data && response.data.response) {
                console.log("Ollama response received successfully");
                return { text: response.data.response };
            } else {
                console.error("Ollama response missing expected data:", response.data);
                return { text: "", error: "No response from Ollama API" };
            }
        } catch (error: any) {
            console.error("Ollama API error:", error);
            
            // Provide more specific error messages based on the error type
            if (error.response) {
                // Server responded with a status code outside of 2xx
                console.error(`Ollama server responded with status ${error.response.status}:`, 
                    error.response.data);
                
                if (error.response.status === 403) {
                    return {
                        text: "",
                        error: "Access forbidden (403). Make sure Ollama server has CORS enabled and is accessible from browser extensions.",
                    };
                }
                
                return {
                    text: "",
                    error: `Ollama server error (${error.response.status}). Check server logs.`,
                };
            } else if (error.request) {
                // Request was made but no response received
                console.error("No response received from Ollama server");
                return {
                    text: "",
                    error: "No response from Ollama server. Make sure Ollama is running at " + this.ollamaBaseUrl,
                };
            }
            
            return {
                text: "",
                error: "Failed to connect to Ollama. Please check that Ollama is running and accessible.",
            };
        }
    }
}

// Storage service
export class StorageService {
    async getApiKey(): Promise<string> {
        try {
            const result = await chrome.storage.sync.get("openaiApiKey");
            return result.openaiApiKey || "";
        } catch (error) {
            console.error("Failed to get API key from storage:", error);
            return "";
        }
    }

    async saveApiKey(apiKey: string): Promise<boolean> {
        try {
            await chrome.storage.sync.set({ openaiApiKey: apiKey });
            return true;
        } catch (error) {
            console.error("Failed to save API key to storage:", error);
            return false;
        }
    }
    async getAISettings(): Promise<AIModelConfig> {
        try {
            const result = await chrome.storage.sync.get([
                "aiProvider",
                "aiModel",
                "openaiApiKey",
                "ollamaBaseUrl",
            ]);

            console.log("Retrieved AI settings:", result);

            const config = {
                provider: result.aiProvider || "openai",
                model:
                    result.aiModel ||
                    (result.aiProvider === "ollama" ? "llama2" : "gpt-4"),
                apiKey: result.openaiApiKey || "",
                baseUrl: result.ollamaBaseUrl || "http://localhost:11434",
            };

            console.log("Parsed AI config:", config);
            return config;
        } catch (error) {
            console.error("Failed to get AI settings from storage:", error);
            return {
                provider: "openai",
                model: "gpt-4",
            };
        }
    }
    async saveAISettings(config: AIModelConfig): Promise<boolean> {
        try {
            console.log("Saving AI settings:", config);
            await chrome.storage.sync.set({
                aiProvider: config.provider,
                aiModel: config.model,
                ollamaBaseUrl: config.baseUrl || "http://localhost:11434",
            });

            // Save API key separately if it exists
            if (config.apiKey && config.provider === "openai") {
                await this.saveApiKey(config.apiKey);
            }

            return true;
        } catch (error) {
            console.error("Failed to save AI settings to storage:", error);
            return false;
        }
    }
}

// Logging service
export class Logger {
    static info(message: string, data?: any): void {
        console.log(`%c[VibeWrite] ${message}`, "color: #1a73e8", data || "");
    }

    static error(message: string, error?: any): void {
        console.error(
            `%c[VibeWrite] ${message}`,
            "color: #d93025",
            error || ""
        );
    }

    static warn(message: string, data?: any): void {
        console.warn(`%c[VibeWrite] ${message}`, "color: #f29900", data || "");
    }
}
