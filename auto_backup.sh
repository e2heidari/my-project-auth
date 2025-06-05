#!/bin/bash

# Configuration
BACKUP_DIR="backups"
MAX_BACKUPS=7  # Keep last 7 days of backups
LOG_FILE="backup.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Start backup
log "Starting automated backup..."

# Copy the database file
cp prisma/dev.db "$BACKUP_DIR/dev_${TIMESTAMP}.db"
if [ $? -eq 0 ]; then
    log "Backup created successfully: $BACKUP_DIR/dev_${TIMESTAMP}.db"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Cleanup old backups (keep only last MAX_BACKUPS)
log "Cleaning up old backups..."
ls -t $BACKUP_DIR/dev_*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
log "Cleanup completed"

# Log completion
log "Backup process completed successfully" 