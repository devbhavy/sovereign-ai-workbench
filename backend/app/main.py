import sys

from fastapi import FastAPI
from app.api.messages import router as messages_router
from app.api.conversations import router as conversations_router
from app.api.files import router as files_router
from app.api.artifacts import router as artifacts_router

# ---------------------------------------------------------------
# Console encoding
#
# On Windows sys.stdout defaults to cp1252. The debug print() calls in
# app/agent/graph.py and app/services/agent_service.py echo raw model output,
# and qwen3 regularly emits characters cp1252 cannot represent (em dashes,
# curly quotes, box drawing). That raises UnicodeEncodeError *inside* the
# request, which run_agent re-raises — so a perfectly good answer is lost and
# the client gets a 500. Observed as:
#     'charmap' codec can't encode characters in position 1494-1495
#
# Printing is a debugging aid and must never be able to fail a request.
# ---------------------------------------------------------------
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")


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