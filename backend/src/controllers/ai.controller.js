import { generateAIResponse } from "../services/geminiService.js";
import { getAIContext } from "../services/aiContextService.js";

const buildAIPrompt = (message, context) => `
You are an inventory assistant. Answer the user's question using only the supplied database context.

Rules:
- Treat the supplied database context as the source of warehouse facts.
- Do not invent database information, products, stock quantities, or warehouses.
- If required data is unavailable, say so clearly.
- Clearly distinguish database facts from calculated values.
- Clearly distinguish database facts from ML-generated predictions, risk assessments, and restock recommendations.
- Stock movement types are the database values IN and OUT; do not invent other movement types.
- Do not invent predictions, confidence values, recommendations, or risk levels.
- If ML information is unavailable, say so rather than guessing.
- Do not expose secrets, credentials, API keys, or internal connection details.

User question:
${message}

Database context:
${JSON.stringify(context, null, 2)}
`;

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                message: "message is required",
            });
        }

        const trimmedMessage = message.trim();
        const context = await getAIContext(trimmedMessage);

        if (context.status === "not_found") {
            return res.json({
                response: `Product not found: ${context.query}`,
            });
        }

        if (context.status === "ambiguous") {
            return res.json({
                response: `Multiple products match "${context.query}". Please identify the product by ID or SKU.`,
            });
        }

        const response = await generateAIResponse(buildAIPrompt(trimmedMessage, context));

        return res.json({
            response,
        });
    } catch (error) {
        console.error("AI chat error:", error);

        return res.status(500).json({
            message: "Failed to generate AI response",
        });
    }
};