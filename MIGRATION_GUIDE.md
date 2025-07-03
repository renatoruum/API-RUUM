# Guia de Migração - ChatGPT API

## Resumo das Mudanças

A API ChatGPT foi refatorada para ser mais genérica e suportar múltiplos tipos de processamento. As principais mudanças incluem:

### Antes (Versão Anterior)
```javascript
// Requisição antiga
{
  "image_url": "https://example.com/room.jpg",
  "room_type": "sala de estar",
  "style": "moderno"
}

// Resposta antiga
{
  "success": true,
  "message": "ChatGPT processed successfully",
  "data": "https://oaidalleapiprodscus.blob.core.windows.net/..."
}
```

### Depois (Versão Nova)
```javascript
// Requisição nova
{
  "image_url": "https://example.com/room.jpg",
  "processing_type": "VIRTUAL_STAGING",
  "room_type": "sala de estar",
  "style": "moderno"
}

// Resposta nova
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

## Mudanças Necessárias no Código Cliente

### 1. Adicionar `processing_type` na Requisição

**Antes:**
```javascript
const payload = {
  image_url: imageUrl,
  room_type: roomType,
  style: style
};
```

**Depois:**
```javascript
const payload = {
  image_url: imageUrl,
  processing_type: 'VIRTUAL_STAGING',
  room_type: roomType,
  style: style
};
```

### 2. Atualizar Tratamento da Resposta

**Antes:**
```javascript
const response = await fetch('/chatgpt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await response.json();
const imageUrl = result.data; // String direta
```

**Depois:**
```javascript
const response = await fetch('/chatgpt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await response.json();
const imageUrl = result.data.result; // Agora está dentro de um objeto
const resultType = result.data.type; // 'image_url' ou 'text'
```

### 3. Função de Migração Automática

Para facilitar a migração, você pode usar esta função wrapper:

```javascript
// Função wrapper para manter compatibilidade
async function legacyChatGPTCall(image_url, room_type, style) {
  const response = await fetch('/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url,
      processing_type: 'VIRTUAL_STAGING',
      room_type,
      style
    })
  });

  const result = await response.json();
  
  if (result.success && result.data.type === 'image_url') {
    return result.data.result; // Retorna apenas a URL da imagem como antes
  }
  
  throw new Error(result.message || 'Erro no processamento');
}

// Usar como antes
const imageUrl = await legacyChatGPTCall(
  'https://example.com/room.jpg',
  'sala de estar',
  'moderno'
);
```

## Novas Funcionalidades Disponíveis

### 1. Identificação de Ambiente
```javascript
const identifyRoom = async (imageUrl) => {
  const response = await fetch('/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      processing_type: 'ROOM_IDENTIFICATION'
    })
  });

  const result = await response.json();
  return result.data.result; // Ex: "sala de estar"
};
```

### 2. Geração de Script
```javascript
const generateScript = async (imageUrl) => {
  const response = await fetch('/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      processing_type: 'SCRIPT_GENERATION'
    })
  });

  const result = await response.json();
  return result.data.result; // Script de locução
};
```

### 3. Fluxo Inteligente
```javascript
const intelligentProcessing = async (imageUrl) => {
  // 1. Identificar o ambiente
  const roomType = await identifyRoom(imageUrl);
  
  // 2. Gerar script
  const script = await generateScript(imageUrl);
  
  // 3. Aplicar virtual staging
  const stagedImage = await legacyChatGPTCall(imageUrl, roomType, 'moderno');
  
  return {
    roomType,
    script,
    stagedImage
  };
};
```

## Checklist de Migração

- [ ] Atualizar todas as chamadas para incluir `processing_type: 'VIRTUAL_STAGING'`
- [ ] Modificar código que processa resposta para usar `result.data.result`
- [ ] Testar todas as funcionalidades existentes
- [ ] Considerar implementar novas funcionalidades (identificação de ambiente, geração de script)
- [ ] Atualizar documentação do cliente
- [ ] Atualizar testes automatizados

## Código de Exemplo Completo

```javascript
class ChatGPTClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async virtualStaging(imageUrl, roomType, style) {
    return this.callAPI({
      image_url: imageUrl,
      processing_type: 'VIRTUAL_STAGING',
      room_type: roomType,
      style: style
    });
  }

  async identifyRoom(imageUrl) {
    return this.callAPI({
      image_url: imageUrl,
      processing_type: 'ROOM_IDENTIFICATION'
    });
  }

  async generateScript(imageUrl) {
    return this.callAPI({
      image_url: imageUrl,
      processing_type: 'SCRIPT_GENERATION'
    });
  }

  async callAPI(payload) {
    const response = await fetch(`${this.baseUrl}/chatgpt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro na API');
    }

    return result.data.result;
  }
}

// Uso
const client = new ChatGPTClient('http://localhost:3000');

// Virtual staging
const stagedImage = await client.virtualStaging(
  'https://example.com/room.jpg',
  'sala de estar',
  'moderno'
);

// Identificação de ambiente
const roomType = await client.identifyRoom('https://example.com/room.jpg');

// Geração de script
const script = await client.generateScript('https://example.com/room.jpg');
```

Este guia deve facilitar a migração do código existente para a nova API genérica.
