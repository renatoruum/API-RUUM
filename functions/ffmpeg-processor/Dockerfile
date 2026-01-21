# Dockerfile para Cloud Functions 2ª Geração
# Otimizado para processamento FFmpeg com Debian

FROM node:20-bullseye-slim

# Instalar FFmpeg com codecs completos
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verificar instalação FFmpeg
RUN ffmpeg -version && ffmpeg -encoders | grep libx264

WORKDIR /workspace

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY index.js ./
COPY assets/ ./assets/

# Verificar estrutura
RUN ls -la && ls -la assets/

# Comando para executar a função
CMD ["npm", "start"]
