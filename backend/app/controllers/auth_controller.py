from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import create_access_token, get_current_user
from backend.app.models.user import User
from backend.app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserProfileResponse, PasswordChangeRequest
)
from backend.app.services.auth_service import (
    register_user, authenticate_user, change_password
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, req)
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        full_name=user.full_name
    )


@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def update_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_password(db, current_user, req.current_password, req.new_password)
    return {"message": "Password updated successfully."}
