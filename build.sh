#!/bin/bash

# Script apenas para build da imagem Docker
# Útil para testes ou quando não quer fazer deploy completo

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="api-ruum-project"
SERVICE_NAME="apiruum"
IMAGE_NAME="us-central1-docker.pkg.dev/${PROJECT_ID}/apiruum-repo/${SERVICE_NAME}:latest"

echo -e "${BLUE}🔨 Fazendo build da imagem Docker...${NC}"

gcloud builds submit --tag "$IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da imagem Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo -e "${YELLOW}📝 Para fazer o deploy, execute: ./deploy.sh${NC}"
