(function () {
    // Only run on LinkedIn domains
    if (typeof window === 'undefined' || !window.location || !window.location.hostname || !window.location.hostname.endsWith('linkedin.com')) {
        return;
    }

    if (window.linkedInFeedEngageInjected) return;
    window.linkedInFeedEngageInjected = true;

    /**
     * Helper to verify extension context is still active and valid.
     * Prevents chrome-extension://invalid/ loop when extension is reloaded/updated.
     * @returns {boolean}
     */
    function isExtensionValid() {
        try {
            return typeof chrome !== 'undefined' && Boolean(chrome.runtime && chrome.runtime.id);
        } catch (_) {
            return false;
        }
    }

    /**
     * Check if LinkedIn is running in Dark Mode or Light Mode
     * @returns {boolean}
     */
    function isLinkedInDarkMode() {
        try {
            const doc = document.documentElement;
            const body = document.body;
            return (
                (doc && doc.classList && (doc.classList.contains('theme--dark') || doc.classList.contains('theme--mercado-dark'))) ||
                (body && body.classList && (body.classList.contains('theme--dark') || body.classList.contains('theme--mercado-dark'))) ||
                (doc && doc.getAttribute && doc.getAttribute('data-theme') === 'dark') ||
                (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            );
        } catch (_) {
            return false;
        }
    }

    const BUILTIN_TONES_LIST = [
        { key: 'professional', label: '💼 Professional' },
        { key: 'insightful', label: '🧠 Insightful' },
        { key: 'friendly', label: '😊 Friendly' },
        { key: 'casual', label: '☕ Casual' },
        { key: 'witty', label: '😄 Witty' },
        { key: 'empathetic', label: '❤️ Empathetic' },
        { key: 'curious', label: '🤔 Curious' },
        { key: 'motivational', label: '🚀 Motivational' },
        { key: 'contrarian', label: '⚡ Contrarian' },
        { key: 'storytelling', label: '📖 Storytelling' },
        { key: 'valuable-notes', label: '💡 Valuable Notes' },
        { key: 'engagement', label: '🔥 Engagement' },
        { key: 'funny-viral', label: '😂 Funny Viral' },
        { key: 'congratulations', label: '🎉 Congratulations' },
        { key: 'positive-feedback', label: '👍 Positive Feedback' },
        { key: 'appreciation', label: '🙏 Appreciation' },
        { key: 'agreement', label: '✅ Agreement' },
        { key: 'encouragement', label: '💪 Encouragement' }
    ];

    // Local cached tones to avoid hitting chrome.storage repeatedly on DOM mutations
    let cachedDisabledTones = [];
    let cachedUserTones = [];

    function updateCachedTones() {
        if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
        try {
            chrome.storage.local.get(['userCreatedTones', 'disabledTones'], (data) => {
                if (!isExtensionValid()) return;
                cachedDisabledTones = Array.isArray(data?.disabledTones) ? data.disabledTones : [];
                cachedUserTones = Array.isArray(data?.userCreatedTones) ? data.userCreatedTones : [];
            });
        } catch (_) { /* ignore */ }
    }

    updateCachedTones();

    if (isExtensionValid() && chrome.storage && chrome.storage.onChanged) {
        try {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (changes.disabledTones) {
                        cachedDisabledTones = Array.isArray(changes.disabledTones.newValue) ? changes.disabledTones.newValue : [];
                    }
                    if (changes.userCreatedTones) {
                        cachedUserTones = Array.isArray(changes.userCreatedTones.newValue) ? changes.userCreatedTones.newValue : [];
                    }
                }
            });
        } catch (_) { /* ignore */ }
    }

    function populateToneSelect(toneSelect, selectBg, selectColor) {
        if (!toneSelect) return;
        toneSelect.innerHTML = '';

        BUILTIN_TONES_LIST.forEach((bt) => {
            if (!cachedDisabledTones.includes(bt.key)) {
                const opt = document.createElement('option');
                opt.value = bt.key;
                opt.textContent = bt.label;
                opt.style.background = selectBg;
                opt.style.color = selectColor;
                toneSelect.appendChild(opt);
            }
        });

        cachedUserTones.forEach((t) => {
            if (t && t.key && t.label && !cachedDisabledTones.includes(t.key)) {
                const opt = document.createElement('option');
                opt.value = t.key;
                opt.textContent = `${t.emoji || '🧩'} ${t.label}`;
                opt.style.background = selectBg;
                opt.style.color = selectColor;
                toneSelect.appendChild(opt);
            }
        });

        if (toneSelect.options.length === 0) {
            const opt = document.createElement('option');
            opt.value = 'professional';
            opt.textContent = '💼 Professional';
            opt.style.background = selectBg;
            opt.style.color = selectColor;
            toneSelect.appendChild(opt);
        }
    }

    /**
     * Find post container element for a given element inside a post card
     */
    function findPostContainer(el) {
        if (!el) return null;
        let curr = el;
        while (curr && curr !== document.body) {
            // Skip comment box ancestors
            if (curr.classList && (
                curr.classList.contains('comments-comment-box') ||
                curr.classList.contains('comments-comment-texteditor')
            )) {
                curr = curr.parentElement;
                continue;
            }
            // EngageGPT-proven post container selectors (Feed, Activity & Profile)
            if (curr.classList && (
                curr.classList.contains('feed-shared-update-v2') ||
                curr.classList.contains('profile-creator-shared-feed-update__container') ||
                curr.classList.contains('profile-creator-shared-feed-update') ||
                curr.classList.contains('profile-creator-shared-feed-update__activity-item') ||
                curr.classList.contains('occludable-update') ||
                curr.classList.contains('fie-impression-container') ||
                curr.classList.contains('feed-shared-update') ||
                curr.classList.contains('main-feed-activity-card') ||
                curr.classList.contains('feed-shared-post') ||
                curr.classList.contains('artdeco-card') ||
                curr.tagName === 'ARTICLE' ||
                curr.classList.contains('artdeco-modal')
            )) {
                return curr;
            }
            if (curr.hasAttribute && (
                curr.hasAttribute('data-urn') ||
                curr.getAttribute('data-view-name') === 'feed-full-update' ||
                curr.getAttribute('role') === 'listitem'
            )) {
                return curr;
            }
            // Has a commentary/post-text child (but is not a comment)
            if (curr !== el && curr.querySelector && (
                curr.querySelector('[data-view-name="feed-commentary"]') ||
                curr.querySelector('[data-testid="expandable-text-box"]') ||
                curr.querySelector('.update-components-text span.break-words') ||
                curr.querySelector('.fie-impression-container')
            )) {
                return curr;
            }
            curr = curr.parentElement;
        }

        return el.closest(
            '[data-view-name="feed-full-update"], ' +
            '.fie-impression-container, ' +
            '.profile-creator-shared-feed-update__container, ' +
            '.profile-creator-shared-feed-update, ' +
            '.feed-shared-update-v2, ' +
            '.artdeco-card, ' +
            '[data-urn], ' +
            '[role="listitem"], ' +
            '.occludable-update, ' +
            '.artdeco-modal, ' +
            'article'
        ) || document.body;
    }

    /**
     * Extract target comment text if replying to a specific user's comment in a thread
     */
    function extractReplyTargetCommentText(field) {
        if (!field) return '';
        const commentItem = field.closest(
            '.comments-comment-item, ' +
            '.comments-reply-item, ' +
            '.comments-comment-item__content, ' +
            'article.comments-comment-item'
        );
        if (!commentItem) return '';

        const textEl = commentItem.querySelector(
            '.comments-comment-item__main-content, ' +
            '.comments-comment-item__inline-show-more-text, ' +
            '.comments-comment-item-content-body, ' +
            'span.break-words'
        );
        return textEl ? textEl.innerText.trim() : '';
    }

    /**
     * Extract author headline from post container
     */
    function extractAuthorHeadline(container) {
        if (!container) return '';
        const headlineEl = (container || document).querySelector(
            '.update-components-actor__description, ' +
            '.feed-shared-actor__description, ' +
            '.update-components-actor__sub-description, ' +
            '.update-components-actor__title, ' +
            '.feed-shared-actor__title'
        );
        return headlineEl ? headlineEl.innerText.trim() : '';
    }

    /**
     * Clean extracted post text: strip hashtags, "see more", "show translation" noise.
     */
    function sanitisePostText(raw) {
        if (!raw) return '';
        let t = raw.replace(/#\w+/g, '').trim();
        t = t.replace(/\u2026\s*see more|see more|show translation/gi, '');
        return t.trim();
    }

    /**
     * Extract post body text from post container.
     */
    function extractPostText(container) {
        const COMMENT_EXCLUDE = [
            '.comments-comment-box',
            '.comments-comments-list',
            '.comments-comment-item',
            '.lkd-ai-helper-bar',
            '.comments-comment-box__form'
        ].join(', ');

        const root = container || document.body;

        // --- Strategy 1: EngageGPT COMMENT_POST_CONTENT selectors ---
        const primarySelectors = [
            '[data-view-name="feed-commentary"]',
            '[data-testid="expandable-text-box"]',
            '.update-components-text span.break-words',
            '.feed-shared-update-v2__description .update-components-text span.break-words',
            '.feed-shared-inline-show-more-text span.break-words',
            'span.break-words'
        ];

        for (const sel of primarySelectors) {
            const elements = root.querySelectorAll(sel);
            for (const el of elements) {
                if (el.closest(COMMENT_EXCLUDE)) continue;
                const spanEl = (el.tagName || '').toLowerCase() === 'span'
                    ? el
                    : (el.getElementsByTagName('span')[0] || el);
                const text = sanitisePostText(spanEl.innerText || spanEl.textContent || '');
                if (text.length >= 10) return text;
            }
        }

        // --- Strategy 2: POST_CONTENT_DIV selectors ---
        const containerSelectors = [
            '[data-view-name="feed-full-update"]',
            '.fie-impression-container',
            'div[componentkey] > p'
        ];

        for (const sel of containerSelectors) {
            const el = root.querySelector(sel);
            if (el && !el.closest(COMMENT_EXCLUDE)) {
                const text = sanitisePostText(el.innerText || el.textContent || '');
                if (text.length >= 10) return text;
            }
        }

        // --- Strategy 3: Legacy selectors (fallback) ---
        const legacySelectors = [
            '.update-components-text',
            '.feed-shared-update-v2__description',
            '.feed-shared-text',
            '.feed-shared-inline-show-more-text',
            '.feed-shared-text-view',
            '.update-components-update-v2__commentary',
            '[data-test-id="main-feed-activity-card__commentary"]',
            '.feed-shared-article__description',
            '.feed-shared-article__title',
            '.feed-shared-main-content',
            'div[dir="ltr"]',
            'span[dir="ltr"]'
        ];

        for (const sel of legacySelectors) {
            const elements = root.querySelectorAll(sel);
            for (const el of elements) {
                if (el.closest(COMMENT_EXCLUDE)) continue;
                const text = sanitisePostText(el.innerText || el.textContent || '');
                if (text.length >= 10) return text;
            }
        }

        // --- Strategy 4: Clone + strip non-post nodes ---
        try {
            const clone = root.cloneNode(true);
            clone.querySelectorAll(
                '.comments-comment-box, .comments-comments-list, .comments-comment-item, ' +
                '.lkd-ai-helper-bar, .feed-shared-social-action-bar, .update-components-actor, ' +
                '.feed-shared-actor, button, footer, form, script, style'
            ).forEach(e => e.remove());
            const rawText = sanitisePostText(clone.innerText || clone.textContent || '');
            if (rawText.length >= 10) return rawText.slice(0, 1000);
        } catch (_e) { /* ignore */ }

        const headline = extractAuthorHeadline(container);
        return headline ? `Post by ${headline}` : 'LinkedIn post updates and professional discussion.';
    }

    /**
     * Safely insert text into contenteditable or textarea
     */
    function insertTextIntoField(field, text) {
        if (!field) return;
        field.focus();

        try {
            if (field.isContentEditable) {
                const success = document.execCommand('insertText', false, text);
                if (!success || !field.innerText.trim()) {
                    field.innerHTML = `<p>${text}</p>`;
                }
            } else {
                field.value = text;
            }
        } catch (_e) {
            if (field.isContentEditable) {
                field.innerHTML = `<p>${text}</p>`;
            } else {
                field.value = text;
            }
        }

        field.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        field.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }

    /**
     * Search up parent tree for any existing helper bar
     */
    function findExistingBarNear(field) {
        let curr = field;
        for (let i = 0; i < 8; i++) {
            if (!curr || curr === document.body) break;
            const bars = curr.querySelectorAll('.lkd-ai-helper-bar');
            if (bars.length > 0) {
                for (let j = 1; j < bars.length; j++) {
                    bars[j].remove();
                }
                return bars[0];
            }
            curr = curr.parentElement;
        }
        return null;
    }

    /**
     * Inject inline AI Helper Bar inside focused comment box
     */
    function attachHelperBar(field) {
        if (!field || !isExtensionValid()) return;

        const existingBar = findExistingBarNear(field);
        if (existingBar) return;

        const textEditor = field.closest(
            '.comments-comment-texteditor, ' +
            '.comments-comment-box__text-editor, ' +
            '.editor-container, ' +
            '.ql-container'
        ) || field;

        const outerBox = field.closest(
            '.comments-comment-box, ' +
            '.comments-comment-box__form, ' +
            '.comments-comment-box__form-container, ' +
            '[data-view-name="comments-comment-box"], ' +
            'form'
        );

        const isDark = isLinkedInDarkMode();
        const barBg = isDark ? '#161e31' : '#f3f6f8';
        const barBorder = isDark ? '#263353' : '#d8dee4';
        const selectBg = isDark ? '#192038' : '#ffffff';
        const selectColor = isDark ? '#c5cfe8' : '#1f2328';
        const selectBorder = isDark ? '#2a3758' : '#d0d7de';
        const statusColor = isDark ? '#8f9ab5' : '#57606a';

        const helperBar = document.createElement('div');
        helperBar.className = 'lkd-ai-helper-bar';
        helperBar.style.cssText = `
            display: flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            gap: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin: 6px 0 !important;
            padding: 5px 10px !important;
            background: ${barBg} !important;
            border: 1px solid ${barBorder} !important;
            border-radius: 8px !important;
            font-size: 11px !important;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: ${selectColor} !important;
            z-index: 1000 !important;
            white-space: nowrap !important;
        `;

        const sparkIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:-1px; margin-right:4px;"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"></path></svg>';

        helperBar.innerHTML = `
            <button class="lkd-ai-gen-btn" type="button" style="
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 12px !important;
                height: 28px !important;
                min-height: 28px !important;
                max-height: 28px !important;
                background: #0a66c2 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                line-height: 28px !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                cursor: pointer !important;
                box-sizing: border-box !important;
                transition: background 0.15s ease, opacity 0.15s ease !important;
            ">
                ${sparkIconSvg}AI Comment
            </button>
            <select class="lkd-ai-tone-select" style="
                display: inline-block !important;
                height: 28px !important;
                min-height: 28px !important;
                max-height: 28px !important;
                padding: 0 8px !important;
                background-color: ${selectBg} !important;
                background: ${selectBg} !important;
                color: ${selectColor} !important;
                border: 1px solid ${selectBorder} !important;
                border-radius: 6px !important;
                font-size: 11px !important;
                line-height: 28px !important;
                cursor: pointer !important;
                outline: none !important;
                box-sizing: border-box !important;
                flex-shrink: 0 !important;
                width: auto !important;
                max-width: 170px !important;
                -webkit-appearance: menulist !important;
                appearance: menulist !important;
            ">
            </select>
            <span class="lkd-ai-status" style="
                font-size: 11px !important;
                color: ${statusColor} !important;
                margin-left: auto !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
            "></span>
        `;

        try {
            if (textEditor && typeof textEditor.before === 'function') {
                textEditor.before(helperBar);
            } else if (textEditor && textEditor.parentElement) {
                textEditor.parentElement.insertBefore(helperBar, textEditor);
            } else if (outerBox && outerBox.firstChild) {
                outerBox.insertBefore(helperBar, outerBox.firstChild);
            } else if (field && field.parentElement) {
                field.parentElement.insertBefore(helperBar, field);
            }
        } catch (_err) {
            try {
                if (field && field.parentElement) {
                    field.parentElement.insertBefore(helperBar, field);
                }
            } catch (_) { /* ignore */ }
        }

        const genBtn = helperBar.querySelector('.lkd-ai-gen-btn');
        const toneSelect = helperBar.querySelector('.lkd-ai-tone-select');
        const statusSpan = helperBar.querySelector('.lkd-ai-status');

        populateToneSelect(toneSelect, selectBg, selectColor);

        genBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isExtensionValid()) {
                if (statusSpan) {
                    statusSpan.textContent = 'Extension reloaded. Please refresh page.';
                    statusSpan.style.color = '#f85149';
                }
                return;
            }

            let postContainer = findPostContainer(field);

            // If walk failed (returned body), try a page-level search for the post container
            if (!postContainer || postContainer === document.body) {
                postContainer =
                    document.querySelector('[data-view-name="feed-full-update"]') ||
                    document.querySelector('.fie-impression-container') ||
                    document.querySelector('.profile-creator-shared-feed-update__container') ||
                    document.querySelector('.profile-creator-shared-feed-update') ||
                    document.querySelector('.feed-shared-update-v2') ||
                    document.querySelector('.artdeco-card') ||
                    document.querySelector('[data-urn]') ||
                    document.querySelector('article') ||
                    document.body;
            }

            const postText = extractPostText(postContainer);
            const replyToComment = extractReplyTargetCommentText(field);
            const authorHeadline = extractAuthorHeadline(postContainer);

            genBtn.disabled = true;
            genBtn.style.opacity = '0.7';
            genBtn.innerHTML = 'Generating...';
            statusSpan.textContent = '';

            try {
                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: 'generateComment',
                        postText,
                        replyToComment,
                        authorHeadline,
                        tone: toneSelect.value
                    }, (res) => {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            resolve({ success: false, error: chrome.runtime.lastError.message });
                        } else {
                            resolve(res);
                        }
                    });
                });

                if (response && response.success && response.text) {
                    insertTextIntoField(field, response.text);
                    statusSpan.textContent = 'AI inserted!';
                    statusSpan.style.color = '#3fb950';
                } else {
                    const err = response?.error || 'Generation failed.';
                    statusSpan.textContent = `Error: ${err}`;
                    statusSpan.style.color = '#f85149';
                }
            } catch (_err) {
                statusSpan.textContent = 'Failed to connect to extension.';
                statusSpan.style.color = '#f85149';
            } finally {
                genBtn.disabled = false;
                genBtn.style.opacity = '1';
                genBtn.innerHTML = `${sparkIconSvg}AI Comment`;
            }
        });

        // Professional hover effect
        genBtn.addEventListener('mouseenter', () => {
            if (!genBtn.disabled) genBtn.style.background = '#004182';
        });
        genBtn.addEventListener('mouseleave', () => {
            if (!genBtn.disabled) genBtn.style.background = '#0a66c2';
        });
    }

    /**
     * Scan page and attach helper bar to all visible comment inputs.
     */
    function scanAndAttachAllCommentBoxes() {
        if (!isExtensionValid()) return;

        const fields = document.querySelectorAll(
            '.comments-comment-box [contenteditable="true"], ' +
            '.comments-comment-texteditor [contenteditable="true"], ' +
            '.comments-comment-box__form [contenteditable="true"], ' +
            '.comments-comment-box textarea, ' +
            '.comments-comment-texteditor textarea, ' +
            '.ql-editor[contenteditable="true"], ' +
            'div[role="textbox"][contenteditable="true"]'
        );
        fields.forEach((f) => attachHelperBar(f));
    }

    // Debounced scan scheduler to prevent freezing or loops
    let scanTimeout = null;
    function scheduleScan() {
        if (!isExtensionValid()) {
            cleanup();
            return;
        }
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
            if (!isExtensionValid()) {
                cleanup();
                return;
            }
            scanAndAttachAllCommentBoxes();
        }, 150);
    }

    /**
     * Event delegation for comment input focus/click
     */
    document.addEventListener('focusin', (e) => {
        if (!isExtensionValid()) return;
        const target = e.target;
        if (!target) return;

        if (target.isContentEditable ||
            target.tagName === 'TEXTAREA' ||
            target.classList?.contains('ql-editor') ||
            target.closest?.('.comments-comment-box, .comments-comment-texteditor, .editor-container, .comments-comment-box__form, form')) {
            const field = target.isContentEditable || target.tagName === 'TEXTAREA'
                ? target
                : target.querySelector?.('[contenteditable="true"], textarea') || target;
            attachHelperBar(field);
        }
    }, true);

    document.addEventListener('click', (e) => {
        if (!isExtensionValid()) return;
        const target = e.target;
        if (!target) return;

        if (target.isContentEditable ||
            target.tagName === 'TEXTAREA' ||
            target.classList?.contains('ql-editor') ||
            target.closest?.('.comments-comment-box, .comments-comment-texteditor, .editor-container, .comments-comment-box__form, form')) {
            const field = target.isContentEditable || target.tagName === 'TEXTAREA'
                ? target
                : target.querySelector?.('[contenteditable="true"], textarea') || target;
            attachHelperBar(field);
        } else if (target.closest && (
            target.closest('button.comment-button') ||
            target.closest('button[aria-label*="comment"]') ||
            target.closest('.social-actions-button') ||
            target.closest('.feed-shared-social-action-bar__action-button')
        )) {
            scheduleScan();
        }
    }, true);

    // MutationObserver to auto-inject on profile activity / SPA navigation
    let observer = null;
    function cleanup() {
        if (observer) {
            try { observer.disconnect(); } catch (_) {}
            observer = null;
        }
    }

    try {
        observer = new MutationObserver(() => {
            if (!isExtensionValid()) {
                cleanup();
                return;
            }
            scheduleScan();
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
            scheduleScan();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body && isExtensionValid()) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    scheduleScan();
                }
            });
        }
    } catch (_e) { /* ignore */ }
})();
