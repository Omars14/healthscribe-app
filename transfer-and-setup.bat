@echo off
echo 🚀 Starting Self-Hosted Supabase Migration
echo ==========================================

echo 📤 Step 1: Transferring data files to VPS...
echo.

REM Transfer JSON data files
echo Transferring user_profiles.json...
scp -o StrictHostKeyChecking=no user_profiles.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer user_profiles.json
    goto :error
)

echo Transferring transcriptions.json...
scp -o StrictHostKeyChecking=no transcriptions.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer transcriptions.json
    goto :error
)

echo Transferring document_templates.json...
scp -o StrictHostKeyChecking=no document_templates.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer document_templates.json
    goto :error
)

echo Transferring transcription_edits.json...
scp -o StrictHostKeyChecking=no transcription_edits.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer transcription_edits.json
    goto :error
)

echo Transferring transcription_metrics.json...
scp -o StrictHostKeyChecking=no transcription_metrics.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer transcription_metrics.json
    goto :error
)

echo Transferring export-summary.json...
scp -o StrictHostKeyChecking=no export-summary.json root@154.26.155.207:/var/www/healthscribe/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer export-summary.json
    goto :error
)

echo.
echo ✅ All data files transferred successfully!
echo.

echo 📜 Step 2: Transferring setup scripts...
echo.

REM Transfer setup scripts
echo Transferring setup-selfhosted-complete.sh...
scp -o StrictHostKeyChecking=no setup-selfhosted-complete.sh root@154.26.155.207:/root/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer setup script
    goto :error
)

echo Transferring import-data-to-postgres.js...
scp -o StrictHostKeyChecking=no import-data-to-postgres.js root@154.26.155.207:/root/
if %errorlevel% neq 0 (
    echo ❌ Failed to transfer import script
    goto :error
)

echo.
echo ✅ Setup scripts transferred successfully!
echo.

echo 🔧 Step 3: Connecting to VPS to run setup...
echo.

REM Connect to VPS and run the setup
echo Running setup script on VPS...
echo When prompted for password, enter: Nomar123
echo.
ssh -o StrictHostKeyChecking=no root@154.26.155.207 "chmod +x /root/setup-selfhosted-complete.sh && /root/setup-selfhosted-complete.sh"

if %errorlevel% neq 0 (
    echo ❌ Setup failed!
    goto :error
)

echo.
echo 🎉 Migration Complete!
echo ====================
echo.
echo Your self-hosted Supabase is now running at https://healthscribe.pro
echo.
echo Test accounts:
echo - admin@healthscribe.pro / password123
echo - Your existing cloud accounts should work
echo.
echo Next steps:
echo 1. Visit https://healthscribe.pro
echo 2. Try logging in with your existing credentials
echo 3. Check that all your 1000+ transcriptions are there
echo.

goto :end

:error
echo.
echo ❌ Migration failed! Please check the error messages above.
echo.
echo Troubleshooting:
echo 1. Make sure your VPS is accessible at 154.26.155.207
echo 2. Verify the password is correct (Nomar123)
echo 3. Check that all required files exist in the current directory
echo.

:end
echo Press any key to exit...
pause > nul



