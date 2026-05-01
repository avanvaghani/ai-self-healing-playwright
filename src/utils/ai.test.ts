import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

vi.mock('dotenv', () => ({ config: vi.fn() }));

const buildResponse = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

describe('healSelector', () => {
  beforeEach(() => {
    vi.resetModules();
    generateContentMock.mockReset();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  test('returns selector string when Gemini responds with one', async () => {
    generateContentMock.mockResolvedValueOnce(buildResponse('  input[name="user"]  '));

    const { healSelector } = await import('./ai.js');
    const result = await healSelector('#old', '<html></html>', 'fill the username input');

    expect(result).toBe('input[name="user"]');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  test('returns null when Gemini responds with NOT_FOUND', async () => {
    generateContentMock.mockResolvedValueOnce(buildResponse('NOT_FOUND'));

    const { healSelector } = await import('./ai.js');
    const result = await healSelector('#old', '<html></html>', 'click submit');

    expect(result).toBeNull();
  });

  test('returns null when Gemini call rejects', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('network down'));

    const { healSelector } = await import('./ai.js');
    const result = await healSelector('#old', '<html></html>', 'click submit');

    expect(result).toBeNull();
  });

  test('passes the failing selector and goal into the prompt', async () => {
    generateContentMock.mockResolvedValueOnce(buildResponse('button.login'));

    const { healSelector } = await import('./ai.js');
    await healSelector('#login-xyz', '<html><body></body></html>', 'click the login button');

    const sentPrompt = generateContentMock.mock.calls[0][0].contents[0].parts[0].text;
    expect(sentPrompt).toContain('#login-xyz');
    expect(sentPrompt).toContain('click the login button');
  });
});

describe('analyzeVisualDiff', () => {
  beforeEach(() => {
    vi.resetModules();
    generateContentMock.mockReset();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  test('parses a clean JSON response', async () => {
    generateContentMock.mockResolvedValueOnce(
      buildResponse('{"isRegression": false, "explanation": "no meaningful change"}'),
    );

    const { analyzeVisualDiff } = await import('./ai.js');
    const result = await analyzeVisualDiff('base64a', 'base64b');

    expect(result).toEqual({ isRegression: false, explanation: 'no meaningful change' });
  });

  test('parses a fenced JSON response (```json ... ```)', async () => {
    generateContentMock.mockResolvedValueOnce(
      buildResponse('```json\n{"isRegression": true, "explanation": "button missing"}\n```'),
    );

    const { analyzeVisualDiff } = await import('./ai.js');
    const result = await analyzeVisualDiff('base64a', 'base64b');

    expect(result).toEqual({ isRegression: true, explanation: 'button missing' });
  });

  test('falls back to a regression-on-error result when API throws', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('boom'));

    const { analyzeVisualDiff } = await import('./ai.js');
    const result = await analyzeVisualDiff('a', 'b');

    expect(result.isRegression).toBe(true);
    expect(result.explanation).toMatch(/AI analysis failed/i);
  });

  test('falls back to a regression-on-error result when JSON is malformed', async () => {
    generateContentMock.mockResolvedValueOnce(buildResponse('not really json'));

    const { analyzeVisualDiff } = await import('./ai.js');
    const result = await analyzeVisualDiff('a', 'b');

    expect(result.isRegression).toBe(true);
    expect(result.explanation).toMatch(/AI analysis failed/i);
  });

  test('sends both screenshots as inline image data', async () => {
    generateContentMock.mockResolvedValueOnce(
      buildResponse('{"isRegression": false, "explanation": "ok"}'),
    );

    const { analyzeVisualDiff } = await import('./ai.js');
    await analyzeVisualDiff('BASELINE_B64', 'CURRENT_B64');

    const parts = generateContentMock.mock.calls[0][0].contents[0].parts;
    const imageParts = parts.filter((p: { inlineData?: { data: string } }) => p.inlineData);
    expect(imageParts).toHaveLength(2);
    expect(imageParts[0].inlineData.data).toBe('BASELINE_B64');
    expect(imageParts[1].inlineData.data).toBe('CURRENT_B64');
  });
});
