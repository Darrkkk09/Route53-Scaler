@echo off
rem Activate the virtual environment and start the FastAPI server
call .venv\Scripts\activate
uvicorn main:app --reload
