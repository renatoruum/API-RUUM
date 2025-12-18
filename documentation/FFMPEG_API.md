# API FFmpeg - Processamento de Vídeo Antes/Depois

API para criar vídeos com efeito "antes e depois" usando FFmpeg. Processa duas imagens (antes/depois) e aplica um efeito de revelação usando uma máscara de vídeo pré-definida.

---

## 📋 Índice

1. [Endpoints Disponíveis](#endpoints-disponíveis)
2. [Modo Recomendado: URLs Públicas](#modo-recomendado-urls-públicas)
3. [Modo Alternativo: Upload de Arquivos](#modo-alternativo-upload-de-arquivos)
4. [Exemplos Front-end](#exemplos-front-end)
5. [Polling de Status](#polling-de-status)
6. [Arquitetura](#arquitetura)

---

## Endpoints Disponíveis

### 1. 🎯 **POST `/api/ffmpeg/before-after`** (RECOMENDADO)
Processa vídeo a partir de URLs públicas de imagens.

**Por que usar URLs?**
- ✅ Escalável (não sobrecarrega servidor com uploads)
- ✅ Mais rápido (imagens já estão no Airtable/CDN)
- ✅ Mesma arquitetura do Shotstack
- ✅ Sem limite de tamanho de requisição HTTP

**Content-Type:** `application/json`

**Body:**
```json
{
  "beforeUrl": "https://url-da-imagem-antes.jpg",
  "afterUrl": "https://url-da-imagem-depois.jpg",
  "clientName": "nome-do-cliente",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "fps": 25,
  "quality": "high"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `beforeUrl` | string | ✅ Sim | - | URL pública da imagem "antes" |
| `afterUrl` | string | ✅ Sim | - | URL pública da imagem "depois" |
| `clientName` | string | ✅ Sim | - | Nome do cliente (para organizar no Firebase) |
| `duration` | number | ❌ Não | 10 | Duração do vídeo em segundos |
| `width` | number | ❌ Não | 1280 | Largura do vídeo |
| `height` | number | ❌ Não | 720 | Altura do vídeo |
| `fps` | number | ❌ Não | 25 | Taxa de quadros por segundo |
| `quality` | string | ❌ Não | "high" | Qualidade: `low`, `medium`, `high` |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "renderId": "817fc7cb-a0b4-4f2d-a401-38676b417971",
  "status": "queued",
  "message": "Processamento de vídeo iniciado"
}
```

**Resposta de Erro (400):**
```json
{
  "success": false,
  "error": "É necessário fornecer: beforeUrl e afterUrl"
}
```

---

### 2. 📊 **GET `/api/ffmpeg/status/:renderId`**
Verifica o status de um processamento.

**Resposta:**
```json
{
  "success": true,
  "id": "817fc7cb-a0b4-4f2d-a401-38676b417971",
  "status": "done",
  "url": "https://firebasestorage.googleapis.com/v0/b/api-ruum.firebasestorage.app/o/clients%2Fteste-airtable%2Fvideos%2F1766080728876_before-after-817fc7cb.mp4?alt=media&token=...",
  "progress": 100,
  "error": null,
  "created": "2025-12-18T17:58:25.224Z",
  "updated": "2025-12-18T17:58:51.780Z"
}
```

**Status Possíveis:**

| Status | Progresso | Descrição |
|--------|-----------|-----------|
| `queued` | 0% | Na fila, aguardando processamento |
| `downloading` | 5-20% | Baixando imagens das URLs |
| `processing` | 20-95% | Processando vídeo com FFmpeg |
| `uploading` | 95-99% | Fazendo upload para Firebase Storage |
| `done` | 100% | ✅ Concluído com sucesso |
| `failed` | 0% | ❌ Erro no processamento |

---

### 3. ⏱️ **POST `/api/ffmpeg/wait/:renderId`**
Aguarda a conclusão do processamento (polling automático).

**Body (opcional):**
```json
{
  "maxWaitTime": 300,
  "pollInterval": 2
}
```

**Resposta:** Mesma estrutura do `/status`, mas aguarda até completar ou dar timeout.

---

### 4. 📤 **POST `/api/ffmpeg/before-after-upload`** (ALTERNATIVO)
Upload direto de arquivos (use apenas se não tiver URLs públicas).

**Content-Type:** `multipart/form-data`

**Campos:**
- `before` (file): Imagem antes (jpg/png)
- `after` (file): Imagem depois (jpg/png)
- `duration`, `width`, `height`, etc. (texto)

---

## 🎨 Exemplos Front-end

### **React/Next.js - Modo URLs (Recomendado)**

```typescript
import { useState } from 'react';

interface RenderStatus {
  success: boolean;
  id: string;
  status: 'queued' | 'downloading' | 'processing' | 'uploading' | 'done' | 'failed';
  url: string | null;
  progress: number;
  error: string | null;
}

export function BeforeAfterVideoProcessor() {
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const createVideo = async (beforeUrl: string, afterUrl: string, clientName: string) => {
    setLoading(true);

    try {
      // 1. Inicia o processamento
      const response = await fetch('http://localhost:8080/api/ffmpeg/before-after', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beforeUrl,
          afterUrl,
          clientName,
          duration: 8,
          quality: 'high'
        }),
      });

      const { renderId } = await response.json();

      // 2. Faz polling do status
      await pollStatus(renderId);

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async (renderId: string) => {
    const pollInterval = 2000; // 2 segundos
    const maxAttempts = 90; // 3 minutos máximo

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`http://localhost:8080/api/ffmpeg/status/${renderId}`);
      const data: RenderStatus = await response.json();

      setStatus(data);

      // Processamento concluído
      if (data.status === 'done') {
        console.log('✅ Vídeo pronto:', data.url);
        return data;
      }

      // Erro no processamento
      if (data.status === 'failed') {
        console.error('❌ Erro:', data.error);
        throw new Error(data.error || 'Falha no processamento');
      }

      // Aguarda antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout: processamento demorou mais de 3 minutos');
  };

  return (
    <div>
      <button
        onClick={() => createVideo(
          'https://airtable.com/imagem-antes.jpg',
          'https://airtable.com/imagem-depois.jpg',
          'cliente-teste'
        )}
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Criar Vídeo'}
      </button>

      {status && (
        <div>
          <p>Status: {status.status}</p>
          <p>Progresso: {status.progress}%</p>
          
          {status.status === 'done' && status.url && (
            <video src={status.url} controls width="640" />
          )}

          {status.status === 'failed' && (
            <p style={{ color: 'red' }}>Erro: {status.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### **JavaScript Vanilla**

```javascript
async function createBeforeAfterVideo(beforeUrl, afterUrl, clientName) {
  try {
    // 1. Inicia processamento
    const response = await fetch('http://localhost:8080/api/ffmpeg/before-after', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beforeUrl: beforeUrl,
        afterUrl: afterUrl,
        clientName: clientName,
        duration: 8,
        quality: 'high'
      }),
    });

    const { renderId } = await response.json();
    console.log('🎬 Processamento iniciado:', renderId);

    // 2. Polling de status
    const result = await pollVideoStatus(renderId);
    console.log('✅ Vídeo pronto:', result.url);
    
    return result.url;

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

async function pollVideoStatus(renderId) {
  const maxAttempts = 90; // 3 minutos
  const pollInterval = 2000; // 2 segundos

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`http://localhost:8080/api/ffmpeg/status/${renderId}`);
    const status = await response.json();

    console.log(`📊 ${status.status} - ${status.progress}%`);

    if (status.status === 'done') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(status.error);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout');
}

// Uso:
createBeforeAfterVideo(
  'https://v5.airtableusercontent.com/.../imagem-antes.jpg',
  'https://v5.airtableusercontent.com/.../imagem-depois.jpg',
  'cliente-nome'
).then(videoUrl => {
  console.log('Vídeo disponível em:', videoUrl);
  
  // Exibir vídeo na página
  const video = document.createElement('video');
  video.src = videoUrl;
  video.controls = true;
  video.width = 640;
  document.body.appendChild(video);
});
```

---

### **cURL (Testes)**

```bash
# 1. Criar vídeo a partir de URLs
curl -X POST http://localhost:8080/api/ffmpeg/before-after \
  -H "Content-Type: application/json" \
  -d '{
    "beforeUrl": "https://v5.airtableusercontent.com/.../antes.jpg",
    "afterUrl": "https://v5.airtableusercontent.com/.../depois.jpg",
    "clientName": "teste-cliente",
    "duration": 8
  }'

# Resposta: {"renderId": "817fc7cb-a0b4-4f2d-a401-38676b417971"}

# 2. Verificar status
curl http://localhost:8080/api/ffmpeg/status/817fc7cb-a0b4-4f2d-a401-38676b417971

# 3. Aguardar conclusão (polling automático)
curl -X POST http://localhost:8080/api/ffmpeg/wait/817fc7cb-a0b4-4f2d-a401-38676b417971 \
  -H "Content-Type: application/json" \
  -d '{"maxWaitTime": 300, "pollInterval": 2}'
```

---

## 📊 Polling de Status - Boas Práticas

### **Intervalo Recomendado**
```javascript
const POLL_INTERVALS = {
  downloading: 2000,   // 2s - Download rápido
  processing: 3000,    // 3s - Processamento pode demorar
  uploading: 1000,     // 1s - Upload geralmente rápido
  default: 2000
};

async function smartPoll(renderId) {
  while (true) {
    const status = await getStatus(renderId);
    
    if (status.status === 'done' || status.status === 'failed') {
      return status;
    }

    const interval = POLL_INTERVALS[status.status] || POLL_INTERVALS.default;
    await sleep(interval);
  }
}
```

### **Timeout e Retry**
```javascript
async function pollWithTimeout(renderId, maxTime = 300000) { // 5 min
  const startTime = Date.now();

  while (Date.now() - startTime < maxTime) {
    try {
      const status = await getStatus(renderId);
      
      if (status.status === 'done') return status;
      if (status.status === 'failed') throw new Error(status.error);
      
      await sleep(2000);
    } catch (error) {
      console.warn('Erro no polling, tentando novamente...', error);
      await sleep(5000); // Aguarda mais em caso de erro
    }
  }

  throw new Error('Timeout: processamento excedeu o tempo máximo');
}
```

---

## 🏗️ Arquitetura

### **Estrutura de Diretórios**
```
/apiruum
├── assets/
│   └── masks/
│       └── before_after_mask.mp4    # Máscara estática (0.09 MB)
│
├── src/
│   ├── services/
│   │   └── ffmpeg.service.js        # Lógica de processamento
│   ├── routes/
│   │   └── ffmpeg.routes.js         # Endpoints HTTP
│   └── connectors/
│       └── firebaseStorage.js       # Upload para Firebase
│
├── temp/
│   ├── uploads/                      # Uploads (se usar multipart)
│   └── processing/                   # Downloads + processamento
│
└── outputs/
    └── videos/                       # Vídeos finais (temporário)
```

### **Fluxo de Processamento**

```
1. Cliente envia beforeUrl + afterUrl
         ↓
2. API valida e retorna renderId
         ↓
3. Download das imagens (com suporte a redirects)
         ↓
4. FFmpeg processa vídeo usando máscara estática
         ↓
5. Upload do vídeo para Firebase Storage
         ↓
6. Retorna URL pública do Firebase
         ↓
7. Limpeza dos arquivos temporários
```

### **Máscara de Vídeo**

A máscara é um arquivo estático em `assets/masks/before_after_mask.mp4`:
- ✅ Sempre a mesma máscara para todos os vídeos
- ✅ Não precisa ser enviada pelo cliente
- ✅ Carregada uma vez na inicialização do servidor
- ✅ Efeito de revelação pré-definido

---

## ⚙️ Configuração

### **Variáveis de Ambiente**
As credenciais do Firebase devem estar configuradas no `.env`:

```env
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=api-ruum
FIREBASE_STORAGE_BUCKET=api-ruum.firebasestorage.app
```

### **Dependências**

```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "firebase-admin": "^12.0.0",
    "uuid": "^9.0.0"
  }
}
```

### **FFmpeg no Sistema**

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Baixar de: https://ffmpeg.org/download.html
```

---

## 🎯 Diferenças: Shotstack vs FFmpeg Local

| Aspecto | Shotstack API | FFmpeg Local |
|---------|---------------|--------------|
| **Processamento** | Servidores Shotstack | Servidor próprio |
| **Custo** | Por vídeo renderizado | Gratuito (usa CPU local) |
| **Performance** | Rápido (distribuído) | Depende do hardware |
| **Customização** | Limitado à API | Total controle |
| **Escalabilidade** | Automática | Manual (adicionar servidores) |
| **API** | Proprietária | **Compatível com Shotstack** |
| **Upload Final** | Shotstack S3 | **Firebase Storage** |
| **Máscara** | Enviada por requisição | **Arquivo estático local** |

---

## 📝 Notas Importantes

### **Limites e Performance**
- ⏱️ Tempo médio de processamento: **20-30 segundos**
- 📦 Tamanho médio do vídeo final: **2-5 MB**
- 🎯 Resolução padrão: **1280x720** (HD)
- ⚡ Suporta redirects de URL (Airtable, Picsum, etc)

### **Limpeza Automática**
- Arquivos temporários são removidos após 5 segundos
- Vídeo final no Firebase permanece
- Jobs em memória são mantidos por 24h

### **Segurança**
- ✅ Validação de URLs
- ✅ Validação de clientName obrigatório
- ✅ Firebase Storage com regras de acesso
- ⚠️ Adicionar autenticação em produção

---

## 🐛 Troubleshooting

### **Erro: "Máscara não encontrada"**
```bash
# Verifique se o arquivo existe:
ls -lh assets/masks/before_after_mask.mp4

# Deve retornar: ~0.09 MB
```

### **Erro: "ClientName é obrigatório"**
```json
{
  "beforeUrl": "...",
  "afterUrl": "...",
  "clientName": "nome-cliente"  ← OBRIGATÓRIO
}
```

### **Erro: "Falha ao baixar: 404"**
- URLs do Airtable podem expirar
- Verifique se as URLs estão acessíveis no navegador
- Use URLs públicas permanentes

### **Vídeo não processa**
```bash
# 1. Verificar logs do servidor
tail -f logs/app.log

# 2. Testar FFmpeg manualmente
ffmpeg -version

# 3. Verificar espaço em disco
df -h
```

---

## 🚀 Próximos Passos

- [ ] Adicionar autenticação (JWT/API Key)
- [ ] Implementar fila de processamento (Bull/Redis)
- [ ] Adicionar suporte a múltiplas máscaras
- [ ] Webhook de notificação ao completar
- [ ] Dashboard de monitoramento
- [ ] Compressão otimizada de vídeo
