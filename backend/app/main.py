from fastapi import FastAPI
from app.api.messages import router as messages_router
from app.api.conversations import router as conversations_router
from app.api.files import router as files_router
from app.api.artifacts import router as artifacts_router

app = FastAPI(
    title="Sovereign AI Workbench",
    version="0.1.0",
)


app.include_router(conversations_router)
app.include_router(files_router)
app.include_router(messages_router)
app.include_router(artifacts_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sovereign-ai-workbench",
    }