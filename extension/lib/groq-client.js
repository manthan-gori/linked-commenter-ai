(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.LinkedInGroqClient = api;
    Object.keys(api).forEach(function (key) {
        if (typeof root[key] === 'undefined') {
            root[key] = api[key];
        }
    });
})(
    typeof globalThis !== 'undefined' ? globalThis : this,
    function () {
        const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        const DEFAULT_MODEL = 'groq/compound-mini';
        const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';
        const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
        const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
        const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
        const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
        const DEFAULT_ANTHROPIC_MODEL = 'claude-3-7-sonnet-20250219';
        const GROQ_STORAGE_KEY = 'groqApiKey';

        /**
         * Clean and normalize an API key string.
         * @param {string} key
         * @returns {string}
         */
        function normalizeApiKey(key) {
            return (key || '').trim();
        }

        /**
         * Universal AI output cleaner: strips thinking blocks, em-dashes, and wrapping quotes.
         * @param {string} rawContent
         * @returns {string}
         */
        function cleanAIOutput(rawContent) {
            if (!rawContent) return '';

            // Strip any <think>...</think> or unclosed <think> reasoning blocks from thinking models
            let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
            cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
            if (cleaned.includes('<think>') || cleaned.includes('<thought>')) {
                cleaned = cleaned.replace(/<(think|thought)>[\s\S]*/gi, '');
            }

            // Strip all em-dashes (—), en-dashes (–), and horizontal bars (―) across the entire text
            cleaned = cleaned.replace(/\s*[—–―−]\s*/g, ', ');
            cleaned = cleaned.replace(/,\s*,/g, ',');
            cleaned = cleaned.replace(/,\s*\./g, '.');
            cleaned = cleaned.replace(/,\s*\?/g, '?');
            cleaned = cleaned.replace(/,\s*!/g, '!');

            return cleaned.trim()
                .replace(/^["'—–―−\-,\s]+|["'—–―−\-,\s]+$/g, '')
                .replace(/^[—–―−\-]\s*/g, '')
                .trim();
        }

        /**
         * Save Groq API key to chrome.storage.local
         * @param {string} apiKey
         * @returns {Promise<boolean>}
         */
        function saveGroqApiKey(apiKey) {
            const cleanKey = normalizeApiKey(apiKey);
            return new Promise(function (resolve) {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve(false);
                    return;
                }
                chrome.storage.local.set({ [GROQ_STORAGE_KEY]: cleanKey }, function () {
                    resolve(true);
                });
            });
        }

        /**
         * Retrieve Groq API key from chrome.storage.local
         * @returns {Promise<string>}
         */
        function getGroqApiKey() {
            return new Promise(function (resolve) {
                if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                    resolve('');
                    return;
                }
                chrome.storage.local.get(GROQ_STORAGE_KEY, function (data) {
                    resolve(data ? (data[GROQ_STORAGE_KEY] || '') : '');
                });
            });
        }

        const DEFAULT_TONES = {
            'professional': {
                label: '💼 Professional',
                emoji: '💼',
                prompt: 'You are a professional LinkedIn networking assistant. Your goal is to write a single, natural, humanized comment in ${language} for a LinkedIn post. Keep the tone professional. Keep it short (1 to 3 concise sentences maximum). Do NOT use em-dashes (—), dashes (-), quotation marks, hashtags, emojis (unless max 1 subtle emoji), or corporate jargon. Respond ONLY with the comment text.'
            },
            'insightful': {
                label: '🧠 Insightful',
                emoji: '🧠',
                prompt: 'You are a thoughtful industry expert. Write an insightful comment in ${language} analyzing a key idea from the post and adding a valuable perspective. 1 to 2 sentences max. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'friendly': {
                label: '😊 Friendly',
                emoji: '😊',
                prompt: 'You are a friendly LinkedIn connection. Write a warm, approachable, and encouraging comment in ${language}. 1 to 2 sentences. Sound human and conversational. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'casual': {
                label: '☕ Casual',
                emoji: '☕',
                prompt: 'You are a casual peer in the industry. Write a relaxed, authentic comment in ${language} as if chatting over coffee. 1 to 2 short sentences. Do NOT use em-dashes, hashtags, or formal jargon. Respond ONLY with the comment text.'
            },
            'witty': {
                label: '😄 Witty',
                emoji: '😄',
                prompt: 'You are a witty professional with smart humor. Write a clever, light-hearted comment in ${language} related to the post. 1 to 2 sentences. Keep it workplace-appropriate. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'empathetic': {
                label: '❤️ Empathetic',
                emoji: '❤️',
                prompt: 'You are an empathetic, supportive peer. Write a compassionate comment in ${language} acknowledging the post author\'s experience or perspective. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or robotic phrasing. Respond ONLY with the comment text.'
            },
            'curious': {
                label: '🤔 Curious',
                emoji: '🤔',
                prompt: 'You are an inquisitive professional. Write a comment in ${language} asking an open, thoughtful question about the post to learn more about the author\'s process or thoughts. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'motivational': {
                label: '🚀 Motivational',
                emoji: '🚀',
                prompt: 'You are an inspiring mentor. Write an uplifting, energizing comment in ${language} that inspires action or celebrates dedication. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or hollow clichés. Respond ONLY with the comment text.'
            },
            'contrarian': {
                label: '⚡ Contrarian',
                emoji: '⚡',
                prompt: 'You are a respectful critical thinker. Write a polite contrarian comment in ${language} offering an alternative perspective or edge case not mentioned in the post. 1 to 2 sentences. Be constructive, never rude. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'storytelling': {
                label: '📖 Storytelling',
                emoji: '📖',
                prompt: 'You are an experienced professional sharing relatable context. Write a short 2-sentence comment in ${language} referencing a brief real-world scenario or lesson that connects with the post. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'valuable-notes': {
                label: '💡 Valuable Notes',
                emoji: '💡',
                prompt: 'You are a LinkedIn thought leader. Write a short, high-value comment in ${language} that adds a genuine insight, key takeaway, or useful tip directly related to the post. Start with the insight directly, no filler opener. 2 to 3 concise sentences. Add a fact, stat, or practical tip. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'engagement': {
                label: '🔥 Engagement',
                emoji: '🔥',
                prompt: 'You are a LinkedIn engagement expert. Write a comment in ${language} that sparks conversation and gets replies. 1 to 2 sentences max. End with a direct, specific question that invites the reader or author to respond. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.'
            },
            'funny-viral': {
                label: '😂 Funny Viral',
                emoji: '😂',
                prompt: 'You are a witty LinkedIn creator who writes comments that go viral because they are genuinely funny and relatable. Write a humorous comment in ${language} about the post. 1 to 2 sentences. Short = shareable. Use clever wordplay or a relatable observation. 1 emoji max. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'congratulations': {
                label: '🎉 Congratulations',
                emoji: '🎉',
                prompt: 'You are a warm, genuine LinkedIn connection. Write a heartfelt congratulations comment in ${language} for this post. 1 to 2 sentences. Sound human, not robotic. Mention something specific from the post. No hollow phrases like "Congratulations on this milestone!". 1 celebratory emoji welcome. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'positive-feedback': {
                label: '👍 Positive Feedback',
                emoji: '👍',
                prompt: 'You are a thoughtful LinkedIn professional. Write a comment in ${language} that gives specific, genuine positive feedback on this post. 2 sentences max. Praise something SPECIFIC from the post, not just "great post". Explain briefly WHY it stood out. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'appreciation': {
                label: '🙏 Appreciation',
                emoji: '🙏',
                prompt: 'You are a grateful LinkedIn professional. Write a sincere appreciation comment in ${language} thanking the author for sharing this post. 1 to 2 sentences. Be genuinely thankful and mention what you found valuable. Sound personal, not copy-pasted. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'agreement': {
                label: '✅ Agreement',
                emoji: '✅',
                prompt: 'You are a LinkedIn professional who strongly agrees with this post. Write a comment in ${language} that validates the author\'s point of view. 1 to 2 sentences. State that you agree and briefly give a REASON or personal experience that backs it up. Sound genuine, not sycophantic. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            },
            'encouragement': {
                label: '💪 Encouragement',
                emoji: '💪',
                prompt: 'You are a supportive LinkedIn mentor. Write an encouraging comment in ${language} that uplifts and motivates the author or the community around this post. 1 to 2 sentences. Acknowledge the effort or journey mentioned in the post. 1 emoji optional. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.'
            }
        };

        /**
         * Build system and user messages for Groq/Gemini/OpenAI API payload
         * @param {Object} opts
         * @returns {{systemPrompt: string, userPrompt: string}}
         */
        function buildGroqPrompt(opts) {
            opts = opts || {};
            const postText = (opts.postText || '').trim();
            const replyToComment = (opts.replyToComment || '').trim();
            const category = opts.category || 'general';
            const language = opts.language === 'pt_BR' || opts.language === 'pt' ? 'Portuguese (Brazil)' : 'English';
            const authorHeadline = opts.authorHeadline ? ` (Author: ${opts.authorHeadline.trim()})` : '';
            const customPrompt = (opts.customPrompt || '').trim();
            const customTones = opts.toneCustomizations || opts.customTones || {};
            const tone = opts.tone || 'professional';

            let systemPrompt = '';
            let userPrompt = '';

            // 1. User-defined custom global prompt / persona (overrides all if present)
            if (customPrompt) {
                systemPrompt =
                    `You are a personalized LinkedIn commenting assistant. ` +
                    `Strictly follow these custom persona guidelines and instructions provided by the user:\n` +
                    `"""\n${customPrompt}\n"""\n\n` +
                    `Language: ${language}.\n` +
                    `Guidelines:\n` +
                    `- Follow the user's custom persona, tone, and formatting rules above.\n` +
                    `- Do NOT use em-dashes (—), dashes (-), quotation marks, or corporate filler.\n` +
                    `- Respond ONLY with the comment text. No intro text, explanations, or metadata.`;

            // 2. Custom-edited tone prompt or user-created tone
            } else if (customTones && customTones[tone]) {
                let toneInstruction = customTones[tone];
                if (typeof toneInstruction === 'object' && toneInstruction.prompt) {
                    toneInstruction = toneInstruction.prompt;
                }
                systemPrompt =
                    `${toneInstruction.replace(/\$\{language\}/g, language)}\n\n` +
                    `Language: ${language}.\n` +
                    `Guidelines:\n` +
                    `- Do NOT use em-dashes (—), dashes (-), quotation marks, or corporate filler.\n` +
                    `- Respond ONLY with the comment text. No explanations or intro text.`;

            // 3. Built-in default tone prompt template
            } else if (DEFAULT_TONES[tone]) {
                systemPrompt =
                    `${DEFAULT_TONES[tone].prompt.replace(/\$\{language\}/g, language)}\n\n` +
                    `Language: ${language}.\n` +
                    `Guidelines:\n` +
                    `- Do NOT use em-dashes (—), dashes (-), quotation marks, or corporate filler.\n` +
                    `- Respond ONLY with the comment text. No explanations or intro text.`;

            // 4. Fallback for reply or general
            } else if (replyToComment) {
                systemPrompt =
                    `You are a professional LinkedIn networking assistant. Your goal is to write a single, natural, humanized reply in ${language} to a specific user's comment on a LinkedIn post. ` +
                    `Guidelines:\n` +
                    `- Keep the tone ${tone}.\n` +
                    `- Keep it short (1 to 2 concise sentences maximum).\n` +
                    `- Be directly relevant to their comment.\n` +
                    `- Do NOT use em-dashes (—), dashes (-), quotation marks, hashtags, or corporate jargon.\n` +
                    `- Respond ONLY with the reply text. No intro text or explanations.`;
            } else {
                systemPrompt =
                    `You are a professional LinkedIn networking assistant. Your goal is to write a single, natural, humanized comment in ${language} for a LinkedIn post. ` +
                    `Guidelines:\n` +
                    `- Keep the tone ${tone}.\n` +
                    `- Keep it short (1 to 3 concise sentences maximum).\n` +
                    `- Be relevant to the post topic (Category: ${category}).\n` +
                    `- Do NOT use em-dashes (—), dashes (-), quotation marks, hashtags, emojis (unless max 1 subtle emoji), or corporate jargon.\n` +
                    `- Respond ONLY with the comment text. No explanations or intro text.`;
            }

            if (replyToComment && !['valuable-notes', 'engagement', 'funny-viral'].includes(tone)) {
                userPrompt = `Post context: "${postText}"\nUser comment to reply to: "${replyToComment}"`;
            } else {
                userPrompt = `Post content${authorHeadline}:\n"${postText}"`;
            }

            return { systemPrompt, userPrompt };
        }

        /**
         * Call Groq API to generate a comment
         * @param {Object} opts
         * @returns {Promise<{success: boolean, text?: string, error?: string}>}
         */
        async function generateGroqComment(opts) {
            opts = opts || {};
            const apiKey = normalizeApiKey(opts.apiKey);
            if (!apiKey) {
                return { success: false, error: 'missing-api-key' };
            }

            const postText = (opts.postText || '').trim();
            if (!postText) {
                return { success: false, error: 'missing-post-text' };
            }

            const prompts = buildGroqPrompt(opts);
            const fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
            if (!fetchFn) {
                return { success: false, error: 'fetch-unavailable' };
            }

            const modelName = opts.model || DEFAULT_MODEL;

            const payload = {
                model: modelName,
                messages: [
                    { role: 'system', content: prompts.systemPrompt },
                    { role: 'user', content: prompts.userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 100
            };

            // For Qwen / reasoning models on Groq: disable thinking so it generates the comment directly
            if (modelName.includes('qwen') || modelName.includes('deepseek') || modelName.includes('r1')) {
                payload.reasoning_effort = 'none';
            }

            try {
                const response = await fetchFn(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text().catch(function () { return ''; });
                    let errorMsg = `api-error-${response.status}`;

                    try {
                        const parsed = JSON.parse(errText);
                        if (parsed?.error?.message) {
                            errorMsg = parsed.error.message;
                        }
                    } catch (_) {
                        if (errText) errorMsg = errText.slice(0, 200);
                    }

                    return {
                        success: false,
                        error: errorMsg,
                        details: errText
                    };
                }

                const data = await response.json();
                const rawContent = data?.choices?.[0]?.message?.content || '';
                const cleanText = cleanAIOutput(rawContent);

                if (!cleanText) {
                    return { success: false, error: 'Empty response received from AI model.' };
                }

                return { success: true, text: cleanText };
            } catch (err) {
                return {
                    success: false,
                    error: err.message || 'network-error'
                };
            }
        }

        /**
         * Call Google Gemini REST API to generate a comment
         * @param {Object} opts
         * @returns {Promise<{success: boolean, text?: string, error?: string}>}
         */
        async function generateGeminiComment(opts) {
            opts = opts || {};
            const apiKey = normalizeApiKey(opts.apiKey);
            if (!apiKey) {
                return { success: false, error: 'missing-api-key' };
            }

            const postText = (opts.postText || '').trim();
            if (!postText) {
                return { success: false, error: 'missing-post-text' };
            }

            const prompts = buildGroqPrompt(opts);
            const fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
            if (!fetchFn) {
                return { success: false, error: 'fetch-unavailable' };
            }

            const modelName = opts.model || DEFAULT_GEMINI_MODEL;
            const endpoint = `${GEMINI_API_BASE_URL}/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

            const payload = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompts.userPrompt }]
                    }
                ],
                systemInstruction: {
                    parts: [{ text: prompts.systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 120
                }
            };

            try {
                const response = await fetchFn(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text().catch(function () { return ''; });
                    let errorMsg = `api-error-${response.status}`;

                    try {
                        const parsed = JSON.parse(errText);
                        if (parsed?.error?.message) {
                            errorMsg = parsed.error.message;
                        }
                    } catch (_) {
                        if (errText) errorMsg = errText.slice(0, 200);
                    }

                    return {
                        success: false,
                        error: errorMsg,
                        details: errText
                    };
                }

                const data = await response.json();
                const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const cleanText = cleanAIOutput(rawContent);

                if (!cleanText) {
                    return { success: false, error: 'Empty response received from Gemini model.' };
                }

                return { success: true, text: cleanText };
            } catch (err) {
                return {
                    success: false,
                    error: err.message || 'network-error'
                };
            }
        }

        /**
         * Call OpenAI REST API to generate a comment
         * @param {Object} opts
         * @returns {Promise<{success: boolean, text?: string, error?: string}>}
         */
        async function generateOpenAIComment(opts) {
            opts = opts || {};
            const apiKey = normalizeApiKey(opts.apiKey);
            if (!apiKey) {
                return { success: false, error: 'missing-api-key' };
            }

            const postText = (opts.postText || '').trim();
            if (!postText) {
                return { success: false, error: 'missing-post-text' };
            }

            const prompts = buildGroqPrompt(opts);
            const fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
            if (!fetchFn) {
                return { success: false, error: 'fetch-unavailable' };
            }

            const modelName = opts.model || DEFAULT_OPENAI_MODEL;
            const isReasoningModel = modelName.startsWith('o1') || modelName.startsWith('o3');

            const payload = {
                model: modelName,
                messages: [
                    { role: 'system', content: prompts.systemPrompt },
                    { role: 'user', content: prompts.userPrompt }
                ]
            };

            if (isReasoningModel) {
                payload.max_completion_tokens = 150;
            } else {
                payload.temperature = 0.7;
                payload.max_tokens = 120;
            }

            try {
                const response = await fetchFn(OPENAI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text().catch(function () { return ''; });
                    let errorMsg = `api-error-${response.status}`;

                    try {
                        const parsed = JSON.parse(errText);
                        if (parsed?.error?.message) {
                            errorMsg = parsed.error.message;
                        }
                    } catch (_) {
                        if (errText) errorMsg = errText.slice(0, 200);
                    }

                    return {
                        success: false,
                        error: errorMsg,
                        details: errText
                    };
                }

                const data = await response.json();
                const rawContent = data?.choices?.[0]?.message?.content || '';
                const cleanText = cleanAIOutput(rawContent);

                if (!cleanText) {
                    return { success: false, error: 'Empty response received from OpenAI model.' };
                }

                return { success: true, text: cleanText };
            } catch (err) {
                return {
                    success: false,
                    error: err.message || 'network-error'
                };
            }
        }

        /**
         * Generate a comment via Anthropic API (Claude)
         * @param {Object} opts
         * @returns {Promise<{success: boolean, text?: string, error?: string, details?: string}>}
         */
        async function generateAnthropicComment(opts) {
            opts = opts || {};
            const apiKey = normalizeApiKey(opts.apiKey);
            if (!apiKey) {
                return { success: false, error: 'missing-api-key' };
            }

            const model = opts.model || DEFAULT_ANTHROPIC_MODEL;
            const prompt = buildGroqPrompt(opts);
            const fetchFn = opts.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);

            if (!fetchFn) {
                return { success: false, error: 'fetch-not-available' };
            }

            const payload = {
                model: model,
                max_tokens: 250,
                messages: [
                    { role: 'user', content: prompt }
                ]
            };

            try {
                const response = await fetchFn(ANTHROPIC_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text().catch(function () { return ''; });
                    let errorMsg = `api-error-${response.status}`;

                    try {
                        const parsed = JSON.parse(errText);
                        if (parsed?.error?.message) {
                            errorMsg = parsed.error.message;
                        }
                    } catch (_) {
                        if (errText) errorMsg = errText.slice(0, 200);
                    }

                    return {
                        success: false,
                        error: errorMsg,
                        details: errText
                    };
                }

                const data = await response.json();
                const rawContent = data?.content?.[0]?.text || '';
                const cleanText = cleanAIOutput(rawContent);

                if (!cleanText) {
                    return { success: false, error: 'Empty response received from Anthropic model.' };
                }

                return { success: true, text: cleanText };
            } catch (err) {
                return {
                    success: false,
                    error: err.message || 'network-error'
                };
            }
        }

        /**
         * Unified comment generation dispatcher for multiple AI providers
         * @param {Object} opts
         * @returns {Promise<{success: boolean, text?: string, error?: string}>}
         */
        async function generateAIComment(opts) {
            opts = opts || {};
            const provider = (opts.provider || 'groq').toLowerCase();
            if (provider === 'gemini') {
                return generateGeminiComment(opts);
            }
            if (provider === 'openai') {
                return generateOpenAIComment(opts);
            }
            if (provider === 'anthropic') {
                return generateAnthropicComment(opts);
            }
            return generateGroqComment(opts);
        }

        /**
         * Test Google Gemini API Key validity
         * @param {string} apiKey
         * @param {string} [model]
         * @param {Function} [fetchFn]
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async function testGeminiConnection(apiKey, model, fetchFn) {
            const cleanKey = normalizeApiKey(apiKey);
            if (!cleanKey) {
                return { success: false, error: 'missing-api-key' };
            }
            const res = await generateGeminiComment({
                apiKey: cleanKey,
                model: model || DEFAULT_GEMINI_MODEL,
                postText: 'Hello world, excited to connect with developers building software.',
                language: 'en',
                fetchFn: fetchFn
            });
            if (res.success) {
                return { success: true };
            }
            return { success: false, error: res.error, details: res.details };
        }

        /**
         * Test OpenAI API Key validity
         * @param {string} apiKey
         * @param {string} [model]
         * @param {Function} [fetchFn]
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async function testOpenAIConnection(apiKey, model, fetchFn) {
            const cleanKey = normalizeApiKey(apiKey);
            if (!cleanKey) {
                return { success: false, error: 'missing-api-key' };
            }
            const res = await generateOpenAIComment({
                apiKey: cleanKey,
                model: model || DEFAULT_OPENAI_MODEL,
                postText: 'Hello world, excited to connect with developers building software.',
                language: 'en',
                fetchFn: fetchFn
            });
            if (res.success) {
                return { success: true };
            }
            return { success: false, error: res.error, details: res.details };
        }

        /**
         * Test Anthropic API Key validity
         * @param {string} apiKey
         * @param {string} [model]
         * @param {Function} [fetchFn]
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async function testAnthropicConnection(apiKey, model, fetchFn) {
            const cleanKey = normalizeApiKey(apiKey);
            if (!cleanKey) {
                return { success: false, error: 'missing-api-key' };
            }
            const res = await generateAnthropicComment({
                apiKey: cleanKey,
                model: model || DEFAULT_ANTHROPIC_MODEL,
                postText: 'Hello world, excited to connect with developers building software.',
                language: 'en',
                fetchFn: fetchFn
            });
            if (res.success) {
                return { success: true };
            }
            return { success: false, error: res.error, details: res.details };
        }

        /**
         * Test Groq API Key validity
         * @param {string} apiKey
         * @param {Function} [fetchFn]
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async function testGroqConnection(apiKey, fetchFn) {
            const cleanKey = normalizeApiKey(apiKey);
            if (!cleanKey) {
                return { success: false, error: 'missing-api-key' };
            }
            const res = await generateGroqComment({
                apiKey: cleanKey,
                postText: 'Hello world, excited to connect with developers building software.',
                language: 'en',
                fetchFn: fetchFn
            });
            if (res.success) {
                return { success: true };
            }
            return { success: false, error: res.error, details: res.details };
        }

        /**
         * Test connection across any provider
         * @param {Object} opts
         * @returns {Promise<{success: boolean, error?: string}>}
         */
        async function testAIConnection(opts) {
            opts = opts || {};
            const provider = (opts.provider || 'groq').toLowerCase();
            if (provider === 'gemini') {
                return testGeminiConnection(opts.apiKey, opts.model, opts.fetchFn);
            }
            if (provider === 'openai') {
                return testOpenAIConnection(opts.apiKey, opts.model, opts.fetchFn);
            }
            if (provider === 'anthropic') {
                return testAnthropicConnection(opts.apiKey, opts.model, opts.fetchFn);
            }
            return testGroqConnection(opts.apiKey, opts.fetchFn);
        }

        return {
            GROQ_API_URL,
            DEFAULT_MODEL,
            DEFAULT_GEMINI_MODEL,
            DEFAULT_OPENAI_MODEL,
            DEFAULT_ANTHROPIC_MODEL,
            GEMINI_API_BASE_URL,
            OPENAI_API_URL,
            ANTHROPIC_API_URL,
            DEFAULT_TONES,
            normalizeApiKey,
            cleanAIOutput,
            saveGroqApiKey,
            getGroqApiKey,
            buildGroqPrompt,
            generateGroqComment,
            generateGeminiComment,
            generateOpenAIComment,
            generateAnthropicComment,
            generateAIComment,
            testGroqConnection,
            testGeminiConnection,
            testOpenAIConnection,
            testAnthropicConnection,
            testAIConnection
        };
    }
);
