@echo off
cd /d "%~dp0"

:: 用 PowerShell 隐藏启动 Node
powershell -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'scripts\migrate.mjs'" 2>nul

:: 等 Node 启动
timeout /t 2 /nobreak >nul

:: 浏览器 (cmd 原生命令, 不受隐藏窗口影响)
start "" http://localhost:3456

exit
