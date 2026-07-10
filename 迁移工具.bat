@echo off
cd /d "%~dp0"

set "URL=http://localhost:3456"
set "NODE_EXE="

for /f "delims=" %%N in ('where node 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%N"
)
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not defined NODE_EXE (
  echo [Error] Node.js not found.
  echo Please install Node.js or add node.exe to system PATH.
  pause
  exit /b 1
)

echo ============================================
echo   Blog Migration Tool
echo   Node: %NODE_EXE%
echo ============================================
echo.
echo Starting server...

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath '%NODE_EXE%' -ArgumentList 'scripts\migrate.mjs' -WorkingDirectory '%~dp0'"

if errorlevel 1 (
  echo [Error] Failed to start Node.js server.
  pause
  exit /b 1
)

echo Waiting for server to start...
set "READY=0"
for /L %%i in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 1;if($r.StatusCode -eq 200){exit 0}}catch{}exit 1" >nul 2>&1
  if not errorlevel 1 (
    set "READY=1"
    goto :ready
  )
  ping -n 2 127.0.0.1 >nul
)

:ready
if "%READY%"=="0" (
  echo [Warning] Server may not have fully started yet.
)

echo Opening browser: %URL%
explorer "%URL%"

echo.
echo Migration tool is running at %URL%
echo Close the browser tab to auto-stop the server.

exit
