from fastapi import APIRouter, HTTPException
from app.models.contact import ContactCreate
from app.db.supabase import supabase

router = APIRouter()

@router.post("", status_code=201)
async def create_contact(payload: ContactCreate):
    result = supabase.table("contact_messages").insert({
        "name": payload.name,
        "email": payload.email,
        "subject": payload.subject,
        "body": payload.body,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save contact message")

    return {"message": "お問い合わせを受け付けました"}
