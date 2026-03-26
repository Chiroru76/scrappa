from fastapi import APIRouter, Depends, HTTPException
from app.models.tag import TagCreate, TagResponse, TagUpdate
from app.db.supabase import supabase
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def get_tags(user_id: str = Depends(get_current_user)):
    """タグ一覧を取得（clip_count付き）"""
    response = supabase.table("tags")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()

    tags_with_count = []
    for tag in response.data:
        count_response = supabase.table("clip_tags")\
            .select("clip_id", count="exact")\
            .eq("tag_id", tag["id"])\
            .execute()

        tags_with_count.append({
            "id": tag["id"],
            "name": tag["name"],
            "clip_count": count_response.count
        })

    return {"tags": tags_with_count}

@router.post("/", response_model=TagResponse, status_code=201)
async def create_tag(tag: TagCreate, user_id: str = Depends(get_current_user)):
    """タグを作成"""
    response = supabase.table("tags")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("name", tag.name)\
        .execute()

    if response.data:
        raise HTTPException(status_code=400, detail="同名のタグが既に存在します")

    tag_data = {"user_id": user_id, "name": tag.name}
    response = supabase.table("tags").insert(tag_data).execute()
    created_tag = response.data[0]

    return TagResponse(
        id=created_tag["id"],
        name=created_tag["name"],
        clip_count=0
    )

@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: str, tag: TagUpdate, user_id: str = Depends(get_current_user)):
    """タグ名を変更"""
    response = supabase.table("tags")\
        .select("*")\
        .eq("id", tag_id)\
        .eq("user_id", user_id)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="タグが見つかりません")

    response = supabase.table("tags")\
        .update({"name": tag.name})\
        .eq("id", tag_id)\
        .execute()

    updated_tag = response.data[0]

    count_response = supabase.table("clip_tags")\
        .select("clip_id", count="exact")\
        .eq("tag_id", tag_id)\
        .execute()

    return TagResponse(
        id=updated_tag["id"],
        name=updated_tag["name"],
        clip_count=count_response.count
    )

@router.delete("/{tag_id}", status_code=204)
async def delete_tag(tag_id: str, user_id: str = Depends(get_current_user)):
    """タグを削除"""
    response = supabase.table("tags")\
        .select("*")\
        .eq("id", tag_id)\
        .eq("user_id", user_id)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="タグが見つかりません")

    supabase.table("tags").delete().eq("id", tag_id).execute()

    return None  # 204 No Content
