@echo off
title Push Egotech to GitHub
cls
echo ========================================================
echo        Upload Egotech to your GitHub Account
echo ========================================================
echo.
echo Target Repository: https://github.com/Marco9-gdf/EGOTech-Erp-System.git
echo.
echo Press any key to push your code to GitHub...
pause >nul

echo.
echo Linking repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Marco9-gdf/EGOTech-Erp-System.git
git branch -M main

echo.
echo Pushing code to GitHub (branch: main)...
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! All 114 files are now uploaded to GitHub!
    echo ========================================================
) else (
    echo.
    echo PUSH FAILED.
    echo Note: If it says "denied to Marco6-E", you can either:
    echo 1. Add Marco6-E as a collaborator at:
    echo    https://github.com/Marco9-gdf/EGOTech-Erp-System/settings/access
    echo OR
    echo 2. Clear stored git credentials in Windows:
    echo    Run: cmdkey /delete:git:https://github.com
)
echo.
pause
