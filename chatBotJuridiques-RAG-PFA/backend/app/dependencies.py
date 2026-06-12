"""
dependencies.py — FastAPI dependencies for authentication and authorisation.

Extracts and verifies the Clerk JWT from the Authorization header.
Returns the Clerk user ID (`sub` claim) for Row-Level Security enforcement.
"""

import time
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt

from app.config import Settings, get_settings
from app.logger import app_logger

# ─────────────────────────────────────────────────────────
# JWKS cache  (refreshed every 6 hours at most)
# ─────────────────────────────────────────────────────────
_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL = 6 * 60 * 60  # 6 hours


async def _get_jwks(settings: Settings) -> list:
    """
    Fetch Clerk's JWKS (JSON Web Key Set) for JWT verification.
    Caches the keys for `_JWKS_TTL` seconds.
    """
    global _jwks_cache

    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < _JWKS_TTL:
        return _jwks_cache["keys"]

    issuer = settings.CLERK_ISSUER.rstrip("/")
    jwks_url = f"{issuer}/.well-known/jwks.json"

    app_logger.info(f"Fetching new JWKS from Clerk: {jwks_url}")
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

    _jwks_cache = {"keys": data.get("keys", []), "fetched_at": now}
    return _jwks_cache["keys"]


def _find_key(keys: list, kid: str) -> Optional[dict]:
    """Find the JWK matching the `kid` in the JWT header."""
    for key in keys:
        if key.get("kid") == kid:
            return key
    return None


async def get_current_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str:
    """
    FastAPI dependency — extracts the Clerk user ID from the JWT.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        app_logger.warning("Authentication failed: Missing or invalid Authorization header", extra={"client_ip": request.client.host if request.client else "unknown"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header.split(" ", 1)[1]

    try:
        # Decode header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            app_logger.warning("Authentication failed: JWT header missing 'kid'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWT header missing 'kid'",
            )

        # Get JWKS and find matching key
        keys = await _get_jwks(settings)
        key = _find_key(keys, kid)
        if not key:
            # Force refresh in case of key rotation
            _jwks_cache["fetched_at"] = 0.0
            keys = await _get_jwks(settings)
            key = _find_key(keys, kid)

        if not key:
            app_logger.warning("Authentication failed: No matching JWK found for this token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No matching JWK found for this token",
            )

        # Verify and decode the JWT
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},  # Clerk doesn't always set aud
        )

        clerk_user_id: Optional[str] = payload.get("sub")
        if not clerk_user_id:
            app_logger.warning("Authentication failed: Token payload missing 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing 'sub' claim",
            )
            
        app_logger.debug("Authentication successful", extra={"user_id": clerk_user_id})
        return clerk_user_id

    except JWTError as exc:
        app_logger.warning(f"Authentication failed: JWT verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT verification failed: {exc}",
        )
    except httpx.HTTPError as exc:
        app_logger.error(f"Authentication service unavailable: Failed to fetch Clerk JWKS: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch Clerk JWKS: {exc}",
        )
