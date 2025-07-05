#!/bin/bash

# Database Migration Script for StuddyBuddy
# This script updates the database schema with new fields

set -e  # Exit on any error

echo "🔄 Starting database migration..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "📊 Running database migrations..."

# Run the migration SQL commands
docker-compose exec postgres psql -U postgres -d postgres -c "
-- Add new columns to chotha table
ALTER TABLE chotha 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Modify stickynotes table
ALTER TABLE stickynotes 
  DROP COLUMN IF EXISTS question,
  DROP COLUMN IF EXISTS answer;

ALTER TABLE stickynotes 
  ADD COLUMN IF NOT EXISTS front TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS back TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS importance VARCHAR(10) CHECK (importance IN ('high', 'medium', 'low')) DEFAULT 'medium';

ALTER TABLE stickynotes 
  ADD COLUMN IF NOT EXISTS notes JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add questions column to quiz table
ALTER TABLE quiz
ADD COLUMN IF NOT EXISTS questions JSONB;

-- Add title column to stickynotes table
ALTER TABLE stickynotes
ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT 'Untitled Notes';
"

echo "✅ Database migration completed successfully!"
