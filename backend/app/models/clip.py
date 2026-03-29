from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ClipCreate(BaseModel):
    """クリップ作成リクエスト"""
    tags: Optional[List[str]] = Field(default=[], description="タグ名のリスト")
    page: Optional[int] = Field(default=None, description="配置ページ番号")

class ClipResponse(BaseModel):
    """クリップレスポンス"""
    id: str = Field(description="クリップID（UUID）")
    image_url: str = Field(description="S3画像URL")
    tags: List[str] = Field(description="タグ名のリスト")
    memo: Optional[str] = Field(default=None, description="メモ")
    page: int = Field(description="配置ページ番号")
    position: int = Field(description="ページ内の位置（0-11）")
    created_at: datetime = Field(description="作成日時")

class ClipUpdate(BaseModel):
    """クリップ更新リクエスト"""
    tags: Optional[List[str]] = None
    memo: Optional[str] = None
    page: Optional[int] = None
    position: Optional[int] = None