import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are SOWAL, an elite AI study companion and sharp viva examiner for Ujjwal Jhajharia.
Focus: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Plant Nutrition.

RULES:
1. NEVER use markdown tables (|---|) or raw LaTeX syntax ($\text{...}$). Use clean bullet points and bold text.
2. Provide crisp, clean text output that looks professional on an OS interface.`;

export async function POST(req: Request) {
  try {
    const { prompt, mood, documentContext, activeDocumentName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { display: "API key missing in Vercel environment variables.", speech: "API key missing hai." },
        { status: 500 }
      );
    }

    const fullPrompt = `[Context: ${activeDocumentName || 'Soil Science'}] [Mode: ${mood || 'viva'}] \n User: ${prompt}`;

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    ];

    let reply = "";
    let usedEngine = "Gemini 3.6 Flash";

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.7 }
          })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          reply = text;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!reply) {
      return NextResponse.json(
        { display: "AI Engine currently busy. Please try again.", speech: "Engine busy hai." },
        { status: 500 }
      );
    }

    // Clean speech generator (removes symbols and keeps it short)
    const cleanSpeech = reply
      .replace(/[*#_`$|~[\]()-]/g, "")
      .split(". ")[0] || "Concept clear hai Ujjwal?";

    return NextResponse.json({
      display: reply,
      speech: cleanSpeech,
      engineUsed: usedEngine
    });

  } catch (error: any) {
    return NextResponse.json(
      { display: "Internal Server Error", speech: "Server error aaya hai." },
      { status: 500 }
    );
  }
}