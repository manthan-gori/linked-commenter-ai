# Privacy Policy — Linked Commenter AI - LinkedIn Comment Assistant

**Last updated:** March 2026

## What This Extension Does

Linked Commenter AI is a Chrome extension that helps you draft intelligent, humanized comments on LinkedIn posts using your chosen AI provider (Groq, Google Gemini, OpenAI, or Anthropic Claude) via your own API key. All processing is strictly on-demand, user-initiated, and runs entirely client-side in your browser.

## Data Collection

### Data We Store Locally
- **AI Provider API Keys** (Groq, Gemini, OpenAI, Anthropic): Stored securely in your browser's local storage (`chrome.storage.local`).
- **Selected AI Provider & Model Preference**: Saved locally in your browser.
- **Custom Prompts & Tone Settings**: Saved locally in your browser.

### Data We Do NOT Collect
- We do not collect passwords, cookies, or login credentials.
- We do not track your browsing activity outside of LinkedIn.
- We do not collect or store any personal data on external servers.
- We do not use analytics, trackers, or telemetry.

## Data Storage

All data is stored **locally on your device** using Chrome's `chrome.storage.local` API. No data is ever sent to any third-party intermediary servers. We do not operate any backend servers or databases.

## Third-Party Services

When you click **✨ AI Comment**, the extension sends:
- The text content of the LinkedIn post you are commenting on
- The selected tone / instruction prompt

This request is sent directly and securely from your browser to your selected AI provider's official endpoint:
- **Groq API** (`api.groq.com`)
- **Google Gemini API** (`generativelanguage.googleapis.com`)
- **OpenAI API** (`api.openai.com`)
- **Anthropic Claude API** (`api.anthropic.com`)

Requests are authenticated using your own user-provided API key. We do not intermediate, inspect, or store any of these requests.

## Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `activeTab` | Access the active LinkedIn post element to read post text and insert the generated comment |
| `storage` | Save your API keys, model preferences, and custom tone prompts locally in your browser |
| `https://www.linkedin.com/*` | Run the content script to display the AI helper bar above comment fields |
| `https://api.groq.com/*` | Send comment generation requests directly to Groq API |
| `https://generativelanguage.googleapis.com/*` | Send comment generation requests directly to Google Gemini API |
| `https://api.openai.com/*` | Send comment generation requests directly to OpenAI API |
| `https://api.anthropic.com/*` | Send comment generation requests directly to Anthropic Claude API |

## Data Sharing

We do not sell, share, or transfer user data to third parties. The only external connection is the direct API call from your browser to your selected AI provider.

## Data Retention and Deletion

All data persists strictly on your local device until you:
- Clear the extension's storage in Chrome settings
- Uninstall the extension
- Clear the API keys in the popup

## Contact

For questions, feedback, or support, open an issue at:
https://github.com/manthan-gori/linked-commenter-ai/issues
