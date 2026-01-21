#!/bin/bash

# Script de Deploy para Cloud Function FFmpeg Processor
# Cloud Functions 2ª Geração com FFmpeg

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROJECT_ID="api-ruum-project"
FUNCTION_NAME="ffmpeg-processor"
REGION="us-central1"
RUNTIME="nodejs20"

echo -e "${BLUE}🚀 Iniciando deploy da Cloud Function FFmpeg Processor${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute o script a partir do diretório da função${NC}"
    exit 1
fi

# Verificar se a máscara existe
if [ ! -f "assets/before_after_mask.mp4" ]; then
    echo -e "${RED}❌ Erro: Máscara before_after_mask.mp4 não encontrada em assets/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Máscara encontrada: $(ls -lh assets/before_after_mask.mp4 | awk '{print $5}')${NC}"
echo ""

# Ler apenas FIREBASE_STORAGE_BUCKET do .env (evita problemas com chaves privadas multiline)
if [ -f "../../apiruum/.env" ]; then
    echo -e "${YELLOW}📦 Carregando bucket do Firebase...${NC}"
    FIREBASE_STORAGE_BUCKET=$(grep "^FIREBASE_STORAGE_BUCKET=" ../../apiruum/.env | cut -d '=' -f2)
fi

# Validar bucket do Firebase
if [ -z "$FIREBASE_STORAGE_BUCKET" ]; then
    echo -e "${YELLOW}⚠️  FIREBASE_STORAGE_BUCKET não definido, usando padrão${NC}"
    FIREBASE_STORAGE_BUCKET="${PROJECT_ID}.appspot.com"
fi

echo -e "${GREEN}✅ Bucket: ${FIREBASE_STORAGE_BUCKET}${NC}"
echo ""

# Deploy da função
echo -e "${YELLOW}🔨 Fazendo deploy da Cloud Function (pode demorar 2-3 minutos)...${NC}"

gcloud functions deploy "$FUNCTION_NAME" \
  --gen2 \
  --runtime "$RUNTIME" \
  --region "$REGION" \
  --source . \
  --entry-point processVideo \
  --trigger-http \
  --allow-unauthenticated \
  --timeout 3600s \
  --memory 8Gi \
  --cpu 4 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}" \
  --project "$PROJECT_ID"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no deploy da Cloud Function${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""

# Obter URL da função
FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
  --gen2 \
  --region "$REGION" \
  --format="value(serviceConfig.uri)" \
  --project "$PROJECT_ID")

echo -e "${BLUE}📋 Informações da função:${NC}"
echo -e "   Nome: ${GREEN}${FUNCTION_NAME}${NC}"
echo -e "   Região: ${GREEN}${REGION}${NC}"
echo -e "   URL: ${GREEN}${FUNCTION_URL}${NC}"
echo -e "   Timeout: ${GREEN}540s (9 minutos)${NC}"
echo -e "   Memória: ${GREEN}8GB${NC}"
echo -e "   CPU: ${GREEN}4 cores${NC}"
echo ""

# Exemplo de teste
echo -e "${BLUE}🧪 Exemplo de teste:${NC}"
echo ""
echo -e "${YELLOW}curl -X POST ${FUNCTION_URL} \\${NC}"
echo -e "${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${YELLOW}  -d '{${NC}"
echo -e "${YELLOW}    \"beforeUrl\": \"https://exemplo.com/before.jpg\",${NC}"
echo -e "${YELLOW}    \"afterUrl\": \"https://exemplo.com/after.jpg\",${NC}"
echo -e "${YELLOW}    \"clientName\": \"teste\",${NC}"
echo -e "${YELLOW}    \"duration\": 8,${NC}"
echo -e "${YELLOW}    \"quality\": \"high\"${NC}"
echo -e "${YELLOW}  }'${NC}"
echo ""

echo -e "${GREEN}🎉 Deploy finalizado!${NC}"
