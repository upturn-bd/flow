# Real-time Notifications Migration Script (PowerShell)
# This script applies the real-time notifications migration to your Supabase database

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Real-time Notifications Migration" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your Supabase database URL:" -ForegroundColor Yellow
    Write-Host "`$env:DATABASE_URL = 'postgresql://postgres:[password]@[host]:5432/postgres'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run directly from Supabase Dashboard → SQL Editor" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Using database: $DATABASE_URL" -ForegroundColor Green
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Enable real-time replication for notifications table"
Write-Host "  2. Create RLS policies for real-time subscriptions"
Write-Host "  3. Set up necessary indexes for performance"
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "Error: psql command not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools or run the SQL directly:" -ForegroundColor Yellow
    Write-Host "  1. Open Supabase Dashboard → SQL Editor" -ForegroundColor Yellow
    Write-Host "  2. Copy contents of sql/enable_realtime_notifications.sql" -ForegroundColor Yellow
    Write-Host "  3. Paste and run in the SQL Editor" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Run the migration
& psql $DATABASE_URL -f sql/enable_realtime_notifications.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify in Supabase Dashboard → Database → Replication"
    Write-Host "  2. Check that 'notifications' table is in the publication"
    Write-Host "  3. Test real-time notifications in your app"
    Write-Host ""
    Write-Host "To test:" -ForegroundColor Yellow
    Write-Host "  - Open app in two browser windows with same user"
    Write-Host "  - Create a notification"
    Write-Host "  - Verify it appears instantly in both windows"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "✗ Migration failed!" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and:" -ForegroundColor Yellow
    Write-Host "  1. Verify your DATABASE_URL is correct"
    Write-Host "  2. Ensure you have proper database permissions"
    Write-Host "  3. Check if the notifications table exists"
    Write-Host ""
    Write-Host "Alternative: Run SQL manually in Supabase Dashboard" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
