import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
    StorageService,
    AIProvider,
    AIModelConfig,
    OllamaHelper,
} from "../utils/services";

// Ollama connection status component
const OllamaConnectionStatus: React.FC<{ baseUrl: string }> = ({ baseUrl }) => {
    const [connectionStatus, setConnectionStatus] = useState<
        "checking" | "connected" | "disconnected"
    >("checking");
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        const checkConnection = async () => {
            setConnectionStatus("checking");
            const isConnected = await OllamaHelper.checkConnection(baseUrl);
            setConnectionStatus(isConnected ? "connected" : "disconnected");

            if (isConnected) {
                const models = await OllamaHelper.getAvailableModels(baseUrl);
                setAvailableModels(models);
            }
        };

        checkConnection();
    }, [baseUrl]);

    return (
        <div>
            <h4
                style={{
                    margin: "0 0 5px 0",
                    color: "#1a73e8",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor:
                            connectionStatus === "connected"
                                ? "#34a853"
                                : connectionStatus === "disconnected"
                                ? "#ea4335"
                                : "#fbbc05",
                        marginRight: "8px",
                        display: "inline-block",
                    }}
                ></span>
                Ollama Status:{" "}
                {connectionStatus === "connected"
                    ? "Connected"
                    : connectionStatus === "disconnected"
                    ? "Disconnected"
                    : "Checking..."}
            </h4>

            {connectionStatus === "connected" && availableModels.length > 0 && (
                <div style={{ fontSize: "11px", marginTop: "5px" }}>
                    <p style={{ margin: "0", fontStyle: "italic" }}>
                        Available models:{" "}
                        {availableModels.slice(0, 3).join(", ")}
                        {availableModels.length > 3 &&
                            ` +${availableModels.length - 3} more`}
                    </p>
                </div>
            )}
        </div>
    );
};

const Popup: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>("");
    const [status, setStatus] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);
    const [autoSuggest, setAutoSuggest] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [aiProvider, setAiProvider] = useState<AIProvider>("openai");
    const [aiModel, setAiModel] = useState<string>("gpt-4");
    const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(
        "http://localhost:11434"
    );

    const storageService = new StorageService();
    useEffect(() => {
        // Load settings when popup opens
        const loadSettings = async () => {
            // Get all AI settings
            const aiSettings = await storageService.getAISettings();
            console.log("Loaded AI settings in popup:", aiSettings);

            // Set the API key if available
            if (aiSettings.apiKey) {
                setApiKey(aiSettings.apiKey);
                setStatus({ message: "API key loaded", type: "success" });
            }

            // Set AI provider and model settings
            console.log("Setting aiProvider to:", aiSettings.provider);
            setAiProvider(aiSettings.provider);

            const modelToUse =
                aiSettings.model ||
                (aiSettings.provider === "ollama" ? "llama2" : "gpt-4");
            console.log("Setting aiModel to:", modelToUse);
            setAiModel(modelToUse);

            // Set Ollama base URL if available
            if (aiSettings.baseUrl) {
                console.log("Setting ollamaBaseUrl to:", aiSettings.baseUrl);
                setOllamaBaseUrl(aiSettings.baseUrl);
            }

            try {
                const settings = await chrome.storage.sync.get([
                    "useDarkMode",
                    "autoSuggest",
                ]);
                if (settings.useDarkMode !== undefined) {
                    setDarkMode(settings.useDarkMode);
                }
                if (settings.autoSuggest !== undefined) {
                    setAutoSuggest(settings.autoSuggest);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };

        loadSettings();
    }, []);

    const saveApiKey = async () => {
        if (!apiKey) {
            setStatus({ message: "Please enter an API key", type: "error" });
            return;
        }

        const success = await storageService.saveApiKey(apiKey);
        if (success) {
            setStatus({
                message: "API key saved successfully",
                type: "success",
            });
        } else {
            setStatus({ message: "Failed to save API key", type: "error" });
        }
    };
    const toggleSidebar = async () => {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (tab.id) {
                // Check if we're on a Google Docs page
                if (tab.url?.includes("docs.google.com/document")) {
                    // Use background script to relay the toggle message
                    chrome.runtime.sendMessage(
                        { type: "TOGGLE_SIDEBAR" },
                        (response) => {
                            if (!response || !response.success) {
                                setStatus({
                                    message:
                                        "Could not toggle sidebar. Please try reloading the page.",
                                    type: "error",
                                });
                            }
                        }
                    );
                } else {
                    setStatus({
                        message:
                            "Please navigate to a Google Docs document first",
                        type: "error",
                    });
                }
            }
        } catch (error) {
            console.error("Error toggling sidebar:", error);
            setStatus({ message: "Failed to toggle sidebar", type: "error" });
        }
    };
    const saveSettings = async () => {
        try {
            // Save general settings
            await chrome.storage.sync.set({
                useDarkMode: darkMode,
                autoSuggest: autoSuggest,
            });

            // Save AI settings
            const aiConfig: AIModelConfig = {
                provider: aiProvider,
                model: aiModel,
                baseUrl: aiProvider === "ollama" ? ollamaBaseUrl : undefined,
                apiKey: aiProvider === "openai" ? apiKey : undefined,
            };

            console.log("Saving AI config:", aiConfig);
            const success = await storageService.saveAISettings(aiConfig);
            console.log("Save success:", success);

            if (success) {
                setStatus({ message: "Settings saved", type: "success" });

                // Force refresh all content scripts in Google Docs tabs
                const tabs = await chrome.tabs.query({
                    url: "*://docs.google.com/*",
                });

                console.log(`Found ${tabs.length} Google Docs tabs to update`);

                for (const tab of tabs) {
                    if (tab.id) {
                        try {
                            await chrome.tabs.sendMessage(tab.id, {
                                type: "RELOAD_SETTINGS",
                            });
                            console.log(
                                `Sent RELOAD_SETTINGS to tab ${tab.id}`
                            );
                        } catch (err) {
                            console.error(
                                `Error sending message to tab ${tab.id}:`,
                                err
                            );
                        }
                    }
                }
            } else {
                setStatus({
                    message: "Failed to save settings",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            setStatus({ message: "Failed to save settings", type: "error" });
        }
    };

    return (
        <div className="container">
            <h1>VibeWrite Settings</h1>{" "}
            <div className="form-group">
                <label htmlFor="ai-provider">AI Provider</label>
                <select
                    id="ai-provider"
                    value={aiProvider}
                    onChange={(e) => {
                        console.log("Dropdown changed:", e.target.value);
                        setAiProvider(e.target.value as AIProvider);
                    }}
                    className="select-input"
                    style={{
                        border: "2px solid blue",
                        padding: "10px",
                        zIndex: 1000,
                    }}
                >
                    <option value="openai">OpenAI</option>
                    <option value="ollama">Ollama (local)</option>
                </select>

                {/* Alternative buttons in case dropdown doesn't work */}
                <div
                    style={{ marginTop: "10px", display: "flex", gap: "10px" }}
                >
                    <button
                        type="button"
                        onClick={() => setAiProvider("openai")}
                        style={{
                            flex: 1,
                            backgroundColor:
                                aiProvider === "openai" ? "#1a73e8" : "#ccc",
                        }}
                    >
                        OpenAI
                    </button>
                    <button
                        type="button"
                        onClick={() => setAiProvider("ollama")}
                        style={{
                            flex: 1,
                            backgroundColor:
                                aiProvider === "ollama" ? "#1a73e8" : "#ccc",
                        }}
                    >
                        Ollama
                    </button>
                </div>
            </div>
            {aiProvider === "openai" ? (
                <div className="form-group">
                    <label htmlFor="api-key">OpenAI API Key</label>
                    <input
                        type="password"
                        id="api-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your OpenAI API key"
                    />
                </div>
            ) : (
                <>
                    <div className="form-group">
                        <label htmlFor="ollama-url">Ollama Base URL</label>
                        <input
                            type="text"
                            id="ollama-url"
                            value={ollamaBaseUrl}
                            onChange={(e) => setOllamaBaseUrl(e.target.value)}
                            placeholder="http://localhost:11434"
                        />
                    </div>{" "}
                    <div
                        className="info-box"
                        style={{
                            backgroundColor: "#f8f9fa",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "10px",
                            marginBottom: "15px",
                            fontSize: "12px",
                        }}
                    >
                        <OllamaConnectionStatus baseUrl={ollamaBaseUrl} />
                        <h4
                            style={{ margin: "10px 0 5px 0", color: "#1a73e8" }}
                        >
                            Ollama Setup Tips:
                        </h4>
                        <p style={{ margin: "5px 0" }}>
                            1. Make sure Ollama is running locally
                        </p>
                        <p style={{ margin: "5px 0" }}>
                            2. For best results, start Ollama with CORS enabled:
                        </p>
                        <pre
                            style={{
                                backgroundColor: "#eee",
                                padding: "5px",
                                overflowX: "auto",
                                fontSize: "11px",
                            }}
                        >
                            OLLAMA_ORIGINS=* ollama serve
                        </pre>
                        <p style={{ margin: "5px 0" }}>
                            3. If you encounter 403 errors, this extension will
                            automatically route Ollama API calls through the
                            background script
                        </p>
                    </div>
                </>
            )}
            <div className="form-group">
                <label htmlFor="ai-model">AI Model</label>
                <input
                    type="text"
                    id="ai-model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder={aiProvider === "openai" ? "gpt-4" : "llama2"}
                />
                <small className="hint">
                    {aiProvider === "openai"
                        ? "Examples: gpt-4, gpt-3.5-turbo"
                        : "Must be a model installed in Ollama"}
                </small>
            </div>
            <div className="toggle-row">
                <span className="toggle-label">Dark Mode</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                    />
                    <span className="slider"></span>
                </label>
            </div>
            <div className="toggle-row">
                <span className="toggle-label">Auto Suggestions</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={autoSuggest}
                        onChange={() => setAutoSuggest(!autoSuggest)}
                    />
                    <span className="slider"></span>
                </label>
            </div>{" "}
            <div className="button-group">
                <button onClick={saveSettings}>Save All Settings</button>
                <button onClick={toggleSidebar}>Toggle Sidebar</button>
            </div>
            {status && (
                <div className={`status ${status.type}`}>{status.message}</div>
            )}
            <div className="footer">
                <p>
                    VibeWrite v1.0.0 |{" "}
                    <a
                        href="https://github.com/yourusername/vibewrite"
                        target="_blank"
                    >
                        GitHub
                    </a>
                </p>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
