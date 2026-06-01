from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.api.dependencies import RoleChecker

router = APIRouter()

# Require Admin role for user management
admin_required = RoleChecker(["Admin"])

@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db), 
    current_user: User = Depends(admin_required)
):
    """Retrieve all users in the system (Admin only)."""
    return db.query(User).order_by(User.full_name).all()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(admin_required)
):
    """Delete a user account (Admin only, cannot delete self)."""
    if current_user.id == id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account."
        )
    
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found."
        )
    
    db.delete(user)
    db.commit()
