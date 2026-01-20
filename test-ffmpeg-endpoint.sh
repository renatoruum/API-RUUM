#!/bin/bash

# Script de teste do endpoint FFmpeg Before/After
# Execute este script após iniciar o servidor com: npm start

echo "🧪 Testando endpoint FFmpeg Before/After..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="/Users/renatopalacio/Documents/Ruum/API_Ruum/apiruum"

echo -e "${YELLOW}📁 Criando arquivos de teste...${NC}"

# Cria imagem vermelha (antes)
ffmpeg -f lavfi -i color=c=red:s=1280x720:d=1 -frames:v 1 "$BASE_DIR/test_antes.jpg" -y &>/dev/null
echo -e "${GREEN}✓${NC} test_antes.jpg (vermelho)"

# Cria imagem azul (depois)
ffmpeg -f lavfi -i color=c=blue:s=1280x720:d=1 -frames:v 1 "$BASE_DIR/test_depois.jpg" -y &>/dev/null
echo -e "${GREEN}✓${NC} test_depois.jpg (azul)"

# Cria vídeo de máscara (metade branca revelando para preta)
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=5 \
  -vf "split[a][b];[a]drawbox=x=iw/2:y=0:w=iw/2:h=ih:color=black:t=fill[a];[b][a]overlay=0:0" \
  "$BASE_DIR/test_mask.mp4" -y &>/dev/null
echo -e "${GREEN}✓${NC} test_mask.mp4 (máscara)"

echo ""
echo -e "${YELLOW}🚀 Enviando requisição para o servidor...${NC}"
echo ""

# Faz a requisição
RESPONSE=$(curl -s -X POST http://localhost:8080/api/ffmpeg/before-after \
  -F "bottom=@$BASE_DIR/test_antes.jpg" \
  -F "top=@$BASE_DIR/test_depois.jpg" \
  -F "mask=@$BASE_DIR/test_mask.mp4" \
  -F "duration=5" \
  -F "width=1280" \
  -F "height=720" \
  -F "fps=25" \
  -F "quality=medium")

# Verifica se a requisição foi bem-sucedida
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Requisição enviada com sucesso!${NC}"
    echo ""
    echo "📋 Resposta:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    
    # Extrai renderId
    RENDER_ID=$(echo "$RESPONSE" | jq -r '.renderId' 2>/dev/null)
    
    if [ ! -z "$RENDER_ID" ] && [ "$RENDER_ID" != "null" ]; then
        echo ""
        echo -e "${BLUE}🎬 Render ID: $RENDER_ID${NC}"
        echo ""
        echo -e "${YELLOW}⏳ Aguardando processamento (verificando a cada 2 segundos)...${NC}"
        
        # Polling de status
        while true; do
            sleep 2
            
            STATUS_RESPONSE=$(curl -s http://localhost:8080/api/ffmpeg/status/$RENDER_ID)
            STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
            PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.progress' 2>/dev/null)
            
            echo -ne "\r${BLUE}Status: $STATUS ($PROGRESS%)${NC}                    "
            
            if [ "$STATUS" = "done" ]; then
                echo ""
                echo ""
                echo -e "${GREEN}✅ Vídeo processado com sucesso!${NC}"
                echo ""
                
                VIDEO_URL=$(echo "$STATUS_RESPONSE" | jq -r '.url' 2>/dev/null)
                LOCAL_PATH=$(echo "$STATUS_RESPONSE" | jq -r '.localPath' 2>/dev/null)
                
                echo "📺 URL: $VIDEO_URL"
                echo "📁 Arquivo local: $LOCAL_PATH"
                
                if [ -f "$LOCAL_PATH" ]; then
                    FILE_SIZE=$(ls -lh "$LOCAL_PATH" | awk '{print $5}')
                    echo "📦 Tamanho: $FILE_SIZE"
                    echo ""
                    echo -e "${GREEN}🎉 Teste concluído com sucesso!${NC}"
                fi
                
                break
            fi
            
            if [ "$STATUS" = "failed" ]; then
                echo ""
                echo ""
                echo -e "${YELLOW}❌ Processamento falhou${NC}"
                ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error' 2>/dev/null)
                echo "Erro: $ERROR"
                break
            fi
        done
    fi
else
    echo -e "${YELLOW}❌ Erro ao conectar ao servidor${NC}"
    echo "Certifique-se que o servidor está rodando em http://localhost:8080"
fi

echo ""
