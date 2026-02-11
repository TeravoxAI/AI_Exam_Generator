"""Response data models for Teravox API"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union


class FetchContentResponse(BaseModel):
    """Response model for content fetching"""
    success: bool
    data: Optional[Union[Dict[str, Any], List[Any]]] = None
    error: Optional[str] = None


class ExamMetadata(BaseModel):
    """Metadata for generated exam"""
    subject: str
    grade: str
    total_marks: int
    question_types_requested: Optional[dict] = None
    model: str = "openai/gpt-5.1"
    provider: str = "openrouter"


class ExamResponse(BaseModel):
    """Response model for exam generation"""
    success: bool
    exam: Optional[Dict[str, Any]] = None
    metadata: Optional[ExamMetadata] = None
    error: Optional[str] = None
    raw_response: Optional[str] = None
