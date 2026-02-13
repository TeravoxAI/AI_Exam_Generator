"""
Response Saver Utility
Saves generated exam responses to JSON files for record keeping and debugging
"""

import os
import json
from datetime import datetime
from typing import Dict, Any

from src.utils import get_logger

logger = get_logger(__name__)

RESPONSES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "responses"
)


def ensure_responses_dir():
    """Ensure responses directory exists"""
    os.makedirs(RESPONSES_DIR, exist_ok=True)
    return RESPONSES_DIR


def save_exam_response(
    subject: str,
    grade: str,
    response_data: Dict[str, Any]
) -> str:
    """
    Save exam response to JSON file

    Args:
        subject: Subject name
        grade: Grade level
        response_data: The complete response object to save

    Returns:
        Path to saved file
    """
    ensure_responses_dir()

    # Create filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"exam_{timestamp}_{subject}_{grade}.json"
    filepath = os.path.join(RESPONSES_DIR, filename)

    try:
        # Save response to file
        with open(filepath, "w") as f:
            json.dump(response_data, f, indent=2)

        logger.info(f"💾 Response saved to: {filepath}")
        return filepath

    except Exception as e:
        logger.error(f"❌ Failed to save response: {str(e)}")
        raise
