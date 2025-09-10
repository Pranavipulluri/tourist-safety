BACKUP_DIR="/backup/tourist-safety"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tourist_safety_db"
DB_USER="postgres"
DB_HOST="localhost"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"

echo "📦 Starting database backup..."

# Create backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Database backup completed: ${BACKUP_FILE}.gz"
    
    # Remove old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up"
    
    # Log success
    logger "Tourist Safety DB backup successful: ${BACKUP_FILE}.gz"
else
    echo "❌ Database backup failed!"
    logger "Tourist Safety DB backup failed!"
    exit 1
fi