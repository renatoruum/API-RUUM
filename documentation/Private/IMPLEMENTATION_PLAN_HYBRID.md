# 🎯 Plano de Implementação Híbrido - Batch Processing System

**Versão:** 2.0 Hybrid  
**Data:** 3 de fevereiro de 2026  
**Responsável:** Renato Palácio (renato@ruum.com.br)  
**Objetivo:** Sistema de processamento em lote com **duas trajetórias** - Fast Track (3-4 dias) ou Robust Track (20 dias)

---

## 📋 Visão Geral

Este plano oferece **flexibilidade total** para implementar o sistema de batch processing seguindo uma de duas trajetórias ou **combinando ambas** conforme as necessidades evoluem.

### 🚀 Fast Track (3-4 dias, 6h/dia)
- **Objetivo:** MVP funcional no ar o mais rápido possível
- **Prioridade:** Funcionalidade core > Perfeição
- **Uso:** Validar conceito, demonstrar ao parceiro CRM, começar a processar lotes pequenos

### 🏗️ Robust Track (20 dias, 2-3h/dia)
- **Objetivo:** Sistema production-ready com todos os bells & whistles
- **Prioridade:** Qualidade, observabilidade, manutenibilidade
- **Uso:** Sistema definitivo para produção em larga escala

### 🎭 Hybrid Approach (RECOMENDADO)
- **Dia 1-4:** Implementar Fast Track MVP
- **Dia 5-20:** Evoluir incrementalmente para Robust Track
- **Vantagem:** Valor imediato + evolução controlada

---

## 🗺️ Roadmap de Decisão

```
┌─────────────────────────────────────────────────────────────┐
│                    DECISÃO INICIAL                          │
│  Precisa de algo funcionando AGORA? → Fast Track            │
│  Pode esperar 3-4 semanas? → Robust Track                   │
│  Quer o melhor dos dois mundos? → Hybrid Approach           │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1: CORE MVP                         │
│  ✅ Cloud Tasks Queue                                       │
│  ✅ Batch Creation Endpoint                                 │
│  ✅ Worker Function                                         │
│  ✅ Status Endpoint                                         │
│  ⏱️ Fast: 3-4 dias | Robust: 5-7 dias                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECKPOINT: MVP FUNCIONA?                      │
│  SIM → Escolher próxima fase                                │
│  NÃO → Debugar antes de prosseguir                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           FASE 2A: FAST TRACK (PARAR AQUI)                 │
│  ✅ Retry manual básico                                     │
│  ✅ Logs mínimos                                            │
│  ✅ Testes com 100 imagens                                  │
│  ⏱️ +0 dias (já incluído no MVP)                           │
└─────────────────────────────────────────────────────────────┘

                    OU

┌─────────────────────────────────────────────────────────────┐
│         FASE 2B: ROBUST TRACK (CONTINUAR)                   │
│  ✅ Retry automático (Cloud Tasks)                          │
│  ✅ Monitoring & Alerting                                   │
│  ✅ Rate Limiter avançado                                   │
│  ✅ Testes unitários + integração                           │
│  ✅ Load testing (1000+ imagens)                            │
│  ✅ Documentation completa                                  │
│  ⏱️ +13-16 dias adicionais                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparação Lado a Lado

| Aspecto | Fast Track (3-4 dias) | Robust Track (20 dias) | Hybrid (4-20 dias) |
|---------|----------------------|------------------------|-------------------|
| **GCP Setup** | Manual, configs mínimos | Terraform IaC | Manual → IaC depois |
| **Error Handling** | Try/catch básico | Retry automático + DLQ | Básico → Automático |
| **Monitoring** | Console.log | Cloud Monitoring + Alertas | Logs → Monitoring |
| **Testing** | Manual com 10-100 imgs | Unitários + Load (1000+) | Manual → Automatizado |
| **Documentation** | README mínimo | Completa (código+API+ops) | README → Completa |
| **Rate Limiting** | Fixo 60/min | Dinâmico + backpressure | Fixo → Dinâmico |
| **Concurrency Control** | Hardcoded (10) | Configurável por endpoint | Hardcoded → Config |
| **Batch Size Limit** | 100 imagens | 10,000 imagens | 100 → 10,000 |
| **Code Review** | ❌ Skip | ✅ Obrigatório | ❌ → ✅ |
| **Production Ready** | ⚠️ Beta | ✅ Sim | ⚠️ → ✅ |
| **Custo GCP** | $10-30/mês | $20-50/mês | $10-50/mês |
| **Esforço Total** | 18-24h | 40-60h | 18-60h |

---

## 🎯 FASE 1: CORE MVP (Obrigatório para Ambas)

### **Objetivo**: Sistema básico funcionando end-to-end

### ⏱️ Timeline
- **Fast Track:** 3-4 dias (6h/dia = 18-24h total)
- **Robust Track:** 5-7 dias (2-3h/dia = 10-21h total)

### 📦 Deliverables

#### 1.1 GCP Infrastructure Setup (Fast: 30min | Robust: 2h)

**Fast Track:**
```bash
# Setup manual via gcloud CLI
gcloud tasks queues create batch-processing-queue \
  --location=us-central1 \
  --max-dispatches-per-second=60 \
  --max-concurrent-dispatches=10

# Criar service account
gcloud iam service-accounts create batch-worker \
  --display-name="Batch Processing Worker"
```

**Robust Track:**
```hcl
# Terraform (terraform/queue.tf)
resource "google_cloud_tasks_queue" "batch_queue" {
  name     = "batch-processing-queue"
  location = "us-central1"

  rate_limits {
    max_dispatches_per_second = 60
    max_concurrent_dispatches = 10
  }

  retry_config {
    max_attempts       = 5
    max_retry_duration = "3600s"
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 4
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

resource "google_service_account" "batch_worker" {
  account_id   = "batch-worker"
  display_name = "Batch Processing Worker"
}
```

---

#### 1.2 Batch Creation Endpoint (Fast: 2.5h | Robust: 4h)

**Fast Track** - `src/routes/batch.js`:
```javascript
const express = require('express');
const { CloudTasksClient } = require('@google-cloud/tasks');
const { getFirestore } = require('firebase-admin/firestore');

const router = express.Router();
const tasksClient = new CloudTasksClient();
const db = getFirestore();

/**
 * POST /api/batch/create
 * Cria um batch de processamento de imagens
 */
router.post('/create', async (req, res) => {
  try {
    const { images, type = 'virtual-staging', userId } = req.body;

    // Validação básica
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Campo "images" deve ser um array' });
    }
    if (images.length === 0) {
      return res.status(400).json({ error: 'Lista de imagens vazia' });
    }
    if (images.length > 100) {
      return res.status(400).json({ error: 'Máximo 100 imagens por batch' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Campo "userId" obrigatório' });
    }

    // Criar batch no Firestore
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchRef = db.collection('batches').doc(batchId);

    const batchData = {
      id: batchId,
      type,
      userId,
      status: 'processing',
      totalImages: images.length,
      processedImages: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: images.map((img, index) => ({
        id: `${batchId}_${index}`,
        url: img.url || img,
        status: 'pending',
        metadata: img.metadata || {}
      }))
    };

    await batchRef.set(batchData);

    // Enfileirar tasks no Cloud Tasks
    const queuePath = tasksClient.queuePath(
      process.env.GCP_PROJECT_ID,
      'us-central1',
      'batch-processing-queue'
    );

    const tasks = [];
    for (let i = 0; i < images.length; i++) {
      const image = batchData.images[i];
      
      const task = {
        httpRequest: {
          httpMethod: 'POST',
          url: `${process.env.CLOUD_RUN_URL}/api/batch/worker`,
          headers: {
            'Content-Type': 'application/json',
          },
          body: Buffer.from(JSON.stringify({
            batchId,
            imageId: image.id,
            imageUrl: image.url,
            type,
            userId,
            metadata: image.metadata
          })).toString('base64'),
        },
      };

      tasks.push(tasksClient.createTask({ parent: queuePath, task }));
    }

    // Aguardar criação de todas as tasks
    await Promise.all(tasks);

    console.log(`✅ Batch ${batchId} criado com ${images.length} imagens`);

    res.status(201).json({
      success: true,
      batchId,
      totalImages: images.length,
      statusUrl: `/api/batch/status/${batchId}`
    });

  } catch (error) {
    console.error('❌ Erro ao criar batch:', error);
    res.status(500).json({ 
      error: 'Erro ao criar batch',
      message: error.message 
    });
  }
});

module.exports = router;
```

**Robust Track** - Adicionar:
- ✅ Validação de schema com Joi/Zod
- ✅ Rate limiting por userId
- ✅ Estimativa de custo antes de processar
- ✅ Webhook notification ao completar
- ✅ Suporte a prioridades (high/normal/low)
- ✅ Logs estruturados (Winston)

---

#### 1.3 Worker Function (Fast: 3h | Robust: 5h)

**Fast Track** - `src/routes/batch-worker.js`:
```javascript
const express = require('express');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

const router = express.Router();
const db = getFirestore();

/**
 * POST /api/batch/worker
 * Worker que processa uma imagem individual (chamado pelo Cloud Tasks)
 */
router.post('/worker', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { batchId, imageId, imageUrl, type, userId, metadata } = req.body;

    console.log(`🔄 Processando ${imageId} do batch ${batchId}`);

    // Atualizar status da imagem para 'processing'
    const batchRef = db.collection('batches').doc(batchId);
    const imageIndex = imageId.split('_').pop();
    
    await batchRef.update({
      [`images.${imageIndex}.status`]: 'processing',
      [`images.${imageIndex}.startedAt`]: new Date(),
      updatedAt: new Date()
    });

    // Processar conforme tipo
    let result;
    switch (type) {
      case 'virtual-staging':
        result = await processVirtualStaging(imageUrl, metadata);
        break;
      case 'video-runway':
        result = await processRunwayVideo(imageUrl, metadata);
        break;
      case 'video-pixverse':
        result = await processPixVerseVideo(imageUrl, metadata);
        break;
      default:
        throw new Error(`Tipo desconhecido: ${type}`);
    }

    // Atualizar imagem como sucesso
    await batchRef.update({
      [`images.${imageIndex}.status`]: 'completed',
      [`images.${imageIndex}.result`]: result,
      [`images.${imageIndex}.completedAt`]: new Date(),
      processedImages: admin.firestore.FieldValue.increment(1),
      successCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Verificar se batch está completo
    const batchDoc = await batchRef.get();
    const batchData = batchDoc.data();
    if (batchData.processedImages === batchData.totalImages) {
      await batchRef.update({
        status: 'completed',
        completedAt: new Date()
      });
      console.log(`✅ Batch ${batchId} COMPLETADO!`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ ${imageId} processado em ${duration}ms`);

    res.status(200).json({ success: true, imageId, duration });

  } catch (error) {
    console.error(`❌ Erro ao processar ${req.body.imageId}:`, error);

    // Atualizar imagem como falha
    try {
      const { batchId, imageId } = req.body;
      const imageIndex = imageId.split('_').pop();
      
      await db.collection('batches').doc(batchId).update({
        [`images.${imageIndex}.status`]: 'failed',
        [`images.${imageIndex}.error`]: error.message,
        [`images.${imageIndex}.failedAt`]: new Date(),
        processedImages: admin.firestore.FieldValue.increment(1),
        failureCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.error('❌ Erro ao atualizar status de falha:', updateError);
    }

    // Cloud Tasks vai tentar novamente automaticamente
    res.status(500).json({ 
      error: error.message,
      imageId: req.body.imageId 
    });
  }
});

/**
 * Processa imagem com Virtual Staging (Gemini Imagen)
 */
async function processVirtualStaging(imageUrl, metadata) {
  const response = await axios.post(
    `${process.env.GEMINI_API_URL}/v1/images:generate`,
    {
      prompt: metadata.prompt || 'Modern living room with furniture',
      imageUrl,
      model: 'imagen-3.0-generate-001'
    },
    {
      headers: { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` }
    }
  );

  return {
    imageUrl: response.data.imageUrl,
    provider: 'gemini-imagen',
    processedAt: new Date()
  };
}

/**
 * Processa vídeo com Runway Gen-3
 */
async function processRunwayVideo(imageUrl, metadata) {
  const response = await axios.post(
    `${process.env.RUNWAY_API_URL}/v1/generate`,
    {
      image: imageUrl,
      duration: metadata.duration || 5,
      prompt: metadata.prompt || 'Camera moving forward'
    },
    {
      headers: { 'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}` }
    }
  );

  return {
    videoUrl: response.data.videoUrl,
    provider: 'runway',
    processedAt: new Date()
  };
}

/**
 * Processa vídeo com PixVerse
 */
async function processPixVerseVideo(imageUrl, metadata) {
  const response = await axios.post(
    `${process.env.PIXVERSE_API_URL}/v1/generate`,
    {
      image: imageUrl,
      duration: metadata.duration || 4,
      prompt: metadata.prompt || 'Smooth camera motion'
    },
    {
      headers: { 'X-API-Key': process.env.PIXVERSE_API_KEY }
    }
  );

  return {
    videoUrl: response.data.videoUrl,
    provider: 'pixverse',
    processedAt: new Date()
  };
}

module.exports = router;
```

**Robust Track** - Adicionar:
- ✅ Circuit breaker pattern para APIs externas
- ✅ Fallback para provider alternativo se um falhar
- ✅ Métricas de performance por provider
- ✅ Cache de resultados (mesma imagem + prompt)
- ✅ Validação de resultado antes de marcar como sucesso

---

#### 1.4 Status Endpoint (Fast: 1h | Robust: 2h)

**Fast Track** - Adicionar em `src/routes/batch.js`:
```javascript
/**
 * GET /api/batch/status/:batchId
 * Consulta status de um batch
 */
router.get('/status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchDoc = await db.collection('batches').doc(batchId).get();
    
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch não encontrado' });
    }

    const batchData = batchDoc.data();

    // Calcular progresso
    const progress = batchData.totalImages > 0 
      ? Math.round((batchData.processedImages / batchData.totalImages) * 100)
      : 0;

    // Calcular tempo estimado restante
    const completedImages = batchData.images.filter(img => img.status === 'completed');
    const avgTime = completedImages.length > 0
      ? completedImages.reduce((sum, img) => {
          const duration = img.completedAt - img.startedAt;
          return sum + duration;
        }, 0) / completedImages.length
      : 30000; // 30s padrão

    const remainingImages = batchData.totalImages - batchData.processedImages;
    const estimatedTimeMs = remainingImages * avgTime;

    res.json({
      batchId: batchData.id,
      status: batchData.status,
      progress,
      totalImages: batchData.totalImages,
      processedImages: batchData.processedImages,
      successCount: batchData.successCount,
      failureCount: batchData.failureCount,
      createdAt: batchData.createdAt,
      estimatedCompletion: batchData.status === 'processing' 
        ? new Date(Date.now() + estimatedTimeMs)
        : null,
      images: batchData.images.map(img => ({
        id: img.id,
        status: img.status,
        url: img.url,
        result: img.result,
        error: img.error
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao consultar status:', error);
    res.status(500).json({ 
      error: 'Erro ao consultar status',
      message: error.message 
    });
  }
});
```

**Robust Track** - Adicionar:
- ✅ Filtros (status=pending, limit=10, offset=0)
- ✅ Agregações (imagens por status, tempo médio)
- ✅ SSE (Server-Sent Events) para updates em real-time
- ✅ Cache Redis para queries frequentes

---

#### 1.5 Integração no App Principal (Fast: 30min | Robust: 1h)

**Fast Track** - `src/app.js`:
```javascript
// Adicionar rotas de batch
const batchRoutes = require('./routes/batch');
const batchWorkerRoutes = require('./routes/batch-worker');

app.use('/api/batch', batchRoutes);
app.use('/api/batch', batchWorkerRoutes);
```

**Robust Track** - Adicionar middleware de autenticação, rate limiting, CORS específico.

---

## 🚀 FASE 2A: FAST TRACK COMPLETION (Parar Aqui se Urgência)

### ⏱️ Timeline: 0 dias extras (já incluído no MVP)

### ✅ Checklist Mínimo

- [ ] MVP deployed no Cloud Run
- [ ] Queue criada no Cloud Tasks
- [ ] Teste com 10 imagens → sucesso
- [ ] Teste com 100 imagens → sucesso
- [ ] Retry manual funciona (resubmit failed images)
- [ ] Logs básicos no Cloud Console
- [ ] README com instruções de uso

### 📝 Limitações Conhecidas

⚠️ **Aceitar essas limitações para lançar rápido:**
- Máximo 100 imagens por batch
- Sem retry automático (só manual)
- Sem alertas proativos
- Monitoramento manual via Console
- Sem testes automatizados
- Sem documentação completa

### 🎯 Quando Parar Aqui

✅ **Use Fast Track se:**
- Precisa demonstrar ao parceiro CRM URGENTE
- Vai processar <500 imagens/dia inicialmente
- Tem tempo de monitorar manualmente
- Pode dedicar 1-2h/semana para manutenção reativa

---

## 🏗️ FASE 2B: ROBUST TRACK EVOLUTION (+13-16 dias)

### **Objetivo**: Transformar MVP em sistema production-ready

### ⏱️ Timeline Adicional
- **Dias 5-8:** Error Handling & Retry (4 dias)
- **Dias 9-12:** Monitoring & Alerting (4 dias)
- **Dias 13-16:** Testing & Documentation (4 dias)
- **Dias 17-20:** Load Testing & Optimization (4 dias)

---

### 📦 Dia 5-8: Error Handling & Retry Avançado

#### Retry Automático com Cloud Tasks

**Configuração avançada** - `queue.yaml`:
```yaml
queue:
  - name: batch-processing-queue
    rate: 60/s
    max_concurrent_requests: 10
    retry_parameters:
      task_retry_limit: 5
      min_backoff_seconds: 10
      max_backoff_seconds: 300
      max_doublings: 4
      task_age_limit: 1h
```

#### Dead Letter Queue (DLQ)

**Criar** - `src/routes/batch-dlq.js`:
```javascript
/**
 * POST /api/batch/dlq
 * Processa tasks que falharam 5+ vezes
 */
router.post('/dlq', async (req, res) => {
  try {
    const { batchId, imageId, error } = req.body;

    console.error(`🚨 DLQ: ${imageId} falhou após 5 tentativas`);

    // Salvar no Firestore para análise manual
    await db.collection('dead_letters').add({
      batchId,
      imageId,
      error,
      receivedAt: new Date(),
      status: 'pending_review'
    });

    // Enviar alerta (email, Slack, PagerDuty)
    await sendAlert({
      type: 'DLQ_ITEM',
      severity: 'HIGH',
      message: `Imagem ${imageId} falhou após 5 tentativas`,
      details: { batchId, error }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no DLQ:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### Circuit Breaker

**Implementar** - `src/utils/circuitBreaker.js`:
```javascript
class CircuitBreaker {
  constructor(name, threshold = 5, timeout = 60000) {
    this.name = name;
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.warn(`🔴 Circuit breaker ${this.name} is now OPEN`);
    }
  }
}

// Usar nos workers
const geminiBreaker = new CircuitBreaker('gemini', 5, 60000);

async function processVirtualStaging(imageUrl, metadata) {
  return await geminiBreaker.execute(async () => {
    const response = await axios.post(/* ... */);
    return response.data;
  });
}
```

---

### 📦 Dia 9-12: Monitoring & Alerting

#### Cloud Monitoring Dashboards

**Métricas customizadas** - `src/utils/metrics.js`:
```javascript
const { MetricServiceClient } = require('@google-cloud/monitoring');
const client = new MetricServiceClient();

async function recordBatchMetric(metricType, value, labels = {}) {
  const projectId = process.env.GCP_PROJECT_ID;
  const projectPath = client.projectPath(projectId);

  const dataPoint = {
    interval: {
      endTime: { seconds: Date.now() / 1000 }
    },
    value: { doubleValue: value }
  };

  const timeSeries = {
    metric: {
      type: `custom.googleapis.com/batch/${metricType}`,
      labels
    },
    resource: {
      type: 'cloud_run_revision',
      labels: {
        project_id: projectId,
        service_name: 'apiruum',
        location: 'us-central1'
      }
    },
    points: [dataPoint]
  };

  await client.createTimeSeries({
    name: projectPath,
    timeSeries: [timeSeries]
  });
}

// Usar no worker
await recordBatchMetric('processing_duration', duration, {
  type: 'virtual-staging',
  status: 'success'
});
```

#### Alerting Policies

**Criar** - `monitoring/alerts.json`:
```json
{
  "displayName": "Batch Processing - Alta Taxa de Falhas",
  "conditions": [{
    "displayName": "Failure Rate > 10%",
    "conditionThreshold": {
      "filter": "metric.type=\"custom.googleapis.com/batch/failure_rate\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.1,
      "duration": "300s"
    }
  }],
  "notificationChannels": ["projects/PROJECT_ID/notificationChannels/EMAIL"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
```

---

### 📦 Dia 13-16: Testing & Documentation

#### Testes Unitários

**Exemplo** - `tests/batch.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/batch/create', () => {
  test('deve criar batch com sucesso', async () => {
    const response = await request(app)
      .post('/api/batch/create')
      .send({
        userId: 'user123',
        type: 'virtual-staging',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.batchId).toBeDefined();
    expect(response.body.totalImages).toBe(2);
  });

  test('deve rejeitar batch vazio', async () => {
    const response = await request(app)
      .post('/api/batch/create')
      .send({
        userId: 'user123',
        images: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('vazia');
  });
});
```

#### Testes de Integração

**Exemplo** - `tests/integration/batch-flow.test.js`:
```javascript
test('fluxo completo: criar → processar → consultar', async () => {
  // 1. Criar batch
  const createResponse = await request(app)
    .post('/api/batch/create')
    .send({ userId: 'test', images: ['url1', 'url2'] });

  const { batchId } = createResponse.body;

  // 2. Aguardar processamento (mock)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. Consultar status
  const statusResponse = await request(app)
    .get(`/api/batch/status/${batchId}`);

  expect(statusResponse.body.status).toBe('completed');
  expect(statusResponse.body.successCount).toBe(2);
}, 30000);
```

---

### 📦 Dia 17-20: Load Testing & Optimization

#### k6 Load Test

**Script** - `tests/load/batch-load.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const payload = JSON.stringify({
    userId: 'loadtest_user',
    type: 'virtual-staging',
    images: Array.from({ length: 50 }, (_, i) => 
      `https://example.com/image${i}.jpg`
    )
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  let response = http.post(
    'https://apiruum.run.app/api/batch/create',
    payload,
    params
  );

  check(response, {
    'status is 201': (r) => r.status === 201,
    'has batchId': (r) => JSON.parse(r.body).batchId !== undefined,
  });

  sleep(1);
}
```

**Executar**:
```bash
k6 run tests/load/batch-load.js
```

---

## 🎯 Matriz de Decisão: Qual Trajetória Seguir?

| Situação | Recomendação | Justificativa |
|----------|--------------|---------------|
| **Demo para parceiro em 1 semana** | Fast Track | Valor > Perfeição |
| **Processar 100-500 imgs/dia** | Fast Track → Hybrid | Começar simples, evoluir |
| **Processar 1000+ imgs/dia** | Robust Track | Precisa resiliência |
| **Equipe de 1 pessoa** | Fast Track | Manutenibilidade |
| **Equipe de 2+ pessoas** | Robust Track | Divide tarefas |
| **Budget limitado (<$50/mês)** | Fast Track | Menos infra |
| **SLA crítico (99.9% uptime)** | Robust Track | Precisa monitoring |
| **MVP para validar mercado** | Fast Track | Iterar rápido |
| **Sistema definitivo** | Robust Track | Qualidade |

---

## 📋 Checklist Final por Trajetória

### Fast Track ✅

- [ ] Cloud Tasks Queue criada
- [ ] Endpoint POST /api/batch/create
- [ ] Endpoint POST /api/batch/worker
- [ ] Endpoint GET /api/batch/status/:id
- [ ] Firestore collection 'batches'
- [ ] Teste com 10 imagens → OK
- [ ] Teste com 100 imagens → OK
- [ ] README com instruções básicas
- [ ] Deploy no Cloud Run
- [ ] Variáveis de ambiente configuradas

**Tempo Total:** 18-24 horas (3-4 dias × 6h/dia)

---

### Robust Track ✅

**Tudo do Fast Track +**

- [ ] Terraform IaC para infra
- [ ] Retry automático (Cloud Tasks config)
- [ ] Dead Letter Queue
- [ ] Circuit breaker pattern
- [ ] Cloud Monitoring dashboards
- [ ] Alerting policies (Slack/Email)
- [ ] Testes unitários (80%+ coverage)
- [ ] Testes de integração
- [ ] Load testing (k6)
- [ ] Documentação completa (API + Ops)
- [ ] Code review aprovado
- [ ] Suporte a 10,000 imagens/batch
- [ ] Rate limiting dinâmico
- [ ] Webhook notifications

**Tempo Total:** 40-60 horas (20 dias × 2-3h/dia)

---

## 🎭 Hybrid Approach: Melhor dos Dois Mundos

### Cronograma Híbrido Recomendado

```
Semana 1 (Dias 1-4): FAST TRACK MVP
├─ Dia 1: Setup GCP + Batch Creation
├─ Dia 2: Worker Function + Status
├─ Dia 3: Testing (10/100 imgs) + Deploy
└─ Dia 4: Demo para parceiro ✅

📊 CHECKPOINT: MVP aprovado pelo parceiro?
   └─ SIM → Continuar para Semana 2-4
   └─ NÃO → Iterar no MVP

Semana 2 (Dias 5-8): ERROR HANDLING
├─ Dia 5: Cloud Tasks retry config avançada
├─ Dia 6: Dead Letter Queue
├─ Dia 7: Circuit breaker
└─ Dia 8: Teste stress (500 imgs)

Semana 3 (Dias 9-12): OBSERVABILITY
├─ Dia 9: Cloud Monitoring dashboards
├─ Dia 10: Custom metrics
├─ Dia 11: Alerting policies
└─ Dia 12: Slack integration

Semana 4 (Dias 13-16): QUALITY
├─ Dia 13: Testes unitários
├─ Dia 14: Testes integração
├─ Dia 15: Load testing (1000 imgs)
└─ Dia 16: Documentação completa

📊 CHECKPOINT: Tudo verde?
   └─ SIM → GO LIVE 🚀
   └─ NÃO → Mais 4 dias para ajustes
```

---

## 💰 Estimativa de Custos por Trajetória

### Fast Track
- **Cloud Run:** $10-20/mês (minimal instances)
- **Cloud Tasks:** $0.40/milhão tasks (~$5/mês para 10k imgs/dia)
- **Firestore:** $5-10/mês (reads/writes)
- **APIs Externas:** $500-2000/mês (Gemini, Runway, PixVerse)

**Total GCP:** ~$20-35/mês  
**Total APIs:** ~$500-2000/mês  
**TOTAL:** ~$520-2035/mês

### Robust Track
- **Cloud Run:** $20-40/mês (autoscaling, min instances 2)
- **Cloud Tasks:** $0.40/milhão (~$10/mês)
- **Firestore:** $10-20/mês
- **Cloud Monitoring:** $5-15/mês (custom metrics)
- **APIs Externas:** $500-2000/mês

**Total GCP:** ~$45-85/mês  
**Total APIs:** ~$500-2000/mês  
**TOTAL:** ~$545-2085/mês

**Diferença:** ~$25-50/mês (+5-10% mais caro)

---

## 🚨 Riscos e Mitigações por Trajetória

| Risco | Fast Track | Robust Track | Hybrid |
|-------|-----------|--------------|--------|
| **API externa cai** | ⚠️ Falha manual | ✅ Circuit breaker | ⚠️ → ✅ |
| **Batch grande (1000+)** | ❌ Não suporta | ✅ Suporta | ⚠️ → ✅ |
| **Bug em produção** | ⚠️ Hotfix manual | ✅ Rollback auto | ⚠️ → ✅ |
| **Monitorar problema** | ⚠️ Manual | ✅ Alertas auto | ⚠️ → ✅ |
| **Falha no retry** | ❌ Perda de dados | ✅ DLQ salva | ⚠️ → ✅ |

---

## 📞 Próximos Passos

### Opção 1: Fast Track (3-4 dias)
```bash
# Você escolhe começar AGORA
$ "Vamos com Fast Track - gere os arquivos do Dia 1"

# Eu gero em ~15 minutos:
# - src/routes/batch.js
# - src/routes/batch-worker.js  
# - queue.yaml
# - .env.example (variáveis necessárias)
# - README-BATCH.md (instruções de uso)

# Você executa (2-3h):
$ gcloud tasks queues create ...
$ npm install @google-cloud/tasks
$ Deploy no Cloud Run
$ Testar com 10 imagens
```

### Opção 2: Robust Track (20 dias)
```bash
# Você escolhe planejamento completo
$ "Vamos com Robust Track - siga o cronograma de 20 dias"

# Começo pelo Dia 1, mas com:
# - Testes unitários desde o início
# - Documentação completa
# - Code review em cada PR
# - Setup de CI/CD
```

### Opção 3: Hybrid (4-20 dias)
```bash
# Você escolhe flexibilidade
$ "Vamos com Hybrid - comece Fast mas prepare para Robust"

# Implemento MVP em 3-4 dias
# Depois iteramos para adicionar:
# - Semana 2: Retry avançado
# - Semana 3: Monitoring
# - Semana 4: Testing completo
```

---

## ❓ FAQ - Perguntas Frequentes

### 1. **Posso mudar de trajetória no meio do caminho?**
✅ **SIM!** O design é modular. Você pode:
- Começar Fast Track → migrar para Robust depois
- Começar Robust → simplificar para Fast se urgência surgir

### 2. **Qual tem melhor ROI?**
📊 **Depende do volume:**
- <500 imgs/dia → Fast Track (ROI alto)
- 500-2000 imgs/dia → Hybrid (balanceado)
- 2000+ imgs/dia → Robust (ROI alto pela resiliência)

### 3. **Fast Track pode quebrar em produção?**
⚠️ **Pode, mas controlado:**
- Limitado a 100 imgs/batch
- Retry manual funciona
- Você monitora no Console
- Para MVPs/demos é suficiente

### 4. **Robust Track vale o tempo extra?**
✅ **Vale se:**
- Vai processar >1000 imgs/dia
- Precisa SLA 99.9%
- Equipe >1 pessoa
- Sistema de longo prazo

### 5. **Hybrid é a melhor escolha?**
🎯 **Na maioria dos casos, SIM:**
- Valor imediato (MVP em 4 dias)
- Evolução controlada
- Aprende com uso real antes de investir

---

## 🎯 Conclusão e Recomendação

### Para Ruum API (seu caso):

**🎭 RECOMENDO: HYBRID APPROACH**

**Razões:**
1. ✅ **Urgência:** Parceiro CRM precisa ver funcionando logo
2. ✅ **Volume incerto:** Não sabe se será 100 ou 10,000 imgs/dia inicialmente
3. ✅ **Aprendizado:** Melhor evoluir com feedback real
4. ✅ **Equipe pequena:** 1 pessoa (você) deve focar em valor primeiro

**Plano:**
```
Semana 1: Fast Track MVP (3-4 dias, 6h/dia)
├─ Lançar para parceiro
├─ Processar primeiros lotes reais
└─ Coletar feedback

Semana 2-4: Evoluir para Robust (conforme necessidade)
├─ Se volume >500/dia → adicionar retry avançado
├─ Se falhas >5% → adicionar monitoring
└─ Se sucesso → investir em testes + docs
```

---

## 📧 Contato

**Dúvidas sobre qual trajetória escolher?**
- Email: renato@ruum.com.br
- Assunto: "Batch Processing - Escolha de Trajetória"

**Pronto para começar?**
- Responda: "Fast Track", "Robust Track" ou "Hybrid"
- Eu gero os arquivos em 15-30 minutos
- Você começa a implementar hoje mesmo! 🚀

---

**Última atualização:** 3 de fevereiro de 2026  
**Versão:** 2.0 Hybrid
