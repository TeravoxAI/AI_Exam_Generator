"""
Supabase Database Service
Handles all database operations for content retrieval
"""

import os
import json
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

from src.utils import get_logger

logger = get_logger(__name__)


class SupabaseService:
    """Service for Supabase database operations"""

    def __init__(self):
        """Initialize Supabase client"""
        logger.info("🔌 Initializing Supabase connection...")
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")

        if not self.url or not self.key:
            logger.error("❌ Missing Supabase credentials")
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY environment variables must be set"
            )

        logger.debug(f"   URL: {self.url}")
        self.client: Client = create_client(self.url, self.key)
        logger.info("✅ Supabase connection established")

    def fetch_content(
        self,
        grade_level: str,
        subject: str,
        book_type: str
    ) -> List[Dict[str, Any]]:
        """Fetch textbook content from database"""
        logger.info(f"📖 Fetching content: {grade_level}/{subject}/{book_type}")

        # Convert grade number to "Grade X" format for database query
        grade_query = f"Grade {grade_level}" if grade_level.isdigit() else grade_level

        response = self.client.table("textbooks").select("*").eq(
            "grade_level", grade_query
        ).eq(
            "subject", subject
        ).eq(
            "book_type", book_type
        ).execute()

        if not response.data:
            logger.warning(f"⚠️  No content found for {grade_level}/{subject}/{book_type}")
            return []

        logger.info(f"✅ Found {len(response.data)} record(s)")

        # Parse JSON content
        parsed_data = []
        for record in response.data:
            content_text = record.get("content_text")
            if isinstance(content_text, str):
                try:
                    content_data = json.loads(content_text)
                except json.JSONDecodeError:
                    content_data = content_text
            else:
                content_data = content_text

            parsed_data.append({
                "raw": record,
                "parsed": content_data
            })

        return parsed_data

    def get_pages_in_range(
        self,
        grade_level: str,
        subject: str,
        book_type: str,
        page_range: str
    ) -> List[Dict[str, Any]]:
        """
        Get specific pages from a range

        Args:
            grade_level: Grade level
            subject: Subject name
            book_type: Type of book (Activity/Course)
            page_range: Range like "110-115"

        Returns:
            List of pages matching the range
        """
        logger.info(f"📄 Fetching page range {page_range} for {book_type}")

        # Parse page range
        start, end = map(int, page_range.split("-"))
        pages_to_fetch = list(range(start, end + 1))
        logger.debug(f"   Pages to fetch: {pages_to_fetch}")

        # Fetch all content for this combination
        data = self.fetch_content(grade_level, subject, book_type)

        # Filter by page numbers
        result = []
        for record in data:
            parsed = record.get("parsed")
            if isinstance(parsed, list):
                for item in parsed:
                    if item.get("book_page_no") in pages_to_fetch:
                        result.append(item)

        logger.info(f"✅ Found {len(result)} page(s) in range")
        return result

    # ============= User Profile Operations =============

    def create_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Create a user profile linked to the auth user.
        """
        if not self.client:
            return False

        # Add ID to data
        data = profile_data.copy()
        data["id"] = user_id

        try:
            result = self.client.table("users").insert(data).execute()
            logger.info(f"✅ User profile created for {user_id}")
            return bool(result.data)
        except Exception as e:
            logger.error(f"❌ Error creating user profile: {e}")
            return False

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user profile by ID.
        """
        if not self.client:
            return None

        try:
            result = self.client.table("users").select("*").eq("id", user_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"❌ Error fetching user profile: {e}")
            return None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    return SupabaseService()
