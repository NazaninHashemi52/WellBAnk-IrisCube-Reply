"""
Main entry point wrapper for uvicorn
This allows running: uvicorn main:app --reload
"""
from app.main import app

__all__ = ["app"]

