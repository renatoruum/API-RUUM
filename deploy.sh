#!/bin/bash

# Script de Deploy para API Ruum no Google Cloud Run
# Automatiza o processo de build e deploy da aplicação

set -e  # Para o script se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do projeto
PROJECT_ID="api-ruum-project"
SERVICE_NAME="apiruum"
REGION="us-central1"
IMAGE_NAME="us-central1-docker.pkg.dev/${PROJECT_ID}/apiruum-repo/${SERVICE_NAME}:latest"

echo -e "${BLUE}🚀 Iniciando deploy da API Ruum...${NC}"

# Verifica se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute o script a partir do diretório raiz do projeto.${NC}"
    exit 1
fi

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Erro: arquivo .env não encontrado.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Lendo variáveis de ambiente do arquivo .env...${NC}"

# Lê as variáveis do arquivo .env
source .env

# Verifica se as variáveis obrigatórias estão definidas
required_vars=(
    "AIRTABLE_API_KEY"
    "AIRTABLE_BASE_ID" 
    "AIRTABLE_TABLE_NAME"
    "OPENAI_API_KEY"
    "SHOTSTACK_API_KEY"
    "RUNWAYML_API_SECRET"
    "ELEVENLABS_API_KEY"
    "VIRTUAL_STAGING_API_KEY"
    "API_TOKEN"
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "FIREBASE_PRIVATE_KEY_ID"
    "FIREBASE_PRIVATE_KEY"
    "FIREBASE_CLIENT_EMAIL"
    "FIREBASE_CLIENT_ID"
    "FIREBASE_AUTH_URI"
    "FIREBASE_TOKEN_URI"
    "FIREBASE_AUTH_PROVIDER_X509_CERT_URL"
    "FIREBASE_CLIENT_X509_CERT_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Erro: Variável $var não definida no arquivo .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Todas as variáveis de ambiente encontradas${NC}"

# 1. Build da imagem Docker
echo -e "${YELLOW}🔨 Fazendo build da imagem Docker...${NC}"
gcloud builds submit --tag "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da imagem Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build da imagem concluído com sucesso${NC}"

# 2. Deploy no Cloud Run
echo -e "${YELLOW}🚀 Fazendo deploy no Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "AIRTABLE_API_KEY=${AIRTABLE_API_KEY}" \
  --set-env-vars "AIRTABLE_BASE_ID=${AIRTABLE_BASE_ID}" \
  --set-env-vars "AIRTABLE_TABLE_NAME=${AIRTABLE_TABLE_NAME}" \
  --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
  --set-env-vars "SHOTSTACK_API_KEY=${SHOTSTACK_API_KEY}" \
  --set-env-vars "RUNWAYML_API_SECRET=${RUNWAYML_API_SECRET}" \
  --set-env-vars "ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}" \
  --set-env-vars "VIRTUAL_STAGING_API_KEY=${VIRTUAL_STAGING_API_KEY}" \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "API_TOKEN=${API_TOKEN}" \
  --set-env-vars "FIREBASE_API_KEY=${FIREBASE_API_KEY}" \
  --set-env-vars "FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}" \
  --set-env-vars "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}" \
  --set-env-vars "FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}" \
  --set-env-vars "FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}" \
  --set-env-vars "FIREBASE_APP_ID=${FIREBASE_APP_ID}" \
  --set-env-vars "FIREBASE_PRIVATE_KEY_ID=${FIREBASE_PRIVATE_KEY_ID}" \
  --set-env-vars "FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}" \
  --set-env-vars "FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}" \
  --set-env-vars "FIREBASE_CLIENT_ID=${FIREBASE_CLIENT_ID}" \
  --set-env-vars "FIREBASE_AUTH_URI=${FIREBASE_AUTH_URI}" \
  --set-env-vars "FIREBASE_TOKEN_URI=${FIREBASE_TOKEN_URI}" \
  --set-env-vars "FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${FIREBASE_AUTH_PROVIDER_X509_CERT_URL}" \
  --set-env-vars "FIREBASE_CLIENT_X509_CERT_URL=${FIREBASE_CLIENT_X509_CERT_URL}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no deploy do Cloud Run${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"

# 3. Mostra informações do serviço
echo -e "${BLUE}📋 Informações do serviço:${NC}"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")
echo -e "URL do serviço: ${GREEN}$SERVICE_URL${NC}"

echo -e "${BLUE}🔍 Verificando status do serviço...${NC}"
gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="table(metadata.name,status.url,status.latestReadyRevisionName)"

echo -e "${GREEN}🎉 Deploy da API Ruum concluído com sucesso!${NC}"
echo -e "${BLUE}URL da API: $SERVICE_URL${NC}"
