import os
import logging
import httpx
from fastapi import Header, HTTPException
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")

# 公開鍵キャッシュ（起動後初回リクエスト時に取得）
_jwks_cache = None


def _fetch_jwks() -> list:
    global _jwks_cache
    if _jwks_cache is None:
        response = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        response.raise_for_status()
        _jwks_cache = response.json()["keys"]
        logger.info(f"JWKS fetched: {len(_jwks_cache)} keys")
    return _jwks_cache


def _get_key_for_token(token: str) -> dict:
    """JWTヘッダーのkidと一致する公開鍵をJWKSから取得する"""
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
    except JWTError as e:
        logger.error(f"Failed to get JWT header: {e}")
        raise

    keys = _fetch_jwks()
    if kid:
        matched = [k for k in keys if k.get("kid") == kid]
        if matched:
            return matched[0]
        logger.warning(f"No key found for kid={kid}, trying all keys")
    return keys[0] if keys else None


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    AuthorizationヘッダーのBearerトークン（Supabase JWT）を検証してuser_idを返す。
    RS256（非対称暗号）でSupabaseのJWKSエンドポイントから取得した公開鍵で検証。
    """
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Missing or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ", 1)[1]

    try:
        key = _get_key_for_token(token)
        if not key:
            logger.error("No JWKS key available")
            raise HTTPException(status_code=401, detail="Invalid token")
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
