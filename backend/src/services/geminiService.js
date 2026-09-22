
import { GoogleGenAI } from "@google/genai";

export const generateAIResponse = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({
        apiKey,
    });

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    return response.text;
};
