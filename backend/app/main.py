from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clips, tags, users, friends, notifications, contact

app = FastAPI(
    title="Scrappa API",
    version="1.0.0",
    description="スクラップブックWebアプリのバックエンドAPI"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",              # ローカル開発
        "http://frontend:3000",              # Docker内部
        "https://scrappafrontend.vercel.app", # 旧URL
        "https://scrappaapp.vercel.app",      # 旧Vercel URL
        "https://scrappa.digital",            # 本番
        "https://www.scrappa.digital",        # 本番 www
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
app.include_router(contact.router, prefix="/contact", tags=["contact"])

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