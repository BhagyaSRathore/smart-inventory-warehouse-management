import { GoogleGenAI } from "@google/genai";

const CANDIDATE_MODELS = [
  "gemma-4-26b-a4b-it",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

export const generateAIResponse = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[geminiService] Model ${model} failed:`, err?.status || err?.message || err);
      // Try next model
    }
  }

  // If all external AI models are temporarily unavailable/overloaded, throw or handle
  console.error("[geminiService] All candidate AI models failed:", lastError);
  throw lastError || new Error("All AI models currently unavailable");
};
