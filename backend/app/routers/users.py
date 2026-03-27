from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.services.image import process_avatar_image
from app.services.storage import upload_to_s3
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/me/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    アバター画像をアップロードして S3 URL を返す
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="JPEG/PNG/WebPのみ対応")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ファイルサイズは5MB以下")

    processed = process_avatar_image(file_bytes)
    url = upload_to_s3(processed, f"avatars/{user_id}.jpg")

    return {"avatar_url": url}
