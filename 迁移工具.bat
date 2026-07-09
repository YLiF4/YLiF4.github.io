@echo off
cd /d "%~dp0"

:: 最小化启动 Node
start "" /min node scripts\migrate.mjs

:: 等服务器启动
timeout /t 3 /nobreak >nul

:: 用 explorer 打开（比 start 更可靠）
explorer http://localhost:3456

exit
