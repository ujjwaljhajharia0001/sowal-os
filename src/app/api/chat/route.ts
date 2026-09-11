import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const systemInstruction = `
You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet deeply supportive, grounded. Mix English and conversational Hindi/Hinglish naturally.
For viva mode: Ask strictly 1 concise, conceptual question at a time. Evaluate answers directly with precision.
`;

    let contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: `Evaluate this handwritten note or diagram. Extract key definitions and ask a sharp viva question from it:\n\n${prompt || 'Scan and start viva'}`,
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Main sun raha hoon Ujjwal, concept clear hai?";

    return NextResponse.json({
      display: reply,
      speech: reply,
      retentionBoost: prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam'),
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { display: "Kuch issue aaya network me Ujjwal, ek baar verify karo!", speech: "Network drop hua hai." },
      { status: 500 }
    );
  }
}