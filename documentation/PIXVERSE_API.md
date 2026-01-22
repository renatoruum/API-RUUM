# PixVerse API - Documentação

## Visão Geral

O PixVerse é uma plataforma de geração de vídeos com IA que permite criar vídeos a partir de imagens ou texto. Esta API fornece integração completa com o serviço PixVerse para:

- **RUUM Drop**: Vídeo de composição de ambientes (ambiente vazio → mobiliado)
- **Image-to-Video**: Transformar imagens estáticas em vídeos animados
- **Text-to-Video**: Gerar vídeos a partir de descrições textuais

## Configuração

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
PIXVERSE_API_KEY=sk-89e6827362bcfa38f4f25f4a7417f418
```

## Endpoints

### 1. RUUM Drop - Vídeo de Composição de Ambientes

Cria um vídeo onde móveis "caem" e compõem o ambiente, partindo de uma foto vazia para uma mobiliada.

**Endpoint:** `POST /api/pixverse/ruum-drop`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "imageEmpty": "https://example.com/empty-room.jpg",
  "imageFurnished": "https://example.com/furnished-room.jpg",
  "prompt": "Furniture elegantly falling and arranging themselves in the room",
  "aspectRatio": "16:9",
  "duration": 4,
  "seed": "12345"
}
```

**Parâmetros:**
- `imageEmpty` (obrigatório): URL da imagem do ambiente vazio
- `imageFurnished` (obrigatório): URL da imagem do ambiente mobiliado
- `prompt` (opcional): Descrição textual para guiar a geração
  - Padrão: "Furniture elegantly falling and arranging themselves in the room"
- `aspectRatio` (opcional): Proporção do vídeo
  - Valores: `'16:9'`, `'9:16'`, `'1:1'`
  - Padrão: `'16:9'`
- `duration` (opcional): Duração do vídeo em segundos
  - Padrão: `4`
- `seed` (opcional): Seed para geração determinística

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123",
    "status": "processing",
    "createdAt": "2026-01-22T10:30:00Z"
  },
  "message": "RUUM Drop video generation started"
}
```

**Exemplo de Uso (JavaScript):**
```javascript
const response = await fetch('http://localhost:8080/api/pixverse/ruum-drop', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageEmpty: 'https://storage.googleapis.com/ruum/empty-living-room.jpg',
    imageFurnished: 'https://storage.googleapis.com/ruum/furnished-living-room.jpg',
    prompt: 'Modern furniture gracefully falling into place',
    aspectRatio: '16:9',
    duration: 5
  })
});

const result = await response.json();
console.log('Task ID:', result.data.taskId);
```

---

### 2. Image-to-Video

Transforma uma imagem estática em um vídeo animado.

**Endpoint:** `POST /api/pixverse/image-to-video`

**Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Animate this image with natural movement",
  "aspectRatio": "16:9",
  "duration": 4,
  "motionStrength": "medium",
  "seed": "12345"
}
```

**Parâmetros:**
- `imageUrl` (obrigatório): URL da imagem a ser animada
- `prompt` (opcional): Descrição do movimento desejado
  - Padrão: "Animate this image with natural movement"
- `aspectRatio` (opcional): `'16:9'`, `'9:16'`, `'1:1'` (padrão: `'16:9'`)
- `duration` (opcional): Duração em segundos (padrão: `4`)
- `motionStrength` (opcional): Intensidade do movimento
  - Valores: `'low'`, `'medium'`, `'high'`
  - Padrão: `'medium'`
- `seed` (opcional): Seed para geração determinística

**Resposta:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_xyz789",
    "status": "processing"
  },
  "message": "Image-to-video generation started"
}
```

**Exemplo:**
```javascript
const response = await fetch('http://localhost:8080/api/pixverse/image-to-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://storage.googleapis.com/ruum/bedroom.jpg',
    prompt: 'Gentle camera movement revealing the room',
    motionStrength: 'low'
  })
});
```

---

### 3. Text-to-Video

Gera um vídeo a partir de uma descrição textual.

**Endpoint:** `POST /api/pixverse/text-to-video`

**Body:**
```json
{
  "prompt": "A modern living room with minimalist furniture, afternoon sunlight streaming through large windows",
  "aspectRatio": "16:9",
  "duration": 4,
  "seed": "12345"
}
```

**Parâmetros:**
- `prompt` (obrigatório): Descrição detalhada do vídeo
- `aspectRatio` (opcional): `'16:9'`, `'9:16'`, `'1:1'` (padrão: `'16:9'`)
- `duration` (opcional): Duração em segundos (padrão: `4`)
- `seed` (opcional): Seed para geração determinística

**Resposta:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_def456",
    "status": "processing"
  },
  "message": "Text-to-video generation started"
}
```

---

### 4. Verificar Status

Verifica o status de uma geração em andamento.

**Endpoint:** `GET /api/pixverse/status/:taskId`

**Exemplo:**
```
GET /api/pixverse/status/task_abc123
```

**Resposta (Processando):**
```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123",
    "status": "processing",
    "progress": 45
  }
}
```

**Resposta (Concluído):**
```json
{
  "success": true,
  "data": {
    "taskId": "task_abc123",
    "status": "completed",
    "videoUrl": "https://cdn.pixverse.ai/videos/task_abc123.mp4",
    "thumbnailUrl": "https://cdn.pixverse.ai/thumbnails/task_abc123.jpg",
    "duration": 4.2
  }
}
```

**Exemplo de Polling:**
```javascript
async function waitForVideo(taskId) {
  let status = 'processing';
  let videoUrl = null;
  
  while (status === 'processing') {
    const response = await fetch(`http://localhost:8080/api/pixverse/status/${taskId}`);
    const result = await response.json();
    
    status = result.data.status;
    
    if (status === 'completed') {
      videoUrl = result.data.videoUrl;
      break;
    } else if (status === 'failed') {
      throw new Error('Video generation failed');
    }
    
    // Aguarda 5 segundos antes de verificar novamente
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return videoUrl;
}

// Uso:
const taskId = 'task_abc123';
const videoUrl = await waitForVideo(taskId);
console.log('Video ready:', videoUrl);
```

---

## Fluxo Completo - RUUM Drop

```javascript
// 1. Iniciar geração
const createResponse = await fetch('http://localhost:8080/api/pixverse/ruum-drop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageEmpty: 'https://storage.googleapis.com/ruum/empty.jpg',
    imageFurnished: 'https://storage.googleapis.com/ruum/furnished.jpg',
    prompt: 'Furniture elegantly falling and arranging themselves',
    duration: 5
  })
});

const createResult = await createResponse.json();
const taskId = createResult.data.taskId;

// 2. Aguardar conclusão com polling
let completed = false;
let videoUrl = null;

while (!completed) {
  const statusResponse = await fetch(`http://localhost:8080/api/pixverse/status/${taskId}`);
  const statusResult = await statusResponse.json();
  
  if (statusResult.data.status === 'completed') {
    videoUrl = statusResult.data.videoUrl;
    completed = true;
  } else if (statusResult.data.status === 'failed') {
    throw new Error('Generation failed');
  } else {
    // Aguardar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// 3. Usar o vídeo gerado
console.log('Video pronto:', videoUrl);
```

---

## Tratamento de Erros

**Erro 400 - Bad Request:**
```json
{
  "success": false,
  "message": "Missing required fields: imageEmpty and imageFurnished"
}
```

**Erro 500 - Internal Server Error:**
```json
{
  "success": false,
  "message": "Error processing RUUM Drop request",
  "error": "PixVerse API Error: 401 - Invalid API key"
}
```

---

## Comparação com Runway

| Recurso | PixVerse | Runway Gen-3 |
|---------|----------|--------------|
| Image-to-Video | ✅ | ✅ |
| Text-to-Video | ✅ | ❌ |
| RUUM Drop (2 imagens) | ✅ | ❌ |
| Qualidade | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Velocidade | Rápida | Moderada |
| Custo | Menor | Maior |

---

## Melhores Práticas

1. **Prompts Eficazes:**
   - Seja específico sobre o movimento desejado
   - Para RUUM Drop: "Furniture elegantly falling and arranging themselves"
   - Para animação geral: "Gentle camera pan revealing the space"

2. **Aspect Ratios:**
   - `16:9` - Landscape (horizontal) - ideal para desktop/TV
   - `9:16` - Portrait (vertical) - ideal para mobile/stories
   - `1:1` - Square - ideal para redes sociais

3. **Motion Strength:**
   - `low` - Movimentos sutis, mais realistas
   - `medium` - Balanço entre realismo e dinamismo
   - `high` - Movimentos dramáticos, mais cinematográficos

4. **Polling:**
   - Verificar status a cada 5 segundos
   - Implementar timeout (ex: 5 minutos)
   - Tratar casos de falha adequadamente

---

## Estrutura do Projeto

```
src/
├── connectors/
│   └── pixverse.js          # Funções de integração com PixVerse API
└── routes/
    └── sendPixverse.js      # Rotas HTTP da API
```

## Funções do Conector

### `createRuumDropVideo(options)`
Cria vídeo RUUM Drop com duas imagens.

### `imageToVideo(options)`
Anima uma imagem estática.

### `textToVideo(options)`
Gera vídeo a partir de texto.

### `getVideoStatus(taskId)`
Verifica status da geração.

---

## Changelog

### v1.0.0 - 22/01/2026
- ✅ Integração inicial com PixVerse
- ✅ Suporte para RUUM Drop
- ✅ Image-to-Video
- ✅ Text-to-Video
- ✅ Endpoint de status
- ✅ Documentação completa

---

## Suporte

Para questões sobre a API do PixVerse, consulte:
- [Documentação Oficial PixVerse](https://docs.pixverse.ai)
- Email: support@pixverse.ai
