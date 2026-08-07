@echo off
cd /d C:\CharityAI\backend
set PYTHONPATH=.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
