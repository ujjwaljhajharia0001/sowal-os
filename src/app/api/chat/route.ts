import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are SOWAL, an elite AI study companion and sharp viva examiner for Ujjwal Jhajharia.
Subject: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Plant Nutrition.

STRICT FORMATTING RULES:
1. DO NOT use LaTeX syntax (NEVER write $\\text{...}$, $\\mathrm{...}$, or $$). Always write standard plain chemical formulas: Al3+, H+, CaCO3, KCl.
2. DO NOT use raw markdown tables with pipes (|---|) because they break the UI. Use clean bold headings and bullet points.
3. Keep the text crisp, structured, and easy to read on screen.

OUTPUT FORMAT (MANDATORY JSON):
You must return your output strictly in valid JSON format:
{
  "display": "Your cleanly formatted response with bullets and bold text (no markdown tables, no LaTeX)",
  "speech": "Short, natural, conversational 1 or 2 spoken sentences in Hinglish. Do NOT read formulas, tables, or long paragraphs out loud. Talk like a real viva mentor directly to Ujjwal."
}
`;

async function callGemini(fullPrompt: string, apiKey: string, imageBase64?: string): Promise<{ display: string; speech: string } | null> {
  const parts: any[] = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: cleanBase64 }
    });
    parts.push({ text: `Analyze this image note: ${fullPrompt}` });
  } else {
    parts.push({ text: fullPrompt });
  }

  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      });
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          return {
            display: parsed.display || rawText,
            speech: parsed.speech || "Concept clear hai Ujjwal? Agla point discuss karein?"
          };
        } catch {
          return {
            display: rawText,
            speech: "Dekho Ujjwal, concept screen par explain kar diya hai. Ek baar verify kar lo."
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const fullPrompt = `
[Topic: ${activeDocumentName || 'Soil Science'}]
[Notes Snippet: ${documentContext || 'None'}]
[Mode: ${mood || 'focused'}]

User Question: ${prompt}
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { display: "API key configure nahi hai.", speech: "API key configure nahi hai." },
        { status: 500 }
      );
    }

    const result = await callGemini(fullPrompt, apiKey, imageBase64);

    if (!result) {
      return NextResponse.json(
        { display: "Engine abhi busy hai. Kripya kuch second baad try karein.", speech: "Engine abhi busy hai." },
        { status: 500 }
      );
    }

    // Extra cleanup to remove any lingering symbols from speech
    const cleanSpeech = result.speech
      .replace(/[*#_`$|]/g, '')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .trim();

    return NextResponse.json({
      display: result.display,
      speech: cleanSpeech,
      engineUsed: 'Gemini 3.6 Flash',
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam'))
    });

  } catch (error: any) {
    console.error("Router Crash:", error);
    return NextResponse.json(
      { display: "System encounter error.", speech: "System error aaya." },
      { status: 500 }
    );
  }
}