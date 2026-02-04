# ⚡ Rate Limits e Boas Práticas

> Otimizando o uso da API Ruum

---

## 📋 Visão Geral

A API Ruum aplica limites para garantir estabilidade e performance para todos os clientes.

---

## 🔢 Limites de Uso

### Limites por IP

| Recurso | Limite |
|---------|--------|
| **Requisições/minuto** | 60 |
| **Processamentos simultâneos** | 5 |
| **Tamanho máximo de imagem** | 10 MB |
| **Timeout por requisição** | 5 minutos |

---

## ⚠️ Resposta de Limite Excedido

### Código HTTP: 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before retrying.",
    "retryAfter": 30
  }
}
```

**Header:**
```http
Retry-After: 30
```

---

## 🔄 Implementando Retry Logic

### Exemplo Básico com Retry

```javascript
async function makeRequestWithRetry(url, data, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(url, data);
      return response.data;
      
    } catch (error) {
      // Se for rate limit (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.error?.retryAfter || 60;
        
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Rate limit. Aguardando ${retryAfter}s... (tentativa ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }
      
      // Outros erros ou última tentativa
      throw error;
    }
  }
}
```

### Exemplo com Backoff Exponencial

```javascript
async function makeRequestWithBackoff(url, data, maxRetries = 5) {
  let delay = 1000; // Começa com 1 segundo
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await axios.post(url, data);
      
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const retryAfter = error.response.data.error?.retryAfter || (delay / 1000);
        
        console.log(`⏳ Aguardando ${retryAfter}s antes da tentativa ${attempt + 2}`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        delay *= 2; // Dobra o delay a cada tentativa
        continue;
      }
      
      throw error;
    }
  }
}
```

---

## ⚙️ Otimizando o Uso

### 1. Processamento em Lote

```javascript
// ❌ Ruim: Processa um por um
for (const image of images) {
  await processImage(image);
}

// ✅ Melhor: Processa em lotes
async function processBatch(images, batchSize = 10) {
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    
    // Processa lote em paralelo
    await Promise.all(batch.map(img => processImage(img)));
    
    // Pequeno delay entre lotes
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 2. Cache de Resultados

```javascript
const cache = new Map();

async function processImageWithCache(imageUrl) {
  // Verifica cache primeiro
  if (cache.has(imageUrl)) {
    console.log('✅ Cache hit!');
    return cache.get(imageUrl);
  }
  
  // Processa e salva no cache
  const result = await processImage(imageUrl);
  cache.set(imageUrl, result);
  
  return result;
}
```

### 3. Controle de Taxa Client-Side

```javascript
class RequestThrottler {
  constructor(maxPerMinute = 60) {
    this.maxPerMinute = maxPerMinute;
    this.queue = [];
    this.requestTimestamps = [];
  }
  
  async request(url, data) {
    // Remove timestamps antigos (>1 minuto)
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    
    // Se atingiu o limite, espera
    if (this.requestTimestamps.length >= this.maxPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (Date.now() - oldestRequest);
      
      console.log(`⏳ Aguardando ${Math.ceil(waitTime/1000)}s para respeitar rate limit`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Faz a requisição
    this.requestTimestamps.push(Date.now());
    return await axios.post(url, data);
  }
}

// Uso
const throttler = new RequestThrottler(60);

for (let i = 0; i < 100; i++) {
  const result = await throttler.request('/api/imagen-staging/full-pipeline', {
    imageUrl: `https://example.com/image${i}.jpg`
  });
  console.log(`Processado ${i + 1}/100`);
}
```

---

## 📊 Monitorando Performance

### Exemplo de Logging

```javascript
const metrics = {
  total: 0,
  success: 0,
  failed: 0,
  rateLimitHits: 0,
  averageTime: 0
};

async function processWithMetrics(url, data) {
  const startTime = Date.now();
  metrics.total++;
  
  try {
    const response = await axios.post(url, data);
    metrics.success++;
    
    const duration = Date.now() - startTime;
    metrics.averageTime = 
      (metrics.averageTime * (metrics.success - 1) + duration) / metrics.success;
    
    return response.data;
    
  } catch (error) {
    metrics.failed++;
    
    if (error.response?.status === 429) {
      metrics.rateLimitHits++;
    }
    
    throw error;
  } finally {
    console.log(`📊 Métricas: ${metrics.success}/${metrics.total} sucesso | Rate limits: ${metrics.rateLimitHits} | Tempo médio: ${Math.round(metrics.averageTime)}ms`);
  }
}
```

---

## 🚨 Troubleshooting

### Problema: Recebendo 429 com frequência

**Causas possíveis:**
- Muitas requisições simultâneas
- Múltiplas instâncias da aplicação rodando
- Requisições em loop sem delay

**Soluções:**
1. Implemente controle de taxa (throttling) no client
2. Adicione delays entre requisições
3. Use processamento em lote
4. Verifique se não há loops infinitos

### Problema: Processamento lento

**Otimizações:**
1. **Comprima imagens** antes de enviar (<5MB ideal)
2. **Use cache** para evitar reprocessamento
3. **Processe em paralelo** (respeitando limites)
4. **Priorize requisições** críticas

---

## 💡 Dicas de Boas Práticas

### ✅ Faça:
- Implemente retry logic com backoff exponencial
- Use cache quando apropriado
- Monitore métricas de uso
- Processe em lotes respeitando limites
- Adicione timeouts nas requisições
- Trate erros 429 gracefully

### ❌ Evite:
- Loops infinitos de requisições
- Retry imediato sem delay
- Múltiplas instâncias sem coordenação
- Ignorar headers `Retry-After`
- Enviar imagens muito grandes (>10MB)

---

## 📚 Referências Relacionadas

- [Error Codes](./ERROR_CODES.md) - Detalhes sobre erro 429
- [Quick Start](./QUICKSTART.md) - Exemplos com retry logic

---

## 🆘 Suporte

**Questões sobre limites?**
- 📧 Suporte técnico: renato@ruum.com.br
- 💬 Slack: #api-crm-integration

---

**Última atualização:** Fevereiro 2026
