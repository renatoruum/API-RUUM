# 🎬 Runway ML - API Documentation

## 📋 **Visão Geral**

A integração com Runway ML permite gerar imagens e converter imagens em vídeos usando inteligência artificial avançada. O serviço oferece capacidades de geração de conteúdo visual para projetos criativos.

## 🔑 **Configuração**

### **Variável de Ambiente:**
```bash
RUNWAYML_API_SECRET=sua_chave_aqui
```

**Obs**: Requer conta válida na Runway ML com créditos disponíveis.

## 🛠️ **Endpoints Disponíveis**

### **1. Geração de Imagens**
```http
POST /api/runway
```

**Descrição**: Gera uma imagem baseada em um prompt textual.

**Parâmetros da Requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `prompt` | string | ✅ | Descrição textual da imagem a ser gerada |
| `params` | object | ❌ | Parâmetros adicionais para personalização |

**Exemplo de Requisição:**
```json
{
  "prompt": "Modern living room with minimalist furniture, natural lighting, 4K quality",
  "params": {
    "aspectRatio": "16:9",
    "quality": "high"
  }
}
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": "gen_xxxxxxxxxxxxxx",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "prompt": "Modern living room with minimalist furniture...",
    "seed": 1234567890,
    "output": []
  }
}
```

### **2. Conversão de Imagem para Vídeo**
```http
POST /api/runway/image-to-video
```

**Descrição**: Converte uma imagem estática em um vídeo animado.

**Parâmetros da Requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image_url` | string | ✅ | URL da imagem a ser convertida em vídeo |
| `motion_prompt` | string | ❌ | Descrição do movimento desejado |
| `params` | object | ❌ | Parâmetros adicionais |

**Exemplo de Requisição:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "motion_prompt": "Gentle camera pan from left to right, subtle lighting changes",
  "params": {
    "duration": 4,
    "fps": 24
  }
}
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": "vid_xxxxxxxxxxxxxx",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "image_url": "https://example.com/room.jpg",
    "motion_prompt": "Gentle camera pan...",
    "output": []
  }
}
```

## 📊 **Status das Tarefas**

As tarefas do Runway ML passam por diferentes estados:

- **PENDING**: Tarefa na fila de processamento
- **RUNNING**: Processamento em andamento
- **SUCCEEDED**: Processamento concluído com sucesso
- **FAILED**: Processamento falhou

## ⚠️ **Tratamento de Erros**

### **Erro de Validação (400)**
```json
{
  "success": false,
  "message": "Missing required field: prompt"
}
```

### **Erro de API (500)**
```json
{
  "success": false,
  "message": "Error generating with Runway",
  "error": "Detalhes do erro..."
}
```

### **Erro de Falha na Tarefa (500)**
```json
{
  "success": false,
  "message": "Runway task failed",
  "error": "Task failed with error: ..."
}
```

## 🔧 **Connector Functions**

### **generateWithRunway(options)**
Gera uma imagem usando Runway ML.

**Parâmetros:**
- `options.prompt` (string): Prompt textual obrigatório
- `options.params` (object): Parâmetros opcionais

**Retorna:** Promise\<Object> com resposta da API

### **imageToVideoWithRunway(options)**
Converte uma imagem em vídeo.

**Parâmetros:**
- `options.image_url` (string): URL da imagem
- `options.motion_prompt` (string): Descrição do movimento
- `options.params` (object): Parâmetros opcionais

**Retorna:** Promise\<Object> com resposta da API

## 📝 **Notas Importantes**

1. **Créditos**: Cada geração consome créditos da conta Runway ML
2. **Tempo de Processamento**: Gerações podem levar alguns minutos
3. **Qualidade**: Prompts mais detalhados geram melhores resultados
4. **Limites**: Respeite os limites de taxa da API
5. **Formatos**: Verifique os formatos de saída suportados

## 🚀 **Exemplos de Uso**

### **Geração de Imagem de Ambiente**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/runway \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Luxury bedroom with king size bed, marble nightstands, soft ambient lighting, photorealistic",
    "params": {
      "aspectRatio": "16:9"
    }
  }'
```

### **Conversão para Vídeo**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/runway/image-to-video \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/luxury-room.jpg",
    "motion_prompt": "Smooth camera movement revealing the room details",
    "params": {
      "duration": 5
    }
  }'
```
