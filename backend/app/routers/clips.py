from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import uuid

from app.models.clip import ClipResponse
from app.services.image import process_image
from app.services.storage import upload_to_s3
from app.db.supabase import supabase

router = APIRouter()

@router.post("/", response_model=ClipResponse, status_code=201)
async def create_clip(
    file: UploadFile = File(..., description="画像ファイル（JPEG/PNG/WebP、10MB以下）"),
    tags: Optional[List[str]] = Form(default=[], description="タグ名のリスト"),
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
    user_id = "test-user-id"  # Step 4で実際の認証に置き換え
    
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
    tag_names = []
    if tags:
        for tag_name in tags:
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