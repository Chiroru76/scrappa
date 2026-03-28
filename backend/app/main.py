from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clips, tags, users, friends, notifications

app = FastAPI(
    title="Scrappa API",
    version="1.0.0",
    description="スクラップブックWebアプリのバックエンドAPI"
)

# CORS設定（Docker環境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # ホストからのアクセス
        "http://frontend:3000",   # Docker内部からのアクセス
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(clips.router, prefix="/clips", tags=["clips"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(friends.router, prefix="/friends", tags=["friends"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

@app.get("/")
def root():
    """
    ルートエンドポイント（ヘルスチェック用）
    """
    return {"message": "Scrappa API is running!", "environment": "Docker"}

@app.get("/health")
def health_check():
    """
    ヘルスチェックエンドポイント
    """
    return {"status": "healthy", "version": "1.0.0"}