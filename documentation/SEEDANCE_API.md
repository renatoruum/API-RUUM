# Seedance API - Documentação de Uso

## ⚡ Importante: Seedance via Freepik API

O **Seedance é acessado através da API do Freepik**, usando a mesma API Key.

**Documentação oficial:** https://docs.freepik.com/api-reference/image-to-video/

## Configuração

Usa a mesma chave do Freepik (já configurada):

```env
FREEPIK_API_KEY=FPSXa83017337be072a57a9d9ad62c418b7f
```

✅ **Nenhuma configuração adicional necessária!**

---

## Conceito: Rota Unificada

Uma **única rota** que aceita parâmetros para escolher:
- Versão: **Pro** ou **Lite**
- Qualidade: **1080p** ou **720p**

---

## Endpoints Disponíveis

### 1. Gerar Vídeo (Unificado)

**Endpoint:** `POST /api/seedance/generate`

Gera vídeos animados a partir de imagens estáticas usando IA.

**Body:**
```json
{
  "version": "pro",
  "quality": "1080p",
  "image": "https://example.com/room.jpg",
  "prompt": "A beautiful scene with gentle camera movement and smooth zoom",
  "duration": "5",
  "camera_fixed": false,
  "aspect_ratio": "widescreen_16_9",
  "frames_per_second": 24,
  "seed": -1,
  "webhook_url": "https://your-webhook.com/callback"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição | Valores Aceitos |
|-------|------|-------------|-----------|-----------------|
| `version` | string | Não (default: "pro") | Versão do modelo | `"pro"` ou `"lite"` |
| `quality` | string | Não (default: "1080p") | Qualidade do vídeo | `"1080p"` ou `"720p"` |
| `image` | string | **Sim** | URL ou base64 da imagem | URL ou base64 |
| `prompt` | string | **Sim** | Descrição da animação | Texto (max 2000 chars) |
| `duration` | string | Não (default: "5") | Duração em segundos | `"5"` ou `"10"` |
| `camera_fixed` | boolean | Não (default: false) | Câmera fixa | true/false |
| `aspect_ratio` | string | Não (default: "widescreen_16_9") | Proporção | Ver opções abaixo |
| `frames_per_second` | number | Não (default: 24) | FPS | 24 |
| `seed` | number | Não (default: -1) | Seed (reprodutibilidade) | -1 a 4294967295 |
| `webhook_url` | string | Não | URL para callback | URL válida |

**Aspect Ratios Disponíveis:**
- `film_horizontal_21_9` - Cinema (21:9)
- `widescreen_16_9` - Widescreen (16:9) **[Padrão]**
- `classic_4_3` - Clássico (4:3)
- `square_1_1` - Quadrado (1:1)
- `traditional_3_4` - Tradicional (3:4)
- `social_story_9_16` - Stories (9:16)
- `film_vertical_9_21` - Cinema vertical (9:21)

**Combinações Disponíveis:**
- ✅ Seedance **Pro 1080p** - Máxima qualidade
- ✅ Seedance **Pro 720p** - Alta qualidade, mais rápido
- ✅ Seedance **Lite 1080p** - Boa qualidade, rápido
- ✅ Seedance **Lite 720p** - Qualidade média, muito rápido

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Video generation initiated with Seedance PRO 1080p",
  "config": {
    "version": "pro",
    "quality": "1080p",
    "duration": "5s"
  },
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "CREATED"
  }
}
```

---

### 2. Verificar Status do Vídeo

**Endpoint:** `GET /api/seedance/status/:id`

Verifica o status de processamento de um vídeo.

**Query Parameters:**
- `version` - "pro" ou "lite" (default: "pro")
- `quality` - "1080p" ou "720p" (default: "1080p")

**Exemplo:**
```bash
GET /api/seedance/status/046b6c7f-0b8a?version=pro&quality=1080p
```

**Resposta:**
```json
{
  "success": true,
  "message": "Video status retrieved",
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "COMPLETED",
    "output_url": "https://cdn.freepik.com/videos/abc123.mp4",
    "thumbnail_url": "https://cdn.freepik.com/thumbs/abc123.jpg",
    "created_at": "2025-10-28T10:00:00Z",
    "completed_at": "2025-10-28T10:02:30Z"
  }
}
```

**Status Possíveis:**
- `CREATED` - Task criada
- `PENDING` - Na fila de processamento
- `PROCESSING` - Gerando vídeo
- `COMPLETED` - Concluído (URL disponível)
- `FAILED` - Falhou (ver mensagem de erro)

---

### 3. Listar Vídeos Gerados

**Endpoint:** `GET /api/seedance/videos`

Lista todos os vídeos gerados.

**Query Parameters:**
- `version` - "pro" ou "lite" (default: "pro")
- `quality` - "1080p" ou "720p" (default: "1080p")
- `page` - Número da página (default: 1)
- `limit` - Itens por página (default: 20)

**Exemplo:**
```bash
GET /api/seedance/videos?version=pro&quality=1080p&page=1&limit=10
```

---

## Exemplos de Uso

### Exemplo 1: Gerar vídeo Pro 1080p (máxima qualidade)

```bash
curl -X POST https://your-api.com/api/seedance/generate \
  -H "Content-Type: application/json" \
  -d '{
    "version": "pro",
    "quality": "1080p",
    "image": "https://storage.googleapis.com/bucket/living-room.jpg",
    "prompt": "Smooth camera pan from left to right with gentle zoom",
    "duration": "10",
    "camera_fixed": false,
    "aspect_ratio": "widescreen_16_9"
  }'
```

### Exemplo 2: Gerar vídeo Lite 720p (rápido)

```bash
curl -X POST https://your-api.com/api/seedance/generate \
  -H "Content-Type: application/json" \
  -d '{
    "version": "lite",
    "quality": "720p",
    "image": "https://storage.googleapis.com/bucket/bedroom.jpg",
    "prompt": "Gentle parallax effect with subtle movement",
    "duration": "5"
  }'
```

### Exemplo 3: Verificar status

```bash
curl -X GET "https://your-api.com/api/seedance/status/046b6c7f-0b8a?version=pro&quality=1080p"
```

---

## Integração com Frontend

### JavaScript Simples

```javascript
// Função para gerar vídeo
const generateSeedanceVideo = async (imageUrl, usePro = true, useHD = true) => {
  const response = await fetch('https://your-api.com/api/seedance/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: usePro ? 'pro' : 'lite',
      quality: useHD ? '1080p' : '720p',
      image: imageUrl,
      prompt: 'Gentle camera movement with smooth transitions',
      duration: "5",
      camera_fixed: false,
      aspect_ratio: "widescreen_16_9"
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`Vídeo ${data.config.version} ${data.config.quality} iniciado!`);
    console.log('Task ID:', data.data.task_id);
    
    // Iniciar polling de status
    pollVideoStatus(data.data.task_id, usePro ? 'pro' : 'lite', useHD ? '1080p' : '720p');
  }
};

// Polling de status
const pollVideoStatus = async (taskId, version, quality) => {
  const checkStatus = async () => {
    const response = await fetch(
      `https://your-api.com/api/seedance/status/${taskId}?version=${version}&quality=${quality}`
    );
    const data = await response.json();
    
    if (data.data.status === 'COMPLETED') {
      console.log('Vídeo pronto!');
      console.log('URL:', data.data.output_url);
      return;
    } else if (data.data.status === 'FAILED') {
      console.error('Falha na geração');
      return;
    } else {
      console.log(`Status: ${data.data.status}`);
      setTimeout(checkStatus, 5000); // Verificar a cada 5 segundos
    }
  };
  
  checkStatus();
};

// Uso
generateSeedanceVideo('https://my-image.jpg', true, true); // Pro 1080p
generateSeedanceVideo('https://my-image.jpg', false, false); // Lite 720p
```

### Componente React

```jsx
import { useState } from 'react';

function SeedanceVideoGenerator() {
  const [version, setVersion] = useState('pro');
  const [quality, setQuality] = useState('1080p');
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);

  const generateVideo = async () => {
    const response = await fetch('/api/seedance/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version,
        quality,
        image: imageUrl,
        prompt,
        duration: "5",
        camera_fixed: false
      })
    });

    const data = await response.json();
    if (data.success) {
      setTaskId(data.data.task_id);
      pollStatus(data.data.task_id);
    }
  };

  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/seedance/status/${id}?version=${version}&quality=${quality}`
      );
      const data = await response.json();
      
      setStatus(data.data);
      
      if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
        clearInterval(interval);
      }
    }, 5000);
  };

  return (
    <div>
      <h2>Gerar Vídeo Seedance</h2>
      
      <select value={version} onChange={(e) => setVersion(e.target.value)}>
        <option value="pro">Seedance Pro</option>
        <option value="lite">Seedance Lite</option>
      </select>

      <select value={quality} onChange={(e) => setQuality(e.target.value)}>
        <option value="1080p">1080p (Full HD)</option>
        <option value="720p">720p (HD)</option>
      </select>

      <input
        type="text"
        placeholder="URL da imagem"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <textarea
        placeholder="Descreva a animação (prompt)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={generateVideo}>
        Gerar com {version.toUpperCase()} {quality}
      </button>

      {status && (
        <div>
          <p>Status: {status.status}</p>
          {status.output_url && (
            <video src={status.output_url} controls />
          )}
        </div>
      )}
    </div>
  );
}

export default SeedanceVideoGenerator;
```

---

## Comparação: Pro vs Lite

| Característica | Seedance Pro | Seedance Lite |
|----------------|--------------|---------------|
| **Qualidade** | Máxima | Boa |
| **Tempo de processamento** | Mais lento (2-5 min) | Rápido (30s-2 min) |
| **Detalhes** | Alta fidelidade | Bons detalhes |
| **Custo (créditos)** | Maior | Menor |
| **Uso recomendado** | Apresentações finais | Previews, testes |

| Qualidade | Resolução | Tamanho do arquivo | Uso recomendado |
|-----------|-----------|-------------------|------------------|
| **1080p** | 1920x1080 | ~10-30 MB | Web, apresentações |
| **720p** | 1280x720 | ~5-15 MB | Mobile, previews |

---

## Casos de Uso

### 1. Preview Rápido (Lite 720p)
- ✅ Testar conceitos rapidamente
- ✅ Aprovar direção criativa
- ✅ Compartilhar em WhatsApp/Mobile

### 2. Apresentação Cliente (Pro 1080p)
- ✅ Entrega final
- ✅ Apresentações formais
- ✅ Website principal

### 3. Balanceado (Pro 720p ou Lite 1080p)
- ✅ Bom equilíbrio qualidade/tempo
- ✅ Uso geral

---

## Troubleshooting

### Erro: "image is required"
- Certifique-se de enviar o campo `image` (URL ou base64)

### Erro: "prompt is required"
- O campo `prompt` é **obrigatório**
- Descreva como quer que a imagem seja animada
- Exemplos: "gentle camera pan", "smooth zoom in"

### Erro: "Invalid duration"
- Use apenas `"5"` ou `"10"` (string, não número)

### Erro: "Invalid API Key"
- Verifique se `FREEPIK_API_KEY` está no `.env`

### Vídeo demora muito
- Use `version: "lite"` para processamento mais rápido
- Use `quality: "720p"` para reduzir tempo
- `duration: "5"` processa mais rápido que `"10"`

---

## Webhooks

Configure um webhook para receber notificações quando o vídeo estiver pronto:

```json
{
  "webhook_url": "https://your-api.com/webhook/seedance"
}
```

O payload enviado ao webhook será o mesmo da resposta do endpoint de status.

---

## Links Úteis

- [Documentação Oficial Freepik API](https://docs.freepik.com/api-reference)
- [Seedance Pro 1080p](https://docs.freepik.com/api-reference/image-to-video/seedance-pro-1080p/post-seedance-pro-1080p)
- [Seedance Pro 720p](https://docs.freepik.com/api-reference/image-to-video/seedance-pro-720p/post-seedance-pro-720p)
- [Seedance Lite 1080p](https://docs.freepik.com/api-reference/image-to-video/seedance-lite-1080p/post-seedance-lite-1080p)
- [Seedance Lite 720p](https://docs.freepik.com/api-reference/image-to-video/seedance-lite-720p/post-seedance-lite-720p)
- [Dashboard Freepik](https://www.freepik.com/developers/dashboard)
