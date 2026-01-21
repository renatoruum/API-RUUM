# FFmpeg Processor - Cloud Function

Cloud Function de 2ª geração para processar vídeos before/after com FFmpeg de alta qualidade.

## 📋 Características

- ✅ **Alta Qualidade**: Controle total sobre preset, CRF e filtros FFmpeg
- ✅ **Confiável**: Sem throttling de CPU, timeout de 9 minutos
- ✅ **Escalável**: Auto-scaling até 10 instâncias paralelas
- ✅ **Eficiente**: Custo ~$0.015 por vídeo (100x mais barato que Cloud Run)
- ✅ **Rápido**: 60-120s por vídeo de 8s em 720p

## 🚀 Deploy

```bash
# Dar permissão de execução
chmod +x deploy.sh

# Fazer deploy
./deploy.sh
```

## 📡 Uso

### Request

```bash
POST https://us-central1-api-ruum-project.cloudfunctions.net/ffmpeg-processor

Content-Type: application/json

{
  "beforeUrl": "https://exemplo.com/before.jpg",
  "afterUrl": "https://exemplo.com/after.jpg",
  "clientName": "cliente-ruum",
  "duration": 8,
  "quality": "high"
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `beforeUrl` | string | ✅ | - | URL da imagem "antes" |
| `afterUrl` | string | ✅ | - | URL da imagem "depois" |
| `clientName` | string | ✅ | - | Nome do cliente (para organizar no Storage) |
| `duration` | number | ❌ | 8 | Duração do vídeo em segundos |
| `quality` | string | ❌ | "high" | Qualidade: "low", "medium", "high", "ultra" |

### Response (Sucesso)

```json
{
  "success": true,
  "jobId": "uuid-do-job",
  "url": "https://storage.googleapis.com/bucket/videos/cliente/uuid.mp4",
  "metadata": {
    "duration": 65432,
    "videoSizeMB": 2.45,
    "quality": "high",
    "clientName": "cliente-ruum"
  }
}
```

### Response (Erro)

```json
{
  "success": false,
  "error": "Mensagem de erro detalhada",
  "jobId": "uuid-do-job"
}
```

## ⚙️ Configuração

### Presets de Qualidade

| Quality | CRF | Preset | Tamanho Aprox. | Uso Recomendado |
|---------|-----|--------|----------------|-----------------|
| `low` | 28 | veryfast | ~1-2 MB | Testes rápidos |
| `medium` | 23 | medium | ~2-3 MB | Produção normal |
| `high` | 18 | medium | ~3-5 MB | Alta qualidade (padrão) |
| `ultra` | 15 | slow | ~5-8 MB | Máxima qualidade |

### Recursos Cloud Functions

```yaml
Memória: 8GB
CPU: 4 cores
Timeout: 540s (9 min)
Runtime: Node.js 20
Geração: 2ª geração
Max Instances: 10
Min Instances: 0 (auto-scale)
```

## 📦 Estrutura de Arquivos

```
ffmpeg-processor/
├── index.js              # Código principal
├── package.json          # Dependências
├── Dockerfile            # Build com FFmpeg
├── deploy.sh             # Script de deploy
├── .gcloudignore         # Arquivos ignorados
├── README.md             # Esta documentação
└── assets/
    └── before_after_mask.mp4  # Máscara de revelação
```

## 🔍 Logs

Visualizar logs em tempo real:

```bash
gcloud functions logs read ffmpeg-processor \
  --gen2 \
  --region us-central1 \
  --limit 50
```

Seguir logs (tail):

```bash
gcloud functions logs tail ffmpeg-processor \
  --gen2 \
  --region us-central1
```

## 💰 Custos Estimados

**Cenário: 100 vídeos/mês, 60s de processamento cada**

```
Invocações: 100 × $0.0003 = $0.03
Compute (8GB, 4 CPU, 60s): 100 × $0.015 = $1.50
Storage (temporário): ~$0.01

Total mensal: ~$1.54
Custo por vídeo: ~$0.015
```

## 🐛 Troubleshooting

### Erro: Máscara não encontrada

```bash
# Verificar se a máscara existe
ls -lh assets/before_after_mask.mp4

# Re-deploy se necessário
./deploy.sh
```

### Timeout

- Vídeos >1080p podem ultrapassar 9 minutos
- Solução: Use quality "medium" ou "low"

### Erro de memória

- Imagens muito grandes (>10MB) podem causar OOM
- Solução: Redimensionar imagens antes do upload

## 📚 Documentação

- [Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Cloud Storage Node.js](https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-nodejs)

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar Functions Framework
npm start

# Testar localmente
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"beforeUrl":"...","afterUrl":"...","clientName":"teste"}'
```

## 📝 Notas

- A função é **stateless** - não mantém estado entre invocações
- Arquivos temporários em `/tmp` são limpos automaticamente
- Máximo de 10 vídeos processando simultaneamente
- URLs das imagens devem estar acessíveis publicamente
