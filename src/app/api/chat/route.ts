import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { display: "API Key missing! Vercel Settings me GEMINI_API_KEY check karein.", speech: "API Key missing hai." },
        { status: 500 }
      );
    }

    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const systemInstructionText = `You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet supportive. Mix English and conversational Hindi naturally.
For viva mode: Ask strictly 1 direct conceptual question at a time.`;

    const contents: any[] = [];
    const parts: any[] = [];

    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({
        text: `Evaluate this note or diagram and ask 1 sharp conceptual viva question:\n\n${prompt || 'Scan and test me'}`
      });
    } else {
      const fullPrompt = `[Context: ${activeDocumentName || 'Soil Science'}]\n[Document: ${documentContext || 'None'}]\n[Mood: ${mood || 'focused'}]\n\nUser: ${prompt}`;
      parts.push({ text: fullPrompt });
    }

    contents.push({ parts });

    // Official v1 endpoint for gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        contents,
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Google API Error:", data);
      return NextResponse.json(
        { display: `Google Error: ${data.error?.message || 'Quota / API issue'}`, speech: "API response me error aaya." },
        { status: res.status }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Main sun raha hoon Ujjwal, boliye!";

    return NextResponse.json({
      display: reply,
      speech: reply,
      engineUsed: 'gemini-1.5-flash',
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam'))
    });

  } catch (error: any) {
    console.error("Route Crash:", error);
    return NextResponse.json(
      { display: `Error: ${error?.message || "Server crash"}`, speech: "Server error" },
      { status: 500 }
    );
  }
}