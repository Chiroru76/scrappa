from fastapi import APIRouter, HTTPException
from app.models.tag import TagCreate, TagResponse, TagUpdate
from app.db.supabase import supabase

router = APIRouter()

@router.get("/", response_model=dict)
async def get_tags():
    """タグ一覧を取得（clip_count付き）"""
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
    # タグ一覧取得
    response = supabase.table("tags")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    
    tags_with_count = []
    for tag in response.data:
        # このタグが付いたクリップ数を取得
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
async def create_tag(tag: TagCreate):
    """タグを作成"""
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
    # 同名タグが存在するか確認
    response = supabase.table("tags")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("name", tag.name)\
        .execute()
    
    if response.data:
        raise HTTPException(status_code=400, detail="同名のタグが既に存在します")
    
    # タグ作成
    tag_data = {"user_id": user_id, "name": tag.name}
    response = supabase.table("tags").insert(tag_data).execute()
    created_tag = response.data[0]
    
    return TagResponse(
        id=created_tag["id"],
        name=created_tag["name"],
        clip_count=0
    )

@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: str, tag: TagUpdate):
    """タグ名を変更"""
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
    # タグ存在確認
    response = supabase.table("tags")\
        .select("*")\
        .eq("id", tag_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="タグが見つかりません")
    
    # タグ名更新
    response = supabase.table("tags")\
        .update({"name": tag.name})\
        .eq("id", tag_id)\
        .execute()
    
    updated_tag = response.data[0]
    
    # clip_count取得
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
async def delete_tag(tag_id: str):
    """タグを削除"""
    user_id = "00000000-0000-0000-0000-000000000001"  # Step 4で実際の認証に置き換え
    
    # タグ存在確認
    response = supabase.table("tags")\
        .select("*")\
        .eq("id", tag_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="タグが見つかりません")
    
    # タグ削除（clip_tagsはCASCADEで自動削除）
    supabase.table("tags").delete().eq("id", tag_id).execute()
    
    return None  # 204 No Content