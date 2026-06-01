from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserSignUp, UserLogin, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserSignUp, db: Session = Depends(get_db)):
    """Register a new user (Admin or Employee)."""
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{user_in.email}' already exists."
        )
    
    hashed = hash_password(user_in.password)
    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        password_hash=hashed,
        role=user_in.role
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Database conflict during signup."
        )

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate credentials and return JWT access token."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token payload containing user id
    token_payload = {"sub": str(user.id)}
    access_token = create_access_token(data=token_payload)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in user."""
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Invalidate session on logout (handled client-side, endpoint confirms success)."""
    return {"message": "Logged out successfully."}
