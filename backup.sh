#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p backups

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Copy the database file to backups directory with timestamp
cp prisma/dev.db "backups/dev_${TIMESTAMP}.db"

echo "Backup created: backups/dev_${TIMESTAMP}.db" 