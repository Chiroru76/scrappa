from pydantic import BaseModel, Field
from typing import Optional

class TagCreate(BaseModel):
    """タグ作成リクエスト"""
    name: str = Field(min_length=1, max_length=50, description="タグ名")

class TagResponse(BaseModel):
    """タグレスポンス"""
    id: str = Field(description="タグID（UUID）")
    name: str = Field(description="タグ名")
    clip_count: int = Field(description="このタグが付いたクリップ数")

class TagUpdate(BaseModel):
    """タグ更新リクエスト"""
    name: str = Field(min_length=1, max_length=50, description="新しいタグ名")