"""
FastAPI Application
Main entry point for Teravox Exam Generation API
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import time
from src.models import (
    FetchContentRequest,
    FetchContentResponse,
    GenerateExamRequest,
    ExamResponse,
)
from src.services import get_llm_service, get_supabase_service
from src.services.exam_storage_service import ExamStorageService
from src.utils import get_logger, save_exam_response
from src.routers import authentication
from src.routers.authorization import get_current_user

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title="Teravox API",
        description="AI-powered exam generation with pedagogical grounding",
        version="1.0.0"
    )

    # CORS middleware for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, specify exact origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include authentication router
    app.include_router(authentication.router, prefix="/auth", tags=["Authentication"])

    # Services will be lazily initialized on first use

    @app.get("/")
    async def root():
        """Health check endpoint"""
        return {
            "message": "Teravox API running",
            "status": "healthy",
            "version": "1.0.0"
        }

    @app.post("/fetch-content", response_model=FetchContentResponse)
    async def fetch_content(request: FetchContentRequest):
        """Fetch raw textbook content"""
        try:
            supabase_service = get_supabase_service()
            content_data = supabase_service.fetch_content(
                grade_level=request.grade_level,
                subject=request.subject,
                book_type=request.book_type
            )

            if not content_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"No content found for {request.grade_level}/{request.subject}/{request.book_type}"
                )

            # Extract parsed content
            parsed_contents = [item.get("parsed") for item in content_data]

            return FetchContentResponse(
                success=True,
                data=parsed_contents
            )

        except HTTPException:
            raise
        except Exception as e:
            return FetchContentResponse(success=False, error=str(e))

    @app.post("/generate-exam", response_model=dict)
    async def generate_exam(request: GenerateExamRequest):
        """Fetch content from specified page ranges"""
        try:
            supabase_service = get_supabase_service()

            if not request.activity_page_range and not request.course_page_range:
                raise HTTPException(
                    status_code=400,
                    detail="Provide activity_page_range or course_page_range"
                )

            all_content = []

            # Fetch activity pages
            if request.activity_page_range:
                activity_pages = supabase_service.get_pages_in_range(
                    grade_level=request.grade,
                    subject=request.subject,
                    book_type="Activity",
                    page_range=request.activity_page_range
                )
                for page in activity_pages:
                    all_content.append({
                        "page_number": page.get("book_page_no"),
                        "book_type": "Activity",
                        "content": page
                    })

            # Fetch course pages
            if request.course_page_range:
                course_pages = supabase_service.get_pages_in_range(
                    grade_level=request.grade,
                    subject=request.subject,
                    book_type="Course",
                    page_range=request.course_page_range
                )
                for page in course_pages:
                    all_content.append({
                        "page_number": page.get("book_page_no"),
                        "book_type": "Course",
                        "content": page
                    })

            if not all_content:
                raise HTTPException(
                    status_code=404,
                    detail=f"No content found for specified ranges"
                )

            return {
                "success": True,
                "subject": request.subject,
                "grade": request.grade,
                "total_pages": len(all_content),
                "pages_fetched": [item["page_number"] for item in all_content],
                "content": all_content,
                "question_types": request.question_types
            }

        except HTTPException:
            raise
        except Exception as e:
            return {"success": False, "error": str(e)}

    @app.get("/get-my-exams")
    async def get_my_exams(current_user: dict = Depends(get_current_user)):
        """Get all exams created by the current user (Protected)"""
        logger.info("=" * 80)
        logger.info("📋 /get-my-exams ENDPOINT CALLED")
        logger.info(f"👤 User: {current_user.get('email', 'unknown')}")
        logger.info("=" * 80)

        try:
            user_id = current_user.get('id')
            if not user_id:
                raise HTTPException(status_code=400, detail="User ID not found in token")

            exam_storage_service = ExamStorageService(get_supabase_service().client)
            exams = exam_storage_service.get_exams_by_user(user_id)

            logger.info(f"✅ Retrieved {len(exams)} exams for user {user_id}")

            return {
                "success": True,
                "user_id": user_id,
                "total_exams": len(exams),
                "exams": exams
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error fetching user exams: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "exams": []
            }

    @app.get("/debug-exam/{exam_id}")
    async def debug_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
        """Debug endpoint to see raw exam structure (Protected)"""
        try:
            user_id = current_user.get('id')
            exam_storage_service = ExamStorageService(get_supabase_service().client)
            exam = exam_storage_service.get_exam_by_id(exam_id, user_id)

            if not exam:
                raise HTTPException(status_code=404, detail="Exam not found")

            # Return the raw exam_content for debugging
            return {
                "success": True,
                "exam_content": exam.get("exam_content"),
                "make_sentences_structure": exam.get("exam_content", {}).get("subjective", {}).get("make_sentences") if exam else None
            }
        except Exception as e:
            logger.error(f"Debug error: {str(e)}")
            return {"success": False, "error": str(e)}

    @app.get("/get-exam/{exam_id}")
    async def get_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
        """Get full exam details by ID (Protected - only accessible by owner)"""
        logger.info("=" * 80)
        logger.info(f"📖 /get-exam/{exam_id} ENDPOINT CALLED")
        logger.info(f"👤 User: {current_user.get('email', 'unknown')}")
        logger.info("=" * 80)

        try:
            user_id = current_user.get('id')
            if not user_id:
                raise HTTPException(status_code=400, detail="User ID not found in token")

            exam_storage_service = ExamStorageService(get_supabase_service().client)
            exam = exam_storage_service.get_exam_by_id(exam_id, user_id)

            if not exam:
                raise HTTPException(
                    status_code=404,
                    detail="Exam not found or you don't have permission to access it"
                )

            logger.info(f"✅ Retrieved exam {exam_id}")

            return {
                "success": True,
                "exam": exam
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error fetching exam {exam_id}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

    @app.post("/generate-exam-questions", response_model=ExamResponse)
    async def generate_exam_questions(
        request: GenerateExamRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Complete pipeline: Fetch content + Generate questions (Protected)"""
        logger.info("=" * 80)
        logger.info("🎯 /generate-exam-questions ENDPOINT CALLED")
        logger.info(f"👤 User: {current_user.get('email', 'unknown')}")
        logger.info("=" * 80)

        start_time = time.time()

        logger.info("📥 Request received:")
        logger.info(f"   Subject: {request.subject}")
        logger.info(f"   Grade: {request.grade}")
        logger.info(f"   Activity page range: {request.activity_page_range}")
        logger.info(f"   Course page range: {request.course_page_range}")
        logger.info(f"   Question types: {request.question_types}")

        try:
            logger.info("🔧 Initializing services...")
            supabase_service = get_supabase_service()
            llm_service = get_llm_service()
            exam_storage_service = ExamStorageService(supabase_service.client)
            logger.info("✅ Services initialized")

            if not request.activity_page_range and not request.course_page_range:
                raise HTTPException(
                    status_code=400,
                    detail="Provide activity_page_range or course_page_range"
                )

            if not request.question_types:
                raise HTTPException(
                    status_code=400,
                    detail="question_types must be provided"
                )

            # Fetch content
            logger.info("📂 Fetching content from Supabase...")
            all_content_text = []

            if request.activity_page_range:
                logger.info(f"📥 Fetching Activity pages: {request.activity_page_range}")
                pages = supabase_service.get_pages_in_range(
                    request.grade, request.subject, "Activity",
                    request.activity_page_range
                )
                logger.info(f"   Found {len(pages)} activity pages")
                all_content_text.extend([p.get("content", "") for p in pages])
                logger.info(f"   Total content so far: {sum(len(p.get('content', '')) for p in pages)} chars")

            if request.course_page_range:
                logger.info(f"📥 Fetching Course pages: {request.course_page_range}")
                pages = supabase_service.get_pages_in_range(
                    request.grade, request.subject, "Course",
                    request.course_page_range
                )
                logger.info(f"   Found {len(pages)} course pages")
                all_content_text.extend([p.get("content", "") for p in pages])
                logger.info(f"   Total content accumulated: {sum(len(c) for c in all_content_text)} chars")

            if not all_content_text:
                logger.error("❌ No content found in database")
                raise HTTPException(status_code=404, detail="No content found")

            # Aggregate content
            logger.info(f"✅ Found {len(all_content_text)} content blocks")
            aggregated_content = "\n\n---\n\n".join(all_content_text)
            logger.info(f"📝 Aggregated content length: {len(aggregated_content)} chars")

            # Convert question_types array format to object format with default 5 per type
            processed_question_types = {}
            if request.question_types:
                for category, types_list in request.question_types.items():
                    if isinstance(types_list, list):
                        # Convert array format to object format with default 5 questions each
                        processed_question_types[category] = {
                            question_type: 5 for question_type in types_list
                        }
                    else:
                        # If already in object format, use as-is
                        processed_question_types[category] = types_list

            logger.info(f"📋 Processed question types: {processed_question_types}")

            # Generate questions
            logger.info("🤖 Calling LLM service to generate questions...")
            result = llm_service.generate_exam_questions(
                content=aggregated_content,
                subject=request.subject,
                grade=request.grade,
                question_types=processed_question_types,
                total_marks=100
            )

            elapsed = time.time() - start_time
            logger.info(f"⏱️  Total request time: {elapsed:.2f}s")

            if result.get("success"):
                logger.info("✅ EXAM GENERATION SUCCESSFUL")
                logger.info(f"   Exam structure: {list(result.get('exam', {}).keys())}")

                # Save exam JSON to file (clean, without wrapper)
                exam_data = result.get("exam")
                try:
                    save_exam_response(
                        subject=request.subject,
                        grade=request.grade,
                        response_data=exam_data
                    )
                except Exception as e:
                    logger.warning(f"⚠️  Could not save response file: {str(e)}")

                # Save exam to database with cost metadata
                try:
                    logger.info("💾 Saving exam to database...")
                    db_result = exam_storage_service.save_exam(
                        subject=request.subject,
                        grade=request.grade,
                        exam_content=exam_data,
                        request_metadata={"question_types": request.question_types},
                        llm_metadata=result.get("metadata", {}),
                        course_page_range=request.course_page_range,
                        activity_page_range=request.activity_page_range,
                        created_by=current_user.get('id', 'api'),
                        request_id=None,  # Can be populated if request tracking is needed
                    )
                    logger.info(f"✅ Exam saved to database: {db_result.get('exam_id')}")
                except Exception as e:
                    logger.warning(f"⚠️  Could not save exam to database: {str(e)}")

                return ExamResponse(
                    success=True,
                    exam=exam_data
                )
            else:
                logger.error(f"❌ EXAM GENERATION FAILED: {result.get('error')}")

                # Save failed response to file for debugging
                response_obj = {
                    "success": False,
                    "error": result.get("error"),
                    "raw_response": result.get("raw_response")
                }
                try:
                    save_exam_response(
                        subject=request.subject,
                        grade=request.grade,
                        response_data=response_obj
                    )
                except Exception as e:
                    logger.warning(f"⚠️  Could not save error response file: {str(e)}")

                return ExamResponse(
                    success=False,
                    error=result.get("error"),
                    raw_response=result.get("raw_response")
                )

        except HTTPException as e:
            logger.error(f"❌ HTTP Exception: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}", exc_info=True)
            return ExamResponse(success=False, error=str(e))

    return app
