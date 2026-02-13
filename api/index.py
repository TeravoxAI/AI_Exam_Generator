"""
Vercel serverless function wrapper for FastAPI
"""
from dotenv import load_dotenv
load_dotenv()

from src.core import create_app

# Create FastAPI app instance
app = create_app()

# Vercel will use this as the handler
# The ASGI app is directly exposed
