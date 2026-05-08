"""
Vercel API entry point for Teravox
This file is loaded by Vercel serverless functions
"""

import sys
import os

# Add repo root to path so src/ imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from src.core import create_app

# Create the FastAPI app for Vercel
app = create_app()

# Export the app for Vercel serverless functions
# Vercel will call this as a WSGI application
