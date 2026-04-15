from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, PINSetup, PINLogin, TokenResponse, UserOut
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, create_refresh_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new radiologist account."""
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        institution=data.institution,
        designation=data.designation,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


@router.post("/pin/setup", response_model=dict)
async def setup_pin(data: PINSetup, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Set up a 4-digit PIN for quick re-authentication."""
    current_user.pin_hash = hash_password(data.pin)
    db.add(current_user)
    return {"message": "PIN set successfully"}


@router.post("/pin/login", response_model=TokenResponse)
async def pin_login(data: PINLogin, db: AsyncSession = Depends(get_db)):
    """Quick login using 4-digit PIN."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.pin_hash:
        raise HTTPException(status_code=401, detail="PIN not set up for this account")
    if not verify_password(data.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserOut.model_validate(current_user)
