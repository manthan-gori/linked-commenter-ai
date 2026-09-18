'use strict';

const {
    GROQ_API_URL,
    DEFAULT_MODEL,
    DEFAULT_GEMINI_MODEL,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_ANTHROPIC_MODEL,
    OPENAI_API_URL,
    ANTHROPIC_API_URL,
    DEFAULT_TONES,
    normalizeApiKey,
    cleanAIOutput,
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
} = require('../extension/lib/groq-client.js');

describe('groq-client', () => {
    test('normalizeApiKey trims whitespace', () => {
        expect(normalizeApiKey('  gsk_12345  ')).toBe('gsk_12345');
        expect(normalizeApiKey(null)).toBe('');
        expect(normalizeApiKey(undefined)).toBe('');
    });

    test('DEFAULT_TONES contains all 18 built-in tone templates', () => {
        expect(Object.keys(DEFAULT_TONES).length).toBe(18);
        expect(DEFAULT_TONES.professional).toBeDefined();
        expect(DEFAULT_TONES['valuable-notes']).toBeDefined();
        expect(DEFAULT_TONES.encouragement).toBeDefined();
    });

    test('buildGroqPrompt formats system and user prompts correctly with default tone', () => {
        const prompts = buildGroqPrompt({
            postText: 'Building microservices with Node.js and Docker',
            category: 'technical',
            language: 'pt_BR',
            authorHeadline: 'Software Engineer at Google',
            tone: 'insightful'
        });

        expect(prompts.systemPrompt).toContain('Portuguese (Brazil)');
        expect(prompts.systemPrompt).toContain('insightful');
        expect(prompts.userPrompt).toContain('Author: Software Engineer at Google');
        expect(prompts.userPrompt).toContain('Building microservices with Node.js and Docker');
    });

    test('buildGroqPrompt uses customized tone prompt when provided', () => {
        const prompts = buildGroqPrompt({
            postText: 'AI trends in 2026',
            tone: 'professional',
            language: 'en',
            toneCustomizations: {
                professional: 'You are a Senior Principal Architect. Write an authoritative professional comment in ${language}.'
            }
        });

        expect(prompts.systemPrompt).toContain('Senior Principal Architect');
        expect(prompts.systemPrompt).toContain('authoritative professional comment in English');
    });

    test('buildGroqPrompt handles user-created custom tones', () => {
        const prompts = buildGroqPrompt({
            postText: 'Clean architecture in TypeScript',
            tone: 'custom-tone-hot-take',
            language: 'en',
            toneCustomizations: {
                'custom-tone-hot-take': 'Give an unfiltered hot take challenging common assumptions in ${language}.'
            }
        });

        expect(prompts.systemPrompt).toContain('unfiltered hot take challenging common assumptions in English');
    });

    test('generateGroqComment returns error if missing API key', async () => {
        const res = await generateGroqComment({ postText: 'Hello' });
        expect(res.success).toBe(false);
        expect(res.error).toBe('missing-api-key');
    });

    test('generateGroqComment returns error if missing post text', async () => {
        const res = await generateGroqComment({ apiKey: 'gsk_123' });
        expect(res.success).toBe(false);
        expect(res.error).toBe('missing-post-text');
    });

    test('generateGroqComment handles successful API call', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Great insights on system architecture!' } }
                ]
            })
        });

        const res = await generateGroqComment({
            apiKey: 'gsk_test123',
            postText: 'Clean Architecture in 2026',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Great insights on system architecture!');
        expect(mockFetch).toHaveBeenCalledWith(
            GROQ_API_URL,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer gsk_test123'
                })
            })
        );
    });

    test('generateGroqComment handles HTTP errors', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'Invalid API key'
        });

        const res = await generateGroqComment({
            apiKey: 'gsk_invalid',
            postText: 'Test post',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(false);
        expect(res.error).toBe('Invalid API key');
    });

    test('buildGroqPrompt incorporates customPrompt when provided', () => {
        const prompts = buildGroqPrompt({
            postText: 'Building microservices with Node.js and Docker',
            language: 'en',
            customPrompt: 'I am a Lead DevOps Engineer. Write concise comments focusing on Kubernetes and CI/CD.'
        });

        expect(prompts.systemPrompt).toContain('You are a personalized LinkedIn commenting assistant.');
        expect(prompts.systemPrompt).toContain('I am a Lead DevOps Engineer. Write concise comments focusing on Kubernetes and CI/CD.');
        expect(prompts.systemPrompt).toContain('Strictly follow these custom persona guidelines');
        expect(prompts.userPrompt).toContain('Building microservices with Node.js and Docker');
    });

    test('generateGroqComment passes customPrompt and strips think tags and em-dashes', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: '<think>Reasoning here</think>Focus on automated pipelines — it saves developer time!' } }
                ]
            })
        });

        const res = await generateGroqComment({
            apiKey: 'gsk_test123',
            postText: 'CI/CD Best Practices',
            customPrompt: 'Focus on automation',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).not.toContain('<think>');
        expect(res.text).not.toContain('—');
        expect(res.text).toBe('Focus on automated pipelines, it saves developer time!');
    });

    test('cleanAIOutput removes thinking blocks, quotes, and em-dashes', () => {
        const raw = '<think>internal thoughts</think> "AI is evolving — we must adapt!"';
        const cleaned = cleanAIOutput(raw);
        expect(cleaned).toBe('AI is evolving, we must adapt!');
    });

    test('generateGeminiComment formats Google AI payload and returns clean response', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    { content: { parts: [{ text: 'Exciting advancements in Gemini 3.7 Flash!' }] } }
                ]
            })
        });

        const res = await generateGeminiComment({
            apiKey: 'AIzaSy_test123',
            model: 'gemini-3.7-flash',
            postText: 'Next-gen Gemini features',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Exciting advancements in Gemini 3.7 Flash!');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=AIzaSy_test123'),
            expect.objectContaining({
                method: 'POST'
            })
        );
    });

    test('generateAIComment routes to active provider correctly', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    { content: { parts: [{ text: 'Routed to Gemini successfully.' }] } }
                ]
            })
        });

        const res = await generateAIComment({
            provider: 'gemini',
            apiKey: 'AIzaSy_test123',
            model: 'gemini-3.7-flash',
            postText: 'Routing test',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Routed to Gemini successfully.');
    });

    test('testAIConnection validates connection across providers', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Connection successful' } }
                ]
            })
        });

        const res = await testAIConnection({ provider: 'groq', apiKey: 'gsk_valid', fetchFn: mockFetch });
        expect(res.success).toBe(true);
    });

    test('generateOpenAIComment formats OpenAI payload and returns clean response', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Great insights on distributed systems architecture!' } }
                ]
            })
        });

        const res = await generateOpenAIComment({
            apiKey: 'sk-test123456',
            model: 'gpt-4o-mini',
            postText: 'Distributed Systems in 2026',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Great insights on distributed systems architecture!');
        expect(mockFetch).toHaveBeenCalledWith(
            OPENAI_API_URL,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer sk-test123456'
                })
            })
        );
    });

    test('generateAIComment routes to OpenAI provider correctly', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Routed to OpenAI successfully.' } }
                ]
            })
        });

        const res = await generateAIComment({
            provider: 'openai',
            apiKey: 'sk-test123',
            model: 'gpt-4o-mini',
            postText: 'Routing test',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Routed to OpenAI successfully.');
    });

    test('testOpenAIConnection validates OpenAI API key', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Connection successful' } }
                ]
            })
        });

        const res = await testOpenAIConnection('sk-test123', 'gpt-4o-mini', mockFetch);
        expect(res.success).toBe(true);
    });

    test('testGroqConnection validates API key', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Connection successful' } }
                ]
            })
        });

        const res = await testGroqConnection('gsk_valid', mockFetch);
        expect(res.success).toBe(true);
    });

    test('generateAnthropicComment returns error if missing API key', async () => {
        const res = await generateAnthropicComment({ postText: 'Hello' });
        expect(res.success).toBe(false);
        expect(res.error).toBe('missing-api-key');
    });

    test('generateAnthropicComment handles successful Anthropic Messages API call', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: 'Great points on scaling large language models!' }
                ]
            })
        });

        const res = await generateAnthropicComment({
            apiKey: 'sk-ant-api03-testkey',
            model: 'claude-3-7-sonnet-20250219',
            postText: 'Scaling LLMs in 2026',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Great points on scaling large language models!');
        expect(mockFetch).toHaveBeenCalledWith(
            ANTHROPIC_API_URL,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'x-api-key': 'sk-ant-api03-testkey',
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                })
            })
        );
    });

    test('generateAIComment routes to Anthropic provider correctly', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: 'Routed to Anthropic successfully.' }
                ]
            })
        });

        const res = await generateAIComment({
            provider: 'anthropic',
            apiKey: 'sk-ant-api03-testkey',
            model: 'claude-3-7-sonnet-20250219',
            postText: 'Routing test',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
        expect(res.text).toBe('Routed to Anthropic successfully.');
    });

    test('testAnthropicConnection validates Anthropic API key', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: 'Connection successful' }
                ]
            })
        });

        const res = await testAnthropicConnection('sk-ant-api03-testkey', 'claude-3-7-sonnet-20250219', mockFetch);
        expect(res.success).toBe(true);
    });

    test('testAIConnection routes to Anthropic provider correctly', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: 'Connection successful' }
                ]
            })
        });

        const res = await testAIConnection({
            provider: 'anthropic',
            apiKey: 'sk-ant-api03-testkey',
            model: 'claude-3-7-sonnet-20250219',
            fetchFn: mockFetch
        });

        expect(res.success).toBe(true);
    });
});
