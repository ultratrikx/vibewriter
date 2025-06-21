/**
 * Helper functions for Ollama integration
 */

/**
 * Validate an Ollama model name before submitting to avoid 500 errors
 * @param baseUrl - Ollama API base URL
 * @param modelName - Model name to check
 * @returns Promise with result object containing valid flag and message
 */
export async function validateOllamaModel(
    baseUrl: string,
    modelName: string
): Promise<{ valid: boolean; message?: string }> {
    try {
        // First check if the modelName is empty or undefined
        if (!modelName || modelName.trim() === "") {
            return {
                valid: false,
                message: "Model name is empty. Please select a valid model.",
            };
        }

        // Check if Ollama server is up and available models
        const response = await fetch(`${baseUrl}/api/tags`);

        if (!response.ok) {
            return {
                valid: false,
                message: `Ollama server returned ${response.status}: ${response.statusText}. Please check that Ollama is running.`,
            };
        }

        const data = await response.json();

        // Check if models exist in the response
        if (
            !data.models ||
            !Array.isArray(data.models) ||
            data.models.length === 0
        ) {
            return {
                valid: false,
                message:
                    "No models found on Ollama server. Please run 'ollama pull <model>' to download a model.",
            };
        }

        // Check if the requested model exists
        const modelExists = data.models.some(
            (m: any) =>
                m.name === modelName || m.name.startsWith(modelName + ":") // Handle tagged versions
        );

        if (!modelExists) {
            const availableModels = data.models
                .map((m: any) => m.name)
                .join(", ");
            return {
                valid: false,
                message: `Model "${modelName}" not found on Ollama server. Available models: ${availableModels}`,
            };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            message: `Failed to validate Ollama model: ${
                error instanceof Error ? error.message : String(error)
            }`,
        };
    }
}
