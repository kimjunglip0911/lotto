@echo off
setlocal
cd /d "%~dp0apps\web"
if errorlevel 1 (
  echo apps\web 경로로 이동 실패
  pause
  exit /b 1
)

echo [1/3] npm install...
call npm install
if errorlevel 1 (
  echo npm install 실패
  pause
  exit /b 1
)

echo [2/3] 포트 1060 정리...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":1060" ^| findstr "LISTENING"') do (
  echo PID %%a 종료
  taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] npm run dev...
call npm run dev
if errorlevel 1 (
  echo npm run dev 실패
  pause
  exit /b 1
)
