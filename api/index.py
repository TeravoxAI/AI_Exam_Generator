"""
Vercel API entry point for Teravox
This file is loaded by Vercel serverless functions
"""

from dotenv import load_dotenv
load_dotenv()

from src.core import create_app

# Create the FastAPI app for Vercel
app = create_app()

# Export the app for Vercel serverless functions
# Vercel will call this as a WSGI application
