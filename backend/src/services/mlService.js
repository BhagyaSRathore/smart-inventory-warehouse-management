const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

const requestToML = async (path, payload) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(`${ML_API_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            throw new Error("ML service returned invalid JSON");
        }

        if (!response.ok) {
            throw new Error(
                data?.detail ||
                data?.message ||
                `ML service returned HTTP ${response.status}`
            );
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
};

export const predictDemand = async (payload) => {
    return requestToML("/api/v1/predict/demand", payload);
};

export const assessRisk = async (payload) => {
    return requestToML("/api/v1/risk/assess", payload);
};

export const recommendRestock = async (payload) => {
    return requestToML("/api/v1/recommend/restock", payload);
};