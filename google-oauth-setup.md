# Setting Up Google OAuth Client ID for VibeWrite

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" at the top of the page
3. Name your project (e.g., "VibeWrite Extension") and click "Create"

## Step 2: Enable the Google Docs API

1. In your project dashboard, navigate to "APIs & Services" > "Library"
2. Search for "Google Docs API" and click on it
3. Click "Enable" to enable the API for your project

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type (unless you have a Google Workspace organization)
3. Fill in the required fields:
    - App name: "VibeWrite"
    - User support email: Your email address
    - Developer contact information: Your email address
4. Click "Save and Continue"
5. On the "Scopes" page, click "Add or Remove Scopes"
6. Add the following scope: `https://www.googleapis.com/auth/documents.readonly`
7. Click "Save and Continue"
8. Add test users (including your own email) and click "Save and Continue"
9. Review your settings and click "Back to Dashboard"

## Step 4: Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. For Application type, select "Chrome extension"
4. Name: "VibeWrite Extension"
5. For "Item ID", enter your Chrome extension ID:
    - You can find this in chrome://extensions/ with developer mode enabled
    - For development, use your extension's ID shown in the extensions page
6. Click "Create"

## Step 5: Update the Extension Manifest

1. Copy the generated OAuth client ID
2. Open your `manifest.json` file
3. Replace "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" with your actual client ID

## Step 6: Load or Reload Your Extension

1. In Chrome, go to chrome://extensions/
2. Enable Developer Mode (toggle in top right)
3. Click "Load unpacked" and select your extension folder
4. Or, if the extension is already loaded, click the refresh icon

## Step 7: Testing

1. Navigate to a Google Docs document
2. Open the VibeWrite extension
3. The extension will now request OAuth permission to access the document
4. After granting permission, the extension should be able to read document content using the Google Docs API

## Troubleshooting

-   If you see "Error getting auth token", verify your OAuth client ID is correct
-   Check the manifest.json includes the identity permission and correct scopes
-   Ensure your OAuth consent screen is properly configured
-   For persistent issues, check Chrome's Developer Console for specific error messages
