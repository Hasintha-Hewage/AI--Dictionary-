# AI Dictionary Extension

A Chrome extension that uses Google's Gemini AI to provide definitions of selected words on any webpage.

## Features

- ✨ Select any word on a webpage to get its definition
- 🤖 Powered by Google's Gemini AI
- 🔒 Secure API key storage in extension storage
- 📱 Works on all websites
- ⚡ Instant definitions in an alert popup

## Setup Instructions

### 1. Get Your API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Choose "Create API key in new project"
4. Copy the API key (it starts with `AIza...`)

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `AIDictionary` folder containing this extension
5. The extension will appear in your browser

### 3. Configure Your API Key

1. Click the extension icon in the top right of Chrome
2. Paste your Google Gemini API key
3. Click "Save API Key"
4. You'll see a success message

## How to Use

1. Go to any website
2. Select any word by dragging to highlight it
3. Release your mouse - the extension automatically sends the text to Google Gemini
4. An alert will appear with the definition in simple English

## Example Output

**Selected Text:** "Serendipity"

**Definition:**
Serendipity means finding or occurring upon something good or valuable by chance. It describes a happy accident or lucky discovery. For example, meeting an old friend by randomly running into them at a cafe would be a moment of serendipity.

## File Structure

```
AIDictionary/
├── manifest.json      # Extension configuration
├── Content.js         # Detects text selection on webpages
├── background.js      # Handles API calls and responses
├── popup.html         # Settings popup UI
├── popup.js           # Popup functionality
└── README.md          # This file
```

## Security Note

- Your API key is stored locally in your browser's storage
- The extension communicates only with Google's Gemini API
- API calls are made from your browser, not stored on any server

## Troubleshooting

### "API key not set" Error

- Make sure you've entered your API key in the extension settings
- Click the extension icon and verify the key is saved

### API Rate Limiting

- Google AI Studio has usage limits on free tier
- Check your usage at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Extension Not Loading

- Ensure Developer mode is enabled at `chrome://extensions/`
- Try reloading the extension (click the reload icon)

## Requirements

- Google Chrome browser
- Google Gemini API key (free to create)
- Internet connection
