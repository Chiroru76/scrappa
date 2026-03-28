from fastapi import APIRouter, Depends, Response

from app.db.supabase import supabase
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("", response_model=dict)
async def get_notifications(user_id: str = Depends(get_current_user)):
    res = supabase.table("notifications") \
        .select("id, type, from_user_id, clip_id, is_read, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute()

    notifications = res.data

    # from_user プロフィールを一括取得
    from_user_ids = list({n["from_user_id"] for n in notifications})
    profiles_map = {}
    if from_user_ids:
        profiles_res = supabase.table("profiles") \
            .select("id, display_name, avatar_url") \
            .in_("id", from_user_ids) \
            .execute()
        profiles_map = {p["id"]: p for p in profiles_res.data}

    result = []
    for n in notifications:
        result.append({
            **n,
            "from_user": profiles_map.get(
                n["from_user_id"],
                {"id": n["from_user_id"], "display_name": None, "avatar_url": None}
            ),
        })

    unread_count = sum(1 for n in notifications if not n["is_read"])

    return {"notifications": result, "unread_count": unread_count}


@router.patch("/read", response_model=dict)
async def mark_all_read(user_id: str = Depends(get_current_user)):
    supabase.table("notifications") \
        .update({"is_read": True}) \
        .eq("user_id", user_id) \
        .eq("is_read", False) \
        .execute()
    return {"ok": True}
