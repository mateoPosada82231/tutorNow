#!/bin/bash
# pre-deploy-backup.sh - Backup de base de datos antes de deploy
# Uso: ./pre-deploy-backup.sh <database-url> <environment>

set -e

DB_URL=$1
ENV=${2:-staging}

if [ -z "$DB_URL" ]; then
    echo "❌ Uso: $0 <database-url> [staging|production]"
    exit 1
fi

BACKUP_FILE="${ENV}_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Creando backup de $ENV..."
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "✅ Backup creado: $BACKUP_FILE_GZ ($(du -h "$BACKUP_FILE_GZ" | cut -f1))"

# Subir a storage (configurar según proveedor)
# AWS S3:
# aws s3 cp "$BACKUP_FILE_GZ" "s3://tutornow-backups/$ENV/$BACKUP_FILE_GZ"

# Google Cloud Storage:
# gsutil cp "$BACKUP_FILE_GZ" "gs://tutornow-backups/$ENV/$BACKUP_FILE_GZ"

# Azure Blob:
# az storage blob upload --file "$BACKUP_FILE_GZ" --container-name tutornow-backups --name "$ENV/$BACKUP_FILE_GZ"

echo "📤 Backup listo para subir a storage configurado"
echo "   Archivo: $BACKUP_FILE_GZ"
