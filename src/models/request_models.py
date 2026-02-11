"""Request data models for Teravox API"""

from pydantic import BaseModel
from typing import Optional


class FetchContentRequest(BaseModel):
    """Request model for fetching raw content"""
    grade_level: str
    subject: str
    book_type: str


class GenerateExamRequest(BaseModel):
    """Request model for generating exam with questions"""
    subject: str
    grade: str
    activity_page_range: Optional[str] = None
    course_page_range: Optional[str] = None
    question_types: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "subject": "English",
                "grade": "2",
                "course_page_range": "110-113",
                "question_types": {
                    "objective": ["mcq", "true_false", "fill_in_blanks", "match_columns", "circle_correct_answer", "rearrange_sentences", "unseen_comprehension_objective"],
                    "subjective": ["short_answer", "complete_sentences", "make_sentences", "long_answer", "unseen_creative_writing", "picture_description", "unseen_comprehension_subjective"]
                }
            }
        }
