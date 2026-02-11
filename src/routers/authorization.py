"""
Authorization Middleware - JWT verification and user context
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.services import get_supabase_service
from typing import Dict, Any

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token and retrieve user profile.
    """
    token = credentials.credentials
    supabase = get_supabase_service()

    if not supabase.client:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Verify token with Supabase Auth
        user_response = supabase.client.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        user_id = user_response.user.id

        # Get profile from users table
        profile = supabase.get_user_profile(user_id)

        if not profile:
            raise HTTPException(status_code=403, detail="User profile not found. Please contact support.")

        return profile

    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
