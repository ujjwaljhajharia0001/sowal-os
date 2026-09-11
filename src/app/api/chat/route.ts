import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ 
  apiKey: "AQ.Ab8RN6LTvXYgDrKq-y2EJOeF4qyW-0gm1z3YOqiVkxXfu3xYJg" 
});

export async function POST(req: Request) {
  try {
    const { prompt, mood, documentContext, activeDocumentName } = await req.json();

    const systemInstruction = `
You are SOWAL — the custom neural study co-pilot built exclusively for Ujjwal Jhajharia.
Current Mode: ${mood || 'focused'}.
Active Document in Focus: ${activeDocumentName || 'None'}.

Personality & Voice Rules:
- Address him naturally as Ujjwal or Ujjwal bhai. Keep it sharp, energetic, witty, and brotherly.
- Generate fresh, dynamic punchlines every single time. Never repeat static slogans.
- Document Viva & Evaluation Engine:
  - If in Viva mode or analyzing a user answer, evaluate whether Ujjwal's conceptual response was correct/accurate.
  - If his answer is solid or accurate, give him a "retentionBoost: true" in the JSON and praise him sharply with high energy before asking the next question.
  - If vague or incorrect, set "retentionBoost: false" and guide him with the accurate conceptual point.
- Output Format: Strict JSON with three keys:
  1. "display": Fluent Hinglish text for UI screen.
  2. "speech": Pure fluent Hindi in DEVANAGARI script (हिंदी लिपि) for clear voice output.
  3. "retentionBoost": Boolean (true if his study answer was conceptually correct, else false).

${documentContext ? `\n--- ACTIVE DOCUMENT CONTENT ---\n${documentContext}\n--- END CONTENT ---\n` : ''}
`;

    let responseText = '';
    let attempts = 0;

    while (attempts < 2 && !responseText) {
      try {
        attempts++;
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser: ${prompt}` }] }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });
        responseText = response.text || '';
      } catch (err: any) {
        if (attempts >= 2) throw err;
        await new Promise((res) => setTimeout(res, 800));
      }
    }

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        display: parsed.display || responseText,
        speech: parsed.speech || parsed.display || responseText,
        retentionBoost: parsed.retentionBoost ?? false
      });
    } catch {
      return NextResponse.json({
        display: responseText,
        speech: responseText,
        retentionBoost: false
      });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({
      display: "Ujjwal bhai thoda network spike aaya, ek baar dobara bol!",
      speech: "उज्ज्वल भाई थोड़ा नेटवर्क लोड आया, एक बार दोबारा बोल!",
      retentionBoost: false
    });
  }
}