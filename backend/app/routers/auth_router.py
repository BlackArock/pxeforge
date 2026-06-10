from fastapi import APIRouter, HTTPException

from ..auth import create_token, verify_credentials
from ..schemas import LoginRequest, TokenResponse

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    if not verify_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(body.username)
    return TokenResponse(access_token=token)
