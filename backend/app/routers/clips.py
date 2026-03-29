from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from typing import Optional
import uuid
import json

from app.models.clip import ClipResponse, ClipUpdate, ClipPositionUpdate
from app.services.image import process_image
from app.services.storage import upload_to_s3, delete_from_s3
from app.db.supabase import supabase
from app.middleware.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ClipResponse, status_code=201)
async def create_clip(
    file: UploadFile = File(..., description="画像ファイル（JPEG/PNG/WebP、10MB以下）"),
    tags: Optional[str] = Form(default="[]", description="タグ名のリスト（JSON配列文字列: '[\"ロゴ\", \"モノクロ\"]'）"),
    memo: Optional[str] = Form(default="", description="メモ（省略可）"),
    is_public: Optional[str] = Form(default="true", description="公開設定（true/false）"),
    page: Optional[int] = Form(default=None, description="配置ページ番号"),
    user_id: str = Depends(get_current_user),
):
    """
    画像をアップロードしてクリップを作成
    
    - **file**: 画像ファイル（multipart/form-data）
    - **tags**: タグ名の配列（省略可）
    - **page**: 配置ページ（省略時は最終ページ）
    """
    
    # 1. ファイルバリデーション
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="JPEG/PNG/WebPのみ対応")
    
    # ファイルサイズチェック（10MB）
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ファイルサイズは10MB以下")
    
    # 2. 画像処理（センタークロップ・リサイズ・圧縮）
    processed_image = process_image(file_bytes)
    
    # 3. S3にアップロード
    clip_id = str(uuid.uuid4())
    filename = f"clips/{clip_id}.jpg"
    image_url = upload_to_s3(processed_image, filename)
    
    # ページ番号決定（省略時は最終ページ）
    if page is None:
        # 最大ページ番号を取得
        response = supabase.table("clips")\
            .select("page")\
            .eq("user_id", user_id)\
            .order("page", desc=True)\
            .limit(1)\
            .execute()
        page = response.data[0]["page"] if response.data else 1
    
    # position決定（ページ内の最後尾）
    response = supabase.table("clips")\
        .select("position")\
        .eq("user_id", user_id)\
        .eq("page", page)\
        .order("position", desc=True)\
        .limit(1)\
        .execute()
    position = (response.data[0]["position"] + 1) if response.data else 0
    
    # clipsテーブルに挿入
    is_public_bool = (is_public or "true").lower() == "true"
    clip_data = {
        "id": clip_id,
        "user_id": user_id,
        "image_url": image_url,
        "page": page,
        "position": position,
        "memo": memo or None,
        "is_public": is_public_bool,
    }
    response = supabase.table("clips").insert(clip_data).execute()
    clip = response.data[0]
    
    # 5. タグ処理
    try:
        tag_list = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        tag_list = []

    tag_names = []
    if tag_list:
        for tag_name in tag_list:
            # タグが既存か確認
            response = supabase.table("tags")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("name", tag_name)\
                .execute()
            
            if response.data:
                tag = response.data[0]
            else:
                # 新規タグ作成
                tag_data = {"user_id": user_id, "name": tag_name}
                response = supabase.table("tags").insert(tag_data).execute()
                tag = response.data[0]
            
            # clip_tagsに関連付け
            supabase.table("clip_tags").insert({
                "clip_id": clip_id,
                "tag_id": tag["id"]
            }).execute()
            
            tag_names.append(tag_name)
    
    # レスポンス
    return ClipResponse(
        id=clip["id"],
        image_url=clip["image_url"],
        tags=tag_names,
        memo=clip.get("memo"),
        is_public=clip.get("is_public", True),
        page=clip["page"],
        position=clip["position"],
        created_at=clip["created_at"]
    )

@router.get("/", response_model=dict)
async def get_clips(
    tag: Optional[str] = None,
    page: int = 1,
    limit: int = 1000,
    user_id: str = Depends(get_current_user),
):
    """
    クリップ一覧を取得

    - **tag**: タグ名でフィルタ（省略可）
    - **page**: ページ番号（デフォルト: 1）
    - **limit**: 取得件数（デフォルト: 24）
    """
    
    # オフセット計算
    offset = (page - 1) * limit
    
    if tag:
        # タグ名からtag_idを取得
        tag_response = supabase.table("tags")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("name", tag)\
            .execute()

        if not tag_response.data:
            return {"clips": [], "total": 0, "page": page, "limit": limit}

        tag_id = tag_response.data[0]["id"]

        # clip_tagsからclip_idを取得
        ct_response = supabase.table("clip_tags")\
            .select("clip_id")\
            .eq("tag_id", tag_id)\
            .execute()

        clip_ids = [row["clip_id"] for row in ct_response.data]

        if not clip_ids:
            return {"clips": [], "total": 0, "page": page, "limit": limit}

        response = supabase.table("clips")\
            .select("*")\
            .eq("user_id", user_id)\
            .in_("id", clip_ids)\
            .order("page", desc=False)\
            .order("position", desc=False)\
            .range(offset, offset + limit - 1)\
            .execute()
    else:
        # 全件取得
        response = supabase.table("clips")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("page", desc=False)\
            .order("position", desc=False)\
            .range(offset, offset + limit - 1)\
            .execute()
    
    clips_data = response.data

    # タグを一括取得（N+1を避けるため3クエリで処理）
    clips_with_tags = []
    if clips_data:
        clip_ids = [clip["id"] for clip in clips_data]

        # clip_tags を一括取得
        ct_response = supabase.table("clip_tags")\
            .select("clip_id, tag_id")\
            .in_("clip_id", clip_ids)\
            .execute()

        # tag_id → tag_name のマップを作成
        tag_ids = list({row["tag_id"] for row in ct_response.data})
        tag_id_to_name = {}
        if tag_ids:
            tags_response = supabase.table("tags")\
                .select("id, name")\
                .in_("id", tag_ids)\
                .execute()
            tag_id_to_name = {row["id"]: row["name"] for row in tags_response.data}

        # clip_id → [tag_name] のマップを作成
        clip_tags_map: dict = {}
        for row in ct_response.data:
            name = tag_id_to_name.get(row["tag_id"])
            if name:
                clip_tags_map.setdefault(row["clip_id"], []).append(name)

        # likes を一括取得してクリップごとのいいね数を集計
        likes_res = supabase.table("likes")\
            .select("clip_id")\
            .in_("clip_id", clip_ids)\
            .execute()
        likes_count_map: dict = {}
        for row in likes_res.data:
            likes_count_map[row["clip_id"]] = likes_count_map.get(row["clip_id"], 0) + 1

        for clip in clips_data:
            clips_with_tags.append({
                **clip,
                "tags": clip_tags_map.get(clip["id"], []),
                "likes_count": likes_count_map.get(clip["id"], 0),
            })
    
    # 総件数取得
    count_response = supabase.table("clips")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .execute()
    total = count_response.count
    
    return {
        "clips": clips_with_tags,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.patch("/{clip_id}/", response_model=dict)
async def update_clip(
    clip_id: str,
    body: ClipUpdate,
    user_id: str = Depends(get_current_user),
):
    """
    クリップのタグを更新（全差し替え）
    """
    # 所有権確認
    res = supabase.table("clips").select("id").eq("id", clip_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Clip not found")

    # メモ・公開設定を更新
    update_fields: dict = {}
    if body.memo is not None:
        update_fields["memo"] = body.memo or None
    if body.is_public is not None:
        update_fields["is_public"] = body.is_public
    if update_fields:
        supabase.table("clips").update(update_fields).eq("id", clip_id).execute()

    # 既存タグ関連を全削除してから再挿入（全差し替え方式）
    supabase.table("clip_tags").delete().eq("clip_id", clip_id).execute()

    tag_names = []
    if body.tags:
        for tag_name in body.tags:
            tag_res = supabase.table("tags").select("*").eq("user_id", user_id).eq("name", tag_name).execute()
            if tag_res.data:
                tag = tag_res.data[0]
            else:
                tag = supabase.table("tags").insert({"user_id": user_id, "name": tag_name}).execute().data[0]
            supabase.table("clip_tags").insert({"clip_id": clip_id, "tag_id": tag["id"]}).execute()
            tag_names.append(tag_name)

    return {"id": clip_id, "tags": tag_names}


@router.post("/reorder", response_model=dict)
async def reorder_clips(
    body: list[ClipPositionUpdate],
    user_id: str = Depends(get_current_user),
):
    """クリップの並び順を一括更新"""
    for item in body:
        supabase.table("clips")\
            .update({"page": item.page, "position": item.position})\
            .eq("id", item.id).eq("user_id", user_id)\
            .execute()
    return {"ok": True}


@router.delete("/{clip_id}/", status_code=204)
async def delete_clip(
    clip_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    クリップを削除（clip_tags → clips → S3 の順で削除）
    """
    # 所有権確認（image_urlも取得）
    res = supabase.table("clips").select("id, image_url").eq("id", clip_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Clip not found")

    image_url = res.data[0]["image_url"]
    # S3キーの抽出（URLから ".amazonaws.com/" 以降を取得）
    s3_key = image_url.split(".amazonaws.com/")[1]

    # DBを先に削除してからS3削除（孤立レコードを防ぐ）
    supabase.table("clip_tags").delete().eq("clip_id", clip_id).execute()
    supabase.table("clips").delete().eq("id", clip_id).execute()
    delete_from_s3(s3_key)

    return Response(status_code=204)


@router.post("/{clip_id}/likes", status_code=201, response_model=dict)
async def like_clip(clip_id: str, user_id: str = Depends(get_current_user)):
    """クリップにいいねする（重複は無視）"""
    supabase.table("likes").upsert({"clip_id": clip_id, "user_id": user_id}).execute()

    # クリップオーナーに通知を挿入（自分自身へは通知しない）
    clip_res = supabase.table("clips").select("user_id").eq("id", clip_id).execute()
    if clip_res.data:
        owner_id = clip_res.data[0]["user_id"]
        if owner_id != user_id:
            supabase.table("notifications").insert({
                "user_id": owner_id,
                "type": "like",
                "from_user_id": user_id,
                "clip_id": clip_id,
            }).execute()

    return {"ok": True}


@router.delete("/{clip_id}/likes", status_code=204)
async def unlike_clip(clip_id: str, user_id: str = Depends(get_current_user)):
    """いいねを取り消す"""
    supabase.table("likes").delete().eq("clip_id", clip_id).eq("user_id", user_id).execute()
    return Response(status_code=204)