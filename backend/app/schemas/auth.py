from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from backend.app.models.user import RoleEnum


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password at least 6 characters")
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    email: str
    full_name: str


class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
