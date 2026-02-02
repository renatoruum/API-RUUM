# ⚡ Rate Limits e Quotas

> Entenda os limites de uso e otimize suas requisições

---

## 📋 Visão Geral

A API Ruum aplica limites de uso para garantir estabilidade e performance para todos os clientes. Existem dois tipos de limites:

1. **Rate Limits** - Requisições por unidade de tempo
2. **Quotas** - Limite total de uso por período (mensal)

---

## 🔢 Rate Limits (Por Minuto)

### Limites por Plano

| Plano | Req/Minuto | Req/Hora | Concurrent Tasks |
|-------|------------|----------|------------------|
| **Starter** | 20 | 600 | 2 |
| **Professional** | 60 | 2000 | 5 |
| **Enterprise** | 200 | 8000 | 20 |
| **Custom** | Negociável | Negociável | Negociável |

**Concurrent Tasks:** Número máximo de processamentos assíncronos (Magic Motion, Magic Drop) rodando simultaneamente.

---

## 📊 Quotas Mensais

### Limites por Funcionalidade

| Funcionalidade | Starter | Professional | Enterprise |
|----------------|---------|--------------|------------|
| **Virtual Staging** | 500 | 5.000 | 50.000 |
| **Video Before/After** | 300 | 3.000 | 30.000 |
| **Magic Motion** | 100 | 1.000 | 10.000 |
| **Magic Drop** | 50 | 500 | 5.000 |

### Quota Compartilhada

Algumas funcionalidades compartilham quota:

- Virtual Staging + Video Before/After = **Quota de Imagens**
- Magic Motion + Magic Drop = **Quota de Vídeos com IA**

---

## 📨 Headers de Rate Limit

Toda resposta da API inclui headers informativos:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1643737200
X-Quota-Limit: 5000
X-Quota-Remaining: 4234
X-Quota-Reset: 1646179200
```

### Descrição dos Headers

| Header | Descrição |
|--------|-----------|
| `X-RateLimit-Limit` | Limite de requisições por minuto |
| `X-RateLimit-Remaining` | Requisições restantes neste minuto |
| `X-RateLimit-Reset` | Timestamp (Unix) quando o rate limit reseta |
| `X-Quota-Limit` | Quota total mensal |
| `X-Quota-Remaining` | Quota restante este mês |
| `X-Quota-Reset` | Timestamp (Unix) quando a quota reseta (1º do mês) |

---

## ⚠️ Resposta de Rate Limit Excedido

### Código HTTP: 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": "You can make up to 60 requests per minute. Try again in 38 seconds.",
    "retryAfter": 38,
    "limit": 60,
    "current": 0,
    "resetAt": "2026-02-02T19:15:00Z"
  }
}
```

### Header Adicional

```http
Retry-After: 38
```

---

## 🔄 Implementando Retry Logic

### Exemplo 1: Retry Simples

```javascript
async function makeRequestWithRetry(url, data, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(url, data, {
        headers: { 'Authorization': `Bearer ${process.env.RUUM_API_KEY}` }
      });
      return response.data;
      
    } catch (error) {
      // Se for rate limit (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.error.retryAfter || 60;
        
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Rate limit hit. Retrying in ${retryAfter}s... (attempt ${attempt + 1}/${maxRetries})`);
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

### Exemplo 2: Backoff Exponencial

```javascript
async function makeRequestWithExponentialBackoff(url, data, maxRetries = 5) {
  let delay = 1000; // Começa com 1 segundo
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await axios.post(url, data, {
        headers: { 'Authorization': `Bearer ${process.env.RUUM_API_KEY}` }
      });
      
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        // Usa Retry-After se disponível, senão backoff exponencial
        const retryAfter = error.response.data.error.retryAfter || (delay / 1000);
        
        console.log(`⏳ Waiting ${retryAfter}s before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        delay *= 2; // Dobra o delay a cada tentativa
        continue;
      }
      
      throw error;
    }
  }
}
```

### Exemplo 3: Rate Limiter Client-Side

```javascript
class RuumAPIClient {
  constructor(apiKey, requestsPerMinute = 60) {
    this.apiKey = apiKey;
    this.requestsPerMinute = requestsPerMinute;
    this.queue = [];
    this.requestTimestamps = [];
  }
  
  async request(url, data) {
    // Remove timestamps antigos (>1 minuto)
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    
    // Se atingiu o limite, espera
    if (this.requestTimestamps.length >= this.requestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (Date.now() - oldestRequest);
      
      console.log(`⏳ Rate limit preemptive wait: ${Math.ceil(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Faz a requisição
    this.requestTimestamps.push(Date.now());
    
    return await axios.post(url, data, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }
}

// Uso
const client = new RuumAPIClient(process.env.RUUM_API_KEY, 60);

for (let i = 0; i < 100; i++) {
  const result = await client.request('/api/imagen-staging/full-pipeline', {
    imageUrl: `https://example.com/image${i}.jpg`
  });
  console.log(`Processed ${i + 1}/100`);
}
```

---

## 📊 Monitorando Uso

### 1. Verificar Headers em Cada Response

```javascript
async function makeRequestAndLogLimits(url, data) {
  const response = await axios.post(url, data, {
    headers: { 'Authorization': `Bearer ${process.env.RUUM_API_KEY}` }
  });
  
  console.log('📊 Rate Limit:', {
    remaining: response.headers['x-ratelimit-remaining'],
    limit: response.headers['x-ratelimit-limit'],
    resetAt: new Date(parseInt(response.headers['x-ratelimit-reset']) * 1000)
  });
  
  console.log('📊 Quota:', {
    remaining: response.headers['x-quota-remaining'],
    limit: response.headers['x-quota-limit'],
    resetAt: new Date(parseInt(response.headers['x-quota-reset']) * 1000)
  });
  
  return response.data;
}
```

### 2. Endpoint Dedicado de Uso

```bash
curl -X GET https://apiruum-562831020087.us-central1.run.app/api/usage \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "rateLimit": {
      "limit": 60,
      "remaining": 42,
      "resetAt": "2026-02-02T19:15:00Z"
    },
    "quota": {
      "period": "monthly",
      "startDate": "2026-02-01",
      "endDate": "2026-02-28",
      "total": 5000,
      "used": 1234,
      "remaining": 3766,
      "percentUsed": 24.68
    },
    "breakdown": {
      "virtualStaging": {
        "used": 450,
        "remaining": 4550
      },
      "videoBeforeAfter": {
        "used": 320,
        "remaining": 2680
      },
      "magicMotion": {
        "used": 234,
        "remaining": 766
      },
      "magicDrop": {
        "used": 230,
        "remaining": 270
      }
    },
    "alerts": [
      {
        "level": "info",
        "message": "Usage is within normal range"
      }
    ]
  }
}
```

---

## 🚨 Alertas de Quota

### Níveis de Alerta

```json
{
  "alerts": [
    {
      "level": "warning",
      "threshold": 80,
      "message": "You have used 80% of your monthly quota",
      "action": "Consider upgrading your plan or optimizing usage"
    }
  ]
}
```

### Quando Alertas São Enviados

| Threshold | Nível | Ação Sugerida |
|-----------|-------|---------------|
| 50% | `info` | Informativo |
| 80% | `warning` | Considere upgrade |
| 90% | `critical` | Planeje upgrade urgente |
| 100% | `exceeded` | Requisições bloqueadas |

---

## ⚙️ Otimizando o Uso

### 1. Batch Processing

```javascript
// ❌ Ruim: Processa um por um sequencialmente
for (const image of images) {
  await processImage(image);
}

// ✅ Melhor: Processa em lotes respeitando rate limit
async function processBatch(images, batchSize = 20) {
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    await Promise.all(batch.map(img => processImage(img)));
    
    // Espera 1 minuto antes do próximo lote (rate limit = 60/min)
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, 60000));
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

### 3. Priorização de Requisições

```javascript
class PriorityQueue {
  constructor(client) {
    this.client = client;
    this.highPriority = [];
    this.lowPriority = [];
  }
  
  async addRequest(url, data, priority = 'low') {
    const request = { url, data };
    
    if (priority === 'high') {
      this.highPriority.push(request);
    } else {
      this.lowPriority.push(request);
    }
  }
  
  async processNext() {
    const request = this.highPriority.shift() || this.lowPriority.shift();
    
    if (!request) return null;
    
    return await this.client.request(request.url, request.data);
  }
}
```

---

## 📈 Upgrade de Plano

### Quando Considerar Upgrade

✅ Atingindo 80%+ da quota regularmente  
✅ Recebendo erros 429 frequentemente  
✅ Necessidade de processar mais imagens/vídeos  
✅ Requisitos de concurrent tasks maiores

### Processo de Upgrade

1. **Contate vendas:** vendas@ruum.com.br
2. **Avalie suas necessidades:** Forneça estimativa mensal
3. **Receba proposta:** Plano customizado se necessário
4. **Ativação:** Upgrade imediato (sem downtime)
5. **Confirmação:** Verifique novos limites via `/api/usage`

---

## 🔍 Debugging de Rate Limits

### Problema: Recebendo 429 mas não deveria

**Checklist:**

```bash
# 1. Verifique quantas requisições você está fazendo
# Adicione logs em cada request

# 2. Verifique se há múltiplas instâncias usando mesma API key
# (ex: dev + staging + produção)

# 3. Teste manualmente
curl -I https://apiruum.../api/health \
  -H "Authorization: Bearer $RUUM_API_KEY"

# Verifique os headers:
# X-RateLimit-Remaining: ?

# 4. Verifique uso atual
curl https://apiruum.../api/usage \
  -H "Authorization: Bearer $RUUM_API_KEY"
```

### Problema: Quota parece incorreta

**Solução:**

```bash
# 1. Verifique seu plano atual
curl https://apiruum.../api/usage \
  -H "Authorization: Bearer $RUUM_API_KEY" \
  | jq '.data.quota'

# 2. Compare com seu contrato

# 3. Se houver discrepância, contate suporte com:
# - API Key (primeiros 10 caracteres)
# - Plano contratado
# - Quota esperada vs atual
```

---

## 📊 Métricas Recomendadas para Monitorar

### Dashboard Básico

```javascript
// Exemplo de métricas a coletar
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitHits: 0,
  quotaExceededHits: 0,
  averageResponseTime: 0,
  quotaUsagePercent: 0
};

// Atualizar após cada request
function updateMetrics(response, error, responseTime) {
  metrics.totalRequests++;
  
  if (error) {
    metrics.failedRequests++;
    
    if (error.response?.status === 429) {
      if (error.response.data.error.code === 'RATE_LIMIT_EXCEEDED') {
        metrics.rateLimitHits++;
      } else if (error.response.data.error.code === 'QUOTA_EXCEEDED') {
        metrics.quotaExceededHits++;
      }
    }
  } else {
    metrics.successfulRequests++;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.successfulRequests - 1) + responseTime) 
      / metrics.successfulRequests;
    
    // Atualizar % de quota
    const quotaRemaining = response.headers['x-quota-remaining'];
    const quotaLimit = response.headers['x-quota-limit'];
    metrics.quotaUsagePercent = ((quotaLimit - quotaRemaining) / quotaLimit) * 100;
  }
}
```

---

## 📚 Referências Relacionadas

- [Authentication](./AUTHENTICATION.md) - Configurar API Key
- [Error Codes](./ERROR_CODES.md) - Detalhes sobre erro 429
- [Quick Start](./QUICKSTART.md) - Exemplos com retry logic

---

## 🆘 Suporte

**Questões sobre limites ou upgrades?**
- 📧 Vendas: vendas@ruum.com.br
- 📧 Suporte técnico: suporte@ruum.com.br

---

**Última atualização:** Fevereiro 2026
