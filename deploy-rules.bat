@echo off
echo ========================================
echo Deploying Firestore Rules
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Firebase CLI is not installed!
    echo Please install it with: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo Deploying Firestore rules...
firebase deploy --only firestore:rules

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Rules deployed successfully!
    echo ========================================
    echo.
    echo You can now refresh your dashboard.
    echo The Journal Entries count should work.
) else (
    echo.
    echo ========================================
    echo Deployment failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. You're logged in: firebase login
    echo 2. Project is initialized: firebase init
    echo 3. You have the correct permissions
)

echo.
pause
