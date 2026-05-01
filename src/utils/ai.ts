import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

let client: any = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }
  return client;
}

/**
 * Uses Gemini to infer a new selector based on a broken selector and the current DOM state.
 */
export async function healSelector(
  oldSelector: string,
  domSnippet: string,
  goal: string,
): Promise<string | null> {
  const prompt = `
    You are an expert Test Automation Engineer specialized in Playwright and CSS selectors.
    A test failed because a selector no longer works.
    
    Old Selector: "${oldSelector}"
    Goal of the action: "${goal}"
    
    Current DOM Snippet:
    \`\`\`html
    ${domSnippet}
    \`\`\`
    
    Analyze the DOM snippet and find the most robust CSS or XPath selector for the element that fulfills the goal.
    Return ONLY the raw selector string. No markdown, no explanations.
    If you cannot find a suitable element, return "NOT_FOUND".
  `;

  try {
    const result = await getClient().models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.candidates[0].content.parts[0].text.trim();
    return text === 'NOT_FOUND' ? null : text;
  } catch (error) {
    console.error('AI Healing Error:', error);
    return null;
  }
}

/**
 * Uses Gemini Vision to perform semantic visual regression analysis.
 */
export async function analyzeVisualDiff(
  baselineBase64: string,
  currentBase64: string,
): Promise<{ isRegression: boolean; explanation: string }> {
  const prompt = `
    Compare these two screenshots of a web application.
    The first is the "Baseline" and the second is the "Current" state.
    
    Ignore minor pixel differences, anti-aliasing, or dynamic content like timestamps if they don't affect the user experience or functionality.
    Identify if there is a MEANINGFUL regression (e.g., broken layout, missing button, wrong color contrast, overlapping text).
    
    Return your response in JSON format:
    {
      "isRegression": boolean,
      "explanation": "Brief description of what changed and why it is or isn't a regression"
    }
  `;

  try {
    const result = await getClient().models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: baselineBase64, mimeType: 'image/png' } },
            { inlineData: { data: currentBase64, mimeType: 'image/png' } },
          ],
        },
      ],
    });

    const text = result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Visual Analysis Error:', error);
    return { isRegression: true, explanation: 'AI analysis failed, defaulting to regression.' };
  }
}
