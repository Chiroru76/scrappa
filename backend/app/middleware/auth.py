import os
import httpx
from fastapi import Header, HTTPException
from jose import jwt, JWTError

SUPABASE_URL = os.environ.get("SUPABASE_URL")

# 公開鍵キャッシュ（起動後初回リクエスト時に取得）
_jwks_cache = None


def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        response = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    AuthorizationヘッダーのBearerトークン（Supabase JWT）を検証してuser_idを返す。
    RS256（非対称暗号）でSupabaseのJWKSエンドポイントから取得した公開鍵で検証。
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ", 1)[1]

    try:
        jwks = _fetch_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
