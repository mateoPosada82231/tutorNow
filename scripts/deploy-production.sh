#!/bin/bash
# deploy-production.sh - Deploy backend to production with Blue/Green strategy
# Uso: ./deploy-production.sh <path-to-jar> [--skip-migrations]

set -e

JAR_PATH=$1
SKIP_MIGRATIONS=${2:-false}

if [ -z "$JAR_PATH" ] || [ ! -f "$JAR_PATH" ]; then
    echo "❌ Uso: $0 <path-to-jar> [--skip-migrations]"
    exit 1
fi

echo "🚀 Iniciando deploy a PRODUCCIÓN (Blue/Green)..."
echo "📦 JAR: $JAR_PATH"

# Verificar variables de entorno requeridas
required_vars=("DB_URL_PROD" "DB_USERNAME_PROD" "DB_PASSWORD_PROD" "JWT_SECRET_PROD" "APP_VERIFICATION_URL_PROD" "APP_RESET_URL_PROD" "APP_CHANGE_CONFIRM_URL_PROD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variable de entorno requerida no definida: $var"
        exit 1
    fi
done

# Backup de base de datos antes del deploy
if [ "$SKIP_MIGRATIONS" != "--skip-migrations" ]; then
    echo "📦 Creando backup pre-deploy producción..."
    BACKUP_FILE="prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$DB_URL_PROD" > "$BACKUP_FILE"
    echo "✅ Backup creado: $BACKUP_FILE"
    # TODO: Subir a S3/GCS para rollback
    # aws s3 cp "$BACKUP_FILE" "s3://tutornow-backups/production/$BACKUP_FILE"
fi

# TODO: Implementar Blue/Green deploy real según la plataforma

# EJEMPLO Render.com (Blue/Green nativo):
# 1. Deploy a servicio "green" (inactivo)
# curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_GREEN_ID/deploys" \
#   -H "Authorization: Bearer $RENDER_API_KEY"
# 2. Esperar health checks
# 3. Switch DNS de blue a green
# curl -X PATCH "https://api.render.com/v1/services/$RENDER_SERVICE_BLUE_ID" \
#   -H "Authorization: Bearer $RENDER_API_KEY" \
#   -d '{"suspended": true}'
# curl -X PATCH "https://api.render.com/v1/services/$RENDER_SERVICE_GREEN_ID" \
#   -H "Authorization: Bearer $RENDER_API_KEY" \
#   -d '{"suspended": false}'

# EJEMPLO Fly.io (canary + promote):
# flyctl deploy --config fly.prod.toml --strategy canary --app tutornow-backend-prod
# flyctl releases promote --config fly.prod.toml --app tutornow-backend-prod

# EJEMPLO Kubernetes (Argo Rollouts / Flagger):
# kubectl argo rollouts set image rollout/tutornow-backend tutornow-backend=registry/tutornow-backend:latest
# kubectl argo rollouts promote rollout/tutornow-backend

# EJEMPLO Docker Swarm / VPS con nginx:
# 1. Build y push imagen nueva
# 2. Deploy a stack "green" en puerto 8081
# 3. Health check en puerto 8081
# 4. Switch nginx upstream a puerto 8081
# 5. Mantener "blue" en 8080 por 10 min para rollback rápido

echo "⚠️  Deploy script incompleto - configurar según plataforma elegida"
echo "   Para Blue/Green real: Render, Fly.io, o Kubernetes con Argo Rollouts"
echo "   Ver docs/deployment-checklist.md sección 3 y 4"

# Health check post-deploy
echo "🔍 Verificando health check en producción..."
# TODO: Implementar health check real con rollback automático
# for i in {1..60}; do
#     if curl -f "https://api.tutornow.com/actuator/health/liveness"; then
#         echo "✅ Health check OK - Deploy exitoso"
#         # Notificar Slack/Discord
#         curl -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"✅ Deploy producción v$VERSION exitoso\"}"
#         exit 0
#     fi
#     sleep 5
# done
# echo "❌ Health check falló - INICIANDO ROLLBACK AUTOMÁTICO"
# ./scripts/rollback.sh "$PREVIOUS_VERSION" production
# exit 1

echo "✅ Deploy a producción completado (simulado)"
