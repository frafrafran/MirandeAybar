@echo off
REM ============================================================
REM  Mirande Aybar - abre el sitio en un servidor local
REM  Doble clic en este archivo. Se abre el navegador solo.
REM  Para cerrarlo: cerra esta ventana negra.
REM ============================================================
title Mirande Aybar - servidor local
cd /d "%~dp0"

echo.
echo   Mirande Aybar
echo   -------------------------------------------
echo   Levantando el sitio en http://localhost:5273
echo.
echo   NO CIERRES esta ventana mientras uses el sitio.
echo   Para terminar, cerra esta ventana.
echo   -------------------------------------------
echo.

REM abre el navegador despues de un momento, para que el servidor ya este listo
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5273"

REM python o py, el que exista
where python >nul 2>&1
if %errorlevel%==0 (
  python -m http.server 5273
  goto :fin
)
where py >nul 2>&1
if %errorlevel%==0 (
  py -m http.server 5273
  goto :fin
)

echo   No se encontro Python en esta PC.
echo   Alternativa: abri directamente el archivo index.html
echo   con doble clic. El sitio funciona igual.
echo.
pause

:fin
