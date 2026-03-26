from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid
import json

from app.models.clip import ClipResponse
from app.services.image import process_image
from app.services.storage import upload_to_s3
from app.db.supabase import supabase

router = APIRouter()

@router.post("/", response_model=ClipResponse, status_code=201)
async def create_clip(
    file: UploadFile = File(..., description="画像ファイル（JPEG/PNG/WebP、10MB以下）"),
    tags: Optional[str] = Form(default="[]", description="タグ名のリスト（JSON配列文字列: '[\"ロゴ\", \"モノクロ\"]'）"),
    page: Optional[int] = Form(default=None, description="配置ページ番号")
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
    
    # 4. Supabaseに保存（認証なし版：固定user_id）
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
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
    clip_data = {
        "id": clip_id,
        "user_id": user_id,
        "image_url": image_url,
        "page": page,
        "position": position,
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
        page=clip["page"],
        position=clip["position"],
        created_at=clip["created_at"]
    )

@router.get("/", response_model=dict)
async def get_clips(
    tag: Optional[str] = None,
    page: int = 1,
    limit: int = 24
):
    """
    クリップ一覧を取得
    
    - **tag**: タグ名でフィルタ（省略可）
    - **page**: ページ番号（デフォルト: 1）
    - **limit**: 取得件数（デフォルト: 24）
    """
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
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
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
    else:
        # 全件取得
        response = supabase.table("clips")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
    
    clips_data = response.data
    
    # 各クリップのタグを取得
    clips_with_tags = []
    for clip in clips_data:
        # タグ取得（JOIN: clip_tags + tags）
        tags_response = supabase.table("clip_tags")\
            .select("tag_id, tags(name)")\
            .eq("clip_id", clip["id"])\
            .execute()
        
        tag_names = [item["tags"]["name"] for item in tags_response.data]
        
        clips_with_tags.append({
            **clip,
            "tags": tag_names
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