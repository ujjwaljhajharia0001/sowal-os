import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          display: "API Key missing! Vercel Settings -> Environment Variables me GEMINI_API_KEY set karo.", 
          speech: "API Key missing hai." 
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const systemInstruction = `
You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet deeply supportive and grounded. Mix English and natural Hindi.
For viva mode: Ask strictly 1 direct, conceptual question at a time. Evaluate student answers with pinpoint clarity.
`;

    let contents: any[] = [];

    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      contents = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        },
        {
          text: `Evaluate this handwritten note or diagram. Extract key definitions and ask 1 sharp conceptual viva question:\n\n${prompt || 'Scan and test me'}`,
        },
      ];
    } else {
      const fullPrompt = `
[Context: ${activeDocumentName || 'General Soil Science & Agronomy'}]
[Document Snippet: ${documentContext || 'None'}]
[Mode: ${mood || 'focused'}]

User Query: ${prompt}
`;
      contents = [fullPrompt];
    }

    // Engine Priority: 1. Primary Engine -> 2. Secondary Engine (Fallback)
    const PRIMARY_MODEL = 'gemini-2.5-flash';
    const SECONDARY_MODEL = 'gemini-1.5-flash';

    let response: any = null;
    let usedModel = PRIMARY_MODEL;

    try {
      // Step 1: Try Primary Model first
      response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (primaryError: any) {
      console.warn(`[Failover] Primary model (${PRIMARY_MODEL}) failed. Switching to Secondary (${SECONDARY_MODEL}). Reason:`, primaryError?.message || primaryError);
      
      // Step 2: Fallback to Secondary Model automatically
      usedModel = SECONDARY_MODEL;
      response = await ai.models.generateContent({
        model: SECONDARY_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }

    const reply = response?.text || "Main sun raha hoon Ujjwal, concept clear hai?";

    return NextResponse.json({
      display: reply,
      speech: reply,
      engineUsed: usedModel,
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam')),
    });

  } catch (error: any) {
    console.error("Critical API Failover Error:", error?.message || error);
    
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      return NextResponse.json(
        { 
          display: "Google AI Studio Daily Quota Reached! AI Studio me ek nayi API Key generate karke Vercel environment variables me update karein.", 
          speech: "Quota reach ho gaya hai." 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        display: `Error: ${error?.message || "Server issue"}. Vercel Environment Variables verify karein.`, 
        speech: "Request complete nahi ho payi." 
      },
      { status: 500 }
    );
  }
}