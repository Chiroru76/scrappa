from pydantic import BaseModel
from typing import Optional


class FriendRequestCreate(BaseModel):
    to_user_id: str


class FriendRequestAction(BaseModel):
    action: str  # "accept" or "reject"


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_color: Optional[str] = None
    cover_title: Optional[str] = None
    cover_font: Optional[str] = None
