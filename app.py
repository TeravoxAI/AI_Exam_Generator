"""
Teravox - AI-Powered Exam Generation System
Main entry point
"""

from dotenv import load_dotenv
load_dotenv()  # Load .env file

import uvicorn
from src.core import create_app
from src.utils import get_logger

logger = get_logger(__name__)

if __name__ == "__main__":
    from src.utils.logger import log_startup
    log_startup()

    logger.info("🚀 Creating FastAPI application...")
    app = create_app()
    logger.info("✅ Application created successfully")

    logger.info("🌐 Starting Uvicorn server on http://0.0.0.0:8000")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
