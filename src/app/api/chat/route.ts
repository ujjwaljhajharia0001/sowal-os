import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { display: "API Key missing! Vercel Environment Variables me GEMINI_API_KEY set karein.", speech: "API key configure nahi hai." },
        { status: 500 }
      );
    }

    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const systemInstructionText = `You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet deeply supportive and grounded. Mix English and conversational Hindi naturally.
For viva mode: Ask strictly 1 concise, conceptual question at a time. Evaluate student answers directly with precision.`;

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
        text: `Evaluate this handwritten note or diagram. Extract key definitions and ask 1 sharp conceptual viva question:\n\n${prompt || 'Scan and test me'}`
      });
    } else {
      const fullPrompt = `[Context: ${activeDocumentName || 'Soil Science & Agronomy'}]\n[Document: ${documentContext || 'None'}]\n[Mood: ${mood || 'focused'}]\n\nUser: ${prompt}`;
      parts.push({ text: fullPrompt });
    }

    // Google ke recommended aur active model identifiers
    const modelsToTry = [
      'gemini-3.1-pro-preview',
      'gemini-3.6-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest'
    ];

    let reply = '';
    let successModel = '';
    let lastErrorDetails = '';

    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            generationConfig: { temperature: 0.7 }
          })
        });

        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
          successModel = modelName;
          break;
        } else {
          lastErrorDetails = data.error?.message || JSON.stringify(data);
        }
      } catch (err: any) {
        lastErrorDetails = err?.message || String(err);
      }
    }

    if (!reply) {
      return NextResponse.json(
        { display: `Google API Error: ${lastErrorDetails}`, speech: "Google API connect nahi ho payi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      display: reply,
      speech: reply,
      engineUsed: successModel,
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam'))
    });

  } catch (error: any) {
    console.error("Route Crash:", error);
    return NextResponse.json(
      { display: `Server Error: ${error?.message || "Internal failure"}`, speech: "Server error" },
      { status: 500 }
    );
  }
}