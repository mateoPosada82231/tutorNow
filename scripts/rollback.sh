#!/bin/bash
# rollback.sh - Rollback backend a versión anterior
# Uso: ./rollback.sh <version-tag-o-sha> <environment> [--skip-migrations]
# Ejemplo: ./rollback.sh abc1234 staging
# Ejemplo: ./rollback.sh v1.0.0 production --skip-migrations

set -e

VERSION=$1
ENV=$2
SKIP_MIGRATIONS=${3:-false}

if [ -z "$VERSION" ] || [ -z "$ENV" ]; then
    echo "❌ Uso: $0 <version-tag-o-sha> <staging|production> [--skip-migrations]"
    exit 1
fi

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "❌ Environment debe ser 'staging' o 'production'"
    exit 1
fi

echo "🔄 Iniciando rollback a $VERSION en $ENV..."

# Verificar que el artifact existe en GitHub Actions
# (requiere gh CLI autenticado)
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) no instalado. Instalar: https://cli.github.com/"
    exit 1
fi

# Descargar artifact de la versión
ARTIFACT_NAME="tutornow-backend-$VERSION"
DOWNLOAD_DIR="./artifact_rollback_$VERSION"
mkdir -p "$DOWNLOAD_DIR"

echo "⬇️  Descargando artifact $ARTIFACT_NAME..."
gh run download --repo mateoPosada82231/tutorNow --name "$ARTIFACT_NAME" --dir "$DOWNLOAD_DIR" 2>/dev/null || {
    echo "❌ No se pudo descargar artifact $ARTIFACT_NAME"
    echo "   Verificar que existe en GitHub Actions (retention: 30 días)"
    exit 1
}

JAR_FILE=$(find "$DOWNLOAD_DIR" -name "*.jar" | head -1)
if [ -z "$JAR_FILE" ] || [ ! -f "$JAR_FILE" ]; then
    echo "❌ No se encontró JAR en artifact descargado"
    exit 1
fi

echo "📦 JAR encontrado: $JAR_FILE"

# Ejecutar deploy de la versión anterior
if [ "$ENV" = "production" ]; then
    ./scripts/deploy-production.sh "$JAR_FILE" "$SKIP_MIGRATIONS"
else
    ./scripts/deploy-staging.sh "$JAR_FILE" "$SKIP_MIGRATIONS"
fi

# Notificar
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"⚠️ Rollback a $VERSION en $ENV completado\"}"
fi

echo "✅ Rollback a $VERSION en $ENV completado"
