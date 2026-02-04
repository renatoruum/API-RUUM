# 📋 Plano de Implementação - Sistema de Processamento em Lote

> **Projeto:** Batch Processing System com Cloud Tasks  
> **Responsável:** Time Dev API Ruum  
> **Prazo:** 4 semanas  
> **Status:** Planejamento

---

## 🎯 Objetivo do Projeto

Implementar sistema de processamento em lote para Virtual Staging, permitindo que parceiros CRM processem **centenas/milhares de imagens simultaneamente** de forma eficiente, confiável e escalável.

**Principais Entregas:**
- ✅ Endpoint de criação de batch (`POST /api/batch/staging/create`)
- ✅ Sistema de filas com Cloud Tasks
- ✅ Workers para processamento paralelo
- ✅ API de monitoramento (`GET /api/batch/:id/status`)
- ✅ Sistema de retry automático
- ✅ Documentação completa

---

## 📅 Cronograma Geral

| Fase | Duração | Início | Fim | Objetivo |
|------|---------|--------|-----|----------|
| **Setup & Infra** | 3 dias | Sem 1 | Sem 1 | Configurar GCP e ambiente |
| **Fase 1: MVP** | 10 dias | Sem 1 | Sem 2 | Validar arquitetura (100 imgs) |
| **Fase 2: Produção** | 7 dias | Sem 3 | Sem 3 | Preparar para larga escala |
| **Fase 3: Testes** | 4 dias | Sem 4 | Sem 4 | Load testing e ajustes |
| **Go-Live** | 1 dia | Sem 4 | Sem 4 | Deploy em produção |

**Total:** ~4 semanas (20 dias úteis)

---

## 🔧 Pré-Requisitos e Setup

### **1. Configuração GCP (Dia 1)**

#### **1.1 Criar Cloud Tasks Queue**

```bash
# Criar queue no GCP
gcloud tasks queues create imagen-staging-queue \
  --location=us-central1 \
  --max-dispatches-per-second=1 \
  --max-concurrent-dispatches=10

# Verificar criação
gcloud tasks queues describe imagen-staging-queue \
  --location=us-central1
```

#### **1.2 Configurar Rate Limiting**

Criar arquivo `queue.yaml`:

```yaml
queue:
  name: imagen-staging-queue
  rate: 60/m
  bucket_size: 10
  max_concurrent_dispatches: 10
  retry_parameters:
    task_retry_limit: 3
    min_backoff: 10s
    max_backoff: 300s
    max_doublings: 3
  task_age_limit: 86400s
```

Deploy:
```bash
gcloud tasks queues update imagen-staging-queue \
  --location=us-central1 \
  --max-dispatches-per-second=1 \
  --max-concurrent-dispatches=10 \
  --max-attempts=3
```

#### **1.3 Configurar Firestore**

```javascript
// Criar collections no Firestore
// Collection: batches
// Structure:
{
  batchId: string,
  clientName: string,
  designStyle: string,
  roomType: string,
  total: number,
  completed: number,
  processing: number,
  failed: number,
  queued: number,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp,
  images: [
    {
      index: number,
      url: string,
      propertyCode: string,
      status: 'queued' | 'processing' | 'completed' | 'failed',
      outputUrl: string,
      error: string,
      queuedAt: timestamp,
      startedAt: timestamp,
      completedAt: timestamp,
      processingTimeMs: number
    }
  ]
}
```

Criar índices:
```bash
# No Firebase Console > Firestore > Indexes
# Criar índice composto:
# Collection: batches
# Fields: status (Ascending), createdAt (Descending)
```

#### **1.4 Configurar Variáveis de Ambiente**

`.env`:
```bash
# GCP
GCP_PROJECT_ID=api-ruum
GCP_REGION=us-central1

# Cloud Tasks
CLOUD_TASKS_QUEUE=imagen-staging-queue
WORKER_URL=https://apiruum-562831020087.us-central1.run.app

# Firebase
FIREBASE_STORAGE_BUCKET=api-ruum.firebasestorage.app

# Gemini API
GEMINI_API_KEY=your_key_here
GEMINI_RATE_LIMIT=60  # RPM
```

---

## 📝 Fase 1: MVP - Implementação Base (Semanas 1-2)

### **Objetivo:** Validar arquitetura com lotes de até 100 imagens

---

### **Sprint 1.1: Endpoint de Criação de Batch (Dias 2-3)**

#### **Tarefa 1.1.1: Criar rota de batch**

```bash
# Criar arquivo
touch src/routes/batch.js
```

Implementar:
```javascript
// src/routes/batch.js
const express = require('express');
const router = express.Router();
const { CloudTasksClient } = require('@google-cloud/tasks');
const admin = require('firebase-admin');

const db = admin.firestore();
const tasksClient = new CloudTasksClient();

// POST /api/batch/staging/create
router.post('/staging/create', async (req, res) => {
  try {
    const { images, designStyle, roomType, clientName, priority = 'normal' } = req.body;

    // Validação
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Campo "images" é obrigatório e deve ser um array não vazio'
      });
    }

    if (images.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Limite máximo de 10.000 imagens por batch'
      });
    }

    // Criar batchId
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar documento no Firestore
    const batchData = {
      batchId,
      clientName,
      designStyle,
      roomType,
      priority,
      total: images.length,
      completed: 0,
      processing: 0,
      failed: 0,
      queued: images.length,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      images: images.map((img, index) => ({
        index,
        url: img.url,
        propertyCode: img.propertyCode || `IMG-${index + 1}`,
        status: 'queued',
        outputUrl: null,
        error: null,
        queuedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null
      }))
    };

    await db.collection('batches').doc(batchId).set(batchData);

    // Enfileirar tasks (implementar em 1.1.2)
    await enqueueBatchTasks(batchId, images, { designStyle, roomType, clientName });

    res.json({
      success: true,
      batchId,
      total: images.length,
      status: 'queued',
      message: `Batch criado com ${images.length} imagens`
    });

  } catch (error) {
    console.error('Erro ao criar batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

**Critérios de Aceitação:**
- ✅ Endpoint aceita array de imagens
- ✅ Valida campos obrigatórios
- ✅ Cria documento no Firestore
- ✅ Retorna batchId

---

#### **Tarefa 1.1.2: Implementar Enqueue de Tasks**

```javascript
// src/utils/cloudTasks.js
const { CloudTasksClient } = require('@google-cloud/tasks');

const client = new CloudTasksClient();
const project = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_REGION;
const queue = process.env.CLOUD_TASKS_QUEUE;

async function enqueueBatchTasks(batchId, images, config) {
  const queuePath = client.queuePath(project, location, queue);
  const { designStyle, roomType, clientName } = config;

  console.log(`📤 Enfileirando ${images.length} tasks para batch ${batchId}...`);

  const promises = images.map(async (image, index) => {
    const payload = {
      batchId,
      imageIndex: index,
      imageUrl: image.url,
      propertyCode: image.propertyCode || `IMG-${index + 1}`,
      designStyle,
      roomType,
      clientName
    };

    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${process.env.WORKER_URL}/api/worker/process-staging`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64')
      }
    };

    try {
      const [response] = await client.createTask({ parent: queuePath, task });
      return { success: true, taskName: response.name };
    } catch (error) {
      console.error(`Erro ao enfileirar task ${index}:`, error.message);
      return { success: false, error: error.message };
    }
  });

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`✅ ${successCount}/${images.length} tasks enfileiradas`);
  
  return results;
}

module.exports = { enqueueBatchTasks };
```

**Critérios de Aceitação:**
- ✅ Cria tasks no Cloud Tasks
- ✅ Payload em base64
- ✅ Retorna contagem de sucesso

---

### **Sprint 1.2: Worker Function (Dias 4-6)**

#### **Tarefa 1.2.1: Criar Worker Endpoint**

```bash
# Criar arquivo
touch src/routes/worker.js
```

Implementar:
```javascript
// src/routes/worker.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { processFullPipeline } = require('../connectors/imagenStaging');

const db = admin.firestore();

// POST /api/worker/process-staging
router.post('/process-staging', async (req, res) => {
  const startTime = Date.now();
  const {
    batchId,
    imageIndex,
    imageUrl,
    propertyCode,
    designStyle,
    roomType,
    clientName
  } = req.body;

  console.log(`\n🔄 [${batchId}] Worker iniciado - Imagem ${imageIndex + 1}`);

  try {
    // Atualizar status: queued → processing
    await db.collection('batches').doc(batchId).update({
      [`images.${imageIndex}.status`]: 'processing',
      [`images.${imageIndex}.startedAt`]: new Date().toISOString(),
      processing: admin.firestore.FieldValue.increment(1),
      queued: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Processar Virtual Staging
    const result = await processFullPipeline({
      imageUrl,
      designStyle,
      roomType,
      clientName,
      propertyCode
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ [${batchId}] Imagem ${imageIndex + 1} concluída em ${processingTime}ms`);

    // Atualizar status: processing → completed
    await db.collection('batches').doc(batchId).update({
      [`images.${imageIndex}.status`]: 'completed',
      [`images.${imageIndex}.outputUrl`]: result.firebase_url,
      [`images.${imageIndex}.completedAt`]: new Date().toISOString(),
      [`images.${imageIndex}.processingTimeMs`]: processingTime,
      completed: admin.firestore.FieldValue.increment(1),
      processing: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Verificar se batch completo
    const batchDoc = await db.collection('batches').doc(batchId).get();
    const batch = batchDoc.data();
    
    if (batch.completed + batch.failed === batch.total) {
      await db.collection('batches').doc(batchId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🎉 [${batchId}] BATCH COMPLETO!`);
    }

    res.json({ success: true, processingTime });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${batchId}] Erro na imagem ${imageIndex + 1}:`, error.message);

    // Atualizar status: processing → failed
    await db.collection('batches').doc(batchId).update({
      [`images.${imageIndex}.status`]: 'failed',
      [`images.${imageIndex}.error`]: error.message,
      [`images.${imageIndex}.completedAt`]: new Date().toISOString(),
      [`images.${imageIndex}.processingTimeMs`]: processingTime,
      failed: admin.firestore.FieldValue.increment(1),
      processing: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Retornar 500 para permitir retry do Cloud Tasks
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

**Critérios de Aceitação:**
- ✅ Atualiza status no Firestore
- ✅ Processa imagem com Virtual Staging
- ✅ Trata erros e permite retry
- ✅ Detecta conclusão de batch

---

#### **Tarefa 1.2.2: Registrar Rotas no App**

```javascript
// src/app.js
const batchRoutes = require('./routes/batch');
const workerRoutes = require('./routes/worker');

app.use('/api/batch', batchRoutes);
app.use('/api/worker', workerRoutes);
```

---

### **Sprint 1.3: Status e Monitoramento (Dias 7-8)**

#### **Tarefa 1.3.1: Endpoint de Status**

```javascript
// src/routes/batch.js (adicionar)

// GET /api/batch/:batchId/status
router.get('/:batchId/status', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batchDoc = await db.collection('batches').doc(batchId).get();

    if (!batchDoc.exists) {
      return res.status(404).json({
        success: false,
        error: `Batch ${batchId} não encontrado`
      });
    }

    const batch = batchDoc.data();

    // Calcular progresso
    const progress = Math.round((batch.completed / batch.total) * 100);

    // Calcular tempo médio
    const completedImages = batch.images.filter(img => img.status === 'completed');
    const avgTime = completedImages.length > 0
      ? completedImages.reduce((sum, img) => sum + (img.processingTimeMs || 0), 0) / completedImages.length
      : 0;

    // Estimar tempo restante
    const remaining = batch.total - batch.completed - batch.failed;
    const estimatedMinutes = Math.ceil((remaining * avgTime) / 60000);

    res.json({
      success: true,
      batchId,
      status: batch.status,
      total: batch.total,
      completed: batch.completed,
      processing: batch.processing,
      failed: batch.failed,
      queued: batch.queued,
      progress,
      clientName: batch.clientName,
      designStyle: batch.designStyle,
      roomType: batch.roomType,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt || null,
      statistics: {
        avgProcessingTimeMs: Math.round(avgTime),
        estimatedRemainingMinutes,
        successRate: Math.round((batch.completed / batch.total) * 100)
      },
      images: batch.images
    });

  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Critérios de Aceitação:**
- ✅ Retorna status completo do batch
- ✅ Calcula progresso em %
- ✅ Estima tempo restante
- ✅ Lista todas as imagens com status

---

### **Sprint 1.4: Testes do MVP (Dias 9-10)**

#### **Tarefa 1.4.1: Teste com 10 Imagens**

```javascript
// test/batch-10-images.test.js
const axios = require('axios');

async function testBatch10Images() {
  console.log('🧪 Teste: 10 imagens');

  // Criar batch
  const createResponse = await axios.post('http://localhost:3000/api/batch/staging/create', {
    images: Array(10).fill(null).map((_, i) => ({
      url: `https://storage.googleapis.com/test-images/img${i}.jpg`,
      propertyCode: `TEST-${i}`
    })),
    designStyle: 'modern',
    roomType: 'living_room',
    clientName: 'Test Client'
  });

  console.log('✅ Batch criado:', createResponse.data.batchId);
  const batchId = createResponse.data.batchId;

  // Polling de status
  let completed = false;
  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s

    const statusResponse = await axios.get(`http://localhost:3000/api/batch/${batchId}/status`);
    const status = statusResponse.data;

    console.log(`📊 Progresso: ${status.progress}% (${status.completed}/${status.total})`);

    if (status.completed + status.failed === status.total) {
      completed = true;
      console.log('🎉 Batch completo!');
      console.log(`   Sucesso: ${status.completed}`);
      console.log(`   Falhas: ${status.failed}`);
    }
  }
}

testBatch10Images().catch(console.error);
```

**Critérios de Aceitação:**
- ✅ 10 imagens processadas com sucesso
- ✅ Status atualizado corretamente
- ✅ Tempo total < 15 minutos

---

#### **Tarefa 1.4.2: Teste com 100 Imagens**

```bash
# Executar teste de carga
node test/batch-100-images.test.js
```

**Critérios de Aceitação:**
- ✅ 100 imagens processadas
- ✅ Taxa de sucesso > 90%
- ✅ Rate limiting funcionando (60 RPM)
- ✅ Sem erros de quota

---

## 📝 Fase 2: Produção (Semana 3)

### **Objetivo:** Preparar para larga escala (1000+ imagens)

---

### **Sprint 2.1: Retry Automático (Dias 11-12)**

#### **Tarefa 2.1.1: Endpoint de Retry Failed**

```javascript
// src/routes/batch.js (adicionar)

// POST /api/batch/:batchId/retry-failed
router.post('/:batchId/retry-failed', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batchDoc = await db.collection('batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ success: false, error: 'Batch não encontrado' });
    }

    const batch = batchDoc.data();
    const failedImages = batch.images.filter(img => img.status === 'failed');

    if (failedImages.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhuma imagem com falha',
        retriedCount: 0
      });
    }

    console.log(`🔄 [${batchId}] Retry de ${failedImages.length} imagens...`);

    // Re-enfileirar
    for (const image of failedImages) {
      await enqueueSingleTask(batchId, image.index, image, {
        designStyle: batch.designStyle,
        roomType: batch.roomType,
        clientName: batch.clientName
      });

      // Reset status
      await db.collection('batches').doc(batchId).update({
        [`images.${image.index}.status`]: 'queued',
        [`images.${image.index}.error`]: null,
        [`images.${image.index}.queuedAt`]: new Date().toISOString(),
        failed: admin.firestore.FieldValue.increment(-1),
        queued: admin.firestore.FieldValue.increment(1)
      });
    }

    res.json({
      success: true,
      retriedCount: failedImages.length,
      message: `${failedImages.length} imagens re-enfileiradas`
    });

  } catch (error) {
    console.error('Erro no retry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Critérios de Aceitação:**
- ✅ Identifica imagens com falha
- ✅ Re-enfileira automaticamente
- ✅ Reseta status para "queued"

---

### **Sprint 2.2: Monitoramento e Alertas (Dias 13-14)**

#### **Tarefa 2.2.1: Cloud Monitoring Dashboard**

```bash
# Criar dashboard no Cloud Monitoring
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json
```

`monitoring-dashboard.json`:
```json
{
  "displayName": "Batch Processing Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Tasks Enfileiradas",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_tasks_queue\" AND metric.type=\"cloudtasks.googleapis.com/queue/depth\""
                }
              }
            }]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Taxa de Sucesso",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
```

---

#### **Tarefa 2.2.2: Alertas de Quota**

```bash
# Criar alerta para quota do Gemini
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Gemini Quota Alert" \
  --condition-display-name="Quota > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

---

### **Sprint 2.3: Documentação (Dias 15-16)**

#### **Tarefa 2.3.1: Criar Documentação Pública**

```bash
# Criar arquivo de documentação
touch documentation/Public/BATCH_PROCESSING_API.md
```

Conteúdo mínimo:
- Endpoint de criação de batch
- Endpoint de status
- Endpoint de retry
- Exemplos de uso
- Códigos de erro
- Limites e quotas

---

### **Sprint 2.4: Testes de Carga (Dia 17)**

#### **Tarefa 2.4.1: Teste com 1000 Imagens**

```javascript
// test/load-test-1000.js
async function loadTest1000() {
  const batchSize = 1000;
  
  console.log(`🔥 Load Test: ${batchSize} imagens`);
  
  // Criar batch
  const response = await axios.post('http://localhost:3000/api/batch/staging/create', {
    images: Array(batchSize).fill(null).map((_, i) => ({
      url: `https://storage.googleapis.com/test-images/img${i % 100}.jpg`,
      propertyCode: `LOAD-${i}`
    })),
    designStyle: 'modern',
    roomType: 'living_room',
    clientName: 'Load Test'
  });
  
  console.log('Batch criado:', response.data.batchId);
  
  // Monitorar
  // ... (similar ao teste anterior)
}
```

**Critérios de Aceitação:**
- ✅ 1000 imagens processadas
- ✅ Taxa de sucesso > 95%
- ✅ Tempo total < 3 horas
- ✅ Sem erros de quota
- ✅ Rate limiting funcionando

---

## 📝 Fase 3: Testes Finais e Go-Live (Semana 4)

### **Sprint 3.1: Testes de Integração (Dias 18-19)**

#### **Tarefa 3.1.1: Teste End-to-End**

- [ ] Criar batch via API
- [ ] Monitorar progresso em tempo real
- [ ] Simular falhas e testar retry
- [ ] Validar URLs geradas
- [ ] Testar concorrência (múltiplos batches)

---

#### **Tarefa 3.1.2: Teste de Stress**

```bash
# Usar k6 ou Artillery para stress test
k6 run load-test.js
```

**Cenários:**
- 5 batches simultâneos de 200 imagens cada
- Validar que rate limiting funciona
- Validar que não há memory leaks

---

### **Sprint 3.2: Deploy em Produção (Dia 20)**

#### **Checklist de Deploy:**

**Pré-Deploy:**
- [ ] Code review completo
- [ ] Todos os testes passando
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco de dados

**Deploy:**
```bash
# 1. Deploy da API
gcloud run deploy apiruum \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# 2. Configurar Cloud Tasks queue
gcloud tasks queues update imagen-staging-queue \
  --location=us-central1 \
  --max-dispatches-per-second=1 \
  --max-concurrent-dispatches=10

# 3. Verificar saúde do sistema
curl https://apiruum-562831020087.us-central1.run.app/health
```

**Pós-Deploy:**
- [ ] Monitorar logs por 2 horas
- [ ] Executar smoke test (10 imagens)
- [ ] Validar métricas no Cloud Monitoring
- [ ] Notificar parceiro CRM

---

## 📊 Métricas de Sucesso

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Taxa de Sucesso** | > 95% | `completed / total` |
| **Tempo Médio/Imagem** | < 60s | `avg(processingTimeMs)` |
| **Throughput** | 10k imgs/dia | Cloud Monitoring |
| **Uptime** | > 99.5% | Cloud Monitoring |
| **Retry Rate** | < 5% | `failed / total` |
| **Custo/Imagem** | < $0.006 | GCP Billing |

---

## 🚨 Riscos e Planos de Contingência

### **Risco 1: Gemini Rate Limit Excedido**

**Probabilidade:** Alta  
**Impacto:** Alto (processamento para)

**Contingência:**
1. Reduzir `max_dispatches_per_second` para 0.8 (48/min)
2. Implementar circuit breaker
3. Notificar cliente sobre delay
4. Considerar fallback para outro provider

---

### **Risco 2: Cloud Tasks com Problemas**

**Probabilidade:** Baixa  
**Impacto:** Crítico

**Contingência:**
1. Implementar dead letter queue
2. Sistema de notificação de falhas
3. Processo manual de retry
4. SLA com Google Cloud

---

### **Risco 3: Custo Acima do Esperado**

**Probabilidade:** Média  
**Impacto:** Alto

**Contingência:**
1. Budget alerts configurados ($100/dia)
2. Análise semanal de custos
3. Cache de resultados similares
4. Otimização de qualidade vs custo

---

## 👥 Responsabilidades

| Papel | Responsável | Tarefas |
|-------|-------------|---------|
| **Tech Lead** | Renato | Arquitetura, code review, deploy |
| **Backend Dev** | Dev 1 | Endpoints, workers, testes |
| **DevOps** | Dev 2 | GCP config, monitoring, CI/CD |
| **QA** | Dev 3 | Testes, validação, documentação |

---

## ✅ Checklist Final de Go-Live

### **Técnico:**
- [ ] Todos os endpoints implementados e testados
- [ ] Cloud Tasks configurado e testado
- [ ] Firestore com índices criados
- [ ] Variáveis de ambiente em produção
- [ ] Logs estruturados e centralizados
- [ ] Monitoramento e alertas ativos
- [ ] Documentação completa (Public + Private)
- [ ] Load test com 1000 imagens passou
- [ ] Taxa de sucesso > 95%
- [ ] Retry automático funcionando

### **Operacional:**
- [ ] Runbook de troubleshooting criado
- [ ] SLA definido e acordado com CRM
- [ ] Processo de escalação documentado
- [ ] Budget alerts configurados
- [ ] Backup e disaster recovery testados

### **Negócio:**
- [ ] Pricing definido com CRM
- [ ] Contrato assinado
- [ ] Treinamento do time do CRM realizado
- [ ] Suporte 24/7 configurado (ou horário definido)

---

## 📞 Contatos

**Time Técnico:**
- Tech Lead: renato@ruum.com.br
- Slack: #dev-api-ruum

**Escalação:**
- Nível 1: Slack (resposta em 1h)
- Nível 2: Email (resposta em 4h)
- Nível 3: Phone (emergências)

---

## 📎 Anexos

### **Links Úteis:**
- [Arquitetura Detalhada](./BATCH_PROCESSING_ARCHITECTURE.md)
- [Documentação GCP Cloud Tasks](https://cloud.google.com/tasks/docs)
- [Gemini API Limits](https://ai.google.dev/gemini-api/docs/rate-limits)

### **Scripts Úteis:**

```bash
# Monitorar queue em tempo real
watch -n 5 'gcloud tasks queues describe imagen-staging-queue --location=us-central1'

# Ver logs do worker
gcloud run logs read apiruum --region=us-central1 --limit=50 | grep "worker"

# Pausar queue (emergência)
gcloud tasks queues pause imagen-staging-queue --location=us-central1

# Retomar queue
gcloud tasks queues resume imagen-staging-queue --location=us-central1
```

---

**Última Atualização:** 3 de Fevereiro de 2026  
**Versão:** 1.0  
**Status:** Aprovado para Implementação
