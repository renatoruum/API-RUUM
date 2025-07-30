# 🚀 Deploy e Produção - API Ruum

## 🛠️ Preparação para Deploy

### 1. Verificações Pré-Deploy

```bash
# Verificar se tudo está funcionando localmente
npm run test:shotstack-full

# Verificar dependências
npm audit

# Verificar configurações
npm run health
```

### 2. Configuração de Ambiente

#### Variáveis de Ambiente (.env)

```env
# Aplicação
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ShotStack
SHOTSTACK_API_KEY=sua_chave_de_producao

# Airtable
AIRTABLE_API_KEY=sua_chave_airtable
AIRTABLE_BASE_ID=seu_base_id
AIRTABLE_TABLE_NAME=sua_tabela

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# ElevenLabs
ELEVENLABS_API_KEY=sua_chave_elevenlabs

# Logs
LOG_LEVEL=info
LOG_DIR=./logs

# Limites
MAX_FILE_SIZE=50MB
REQUEST_TIMEOUT=300000
```

## 🐳 Deploy com Docker

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Alterar proprietário dos arquivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  apiruum:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - apiruum
    restart: unless-stopped
```

### 3. Comandos Docker

```bash
# Build da imagem
docker build -t apiruum:latest .

# Executar container
docker run -d \
  --name apiruum \
  --env-file .env \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  apiruum:latest

# Com docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f apiruum

# Parar e remover
docker-compose down
```

## 🔧 Deploy com PM2

### 1. Instalação do PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Ou com yarn
yarn global add pm2
```

### 2. Configuração (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'apiruum',
    script: './src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 3. Comandos PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Monitorar aplicação
pm2 monit

# Ver logs
pm2 logs apiruum

# Reiniciar
pm2 restart apiruum

# Parar
pm2 stop apiruum

# Remover
pm2 delete apiruum

# Salvar configuração
pm2 save

# Startup automático
pm2 startup
```

## ☁️ Deploy no Google Cloud Run

### Pré-requisitos

1. **Google Cloud CLI instalado e autenticado**
   ```bash
   gcloud auth login
   gcloud config set project api-ruum-project
   ```

2. **Docker configurado para o Artifact Registry**
   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```

3. **Arquivo .env configurado** com todas as chaves de API necessárias

### Deploy Automático

```bash
# Usando o script de deploy
./deploy.sh
```

O script automaticamente:
- ✅ Verifica se todas as variáveis de ambiente estão configuradas
- ✅ Faz o build da imagem Docker
- ✅ Faz o deploy no Cloud Run
- ✅ Mostra as informações do serviço deployado

### Deploy Manual

```bash
# 1. Build da imagem Docker
gcloud builds submit --tag us-central1-docker.pkg.dev/api-ruum-project/apiruum-repo/apiruum:latest

# 2. Deploy no Cloud Run
gcloud run deploy apiruum \
  --image us-central1-docker.pkg.dev/api-ruum-project/apiruum-repo/apiruum:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars SHOTSTACK_API_KEY=sua_chave_aqui
```

## 🌐 Configuração do Nginx

### nginx.conf

```nginx
upstream apiruum {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name seu-dominio.com;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    # SSL
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Proxy para aplicação
    location / {
        proxy_pass http://apiruum;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Arquivos estáticos
    location /static {
        alias /app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Monitoramento

### 1. Health Check

```bash
# Endpoint de saúde
curl -X GET https://seu-dominio.com/api/health

# Resposta esperada
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "services": {
    "shotstack": "ok",
    "airtable": "ok",
    "openai": "ok"
  }
}
```

### 2. Métricas

```bash
# Métricas da aplicação
curl -X GET https://seu-dominio.com/api/metrics

# Métricas do ShotStack
curl -X GET https://seu-dominio.com/api/shotstack/metrics
```

### 3. Alertas

Configure alertas para:
- Status HTTP 500 ou 503
- Tempo de resposta > 30s
- Uso de CPU > 80%
- Uso de memória > 90%
- Falhas na API do ShotStack

## 🔐 Segurança

### 1. Variáveis de Ambiente

```bash
# Nunca commitar arquivos .env
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Usar serviços de secrets
# AWS Secrets Manager
# Azure Key Vault
# Google Secret Manager
```

### 2. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

app.use('/api/', limiter);
```

### 3. Validação de Input

```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/shotstack/render', [
  body('timeline').isObject(),
  body('output').optional().isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Processar requisição
});
```

## 📋 Checklist de Deploy

### Antes do Deploy

- [ ] Testes locais passaram
- [ ] Variáveis de ambiente configuradas
- [ ] Certificado SSL configurado
- [ ] Backup do banco de dados
- [ ] Documentação atualizada

### Durante o Deploy

- [ ] Build da aplicação
- [ ] Deploy da aplicação
- [ ] Verificação de saúde
- [ ] Teste de endpoints críticos
- [ ] Monitoramento ativo

### Após o Deploy

- [ ] Verificar logs
- [ ] Testar todas as funcionalidades
- [ ] Monitorar métricas
- [ ] Configurar alertas
- [ ] Documentar versão deployada

## 🆘 Rollback

### Estratégia de Rollback

```bash
# Com Docker
docker-compose down
docker-compose up -d --build

# Com PM2
pm2 restart apiruum --update-env

# Com Git
git revert HEAD
npm run build
pm2 restart apiruum
```

### Backup e Restore

```bash
# Backup antes do deploy
tar -czf backup-$(date +%Y%m%d).tar.gz src/ package.json .env

# Restore se necessário
tar -xzf backup-YYYYMMDD.tar.gz
npm install
pm2 restart apiruum
```

## 📞 Contato e Suporte

Para problemas de deploy:
1. Verifique os logs: `pm2 logs apiruum`
2. Execute diagnóstico: `npm run diagnose-shotstack`
3. Verifique health check: `curl https://seu-dominio.com/api/health`
4. Contate a equipe de DevOps

### Links Úteis

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [ShotStack Status](https://status.shotstack.io/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
  --cpu 2 \
  --set-env-vars AIRTABLE_API_KEY=sua_chave_aqui \
  --set-env-vars AIRTABLE_BASE_ID=sua_base_id_aqui \
  --set-env-vars AIRTABLE_TABLE_NAME="Images Test API" \
  --set-env-vars OPENAI_API_KEY=sua_chave_openai_aqui \
  --set-env-vars SHOTSTACK_API_KEY=sua_chave_shotstack_aqui \
  --set-env-vars RUNWAYML_API_SECRET=sua_chave_runway_aqui \
  --set-env-vars ELEVENLABS_API_KEY=sua_chave_elevenlabs_aqui \
  --set-env-vars VIRTUAL_STAGING_API_KEY=sua_chave_virtual_staging_aqui \
  --set-env-vars NODE_ENV=production \
  --set-env-vars API_TOKEN=seu_token_api_aqui
```

## Variáveis de Ambiente Obrigatórias

Certifique-se de que seu arquivo `.env` contém todas essas variáveis:

```bash
# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=

# OpenAI
OPENAI_API_KEY=

# Shotstack
SHOTSTACK_API_KEY=

# Runway ML
RUNWAYML_API_SECRET=

# ElevenLabs
ELEVENLABS_API_KEY=

# Virtual Staging AI
VIRTUAL_STAGING_API_KEY=

# API
API_TOKEN=

# Ambiente
NODE_ENV=production
```

## URLs e Informações

- **URL do serviço**: https://apiruum-2cpzkgiiia-uc.a.run.app
- **Região**: us-central1
- **Projeto**: api-ruum-project

## Rotas Disponíveis

- `POST /api/chatgpt` - Processamento com OpenAI
- `POST /api/update-images-airtable` - Atualização de imagens no Airtable
- `POST /api/runway` - Geração de imagens com Runway
- `POST /api/runway/image-to-video` - Geração de vídeo com Runway
- `POST /api/sendShotStack` - Processamento com Shotstack
- `POST /api/elevenlabs/text-to-speech` - Text-to-Speech com ElevenLabs
- `POST /api/virtual-staging/create` - Virtual Staging de imóveis
- `POST /api/virtual-staging/analyze-and-stage` - Análise + Virtual Staging automático
- `POST /webhook` - Webhook principal

## Verificação do Deploy

Para verificar se o deploy foi bem-sucedido:

```bash
# Verificar status do serviço
gcloud run services describe apiruum --region=us-central1

# Verificar logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=apiruum" --limit=10

# Testar a API
curl -X GET "https://apiruum-2cpzkgiiia-uc.a.run.app/api/test"
```

## Troubleshooting

### Erro de autenticação
```bash
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Erro de permissões
```bash
gcloud projects add-iam-policy-binding api-ruum-project \
  --member="user:seu-email@gmail.com" \
  --role="roles/run.admin"
```

### Verificar variáveis de ambiente no serviço
```bash
gcloud run services describe apiruum --region=us-central1 | grep -A 20 "Env vars:"
```
