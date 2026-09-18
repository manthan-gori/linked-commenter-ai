document.addEventListener('DOMContentLoaded', () => {
    // Views & Navigation
    const mainSettingsView = document.getElementById('mainSettingsView');
    const toneManagerView = document.getElementById('toneManagerView');
    const openToneManagerBtn = document.getElementById('openToneManagerBtn');
    const backToMainViewBtn = document.getElementById('backToMainViewBtn');
    const headerTitle = document.getElementById('headerTitle');

    // Provider & Main Settings Elements
    const providerSelect = document.getElementById('aiProviderSelect');
    const groqSection = document.getElementById('groqConfigSection');
    const geminiSection = document.getElementById('geminiConfigSection');
    const openaiSection = document.getElementById('openaiConfigSection');
    const anthropicSection = document.getElementById('anthropicConfigSection');

    const groqInput = document.getElementById('groqApiKeyInput');
    const groqModelSelect = document.getElementById('groqModelSelect');
    const toggleGroqBtn = document.getElementById('toggleGroqKeyVisibilityBtn');

    const geminiInput = document.getElementById('geminiApiKeyInput');
    const geminiModelSelect = document.getElementById('geminiModelSelect');
    const toggleGeminiBtn = document.getElementById('toggleGeminiKeyVisibilityBtn');

    const openaiInput = document.getElementById('openaiApiKeyInput');
    const openaiModelSelect = document.getElementById('openaiModelSelect');
    const toggleOpenAIBtn = document.getElementById('toggleOpenAIKeyVisibilityBtn');

    const anthropicInput = document.getElementById('anthropicApiKeyInput');
    const anthropicModelSelect = document.getElementById('anthropicModelSelect');
    const toggleAnthropicBtn = document.getElementById('toggleAnthropicKeyVisibilityBtn');

    const badgeEl = document.getElementById('aiStatusBadge');
    const saveBtn = document.getElementById('saveAiKeyBtn');
    const customPromptInput = document.getElementById('customPromptInput');
    const resetCustomPromptBtn = document.getElementById('resetCustomPromptBtn');
    const statusBox = document.getElementById('statusBox');

    // Tone Manager Elements
    const editToneSelect = document.getElementById('editToneSelect');
    const editTonePromptInput = document.getElementById('editTonePromptInput');
    const saveTonePromptBtn = document.getElementById('saveTonePromptBtn');
    const deleteCustomToneBtn = document.getElementById('deleteCustomToneBtn');
    const resetCurrentToneBtn = document.getElementById('resetCurrentToneBtn');
    const toneVisibilityCheckbox = document.getElementById('toneVisibilityCheckbox');
    const toneTypeBadge = document.getElementById('toneTypeBadge');

    const toggleNewToneBtn = document.getElementById('toggleNewToneBtn');
    const newToneCard = document.getElementById('newToneCard');
    const closeNewToneCardBtn = document.getElementById('closeNewToneCardBtn');
    const newToneEmojiInput = document.getElementById('newToneEmojiInput');
    const newToneNameInput = document.getElementById('newToneNameInput');
    const newTonePromptInput = document.getElementById('newTonePromptInput');
    const addNewToneBtn = document.getElementById('addNewToneBtn');
    const toneStatusBox = document.getElementById('toneStatusBox');

    // Fallback default tones dictionary
    const groqClient = (typeof globalThis !== 'undefined' && globalThis.LinkedInGroqClient) ? globalThis.LinkedInGroqClient : null;
    const defaultTonesMap = (groqClient && groqClient.DEFAULT_TONES) ? groqClient.DEFAULT_TONES : {
        'professional': { label: '💼 Professional', emoji: '💼', prompt: 'You are a professional LinkedIn networking assistant. Your goal is to write a single, natural, humanized comment in ${language} for a LinkedIn post. Keep the tone professional. Keep it short (1 to 3 concise sentences maximum). Do NOT use em-dashes (—), dashes (-), quotation marks, hashtags, emojis (unless max 1 subtle emoji), or corporate jargon. Respond ONLY with the comment text.' },
        'insightful': { label: '🧠 Insightful', emoji: '🧠', prompt: 'You are a thoughtful industry expert. Write an insightful comment in ${language} analyzing a key idea from the post and adding a valuable perspective. 1 to 2 sentences max. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'friendly': { label: '😊 Friendly', emoji: '😊', prompt: 'You are a friendly LinkedIn connection. Write a warm, approachable, and encouraging comment in ${language}. 1 to 2 sentences. Sound human and conversational. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'casual': { label: '☕ Casual', emoji: '☕', prompt: 'You are a casual peer in the industry. Write a relaxed, authentic comment in ${language} as if chatting over coffee. 1 to 2 short sentences. Do NOT use em-dashes, hashtags, or formal jargon. Respond ONLY with the comment text.' },
        'witty': { label: '😄 Witty', emoji: '😄', prompt: 'You are a witty professional with smart humor. Write a clever, light-hearted comment in ${language} related to the post. 1 to 2 sentences. Keep it workplace-appropriate. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'empathetic': { label: '❤️ Empathetic', emoji: '❤️', prompt: 'You are an empathetic, supportive peer. Write a compassionate comment in ${language} acknowledging the post author\'s experience or perspective. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or robotic phrasing. Respond ONLY with the comment text.' },
        'curious': { label: '🤔 Curious', emoji: '🤔', prompt: 'You are an inquisitive professional. Write a comment in ${language} asking an open, thoughtful question about the post to learn more about the author\'s process or thoughts. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'motivational': { label: '🚀 Motivational', emoji: '🚀', prompt: 'You are an inspiring mentor. Write an uplifting, energizing comment in ${language} that inspires action or celebrates dedication. 1 to 2 sentences. Do NOT use em-dashes, hashtags, or hollow clichés. Respond ONLY with the comment text.' },
        'contrarian': { label: '⚡ Contrarian', emoji: '⚡', prompt: 'You are a respectful critical thinker. Write a polite contrarian comment in ${language} offering an alternative perspective or edge case not mentioned in the post. 1 to 2 sentences. Be constructive, never rude. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'storytelling': { label: '📖 Storytelling', emoji: '📖', prompt: 'You are an experienced professional sharing relatable context. Write a short 2-sentence comment in ${language} referencing a brief real-world scenario or lesson that connects with the post. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'valuable-notes': { label: '💡 Valuable Notes', emoji: '💡', prompt: 'You are a LinkedIn thought leader. Write a short, high-value comment in ${language} that adds a genuine insight, key takeaway, or useful tip directly related to the post. Start with the insight directly, no filler opener. 2 to 3 concise sentences. Add a fact, stat, or practical tip. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'engagement': { label: '🔥 Engagement', emoji: '🔥', prompt: 'You are a LinkedIn engagement expert. Write a comment in ${language} that sparks conversation and gets replies. 1 to 2 sentences max. End with a direct, specific question that invites the reader or author to respond. Do NOT use em-dashes, hashtags, or corporate jargon. Respond ONLY with the comment text.' },
        'funny-viral': { label: '😂 Funny Viral', emoji: '😂', prompt: 'You are a witty LinkedIn creator who writes comments that go viral because they are genuinely funny and relatable. Write a humorous comment in ${language} about the post. 1 to 2 sentences. Short = shareable. Use clever wordplay or a relatable observation. 1 emoji max. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'congratulations': { label: '🎉 Congratulations', emoji: '🎉', prompt: 'You are a warm, genuine LinkedIn connection. Write a heartfelt congratulations comment in ${language} for this post. 1 to 2 sentences. Sound human, not robotic. Mention something specific from the post. No hollow phrases like "Congratulations on this milestone!". 1 celebratory emoji welcome. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'positive-feedback': { label: '👍 Positive Feedback', emoji: '👍', prompt: 'You are a thoughtful LinkedIn professional. Write a comment in ${language} that gives specific, genuine positive feedback on this post. 2 sentences max. Praise something SPECIFIC from the post, not just "great post". Explain briefly WHY it stood out. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'appreciation': { label: '🙏 Appreciation', emoji: '🙏', prompt: 'You are a grateful LinkedIn professional. Write a sincere appreciation comment in ${language} thanking the author for sharing this post. 1 to 2 sentences. Be genuinely thankful and mention what you found valuable. Sound personal, not copy-pasted. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'agreement': { label: '✅ Agreement', emoji: '✅', prompt: 'You are a LinkedIn professional who strongly agrees with this post. Write a comment in ${language} that validates the author\'s point of view. 1 to 2 sentences. State that you agree and briefly give a REASON or personal experience that backs it up. Sound genuine, not sycophantic. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' },
        'encouragement': { label: '💪 Encouragement', emoji: '💪', prompt: 'You are a supportive LinkedIn mentor. Write an encouraging comment in ${language} that uplifts and motivates the author or the community around this post. 1 to 2 sentences. Acknowledge the effort or journey mentioned in the post. 1 emoji optional. Do NOT use em-dashes or hashtags. Respond ONLY with the comment text.' }
    };

    let currentToneCustomizations = {};
    let currentUserCreatedTones = [];
    let currentDisabledTones = [];

    function setStatus(targetBox, msg, type) {
        if (!targetBox) return;
        targetBox.style.display = 'block';
        targetBox.textContent = msg;
        const colors = {
            info: '#5eb3f6',
            success: '#3fb950',
            error: '#f85149',
            warning: '#d29922'
        };
        targetBox.style.borderLeftColor = colors[type] || colors.info;
    }

    function updateProviderView(provider) {
        if (groqSection) groqSection.style.display = provider === 'groq' ? 'block' : 'none';
        if (geminiSection) geminiSection.style.display = provider === 'gemini' ? 'block' : 'none';
        if (openaiSection) openaiSection.style.display = provider === 'openai' ? 'block' : 'none';
        if (anthropicSection) anthropicSection.style.display = provider === 'anthropic' ? 'block' : 'none';
    }

    function getActiveKeyForProvider(provider, data) {
        if (provider === 'gemini') return data?.geminiApiKey || geminiInput?.value || '';
        if (provider === 'openai') return data?.openaiApiKey || openaiInput?.value || '';
        if (provider === 'anthropic') return data?.anthropicApiKey || anthropicInput?.value || '';
        return data?.groqApiKey || groqInput?.value || '';
    }

    // Navigation switching
    if (openToneManagerBtn) {
        openToneManagerBtn.addEventListener('click', () => {
            if (mainSettingsView) mainSettingsView.style.display = 'none';
            if (toneManagerView) toneManagerView.style.display = 'block';
            if (headerTitle) headerTitle.textContent = 'Tone & Prompt Settings';
            if (openToneManagerBtn) openToneManagerBtn.style.display = 'none';
            if (toggleNewToneBtn) toggleNewToneBtn.style.display = 'flex';
            if (newToneCard) newToneCard.style.display = 'none';
            loadToneManagerData();
        });
    }

    if (backToMainViewBtn) {
        backToMainViewBtn.addEventListener('click', () => {
            if (toneManagerView) toneManagerView.style.display = 'none';
            if (mainSettingsView) mainSettingsView.style.display = 'block';
            if (headerTitle) headerTitle.textContent = 'Linked Commenter AI';
            if (openToneManagerBtn) openToneManagerBtn.style.display = 'flex';
        });
    }

    // Check active tab domain
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs && tabs[0];
                const nonLinkedInBanner = document.getElementById('nonLinkedInBanner');
                if (activeTab && activeTab.url) {
                    try {
                        const urlObj = new URL(activeTab.url);
                        if (!urlObj.hostname.endsWith('linkedin.com') && nonLinkedInBanner) {
                            nonLinkedInBanner.style.display = 'block';
                        }
                    } catch (_) {}
                }
            });
        } catch (_) {}
    }

    // Load initial settings
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
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
            'userCreatedTones',
            'disabledTones'
        ], (data) => {
            const provider = data?.aiProvider || 'groq';
            if (providerSelect) {
                providerSelect.value = provider;
            }
            updateProviderView(provider);

            if (groqInput && data?.groqApiKey) groqInput.value = data.groqApiKey;
            if (groqModelSelect && data?.groqModel) groqModelSelect.value = data.groqModel;

            if (geminiInput && data?.geminiApiKey) geminiInput.value = data.geminiApiKey;
            if (geminiModelSelect && data?.geminiModel) geminiModelSelect.value = data.geminiModel;

            if (openaiInput && data?.openaiApiKey) openaiInput.value = data.openaiApiKey;
            if (openaiModelSelect && data?.openaiModel) openaiModelSelect.value = data.openaiModel;

            if (anthropicInput && data?.anthropicApiKey) anthropicInput.value = data.anthropicApiKey;
            if (anthropicModelSelect && data?.anthropicModel) anthropicModelSelect.value = data.anthropicModel;

            if (customPromptInput && typeof data?.customPrompt === 'string') {
                customPromptInput.value = data.customPrompt;
            }

            currentToneCustomizations = data?.toneCustomizations || {};
            currentUserCreatedTones = Array.isArray(data?.userCreatedTones) ? data.userCreatedTones : [];
            currentDisabledTones = Array.isArray(data?.disabledTones) ? data.disabledTones : [];

            // Update badge based on active provider configuration
            const activeKey = getActiveKeyForProvider(provider, data);
            if (badgeEl) {
                badgeEl.textContent = activeKey ? '✓ Configured' : 'Not configured';
                badgeEl.className = activeKey ? 'badge active' : 'badge';
            }
        });

        providerSelect?.addEventListener('change', () => {
            const newProvider = providerSelect.value;
            updateProviderView(newProvider);
            chrome.storage.local.set({ aiProvider: newProvider });

            const activeKey = getActiveKeyForProvider(newProvider, null);
            if (badgeEl) {
                badgeEl.textContent = activeKey ? '✓ Configured' : 'Not configured';
                badgeEl.className = activeKey ? 'badge active' : 'badge';
            }
        });

        groqModelSelect?.addEventListener('change', () => {
            chrome.storage.local.set({ groqModel: groqModelSelect.value });
        });

        geminiModelSelect?.addEventListener('change', () => {
            chrome.storage.local.set({ geminiModel: geminiModelSelect.value });
        });

        openaiModelSelect?.addEventListener('change', () => {
            chrome.storage.local.set({ openaiModel: openaiModelSelect.value });
        });

        anthropicModelSelect?.addEventListener('change', () => {
            chrome.storage.local.set({ anthropicModel: anthropicModelSelect.value });
        });

        customPromptInput?.addEventListener('input', () => {
            chrome.storage.local.set({ customPrompt: customPromptInput.value.trim() });
        });
    }

    // Reset custom global prompt
    if (resetCustomPromptBtn) {
        resetCustomPromptBtn.addEventListener('click', () => {
            if (customPromptInput) customPromptInput.value = '';
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ customPrompt: '' }, () => {
                    setStatus(statusBox, 'Custom prompt reset to default.', 'info');
                });
            } else {
                setStatus(statusBox, 'Custom prompt reset to default.', 'info');
            }
        });
    }

    // Toggle password visibility with SVG icon swap
    const eyeSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOffSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    function setupPasswordToggle(btn, input) {
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.innerHTML = isPassword ? eyeOffSvg : eyeSvg;
        });
    }

    setupPasswordToggle(toggleGroqBtn, groqInput);
    setupPasswordToggle(toggleGeminiBtn, geminiInput);
    setupPasswordToggle(toggleOpenAIBtn, openaiInput);
    setupPasswordToggle(toggleAnthropicBtn, anthropicInput);

    // Save and test key
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const provider = providerSelect ? providerSelect.value : 'groq';
            const groqKey = (groqInput?.value || '').trim();
            const groqModel = groqModelSelect ? groqModelSelect.value : 'groq/compound-mini';
            const geminiKey = (geminiInput?.value || '').trim();
            const geminiModel = geminiModelSelect ? geminiModelSelect.value : 'gemini-3.7-flash';
            const openaiKey = (openaiInput?.value || '').trim();
            const openaiModel = openaiModelSelect ? openaiModelSelect.value : 'gpt-4o-mini';
            const anthropicKey = (anthropicInput?.value || '').trim();
            const anthropicModel = anthropicModelSelect ? anthropicModelSelect.value : 'claude-3-7-sonnet-20250219';
            const customPrompt = customPromptInput ? customPromptInput.value.trim() : '';

            let activeKey = groqKey;
            let activeModel = groqModel;
            let providerName = 'Groq AI';

            if (provider === 'gemini') {
                activeKey = geminiKey;
                activeModel = geminiModel;
                providerName = 'Google Gemini';
            } else if (provider === 'openai') {
                activeKey = openaiKey;
                activeModel = openaiModel;
                providerName = 'OpenAI';
            } else if (provider === 'anthropic') {
                activeKey = anthropicKey;
                activeModel = anthropicModel;
                providerName = 'Anthropic (Claude)';
            }

            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    aiProvider: provider,
                    groqApiKey: groqKey,
                    groqModel: groqModel,
                    geminiApiKey: geminiKey,
                    geminiModel: geminiModel,
                    openaiApiKey: openaiKey,
                    openaiModel: openaiModel,
                    anthropicApiKey: anthropicKey,
                    anthropicModel: anthropicModel,
                    customPrompt: customPrompt
                });
            }

            if (!activeKey) {
                if (badgeEl) {
                    badgeEl.textContent = 'Not configured';
                    badgeEl.className = 'badge';
                }
                setStatus(statusBox, `${providerName} API Key cleared / empty.`, 'info');
                return;
            }

            if (badgeEl) {
                badgeEl.textContent = 'Testing...';
                badgeEl.className = 'badge';
            }

            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';

            chrome.runtime.sendMessage({
                action: 'testAIConnection',
                provider: provider,
                apiKey: activeKey,
                model: activeModel
            }, (testRes) => {
                saveBtn.disabled = false;
                saveBtn.style.opacity = '1';

                if (chrome.runtime.lastError) {
                    if (badgeEl) {
                        badgeEl.textContent = '✗ Error';
                        badgeEl.className = 'badge error';
                    }
                    setStatus(statusBox, `Extension background worker error: ${chrome.runtime.lastError.message}`, 'error');
                    return;
                }

                if (testRes && testRes.success) {
                    if (badgeEl) {
                        badgeEl.textContent = '✓ Active';
                        badgeEl.className = 'badge active';
                    }
                    setStatus(statusBox, `Connected to ${providerName} (${activeModel})`, 'success');
                } else {
                    if (badgeEl) {
                        badgeEl.textContent = '✗ Connection Error';
                        badgeEl.className = 'badge error';
                    }
                    const errReason = testRes?.error || 'connection-failed';
                    setStatus(statusBox, `${providerName} test failed: ${errReason}`, 'error');
                }
            });
        });
    }

    // ==========================================
    // TONE MANAGER LOGIC
    // ==========================================

    function loadToneManagerData() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['toneCustomizations', 'userCreatedTones', 'disabledTones'], (data) => {
                currentToneCustomizations = data?.toneCustomizations || {};
                currentUserCreatedTones = Array.isArray(data?.userCreatedTones) ? data.userCreatedTones : [];
                currentDisabledTones = Array.isArray(data?.disabledTones) ? data.disabledTones : [];
                renderToneSelectOptions();
            });
        } else {
            renderToneSelectOptions();
        }
    }

    function renderToneSelectOptions() {
        if (!editToneSelect) return;
        const selectedValue = editToneSelect.value;
        editToneSelect.innerHTML = '';

        // 1. Built-in tones
        const builtInGroup = document.createElement('optgroup');
        builtInGroup.label = 'Built-in Tones (18)';
        Object.keys(defaultTonesMap).forEach((k) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = defaultTonesMap[k].label;
            builtInGroup.appendChild(opt);
        });
        editToneSelect.appendChild(builtInGroup);

        // 2. User created tones
        if (currentUserCreatedTones.length > 0) {
            const customGroup = document.createElement('optgroup');
            customGroup.label = 'My Custom Tones';
            currentUserCreatedTones.forEach((t) => {
                const opt = document.createElement('option');
                opt.value = t.key;
                opt.textContent = `${t.emoji || '🧩'} ${t.label}`;
                customGroup.appendChild(opt);
            });
            editToneSelect.appendChild(customGroup);
        }

        if (selectedValue && editToneSelect.querySelector(`option[value="${selectedValue}"]`)) {
            editToneSelect.value = selectedValue;
        } else {
            editToneSelect.value = 'professional';
        }

        onToneSelectionChanged();
    }

    function onToneSelectionChanged() {
        const toneKey = editToneSelect?.value;
        if (!toneKey) return;

        const isUserCreated = currentUserCreatedTones.some((t) => t.key === toneKey);

        if (deleteCustomToneBtn) {
            deleteCustomToneBtn.style.display = isUserCreated ? 'inline-block' : 'none';
        }
        if (resetCurrentToneBtn) {
            resetCurrentToneBtn.style.display = isUserCreated ? 'none' : 'inline-block';
        }

        // Visibility checkbox state
        if (toneVisibilityCheckbox) {
            toneVisibilityCheckbox.checked = !currentDisabledTones.includes(toneKey);
        }

        let activePrompt = '';
        if (isUserCreated) {
            const customObj = currentUserCreatedTones.find((t) => t.key === toneKey);
            activePrompt = customObj?.prompt || '';
            if (toneTypeBadge) {
                toneTypeBadge.textContent = 'Custom Tone';
                toneTypeBadge.className = 'badge active';
            }
        } else {
            const isCustomized = Boolean(currentToneCustomizations[toneKey]);
            activePrompt = isCustomized ? currentToneCustomizations[toneKey] : (defaultTonesMap[toneKey]?.prompt || '');
            if (toneTypeBadge) {
                toneTypeBadge.textContent = isCustomized ? 'Modified' : 'Built-in';
                toneTypeBadge.className = isCustomized ? 'badge active' : 'badge';
            }
        }

        if (editTonePromptInput) {
            editTonePromptInput.value = activePrompt;
        }
    }

    editToneSelect?.addEventListener('change', onToneSelectionChanged);

    // Tone Visibility Checkbox Toggle
    if (toneVisibilityCheckbox) {
        toneVisibilityCheckbox.addEventListener('change', () => {
            const toneKey = editToneSelect?.value;
            if (!toneKey) return;

            if (toneVisibilityCheckbox.checked) {
                currentDisabledTones = currentDisabledTones.filter((k) => k !== toneKey);
            } else {
                if (!currentDisabledTones.includes(toneKey)) {
                    currentDisabledTones.push(toneKey);
                }
            }

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ disabledTones: currentDisabledTones }, () => {
                    setStatus(toneStatusBox, toneVisibilityCheckbox.checked ? 'Tone will appear in LinkedIn bar.' : 'Tone hidden from LinkedIn bar.', 'info');
                });
            } else {
                setStatus(toneStatusBox, toneVisibilityCheckbox.checked ? 'Tone will appear in LinkedIn bar.' : 'Tone hidden from LinkedIn bar.', 'info');
            }
        });
    }

    // Single-tone reset (Restore ONLY the currently selected tone)
    if (resetCurrentToneBtn) {
        resetCurrentToneBtn.addEventListener('click', () => {
            const toneKey = editToneSelect?.value;
            if (!toneKey) return;

            delete currentToneCustomizations[toneKey];

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ toneCustomizations: currentToneCustomizations }, () => {
                    const toneLabel = defaultTonesMap[toneKey]?.label || toneKey;
                    setStatus(toneStatusBox, `"${toneLabel}" restored to default prompt!`, 'info');
                    onToneSelectionChanged();
                });
            } else {
                const toneLabel = defaultTonesMap[toneKey]?.label || toneKey;
                setStatus(toneStatusBox, `"${toneLabel}" restored to default prompt!`, 'info');
                onToneSelectionChanged();
            }
        });
    }

    // Save modified tone prompt
    if (saveTonePromptBtn) {
        saveTonePromptBtn.addEventListener('click', () => {
            const toneKey = editToneSelect?.value;
            const updatedPrompt = (editTonePromptInput?.value || '').trim();
            if (!toneKey || !updatedPrompt) return;

            const isUserCreated = currentUserCreatedTones.some((t) => t.key === toneKey);

            if (isUserCreated) {
                currentUserCreatedTones = currentUserCreatedTones.map((t) => {
                    if (t.key === toneKey) {
                        return Object.assign({}, t, { prompt: updatedPrompt });
                    }
                    return t;
                });
            } else {
                currentToneCustomizations[toneKey] = updatedPrompt;
            }

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    toneCustomizations: currentToneCustomizations,
                    userCreatedTones: currentUserCreatedTones
                }, () => {
                    setStatus(toneStatusBox, `Tone prompt saved successfully!`, 'success');
                    onToneSelectionChanged();
                });
            } else {
                setStatus(toneStatusBox, `Tone prompt saved successfully!`, 'success');
            }
        });
    }

    // Delete custom tone
    if (deleteCustomToneBtn) {
        deleteCustomToneBtn.addEventListener('click', () => {
            const toneKey = editToneSelect?.value;
            if (!toneKey) return;

            currentUserCreatedTones = currentUserCreatedTones.filter((t) => t.key !== toneKey);
            delete currentToneCustomizations[toneKey];
            currentDisabledTones = currentDisabledTones.filter((k) => k !== toneKey);

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    toneCustomizations: currentToneCustomizations,
                    userCreatedTones: currentUserCreatedTones,
                    disabledTones: currentDisabledTones
                }, () => {
                    setStatus(toneStatusBox, `Custom tone deleted.`, 'info');
                    renderToneSelectOptions();
                });
            } else {
                setStatus(toneStatusBox, `Custom tone deleted.`, 'info');
                renderToneSelectOptions();
            }
        });
    }

    // Collapsible New Tone Form toggling
    if (toggleNewToneBtn && newToneCard) {
        toggleNewToneBtn.addEventListener('click', () => {
            newToneCard.style.display = 'block';
            toggleNewToneBtn.style.display = 'none';
        });
    }
    if (closeNewToneCardBtn && newToneCard && toggleNewToneBtn) {
        closeNewToneCardBtn.addEventListener('click', () => {
            newToneCard.style.display = 'none';
            toggleNewToneBtn.style.display = 'flex';
        });
    }

    // Add brand new custom tone
    if (addNewToneBtn) {
        addNewToneBtn.addEventListener('click', () => {
            const label = (newToneNameInput?.value || '').trim();
            const emoji = (newToneEmojiInput?.value || '🧩').trim() || '🧩';
            const prompt = (newTonePromptInput?.value || '').trim();

            if (!label || !prompt) {
                setStatus(toneStatusBox, `Please provide both a Tone Name and Prompt.`, 'error');
                return;
            }

            const key = 'custom-tone-' + Date.now();
            currentUserCreatedTones.push({
                key: key,
                label: label,
                emoji: emoji,
                prompt: prompt
            });

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ userCreatedTones: currentUserCreatedTones }, () => {
                    if (newToneNameInput) newToneNameInput.value = '';
                    if (newToneEmojiInput) newToneEmojiInput.value = '🧩';
                    if (newTonePromptInput) newTonePromptInput.value = '';
                    if (newToneCard) newToneCard.style.display = 'none';
                    if (toggleNewToneBtn) toggleNewToneBtn.style.display = 'flex';

                    setStatus(toneStatusBox, `Created new tone "${emoji} ${label}"!`, 'success');
                    renderToneSelectOptions();
                    if (editToneSelect) editToneSelect.value = key;
                    onToneSelectionChanged();
                });
            } else {
                if (newToneCard) newToneCard.style.display = 'none';
                if (toggleNewToneBtn) toggleNewToneBtn.style.display = 'flex';
                setStatus(toneStatusBox, `Created new tone "${emoji} ${label}"!`, 'success');
            }
        });
    }
});
