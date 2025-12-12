#!/bin/bash

# Real-time Notifications Migration Script
# This script applies the real-time notifications migration to your Supabase database

echo "=================================================="
echo "Real-time Notifications Migration"
echo "=================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your Supabase database URL:"
    echo "export DATABASE_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    echo ""
    exit 1
fi

echo "Using database: $DATABASE_URL"
echo ""
echo "This will:"
echo "  1. Enable real-time replication for notifications table"
echo "  2. Create RLS policies for real-time subscriptions"
echo "  3. Set up necessary indexes for performance"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "Running migration..."
echo ""

# Run the migration
psql "$DATABASE_URL" -f sql/enable_realtime_notifications.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✓ Migration completed successfully!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "  1. Verify in Supabase Dashboard → Database → Replication"
    echo "  2. Check that 'notifications' table is in the publication"
    echo "  3. Test real-time notifications in your app"
    echo ""
    echo "To test:"
    echo "  - Open app in two browser windows with same user"
    echo "  - Create a notification"
    echo "  - Verify it appears instantly in both windows"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "✗ Migration failed!"
    echo "=================================================="
    echo ""
    echo "Please check the error messages above and:"
    echo "  1. Verify your DATABASE_URL is correct"
    echo "  2. Ensure you have proper database permissions"
    echo "  3. Check if the notifications table exists"
    echo ""
    exit 1
fi
