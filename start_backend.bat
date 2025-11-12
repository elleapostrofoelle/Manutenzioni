@echo off

REM Vai alla cartella principale del progetto
cd /d "C:\Users\clama\dyad-apps\manutenzioni1"

REM Avvia il server compilato (usa il percorso completo di node.exe)
"C:\Program Files\nodejs\node.exe" dist\backend\server.js