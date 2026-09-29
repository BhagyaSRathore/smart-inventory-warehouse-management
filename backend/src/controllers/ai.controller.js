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

        try {
            const response = await generateAIResponse(buildAIPrompt(trimmedMessage, context));
            return res.json({
                response,
            });
        } catch (genError) {
            console.warn("[ai.controller] LLM service unavailable, constructing database context response:", genError?.message);

            let contextualReply = "";
            if (context.product) {
                const p = context.product;
                contextualReply = `Product: ${p.name} (SKU: ${p.sku})\nCurrent Stock: ${p.currentStock ?? 0}\nReorder Point: ${p.reorderPoint ?? 'N/A'}\nCategory: ${p.categoryName || 'General'}\nWarehouse Rack: ${p.rackLocation || 'Not Assigned'}`;
                if (p.ml) {
                    if (p.ml.restock) contextualReply += `\nRestock Alert: ${p.ml.restock.recommendation || p.ml.restock.status}`;
                    if (p.ml.risk) contextualReply += `\nRisk Level: ${p.ml.risk.level || p.ml.risk.riskLevel}`;
                }
            } else if (context.overview) {
                const o = context.overview;
                contextualReply = `Warehouse Overview:\nTotal Products: ${o.totalProducts ?? 0}\nLow Stock Items: ${o.lowStockCount ?? 0}\nTotal Warehouses: ${o.warehouseCount ?? 0}\nActive Orders: ${o.activeOrders ?? 0}`;
            } else {
                contextualReply = `Connected to Inventory Warehouse System. You can ask for product details, stock levels, warehouse status, or restock alerts.`;
            }

            return res.json({
                response: contextualReply,
            });
        }
    } catch (error) {
        console.error("AI chat error:", error);

        return res.status(500).json({
            message: "Failed to generate AI response",
        });
    }
};