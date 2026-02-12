"""
Authentication Dependencies
FastAPI dependencies for protecting routes and getting current user
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.auth import verify_token

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ============================================
# Current User Dependencies
# ============================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    
    Args:
        token: JWT access token from Authorization header
        db: Database session
    
    Returns:
        User object if authenticated
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify and decode token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    # Extract user_id from token
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user
    
    Args:
        current_user: Current user from get_current_user dependency
    
    Returns:
        User object if active
    
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


# ============================================
# Role-Based Access Control Dependencies
# ============================================

async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require admin role
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if user is admin
    
    Raises:
        HTTPException: If user is not admin
    """
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def require_teacher(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require teacher role (or admin)
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if user is teacher or admin
    
    Raises:
        HTTPException: If user is not teacher/admin
    """
    if not (current_user.is_teacher() or current_user.is_admin()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher privileges required"
        )
    return current_user


async def require_student(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Require student role
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if user is student
    
    Raises:
        HTTPException: If user is not student
    """
    if not current_user.is_student():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student privileges required"
        )
    return current_user


# ============================================
# Optional Authentication
# ============================================

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work differently for authenticated users
    
    Args:
        token: Optional JWT access token
        db: Database session
    
    Returns:
        User object if authenticated, None otherwise
    """
    if not token:
        return None
    
    try:
        payload = verify_token(token)
        if payload is None:
            return None
        
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        return user if user and user.is_active else None
    except:
        return None


# ============================================
# Role Checking Helpers
# ============================================

def check_user_role(user: User, required_role: UserRole) -> bool:
    """
    Check if user has required role
    
    Args:
        user: User object
        required_role: Required role
    
    Returns:
        True if user has role, False otherwise
    """
    # Admin can access everything
    if user.is_admin():
        return True
    
    return user.has_role(required_role)


def check_user_can_access_resource(user: User, resource_owner_id: int) -> bool:
    """
    Check if user can access a resource
    Users can access their own resources, admins can access everything
    
    Args:
        user: User object
        resource_owner_id: ID of resource owner
    
    Returns:
        True if user can access, False otherwise
    """
    # Admin can access everything
    if user.is_admin():
        return True
    
    # Users can access their own resources
    return user.id == resource_owner_id