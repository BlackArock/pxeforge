from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import HTTPException, Request
from jose.exceptions import JWTError

from .config import ADMIN_PASSWORD, ADMIN_USER, JWT_ALGORITHM, JWT_EXPIRY_HOURS, JWT_SECRET


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_credentials(username: str, password: str) -> bool:
    return username == ADMIN_USER and password == ADMIN_PASSWORD


def get_current_user(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        token = request.query_params.get("token", "")
        if not token:
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        auth = f"Bearer {token}"
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
