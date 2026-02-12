"""
User Model - Authentication and Authorization
Handles user accounts, roles, and authentication
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    lecturer = "lecturer"
    student = "student"


class User(Base):
    """
    User account model for authentication
    Supports role-based access control (RBAC)
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    
    # Role-based access control
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)

    # OAuth fields
    oauth_provider = Column(String, nullable=True)  # 'google', 'microsoft', 'github'
    oauth_provider_id = Column(String, nullable=True)  # Provider's user ID
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Optional: Link to Student table if role is STUDENT
    student_id = Column(String(50), unique=True, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
    
    def has_role(self, role: UserRole) -> bool:
        """Check if user has specific role"""
        return self.role == role
    
    def is_lecturer(self) -> bool:
        """Check if user is lecturer"""
        return self.role == UserRole.lecturer
    
    def is_student(self) -> bool:
        """Check if user is student"""
        return self.role == UserRole.student


class RefreshToken(Base):
    """
    Refresh token model for JWT token refresh
    Allows invalidating tokens and tracking sessions
    """
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id})>"
    
    def is_valid(self) -> bool:
        """Check if token is still valid"""
        return not self.revoked and self.expires_at > datetime.utcnow()