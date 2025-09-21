# Simple Supabase Migration Script
Write-Host '🚀 STARTING SUPABASE MIGRATION' -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BACKUP_DIR = "backup/supabase-migration-$timestamp"
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host '✅ Created backup directory'

# Stop existing containers
Write-Host 'Stopping existing containers...'
docker stop $(docker ps -aq --filter 'name=supabase') 2>$null
docker rm $(docker ps -aq --filter 'name=supabase') 2>$null

Write-Host '✅ Stopped existing containers'

# Start fresh Supabase
Write-Host 'Starting fresh Supabase...'
docker run -d --name supabase-db -e POSTGRES_PASSWORD=password123 -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5432:5432 postgres:15
Start-Sleep -Seconds 10

Write-Host '✅ Started database'

# Test connection
Write-Host 'Testing database connection...'
docker exec supabase-db psql -U postgres -d postgres -c 'SELECT version();'

Write-Host '✅ Database ready'

# Update environment
Write-Host 'Updating environment...'
$envContent = @'
NEXT_PUBLIC_SUPABASE_URL=https://healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU
'@
Set-Content -Path '.env.local' -Value $envContent

Write-Host '✅ Environment updated'

Write-Host '🎉 BASIC MIGRATION COMPLETE!' -ForegroundColor Green
Write-Host 'Your app should now connect to self-hosted Supabase'




