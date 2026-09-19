# Linked Commenter AI

Chrome Extension (Manifest V3) for fast, intelligent, and humanized AI comment generation on LinkedIn using Multi-Model AI (Groq, Google Gemini, OpenAI, and Anthropic Claude).

## Quick Reference

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript (checkJs: false, allowJs: true)
npm run test          # Jest --verbose
```

## Structure

```
extension/
  _locales/en/         # EN locale catalog
  _locales/pt_BR/      # PT-BR locale catalog
  icons/               # 16, 48, 128 px icons
  lib/
    groq-client.js     # UMD module for multi-provider AI API communication (Groq, Gemini, OpenAI, Anthropic), prompt building & sanitization
  popup/
    popup.html         # Settings UI, Provider & Model selector, Tone customizer
    popup.js           # Multi-provider API keys & Model preferences persistence
  background.js        # Service worker (Manifest V3 message router)
  feed-engage.js       # LinkedIn feed DOM insertion & AI button injection
  manifest.json        # MV3 manifest
tests/
  groq-client.test.js  # Jest unit tests for AI clients & prompts
```

## Tech Stack

- **Runtime**: Chrome Extension (Manifest V3), service worker + content script
- **Language**: JavaScript (no build step, runs directly in browser)
- **AI Backends**: Groq Cloud API, Google Gemini API, OpenAI API, Anthropic Claude API
- **Testing**: Jest (`tests/groq-client.test.js`)
- **Linting**: ESLint
- **Type checking**: TypeScript (`allowJs`, `noEmit`)

## Key Modules

| Module | Purpose |
|---|---|
| `extension/lib/groq-client.js` | Pure-logic UMD module for multi-provider AI API payload building (Groq, Gemini, OpenAI, Claude), 18 tone prompts + custom tones, persona prompts, error parsing, and em-dash/thinking tag sanitization |
| `extension/feed-engage.js` | Content script: detects comment boxes, parses post content via modern LinkedIn DOM selectors, and injects `✨ AI Comment` bar |
| `extension/popup/` | Popup UI for managing API keys across providers, model selection, custom prompts, and tone editor |
| `extension/background.js` | Background service worker routing messages between content script and AI client |

## Supported AI Providers & Models (Configurable in Popup)

- **⚡ Groq Cloud**: `groq/compound-mini`, `groq/compound`, `qwen/qwen3.8-27b`, `allam-2-7b`, `qwen/qwen3.6-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`
- **✨ Google Gemini**: `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`, `gemini-3-flash-preview`
- **🤖 OpenAI (ChatGPT)**: `gpt-4o-mini`, `gpt-4o`, `gpt-4.5-preview`, `o3-mini`, `o1`, `o1-mini`, `gpt-4-turbo`
- **🧠 Anthropic (Claude)**: `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

## Conventions

- **No build step** — extension runs raw JS in Chrome
- **UMD-style modules** — `(function(root, factory) { ... })` pattern for Node + browser compatibility
- **100% Client-Side** — zero tracking, all data in `chrome.storage.local`
- **Dark UI Design** — modern, sleek dark styling
