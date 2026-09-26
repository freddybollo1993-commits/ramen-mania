@echo off
title Ramen Mania Arcade Master - Servidor Vite
echo =====================================================================
echo   Ramen Mania Arcade Master - Servidor de Desarrollo Vite
echo   Iniciando en puerto 3000...
echo =====================================================================
start http://localhost:3000/
call npx vite --host --port 3000
pause
