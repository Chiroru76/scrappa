from fastapi import APIRouter, Depends, HTTPException, Response

from app.db.supabase import supabase
from app.middleware.auth import get_current_user
from app.models.friend import FriendRequestCreate, FriendRequestAction

router = APIRouter()


def _get_profile(user_id: str) -> dict:
    res = supabase.table("profiles").select("id, display_name, avatar_url").eq("id", user_id).execute()
    if res.data:
        return res.data[0]
    return {"id": user_id, "display_name": None, "avatar_url": None}


def _are_friends(user_id_a: str, user_id_b: str) -> bool:
    res1 = supabase.table("friend_requests")\
        .select("id").eq("from_user_id", user_id_a).eq("to_user_id", user_id_b)\
        .eq("status", "accepted").execute()
    if res1.data:
        return True
    res2 = supabase.table("friend_requests")\
        .select("id").eq("from_user_id", user_id_b).eq("to_user_id", user_id_a)\
        .eq("status", "accepted").execute()
    return bool(res2.data)


# ── フレンド申請を送る ──────────────────────────────────────
@router.post("/requests", response_model=dict, status_code=201)
async def send_friend_request(
    body: FriendRequestCreate,
    user_id: str = Depends(get_current_user),
):
    if body.to_user_id == user_id:
        raise HTTPException(status_code=400, detail="自分にフレンド申請はできません")

    # 重複チェック（A→B / B→A どちらでも）
    existing1 = supabase.table("friend_requests").select("id")\
        .eq("from_user_id", user_id).eq("to_user_id", body.to_user_id).execute()
    existing2 = supabase.table("friend_requests").select("id")\
        .eq("from_user_id", body.to_user_id).eq("to_user_id", user_id).execute()
    if existing1.data or existing2.data:
        raise HTTPException(status_code=409, detail="既にフレンド申請済みまたはフレンドです")

    res = supabase.table("friend_requests").insert({
        "from_user_id": user_id,
        "to_user_id": body.to_user_id,
        "status": "pending",
    }).execute()

    # フレンド申請通知を挿入
    supabase.table("notifications").insert({
        "user_id": body.to_user_id,
        "type": "friend_request",
        "from_user_id": user_id,
    }).execute()

    return {"id": res.data[0]["id"]}


# ── 受け取った申請一覧 ──────────────────────────────────────
@router.get("/requests", response_model=dict)
async def get_received_requests(user_id: str = Depends(get_current_user)):
    res = supabase.table("friend_requests")\
        .select("id, from_user_id, created_at")\
        .eq("to_user_id", user_id).eq("status", "pending")\
        .order("created_at", desc=True).execute()

    requests_with_profiles = []
    for req in res.data:
        profile = _get_profile(req["from_user_id"])
        requests_with_profiles.append({
            "id": req["id"],
            "from_user_id": req["from_user_id"],
            "from_user": profile,
            "created_at": req["created_at"],
        })

    return {"requests": requests_with_profiles}


# ── 申請を承認 / 拒否 ───────────────────────────────────────
@router.patch("/requests/{request_id}", response_model=dict)
async def respond_to_request(
    request_id: str,
    body: FriendRequestAction,
    user_id: str = Depends(get_current_user),
):
    if body.action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="action は accept または reject のみ")

    res = supabase.table("friend_requests").select("id")\
        .eq("id", request_id).eq("to_user_id", user_id).eq("status", "pending").execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="申請が見つかりません")

    new_status = "accepted" if body.action == "accept" else "rejected"
    supabase.table("friend_requests").update({"status": new_status}).eq("id", request_id).execute()

    return {"status": new_status}


# ── フレンド一覧 ────────────────────────────────────────────
@router.get("", response_model=dict)
async def get_friends(user_id: str = Depends(get_current_user)):
    # 自分が送った承認済み
    res1 = supabase.table("friend_requests").select("to_user_id")\
        .eq("from_user_id", user_id).eq("status", "accepted").execute()
    # 自分が受け取った承認済み
    res2 = supabase.table("friend_requests").select("from_user_id")\
        .eq("to_user_id", user_id).eq("status", "accepted").execute()

    friend_ids = [r["to_user_id"] for r in res1.data] + [r["from_user_id"] for r in res2.data]

    friends = []
    for fid in friend_ids:
        friends.append(_get_profile(fid))

    return {"friends": friends}


# ── フレンド解除 ────────────────────────────────────────────
@router.delete("/{friend_user_id}", status_code=204)
async def remove_friend(friend_user_id: str, user_id: str = Depends(get_current_user)):
    supabase.table("friend_requests").delete()\
        .eq("from_user_id", user_id).eq("to_user_id", friend_user_id)\
        .eq("status", "accepted").execute()
    supabase.table("friend_requests").delete()\
        .eq("from_user_id", friend_user_id).eq("to_user_id", user_id)\
        .eq("status", "accepted").execute()
    return Response(status_code=204)


# ── フレンドのクリップ一覧（いいね情報付き） ────────────────
@router.get("/{friend_user_id}/clips", response_model=dict)
async def get_friend_clips(
    friend_user_id: str,
    user_id: str = Depends(get_current_user),
):
    if not _are_friends(user_id, friend_user_id):
        raise HTTPException(status_code=403, detail="フレンドのみ閲覧できます")

    clips_res = supabase.table("clips").select("*")\
        .eq("user_id", friend_user_id)\
        .eq("is_public", True)\
        .order("created_at", desc=False).execute()
    clips_data = clips_res.data

    # フレンドのカバー設定を取得
    profile_res = supabase.table("profiles")\
        .select("display_name, cover_color, cover_title, cover_font")\
        .eq("id", friend_user_id).execute()
    profile = profile_res.data[0] if profile_res.data else {}

    if not clips_data:
        return {"clips": [], "cover": profile}

    clip_ids = [c["id"] for c in clips_data]

    # タグを一括取得
    ct_res = supabase.table("clip_tags").select("clip_id, tag_id").in_("clip_id", clip_ids).execute()
    tag_ids = list({r["tag_id"] for r in ct_res.data})
    tag_id_to_name = {}
    if tag_ids:
        tags_res = supabase.table("tags").select("id, name").in_("id", tag_ids).execute()
        tag_id_to_name = {r["id"]: r["name"] for r in tags_res.data}
    clip_tags_map: dict = {}
    for r in ct_res.data:
        name = tag_id_to_name.get(r["tag_id"])
        if name:
            clip_tags_map.setdefault(r["clip_id"], []).append(name)

    # いいねを一括取得
    likes_res = supabase.table("likes").select("clip_id, user_id").in_("clip_id", clip_ids).execute()
    like_counts: dict = {}
    liked_by_me: set = set()
    for r in likes_res.data:
        like_counts[r["clip_id"]] = like_counts.get(r["clip_id"], 0) + 1
        if r["user_id"] == user_id:
            liked_by_me.add(r["clip_id"])

    result = []
    for clip in clips_data:
        cid = clip["id"]
        result.append({
            **clip,
            "tags": clip_tags_map.get(cid, []),
            "like_count": like_counts.get(cid, 0),
            "liked": cid in liked_by_me,
        })

    return {"clips": result, "cover": profile}
