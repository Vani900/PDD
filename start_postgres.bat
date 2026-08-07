@echo off
cd /d C:\CharityAI
if exist "c:\CharityAI\pgdata\postmaster.pid" del /f /q "c:\CharityAI\pgdata\postmaster.pid"
"c:\CharityAI\pg16\postgresql-16.2.0-x86_64-pc-windows-msvc\bin\postgres.exe" -D "c:\CharityAI\pgdata" >> "c:\CharityAI\postgres.log" 2>&1
