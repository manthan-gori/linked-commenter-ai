try {
    importScripts('/lib/groq-client.js');
} catch (_e) {
    try {
        importScripts('lib/groq-client.js');
    } catch (_e2) {
        console.error('[Background] Failed to load groq-client.js:', _e2);
    }
}

const groqClient = typeof LinkedInGroqClient !== 'undefined' ? LinkedInGroqClient : (typeof self !== 'undefined' && self.LinkedInGroqClient ? self.LinkedInGroqClient : null);

// Restrict extension action activation exclusively to LinkedIn
chrome.runtime.onInstalled.addListener(() => {
    if (chrome.action && chrome.action.disable) {
        chrome.action.disable();
    }

    if (chrome.declarativeContent && chrome.declarativeContent.onPageChanged) {
        chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
            chrome.declarativeContent.onPageChanged.addRules([
                {
                    conditions: [
                        new chrome.declarativeContent.PageStateMatcher({
                            pageUrl: { hostSuffix: 'linkedin.com' }
                        })
                    ],
                    actions: [new chrome.declarativeContent.ShowAction()]
                }
            ]);
        });
    }
});

if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        const url = changeInfo.url || tab?.url || '';
        if (url) {
            try {
                const parsed = new URL(url);
                if (parsed.hostname.endsWith('linkedin.com')) {
                    if (chrome.action && chrome.action.enable) chrome.action.enable(tabId);
                } else {
                    if (chrome.action && chrome.action.disable) chrome.action.disable(tabId);
                }
            } catch (_) {
                if (chrome.action && chrome.action.disable) chrome.action.disable(tabId);
            }
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.action) return false;

    if (request.action === 'saveGroqApiKey') {
        if (groqClient) {
            groqClient.saveGroqApiKey(request.apiKey).then((success) => {
                sendResponse({ status: success ? 'saved' : 'error' });
            });
        } else {
            sendResponse({ status: 'error', reason: 'groq-client-missing' });
        }
        return true;
    }

    if (request.action === 'getGroqApiKey') {
        if (groqClient) {
            groqClient.getGroqApiKey().then((apiKey) => {
                sendResponse({ apiKey: apiKey || '' });
            });
        } else {
            sendResponse({ apiKey: '' });
        }
        return true;
    }

    if (request.action === 'testGroqConnection' || request.action === 'testAIConnection') {
        if (groqClient) {
            groqClient.testAIConnection({
                provider: request.provider || (request.action === 'testGroqConnection' ? 'groq' : 'gemini'),
                apiKey: request.apiKey,
                model: request.model
            }).then((res) => sendResponse(res));
        } else {
            sendResponse({ success: false, error: 'ai-client-missing' });
        }
        return true;
    }

    if (request.action === 'testGeminiConnection') {
        if (groqClient) {
            groqClient.testGeminiConnection(request.apiKey, request.model).then((res) => sendResponse(res));
        } else {
            sendResponse({ success: false, error: 'ai-client-missing' });
        }
        return true;
    }

    if (request.action === 'testOpenAIConnection') {
        if (groqClient) {
            groqClient.testOpenAIConnection(request.apiKey, request.model).then((res) => sendResponse(res));
        } else {
            sendResponse({ success: false, error: 'ai-client-missing' });
        }
        return true;
    }

    if (request.action === 'testAnthropicConnection') {
        if (groqClient) {
            groqClient.testAnthropicConnection(request.apiKey, request.model).then((res) => sendResponse(res));
        } else {
            sendResponse({ success: false, error: 'ai-client-missing' });
        }
        return true;
    }

    if (request.action === 'generateComment') {
        (async () => {
            let provider = request.provider || '';
            let apiKey = '';
            let model = request.model || '';
            let customPrompt = request.customPrompt || '';

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const stored = await new Promise((resolve) => {
                    chrome.storage.local.get([
                        'aiProvider',
                        'groqApiKey',
                        'groqModel',
                        'geminiApiKey',
                        'geminiModel',
                        'openaiApiKey',
                        'openaiModel',
                        'anthropicApiKey',
                        'anthropicModel',
                        'customPrompt',
                        'toneCustomizations',
                        'userCreatedTones'
                    ], (data) => resolve(data || {}));
                });

                if (!provider) {
                    provider = stored.aiProvider || 'groq';
                }

                if (provider === 'gemini') {
                    apiKey = stored.geminiApiKey || '';
                    if (!model) {
                        model = stored.geminiModel || 'gemini-3.7-flash';
                    }
                } else if (provider === 'openai') {
                    apiKey = stored.openaiApiKey || '';
                    if (!model) {
                        model = stored.openaiModel || 'gpt-4o-mini';
                    }
                } else if (provider === 'anthropic') {
                    apiKey = stored.anthropicApiKey || '';
                    if (!model) {
                        model = stored.anthropicModel || 'claude-3-7-sonnet-20250219';
                    }
                } else {
                    apiKey = stored.groqApiKey || '';
                    if (!model) {
                        model = stored.groqModel || 'groq/compound-mini';
                    }
                }

                if (!customPrompt && stored.customPrompt) {
                    customPrompt = stored.customPrompt;
                }

                if (stored.toneCustomizations || stored.userCreatedTones) {
                    let customMap = Object.assign({}, stored.toneCustomizations || {});
                    if (Array.isArray(stored.userCreatedTones)) {
                        stored.userCreatedTones.forEach((t) => {
                            if (t && t.key && t.prompt) {
                                customMap[t.key] = t.prompt;
                            }
                        });
                    }
                    request.toneCustomizations = customMap;
                }
            } else if (groqClient) {
                apiKey = await groqClient.getGroqApiKey();
                provider = 'groq';
                model = model || 'groq/compound-mini';
            }

            if (!provider) {
                provider = 'groq';
            }
            if (!model) {
                if (provider === 'gemini') model = 'gemini-3.7-flash';
                else if (provider === 'openai') model = 'gpt-4o-mini';
                else model = 'groq/compound-mini';
            }

            if (!apiKey) {
                const providerNames = {
                    gemini: 'Google Gemini',
                    openai: 'OpenAI',
                    groq: 'Groq'
                };
                const providerName = providerNames[provider] || 'AI';
                sendResponse({
                    success: false,
                    error: 'missing-api-key',
                    details: `Please set your ${providerName} API Key in the extension popup settings.`
                });
                return;
            }

            if (groqClient) {
                const aiResult = await groqClient.generateAIComment({
                    provider: provider,
                    apiKey: apiKey,
                    model: model,
                    postText: request.postText,
                    replyToComment: request.replyToComment || '',
                    authorHeadline: request.authorHeadline,
                    tone: request.tone || 'professional',
                    language: request.language || 'en',
                    customPrompt: customPrompt,
                    toneCustomizations: request.toneCustomizations
                });

                sendResponse(aiResult);
            } else {
                sendResponse({ success: false, error: 'ai-client-missing' });
            }
        })();
        return true;
    }
});
