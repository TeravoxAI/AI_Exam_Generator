"""
Logging configuration for Teravox
"""

import logging
import os
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Log file paths
LOG_FILE = LOGS_DIR / f"teravox_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
ERROR_LOG_FILE = LOGS_DIR / f"teravox_errors_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"


def get_logger(name: str) -> logging.Logger:
    """
    Get configured logger instance

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Only configure if not already configured
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)

        # Console handler (INFO level)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File handler (DEBUG level - everything)
        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        # Error handler (ERROR level only)
        error_handler = logging.FileHandler(ERROR_LOG_FILE)
        error_handler.setLevel(logging.ERROR)
        error_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s\n%(exc_info)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        error_handler.setFormatter(error_formatter)
        logger.addHandler(error_handler)

    return logger


def log_startup():
    """Log application startup information"""
    logger = get_logger("startup")
    logger.info("=" * 80)
    logger.info("TERAVOX - AI-POWERED EXAM GENERATION SYSTEM")
    logger.info("=" * 80)
    logger.info(f"Version: 1.0.0")
    logger.info(f"Model: openai/gpt-5.1 (via OpenRouter)")
    logger.info(f"Timestamp: {datetime.now()}")
    logger.info(f"Log file: {LOG_FILE}")
    logger.info("=" * 80)


def log_request(method: str, path: str, params: dict = None):
    """Log incoming request"""
    logger = get_logger("request")
    logger.info(f"📨 {method} {path}")
    if params:
        logger.debug(f"   Parameters: {params}")


def log_response(status_code: int, duration: float, success: bool):
    """Log outgoing response"""
    logger = get_logger("response")
    status_icon = "✅" if success else "❌"
    logger.info(f"{status_icon} Status: {status_code} | Duration: {duration:.2f}s")
