"""
Authentication Router - API endpoints for user authentication
"""
from fastapi import APIRouter, HTTPException
from src.models.auth_models import UserCredentials, UserRegistration, AuthResponse
from src.services import get_supabase_service
from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def sign_up(user_data: UserRegistration):
    """
    Create a new user and store profile information
    """
    logger.info("=" * 80)
    logger.info("📝 SIGNUP REQUEST RECEIVED")
    logger.info(f"   Email: {user_data.email}")
    logger.info(f"   Name: {user_data.first_name} {user_data.last_name}")
    logger.info(f"   Role: {user_data.role}")
    logger.info(f"   School: {user_data.school}")
    logger.info("=" * 80)

    supabase = get_supabase_service()
    logger.info(f"🔗 Supabase client available: {supabase.client is not None}")

    if not supabase.client:
        logger.error("❌ Database connection not available")
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # 1. Sign up with Supabase Auth
        logger.debug(f"📤 Sending signup request to Supabase for: {user_data.email}")
        response = supabase.client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        logger.info(f"✅ Supabase signup response received")
        logger.debug(f"   User ID: {response.user.id if response.user else 'None'}")
        logger.debug(f"   Session: {response.session is not None}")
        logger.debug(f"   User verified: {response.user.user_metadata if response.user else 'N/A'}")

        # 2. If successful, create user profile
        if response.user and response.user.id:
            logger.info(f"👤 Creating user profile for user ID: {response.user.id}")
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

            if profile_created:
                logger.info(f"✅ User profile created successfully")
            else:
                logger.warning(f"⚠️  Failed to create profile for user {response.user.id}")

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

            logger.info("✅ SIGNUP SUCCESSFUL")
            logger.info(f"   User Email: {user_data.email}")
            logger.info(f"   Token provided: {token is not None}")
            logger.info("=" * 80)
            return AuthResponse(
                success=True,
                message="User created successfully.",
                user=user_response_data,
                session=session_dict,
                token=token
            )
        else:
            logger.error("❌ SIGNUP FAILED - No user returned from Supabase")
            logger.debug(f"   Response user: {response.user}")
            logger.debug(f"   Response session: {response.session}")
            logger.info("=" * 80)
            return AuthResponse(
                success=False,
                message="Failed to create user",
                error="No user returned from Supabase"
            )

    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ SIGNUP EXCEPTION: {error_msg}")
        logger.debug(f"   Exception type: {type(e).__name__}")
        logger.debug(f"   Full error: {repr(e)}")
        logger.info("=" * 80)

        if "User already registered" in error_msg or "already been registered" in error_msg:
            logger.warning(f"⚠️  User already exists: {user_data.email}")
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
    logger.info("=" * 80)
    logger.info("🔓 LOGIN REQUEST RECEIVED")
    logger.info(f"   Email: {credentials.email}")
    logger.info("=" * 80)

    supabase = get_supabase_service()
    logger.info(f"🔗 Supabase client available: {supabase.client is not None}")

    if not supabase.client:
        logger.error("❌ Database connection not available")
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        logger.debug(f"📤 Sending login request to Supabase for: {credentials.email}")
        response = supabase.client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })
        logger.info(f"✅ Supabase login response received")
        logger.debug(f"   User found: {response.user is not None}")
        logger.debug(f"   Session found: {response.session is not None}")
        if response.user:
            logger.debug(f"   User ID: {response.user.id}")
            logger.debug(f"   User email: {response.user.email}")
            logger.debug(f"   Email confirmed: {response.user.email_confirmed_at is not None}")

        if response.user and response.session:
            logger.info(f"👤 Fetching user profile for: {response.user.id}")
            # Fetch full profile to return to frontend
            profile = supabase.get_user_profile(response.user.id)

            if profile:
                logger.info(f"✅ User profile found")
                logger.debug(f"   Profile keys: {list(profile.keys())}")
                logger.debug(f"   is_approved: {profile.get('is_approved')}")
            else:
                logger.warning(f"⚠️  User profile not found in database")

            user_data_resp = response.user.model_dump() if hasattr(response.user, 'model_dump') else response.user.__dict__

            if profile:
                user_data_resp.update(profile)

            # Extract token from session
            session_dict = response.session.model_dump() if hasattr(response.session, 'model_dump') else response.session.__dict__
            token = session_dict.get('access_token')

            logger.info("✅ LOGIN SUCCESSFUL")
            logger.info(f"   User Email: {response.user.email}")
            logger.info(f"   Token provided: {token is not None}")
            logger.info(f"   is_approved: {user_data_resp.get('is_approved')}")
            logger.info("=" * 80)

            return AuthResponse(
                success=True,
                message="Login successful",
                user=user_data_resp,
                session=session_dict,
                token=token
            )
        else:
            logger.error("❌ LOGIN FAILED - Invalid credentials or no session")
            logger.debug(f"   User present: {response.user is not None}")
            logger.debug(f"   Session present: {response.session is not None}")
            logger.info("=" * 80)
            return AuthResponse(
                success=False,
                message="Login failed",
                error="Invalid credentials or no session returned"
            )

    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ LOGIN EXCEPTION: {error_msg}")
        logger.debug(f"   Exception type: {type(e).__name__}")
        logger.debug(f"   Full error: {repr(e)}")
        logger.info("=" * 80)

        if "Invalid login credentials" in error_msg:
            logger.warning(f"⚠️  Invalid credentials for: {credentials.email}")
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
