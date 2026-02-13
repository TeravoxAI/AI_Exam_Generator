"""
Authentication Router - API endpoints for user authentication
"""
from fastapi import APIRouter, HTTPException
from src.models.auth_models import UserCredentials, UserRegistration, AuthResponse
from src.services import get_supabase_service

router = APIRouter(tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def sign_up(user_data: UserRegistration):
    """
    Create a new user and store profile information
    """
    supabase = get_supabase_service()

    if not supabase.client:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # 1. Sign up with Supabase Auth
        response = supabase.client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })

        # 2. If successful, create user profile
        if response.user and response.user.id:
            profile_created = supabase.create_user_profile(
                user_id=response.user.id,
                profile_data={
                    "email": user_data.email,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "school_branch": user_data.school,  # Map school to school_branch
                    "role": user_data.role,
                    "is_approved": False  # All users require admin approval
                }
            )

            if not profile_created:
                print(f"Warning: Failed to create profile for user {response.user.id}")

            user_response_data = response.user.model_dump() if hasattr(response.user, 'model_dump') else response.user.__dict__

            # Merge profile data
            user_response_data.update({
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "school": user_data.school,
                "role": user_data.role,
                "is_approved": False
            })

            # Extract token from session
            token = None
            if response.session:
                session_dict = response.session.model_dump() if hasattr(response.session, 'model_dump') else response.session.__dict__
                token = session_dict.get('access_token')
            else:
                session_dict = None

            return AuthResponse(
                success=True,
                message="User created successfully.",
                user=user_response_data,
                session=session_dict,
                token=token
            )
        else:
            return AuthResponse(
                success=False,
                message="Failed to create user",
                error="No user returned from Supabase"
            )

    except Exception as e:
        error_msg = str(e)
        if "User already registered" in error_msg or "already been registered" in error_msg:
            return AuthResponse(
                success=False,
                message="User already exists",
                error="User already exists"
            )
        return AuthResponse(
            success=False,
            message="Signup failed",
            error=str(e)
        )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserCredentials):
    """
    Sign in a user using Supabase Auth
    """
    supabase = get_supabase_service()

    if not supabase.client:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        response = supabase.client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })

        if response.user and response.session:
            # Fetch full profile to return to frontend
            profile = supabase.get_user_profile(response.user.id)

            user_data_resp = response.user.model_dump() if hasattr(response.user, 'model_dump') else response.user.__dict__

            if profile:
                user_data_resp.update(profile)

            # Extract token from session
            session_dict = response.session.model_dump() if hasattr(response.session, 'model_dump') else response.session.__dict__
            token = session_dict.get('access_token')

            return AuthResponse(
                success=True,
                message="Login successful",
                user=user_data_resp,
                session=session_dict,
                token=token
            )
        else:
            return AuthResponse(
                success=False,
                message="Login failed",
                error="Invalid credentials or no session returned"
            )

    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            return AuthResponse(
                success=False,
                message="Invalid email or password",
                error="Invalid email or password"
            )
        return AuthResponse(
            success=False,
            message="Login failed",
            error=str(e)
        )


@router.post("/logout", response_model=AuthResponse)
async def logout():
    """
    Sign out the current user
    """
    supabase = get_supabase_service()

    if not supabase.client:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        supabase.client.auth.sign_out()

        return AuthResponse(
            success=True,
            message="Logout successful"
        )

    except Exception as e:
        return AuthResponse(
            success=False,
            message="Logout failed",
            error=str(e)
        )
