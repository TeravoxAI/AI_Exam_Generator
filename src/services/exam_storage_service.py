"""
Service for storing generated exams in the database.
Handles exam persistence, cost tracking, and metadata management.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ExamStorageService:
    """Manages exam persistence to the generated_exams table."""

    def __init__(self, supabase_client):
        """
        Initialize with Supabase client.

        Args:
            supabase_client: Supabase client instance
        """
        self.client = supabase_client
        self.table_name = "generated_exams"

    def save_exam(
        self,
        subject: str,
        grade: str,
        exam_content: Dict[str, Any],
        request_metadata: Dict[str, Any],
        llm_metadata: Dict[str, Any],
        course_page_range: Optional[str] = None,
        activity_page_range: Optional[str] = None,
        created_by: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Save a generated exam to the database using UPSERT logic.

        Args:
            subject: Subject of the exam
            grade: Grade level
            exam_content: Complete exam JSON
            request_metadata: Request parameters (question_types, etc.)
            llm_metadata: LLM response metadata (tokens, cost, model, etc.)
            course_page_range: Page range used from course
            activity_page_range: Page range used from activity
            created_by: User who created this exam
            request_id: ID to track the original request

        Returns:
            Dict with exam_id and other saved data

        Raises:
            Exception: If database operation fails
        """
        try:
            # Generate exam_id
            exam_id = str(uuid.uuid4())

            logger.info(f"Saving exam: {exam_id} for {subject} Grade {grade}")

            # Calculate statistics from exam_content
            stats = self._calculate_stats(exam_content)

            # Prepare metadata with cost information
            metadata = self._prepare_metadata(llm_metadata)

            # Prepare the record
            record = {
                "exam_id": exam_id,
                "subject": subject,
                "grade": grade,
                "course_page_range": course_page_range,
                "activity_page_range": activity_page_range,
                "question_types_requested": request_metadata.get("question_types"),
                "exam_content": exam_content,
                "total_marks": stats["total_marks"],
                "total_questions": stats["total_questions"],
                "objective_questions_count": stats["objective_count"],
                "subjective_questions_count": stats["subjective_count"],
                "metadata": metadata,
                "status": "completed",
                "created_by": created_by or "system",
                "request_id": request_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            logger.info(f"Inserting exam record with ID: {exam_id}")

            # Insert using Supabase
            response = self.client.table(self.table_name).insert(record).execute()

            logger.info(f"✅ Exam saved successfully: {exam_id}")

            return {
                "exam_id": exam_id,
                "status": "saved",
                "message": f"Exam saved with ID: {exam_id}",
                "data": response.data[0] if response.data else record,
            }

        except Exception as e:
            logger.error(f"❌ Failed to save exam: {str(e)}", exc_info=True)
            raise

    def _calculate_stats(self, exam_content: Dict[str, Any]) -> Dict[str, int]:
        """
        Calculate statistics from exam content.
        Handles both formats: direct arrays and wrapped in 'questions' key.

        Args:
            exam_content: Complete exam JSON

        Returns:
            Dict with total_marks, total_questions, objective_count, subjective_count
        """
        total_marks = 0
        total_questions = 0
        objective_count = 0
        subjective_count = 0

        # Count objective questions
        if "objective" in exam_content:
            for question_type, type_data in exam_content["objective"].items():
                questions = []

                # Handle both formats:
                # Format 1: type_data is array directly
                if isinstance(type_data, list):
                    questions = type_data
                # Format 2: type_data is dict with 'questions' key
                elif isinstance(type_data, dict) and "questions" in type_data:
                    questions = type_data["questions"]

                if questions and isinstance(questions, list):
                    objective_count += len(questions)
                    total_questions += len(questions)

                    # Sum marks
                    for q in questions:
                        if isinstance(q, dict) and "marks" in q:
                            total_marks += q["marks"]

        # Count subjective questions
        if "subjective" in exam_content:
            for question_type, type_data in exam_content["subjective"].items():
                questions = []

                # Handle both formats
                if isinstance(type_data, list):
                    questions = type_data
                elif isinstance(type_data, dict) and "questions" in type_data:
                    questions = type_data["questions"]

                if questions and isinstance(questions, list):
                    subjective_count += len(questions)
                    total_questions += len(questions)

                    # Sum marks
                    for q in questions:
                        if isinstance(q, dict) and "marks" in q:
                            total_marks += q["marks"]

        return {
            "total_marks": total_marks,
            "total_questions": total_questions,
            "objective_count": objective_count,
            "subjective_count": subjective_count,
        }

    def _prepare_metadata(self, llm_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare metadata with cost information from OpenRouter.

        Args:
            llm_metadata: Raw metadata from LLM service

        Returns:
            Formatted metadata dict with costs and tokens
        """
        metadata = {
            "model": llm_metadata.get("model", "unknown"),
            "provider": llm_metadata.get("provider", "openrouter"),
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Token usage
        if "usage" in llm_metadata:
            usage = llm_metadata["usage"]
            metadata["input_tokens"] = usage.get("prompt_tokens", 0)
            metadata["output_tokens"] = usage.get("completion_tokens", 0)
            metadata["total_tokens"] = usage.get("total_tokens", 0)

        # Cost information from OpenRouter
        if "cost" in llm_metadata:
            metadata["cost"] = {
                "input_cost": llm_metadata["cost"].get("input_cost", 0),
                "output_cost": llm_metadata["cost"].get("output_cost", 0),
                "total_cost": llm_metadata["cost"].get("total_cost", 0),
                "currency": "USD",
            }

        # Performance metrics
        if "generation_time_ms" in llm_metadata:
            metadata["generation_time_ms"] = llm_metadata["generation_time_ms"]
        if "api_latency_ms" in llm_metadata:
            metadata["api_latency_ms"] = llm_metadata["api_latency_ms"]
        if "finish_reason" in llm_metadata:
            metadata["finish_reason"] = llm_metadata["finish_reason"]

        return metadata

    def get_exam(self, exam_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve an exam by ID."""
        try:
            response = (
                self.client.table(self.table_name)
                .select("*")
                .eq("exam_id", exam_id)
                .single()
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"Failed to retrieve exam {exam_id}: {str(e)}")
            return None

    def get_exams_by_subject_grade(
        self, subject: str, grade: str, limit: int = 10
    ) -> list:
        """Get recent exams for a subject and grade."""
        try:
            response = (
                self.client.table(self.table_name)
                .select("*")
                .eq("subject", subject)
                .eq("grade", grade)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(
                f"Failed to retrieve exams for {subject}/{grade}: {str(e)}"
            )
            return []

    def get_total_cost_by_subject(self, subject: str) -> Dict[str, Any]:
        """Calculate total costs for a subject."""
        try:
            exams = (
                self.client.table(self.table_name)
                .select("metadata")
                .eq("subject", subject)
                .execute()
            )

            total_cost = 0.0
            total_exams = 0

            for exam in exams.data or []:
                if exam.get("metadata") and exam["metadata"].get("cost"):
                    total_cost += float(
                        exam["metadata"]["cost"].get("total_cost", 0)
                    )
                    total_exams += 1

            return {
                "subject": subject,
                "total_exams": total_exams,
                "total_cost_usd": round(total_cost, 4),
            }
        except Exception as e:
            logger.error(f"Failed to calculate costs for {subject}: {str(e)}")
            return {"subject": subject, "total_exams": 0, "total_cost_usd": 0}

    def get_all_costs_summary(self) -> Dict[str, Any]:
        """Get cost summary across all exams."""
        try:
            exams = self.client.table(self.table_name).select("subject, metadata").execute()

            costs_by_subject = {}
            total_cost = 0.0
            total_exams = 0

            for exam in exams.data or []:
                subject = exam.get("subject", "unknown")
                if exam.get("metadata") and exam["metadata"].get("cost"):
                    exam_cost = float(exam["metadata"]["cost"].get("total_cost", 0))

                    if subject not in costs_by_subject:
                        costs_by_subject[subject] = {"exams": 0, "cost": 0.0}

                    costs_by_subject[subject]["exams"] += 1
                    costs_by_subject[subject]["cost"] += exam_cost
                    total_cost += exam_cost
                    total_exams += 1

            return {
                "total_exams": total_exams,
                "total_cost_usd": round(total_cost, 4),
                "by_subject": {
                    subject: {
                        "exams": data["exams"],
                        "cost": round(data["cost"], 4),
                    }
                    for subject, data in costs_by_subject.items()
                },
            }
        except Exception as e:
            logger.error(f"Failed to get cost summary: {str(e)}")
            return {"total_exams": 0, "total_cost_usd": 0, "by_subject": {}}

    def get_exams_by_user(self, user_id: str) -> list:
        """
        Get all exams created by a specific user, ordered by creation date (newest first).
        Includes exam_content to recalculate stats for accuracy.

        Args:
            user_id: The user ID to fetch exams for

        Returns:
            List of exam records with recalculated stats
        """
        try:
            logger.info(f"📚 Fetching exams for user: {user_id}")
            response = (
                self.client.table(self.table_name)
                .select(
                    "exam_id, subject, grade, created_at, total_marks, total_questions, "
                    "objective_questions_count, subjective_questions_count, course_page_range, activity_page_range, "
                    "exam_content"
                )
                .eq("created_by", user_id)
                .order("created_at", desc=True)
                .execute()
            )

            exams = response.data or []

            # Recalculate stats for each exam to ensure accuracy
            # This fixes stats for exams saved before the bug fix
            for exam in exams:
                if exam.get("exam_content"):
                    logger.debug(f"🔄 Recalculating stats for exam {exam['exam_id']}")
                    stats = self._calculate_stats(exam["exam_content"])

                    exam["total_marks"] = stats["total_marks"]
                    exam["total_questions"] = stats["total_questions"]
                    exam["objective_questions_count"] = stats["objective_count"]
                    exam["subjective_questions_count"] = stats["subjective_count"]

            logger.info(f"✅ Found {len(exams)} exams for user {user_id}")
            return exams
        except Exception as e:
            logger.error(f"❌ Failed to retrieve exams for user {user_id}: {str(e)}")
            return []

    def get_exam_by_id(self, exam_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get full exam details by ID (with user verification for security).
        Recalculates stats from exam_content to ensure accuracy.

        Args:
            exam_id: The exam ID
            user_id: The user ID (to verify ownership)

        Returns:
            Full exam record with exam_content and recalculated stats, or None if not found or not owned by user
        """
        try:
            logger.info(f"📖 Fetching exam {exam_id} for user {user_id}")
            response = (
                self.client.table(self.table_name)
                .select("*")
                .eq("exam_id", exam_id)
                .eq("created_by", user_id)
                .single()
                .execute()
            )

            if response.data:
                exam_data = response.data

                # Recalculate stats from exam_content to ensure accuracy
                # This fixes stats for exams saved before the bug fix
                if exam_data.get("exam_content"):
                    logger.info(f"🔄 Recalculating stats for exam {exam_id}")
                    stats = self._calculate_stats(exam_data["exam_content"])

                    # Update the exam data with recalculated stats
                    exam_data["total_marks"] = stats["total_marks"]
                    exam_data["total_questions"] = stats["total_questions"]
                    exam_data["objective_questions_count"] = stats["objective_count"]
                    exam_data["subjective_questions_count"] = stats["subjective_count"]

                    logger.info(f"✅ Recalculated stats - {stats['total_questions']} questions, {stats['total_marks']} marks")

                logger.info(f"✅ Retrieved exam {exam_id}")
                return exam_data
            else:
                logger.warning(f"⚠️  Exam {exam_id} not found or user {user_id} is not the owner")
                return None
        except Exception as e:
            logger.error(f"❌ Failed to retrieve exam {exam_id}: {str(e)}")
            return None
