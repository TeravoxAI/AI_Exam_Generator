"""
Authentication data models for Teravox Exam Generator
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class UserCredentials(BaseModel):
    """User credentials for login"""
    email: str
    password: str


class UserRegistration(BaseModel):
    """User registration data"""
    first_name: str
    last_name: str
    email: str
    password: str
    role: str
    school: str  # Maps to school_branch in the database


class AuthResponse(BaseModel):
    """Response model for authentication"""
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    session: Optional[Dict[str, Any]] = None
    token: Optional[str] = None
    error: Optional[str] = None
