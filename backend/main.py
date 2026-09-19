from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables
from routes import router
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="TamilBridge 2.0", lifespan=lifespan)

# CORS_ORIGINS env var = comma-separated list of allowed origins
# e.g. "https://tamilbridge.onrender.com,http://localhost:5173"
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    api_key = os.getenv("GEMINI_API_KEY", "")
    key_hint = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "NOT_SET"
    return {
        "status": "ok",
        "version": "v2.1-36e6963",
        "gemini_key_set": bool(api_key),
        "gemini_key_hint": key_hint
    }

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
