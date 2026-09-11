import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet deeply supportive and grounded. Mix English and conversational Hindi naturally.
For viva mode: Ask strictly 1 concise, conceptual question at a time. Evaluate student answers directly with precision.`;

// 1. Google Gemini Active Caller
async function callGemini(fullPrompt: string, apiKey: string, imageBase64?: string): Promise<string | null> {
  const parts: any[] = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: cleanBase64 }
    });
    parts.push({ text: `Analyze this image note/diagram: ${fullPrompt}` });
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
          generationConfig: { temperature: 0.7 }
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}

// 2. OpenRouter Unified Backup (DeepSeek, ChatGPT, Llama)
async function callOpenRouter(fullPrompt: string, apiKey: string): Promise<{ text: string; model: string } | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sowal-os.vercel.app',
        'X-Title': 'SOWAL OS'
      },
      body: JSON.stringify({
        models: [
          'deepseek/deepseek-chat',
          'openai/gpt-4o-mini',
          'meta-llama/llama-3.1-8b-instruct:free'
        ],
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    const model = data.model || 'OpenRouter Backup';
    if (text) return { text, model };
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const fullPrompt = `
[Context: ${activeDocumentName || 'Soil Science & Agronomy'}]
[Document Snippet: ${documentContext || 'None'}]
[Mode: ${mood || 'focused'}]

User Query: ${prompt}
`;

    let reply: string | null = null;
    let engineUsed = 'Gemini Active';

    // Primary attempt: Google Gemini
    if (process.env.GEMINI_API_KEY) {
      reply = await callGemini(fullPrompt, process.env.GEMINI_API_KEY, imageBase64);
    }

    // Failover attempt: OpenRouter
    if (!reply && process.env.OPENROUTER_API_KEY && !imageBase64) {
      const fallbackResult = await callOpenRouter(fullPrompt, process.env.OPENROUTER_API_KEY);
      if (fallbackResult) {
        reply = fallbackResult.text;
        engineUsed = fallbackResult.model;
      }
    }

    if (!reply) {
      return NextResponse.json(
        { 
          display: "AI Engine Quota hit ya endpoints busy hain. Thodi der baad try karein.", 
          speech: "Engine abhi busy hai." 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      display: reply,
      speech: reply,
      engineUsed,
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam'))
    });

  } catch (error: any) {
    console.error("Router Crash:", error);
    return NextResponse.json(
      { display: `Engine Error: ${error?.message || "Internal failure"}`, speech: "Server error" },
      { status: 500 }
    );
  }
}