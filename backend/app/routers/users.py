from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.services.image import process_avatar_image
from app.services.storage import upload_to_s3
from app.db.supabase import supabase
from app.middleware.auth import get_current_user
from app.models.friend import ProfileUpdate

router = APIRouter()


@router.post("/me/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """アバター画像をアップロードして S3 URL を返す"""
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="JPEG/PNG/WebPのみ対応")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ファイルサイズは5MB以下")

    processed = process_avatar_image(file_bytes)
    url = upload_to_s3(processed, f"avatars/{user_id}.jpg")

    return {"avatar_url": url}


@router.get("/me", response_model=dict)
async def get_my_profile(user_id: str = Depends(get_current_user)):
    """自分のプロフィール（表紙設定を含む）を取得"""
    res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return res.data or {}


@router.patch("/me", response_model=dict)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
):
    """profiles テーブルに表示名・アバター・表紙設定を同期"""
    upsert_data: dict = {"id": user_id}
    if body.display_name is not None:
        upsert_data["display_name"] = body.display_name
    if body.avatar_url is not None:
        upsert_data["avatar_url"] = body.avatar_url
    if body.cover_color is not None:
        upsert_data["cover_color"] = body.cover_color
    if body.cover_title is not None:
        upsert_data["cover_title"] = body.cover_title
    if body.cover_font is not None:
        upsert_data["cover_font"] = body.cover_font

    supabase.table("profiles").upsert(upsert_data).execute()
    return {"ok": True}


@router.get("/search", response_model=dict)
async def search_users(
    q: str = "",
    user_id: str = Depends(get_current_user),
):
    """display_name で部分一致検索（自分を除く）"""
    if not q or len(q.strip()) < 1:
        return {"users": []}

    res = supabase.table("profiles")\
        .select("id, display_name, avatar_url")\
        .ilike("display_name", f"%{q.strip()}%")\
        .neq("id", user_id)\
        .limit(20)\
        .execute()

    users = []
    for profile in res.data:
        target_id = profile["id"]

        # 申請状況を確認（自分→相手 / 相手→自分）
        req_sent = supabase.table("friend_requests").select("id, status")\
            .eq("from_user_id", user_id).eq("to_user_id", target_id).execute()
        req_recv = supabase.table("friend_requests").select("id, status")\
            .eq("from_user_id", target_id).eq("to_user_id", user_id).execute()

        relation = "none"
        if req_sent.data:
            relation = req_sent.data[0]["status"]       # "pending" / "accepted"
        elif req_recv.data:
            status = req_recv.data[0]["status"]
            relation = "accepted" if status == "accepted" else "pending_received"

        users.append({**profile, "relation": relation})

    return {"users": users}
