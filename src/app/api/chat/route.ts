import { GoogleGenerativeAI } from '@google/generative-ai';
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const { prompt, mood, documentContext, activeDocumentName, imageBase64 } = await req.json();

    const systemInstruction = `
You are SOWAL, an elite AI study companion and viva examiner built for Ujjwal Jhajharia.
Focus domains: Soil Science, Soil Colloids & CEC, Agronomy, Fertilizers, Weed Management, Plant Nutrition.
Tone: Sharp, professional yet deeply supportive and grounded. Mix English and natural conversational Hindi.
For viva mode: Ask strictly 1 concise, conceptual question at a time. Evaluate student answers directly with precision.
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    let result;

    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };
      const textPrompt = `Evaluate this handwritten note or diagram. Extract key definitions and ask 1 sharp conceptual viva question:\n\n${prompt || 'Scan and test me'}`;
      result = await model.generateContent([textPrompt, imagePart]);
    } else {
      const fullPrompt = `
[Context: ${activeDocumentName || 'General Soil Science & Agronomy'}]
[Document Snippet: ${documentContext || 'None'}]
[Mode: ${mood || 'focused'}]

User Query: ${prompt}
`;
      result = await model.generateContent(fullPrompt);
    }

    const response = await result.response;
    const reply = response.text() || "Main sun raha hoon Ujjwal, concept clear hai?";

    return NextResponse.json({
      display: reply,
      speech: reply,
      engineUsed: 'gemini-1.5-flash',
      retentionBoost: typeof prompt === 'string' && (prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('exam')),
    });

  } catch (error: any) {
    console.error("Critical Generation Error:", error?.message || error);
    
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      return NextResponse.json(
        { 
          display: "Google AI Studio Daily Quota Reached! Kuch der baad try karein ya fresh API key lagayein.", 
          speech: "Quota reach ho gaya hai." 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        display: `Error: ${error?.message || "Generation error"}. Check console logs.`, 
        speech: "Request complete nahi ho payi." 
      },
      { status: 500 }
    );
  }
}