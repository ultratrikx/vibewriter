# VibeWrite - OpenAI GPT for Google Docs

A Chrome extension that integrates OpenAI GPT into Google Docs to provide real-time writing assistance, suggestions, and a chat interface.

## Features

-   **Inline Writing Feedback**: Get AI-powered comments on your writing directly in Google Docs.
-   **Writing Suggestions**: Receive suggestions to improve your writing style, grammar, and clarity.
-   **Interactive Chat**: Chat with the AI about your document to get help, ideas, or feedback.
-   **Sidebar Interface**: Clean and intuitive sidebar UI that integrates seamlessly with Google Docs.

## Installation

### Development Mode

1. Clone this repository:

    ```
    git clone https://github.com/your-username/vibewrite.git
    cd vibewrite
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `.env` file with your OpenAI API key (copy from `.env.example`):

    ```
    OPENAI_API_KEY=your-api-key-here
    ```

4. Build the extension:

    ```
    npm run build
    ```

5. Load the extension in Chrome:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top right
    - Click "Load unpacked" and select the `dist` folder from this project

### From Chrome Web Store

_(Coming soon)_

## Usage

1. Open a Google Docs document
2. Click the VibeWrite button in the toolbar to open the sidebar
3. Enter your OpenAI API key in the extension popup (click the extension icon in the toolbar)
4. Use the chat interface to ask for writing help or click "Analyze" to get suggestions
5. Select text and click "Add Feedback" to get specific feedback on that text

## Development

-   Run development build with hot reloading:

    ```
    npm run dev
    ```

-   Build for production:
    ```
    npm run build
    ```

## Technology Stack

-   TypeScript
-   React
-   Webpack
-   Chrome Extension API
-   OpenAI API

## Privacy

This extension uses your OpenAI API key to process your document content. Your API key and document content are never stored on any servers other than being sent to OpenAI's API for processing. All processing happens in your browser.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
