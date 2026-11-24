#!/bin/bash
# deploy-staging.sh - Deploy backend to staging environment
# Uso: ./deploy-staging.sh <path-to-jar> [--skip-migrations]

set -e

JAR_PATH=$1
SKIP_MIGRATIONS=${2:-false}

if [ -z "$JAR_PATH" ] || [ ! -f "$JAR_PATH" ]; then
    echo "❌ Uso: $0 <path-to-jar> [--skip-migrations]"
    exit 1
fi

echo "🚀 Iniciando deploy a STAGING..."
echo "📦 JAR: $JAR_PATH"

# Verificar variables de entorno requeridas
required_vars=("DB_URL_STAGING" "DB_USERNAME_STAGING" "DB_PASSWORD_STAGING" "JWT_SECRET_STAGING" "APP_VERIFICATION_URL_STAGING" "APP_RESET_URL_STAGING" "APP_CHANGE_CONFIRM_URL_STAGING")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variable de entorno requerida no definida: $var"
        exit 1
    fi
done

# Backup de base de datos antes del deploy (si no se salta migraciones)
if [ "$SKIP_MIGRATIONS" != "--skip-migrations" ]; then
    echo "📦 Creando backup pre-deploy..."
    BACKUP_FILE="staging_backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$DB_URL_STAGING" > "$BACKUP_FILE"
    echo "✅ Backup creado: $BACKUP_FILE"
    # TODO: Subir a S3/GCS para rollback
    # aws s3 cp "$BACKUP_FILE" "s3://tutornow-backups/staging/$BACKUP_FILE"
fi

# TODO: Implementar deploy real según la plataforma elegida
# Ejemplos:

# OPCIÓN A: Render.com (via API)
# curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID_STAGING/deploys" \
#   -H "Authorization: Bearer $RENDER_API_KEY" \
#   -H "Content-Type: application/json"

# OPCIÓN B: Fly.io
# flyctl deploy --config fly.staging.toml --app tutornow-backend-staging

# OPCIÓN C: Railway
# railway up --service backend-staging

# OPCIÓN D: Docker + VPS propio
# docker build -t tutornow-backend:staging .
# docker tag tutornow-backend:staging registry.example.com/tutornow-backend:staging
# docker push registry.example.com/tutornow-backend:staging
# ssh user@staging-server "docker pull registry.example.com/tutornow-backend:staging && docker-compose up -d"

# OPCIÓN E: Java directo en VM
# scp "$JAR_PATH" user@staging-server:/opt/tutornow/backend.jar
# ssh user@staging-server "systemctl restart tutornow-backend"

echo "⚠️  Deploy script incompleto - configurar según plataforma elegida"
echo "   Plataformas recomendadas: Render, Fly.io, Railway"
echo "   Ver docs/deployment-checklist.md sección 3"

# Health check post-deploy
echo "🔍 Verificando health check..."
# TODO: Implementar health check real
# for i in {1..30}; do
#     if curl -f "https://api-staging.tutornow.com/actuator/health/liveness"; then
#         echo "✅ Health check OK"
#         exit 0
#     fi
#     sleep 2
# done
# echo "❌ Health check falló"
# exit 1

echo "✅ Deploy a staging completado (simulado)"
