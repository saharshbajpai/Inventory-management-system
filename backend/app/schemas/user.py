from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class UserSignUp(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=100, description="Secure password (minimum 6 characters)")
    role: str = Field(..., pattern="^(Admin|Employee)$", description="User role, either 'Admin' or 'Employee'")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's login email")
    password: str = Field(..., description="User's login password")

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
