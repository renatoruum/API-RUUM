# Deploy da API Ruum

Este documento contém as instruções para fazer o deploy da API Ruum no Google Cloud Run.

## Pré-requisitos

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

## Deploy Automático

### Usando o script de deploy

```bash
./deploy.sh
```

O script automaticamente:
- ✅ Verifica se todas as variáveis de ambiente estão configuradas
- ✅ Faz o build da imagem Docker
- ✅ Faz o deploy no Cloud Run
- ✅ Mostra as informações do serviço deployado

## Deploy Manual

### 1. Build da imagem Docker

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/api-ruum-project/apiruum-repo/apiruum:latest
```

### 2. Deploy no Cloud Run

```bash
gcloud run deploy apiruum \
  --image us-central1-docker.pkg.dev/api-ruum-project/apiruum-repo/apiruum:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars AIRTABLE_API_KEY=sua_chave_aqui \
  --set-env-vars AIRTABLE_BASE_ID=sua_base_id_aqui \
  --set-env-vars AIRTABLE_TABLE_NAME="Images Test API" \
  --set-env-vars OPENAI_API_KEY=sua_chave_openai_aqui \
  --set-env-vars SHOTSTACK_API_KEY=sua_chave_shotstack_aqui \
  --set-env-vars RUNWAYML_API_SECRET=sua_chave_runway_aqui \
  --set-env-vars ELEVENLABS_API_KEY=sua_chave_elevenlabs_aqui \
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
