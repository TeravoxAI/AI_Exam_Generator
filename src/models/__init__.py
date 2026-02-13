"""Data models for Teravox"""

from .request_models import (
    FetchContentRequest,
    GenerateExamRequest,
)
from .response_models import (
    FetchContentResponse,
    ExamResponse,
)
from .auth_models import (
    UserCredentials,
    UserRegistration,
    AuthResponse,
)

__all__ = [
    "FetchContentRequest",
    "GenerateExamRequest",
    "FetchContentResponse",
    "ExamResponse",
    "UserCredentials",
    "UserRegistration",
    "AuthResponse",
]
