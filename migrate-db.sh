#!/bin/bash

# Database Migration Script
# This script exports data from the VM's PostgreSQL and imports it to Docker PostgreSQL

set -e

echo "🔄 Starting database migration from VM PostgreSQL to Docker PostgreSQL..."

# Export data from VM PostgreSQL
echo "📤 Exporting data from VM PostgreSQL..."
sudo -u postgres pg_dump -h localhost -U postgres -d postgres --clean --if-exists > /tmp/studdy_buddy_backup.sql

echo "✅ Data exported successfully to /tmp/studdy_buddy_backup.sql"

# Wait for Docker PostgreSQL to be ready
echo "⏳ Waiting for Docker PostgreSQL to be ready..."
sleep 10

# Import data to Docker PostgreSQL
echo "📥 Importing data to Docker PostgreSQL..."
docker exec -i studdybuddy-postgres-1 psql -U postgres -d postgres < /tmp/studdy_buddy_backup.sql

echo "✅ Database migration completed successfully!"
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/studdy_buddy_backup.sql

echo "🎉 Migration completed! The application should now work with Docker PostgreSQL."
