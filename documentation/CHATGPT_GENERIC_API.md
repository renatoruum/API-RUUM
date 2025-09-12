# ChatGPT Generic API - Documentação

## Visão Geral

A API ChatGPT foi refatorada para suportar diferentes tipos de processamento de imagens, tornando-se mais genérica e flexível. Agora suporta três tipos principais de operações:

1. **Virtual Staging** - Modificação de imagens com staging virtual
2. **Identificação de Ambiente** - Análise e identificação do tipo de cômodo
3. **Geração de Script** - Criação de scripts de locução para imóveis

## Endpoint

```
POST /chatgpt
```

## Parâmetros da Requisição

### Parâmetros Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `image_url` | string | URL da imagem a ser processada |
| `processing_type` | string | Tipo de processamento (ver tipos suportados) |

### Tipos de Processamento Suportados

#### 1. VIRTUAL_STAGING
Gera uma versão modificada da imagem com virtual staging.

**Parâmetros adicionais obrigatórios:**
- `room_type`: Tipo do cômodo (ex: "sala de estar", "quarto", "cozinha")
- `style`: Estilo do staging (ex: "moderno", "clássico", "minimalista")

**Exemplo de requisição:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "processing_type": "VIRTUAL_STAGING",
  "room_type": "sala de estar",
  "style": "moderno"
}
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Processamento ChatGPT concluído com sucesso",
  "processing_type": "VIRTUAL_STAGING",
  "data": {
    "type": "image_url",
    "result": "https://oaidalleapiprodscus.blob.core.windows.net/..."
  }
}
```

#### 2. ROOM_IDENTIFICATION
Identifica o tipo de ambiente/cômodo na imagem.

**Parâmetros adicionais:** Nenhum

**Exemplo de requisição:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "processing_type": "ROOM_IDENTIFICATION"
}
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Processamento ChatGPT concluído com sucesso",
  "processing_type": "ROOM_IDENTIFICATION",
  "data": {
    "type": "text",
    "result": "sala de estar"
  }
}
```

#### 3. SCRIPT_GENERATION
Gera um script de locução profissional baseado na análise da imagem.

**Parâmetros adicionais:** Nenhum

**Exemplo de requisição:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "processing_type": "SCRIPT_GENERATION"
}
```

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Processamento ChatGPT concluído com sucesso",
  "processing_type": "SCRIPT_GENERATION",
  "data": {
    "type": "text",
    "result": "Esta belíssima sala de estar apresenta um ambiente aconchegante e moderno, com amplo espaço para relaxamento e convivência..."
  }
}
```

## Códigos de Status

- **200**: Sucesso
- **400**: Erro na requisição (parâmetros faltando ou inválidos)
- **500**: Erro interno do servidor

## Exemplos de Uso

### cURL

```bash
# Virtual Staging
curl -X POST http://localhost:3000/chatgpt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/room.jpg",
    "processing_type": "VIRTUAL_STAGING",
    "room_type": "sala de estar",
    "style": "moderno"
  }'

# Identificação de Ambiente
curl -X POST http://localhost:3000/chatgpt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/room.jpg",
    "processing_type": "ROOM_IDENTIFICATION"
  }'

# Geração de Script
curl -X POST http://localhost:3000/chatgpt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/room.jpg",
    "processing_type": "SCRIPT_GENERATION"
  }'
```

### JavaScript (Fetch)

```javascript
// Virtual Staging
const response = await fetch('/chatgpt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/room.jpg',
    processing_type: 'VIRTUAL_STAGING',
    room_type: 'sala de estar',
    style: 'moderno'
  })
});

const result = await response.json();
console.log(result);
```

## Notas Técnicas

- As imagens são automaticamente redimensionadas para 1024x1024 pixels
- O formato de saída é sempre PNG para processamento
- Tempo limite de 120 segundos para requisições
- Para virtual staging, utiliza DALL-E 2
- Para análise de imagem, utiliza GPT-4 Vision

## Tratamento de Erros

A API retorna erros estruturados com mensagens claras:

```json
{
  "success": false,
  "message": "Campo obrigatório: image_url",
  "supported_types": ["VIRTUAL_STAGING", "ROOM_IDENTIFICATION", "SCRIPT_GENERATION"]
}
```
