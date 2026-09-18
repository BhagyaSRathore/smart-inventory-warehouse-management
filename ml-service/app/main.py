from fastapi import FastAPI

from app.routers import predictions, recommendations, risk

app = FastAPI(
    title="Smart Inventory ML Service",
    version="1.0.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(predictions.router)
app.include_router(risk.router)
app.include_router(recommendations.router)