# 🎬 FFmpeg Serverless API - Processamento de Vídeos

> **Endpoint Base:** Google Cloud Function  
> **Métodos:** POST  
> **Tipo:** Síncrono  
> **Tempo de Resposta:** 30-90 segundos (depende da duração dos vídeos)

---

## 📋 Visão Geral

API serverless (Google Cloud Functions) dedicada ao processamento de vídeos com FFmpeg. Oferece duas funcionalidades principais:

1. **Before/After** - Cria vídeo comparativo com máscara de transição
2. **Merge Videos** - Concatena dois vídeos mantendo qualidade e orientação

**Uso na plataforma Ruum:**
- Processar vídeos Before/After com alta qualidade
- Mesclar vídeos (Before/After + Camera Magic/Magic Motion)
- Suporte para orientação horizontal (16:9) e vertical (9:16)
- Normalização automática de resolução, FPS e aspect ratio

⚠️ **Nota:** Endpoint serverless separado da API principal para melhor performance e isolamento de recursos.

---

## 🔗 Endpoints Disponíveis

### 1. Before/After com Máscara

```
POST https://[REGION]-[PROJECT].cloudfunctions.net/processVideo?action=processBeforeAfter
```

### 2. Merge de Vídeos (Concatenação)

```
POST https://[REGION]-[PROJECT].cloudfunctions.net/processVideo?action=mergeVideos
```

---

## 🎭 Before/After com Máscara

### Endpoint:

```
POST /processVideo?action=processBeforeAfter
```

### Descrição:

Cria vídeo comparativo Before/After com máscara de transição animada. Suporta orientação horizontal (1280x720) e vertical (1080x1920).

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `beforeUrl` | string | ✅ | URL da imagem "antes" (JPG/PNG) |
| `afterUrl` | string | ✅ | URL da imagem "depois" (JPG/PNG) |
| `clientName` | string | ✅ | Nome do cliente (usado no path do Storage) |
| `duration` | number | ❌ | Duração do vídeo em segundos (padrão: 8) |
| `quality` | string | ❌ | Qualidade: `low`, `medium`, `high`, `ultra` (padrão: `high`) |
| `orientation` | string | ❌ | Orientação: `horizontal` ou `vertical` (padrão: `horizontal`) |

### Configurações de Qualidade:

| Qualidade | CRF | Preset | Uso |
|-----------|-----|--------|-----|
| `low` | 28 | veryfast | Testes rápidos |
| `medium` | 23 | medium | Uso geral |
| `high` | 18 | medium | Produção (recomendado) |
| `ultra` | 15 | slow | Qualidade máxima |

### Resoluções por Orientação:

| Orientação | Resolução | FPS | Aspect Ratio |
|------------|-----------|-----|--------------|
| `horizontal` | 1280x720 | 25 | 16:9 |
| `vertical` | 1080x1920 | 60 | 9:16 |

### Exemplo com cURL:

```bash
curl -X POST "https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=processBeforeAfter" \
  -H "Content-Type: application/json" \
  -d '{
    "beforeUrl": "https://storage.googleapis.com/.../antes.jpg",
    "afterUrl": "https://storage.googleapis.com/.../depois.jpg",
    "clientName": "Cliente Exemplo",
    "duration": 8,
    "quality": "high",
    "orientation": "horizontal"
  }'
```

### Exemplo com JavaScript:

```javascript
async function createBeforeAfterVideo(before, after, clientName) {
  const response = await fetch(
    'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=processBeforeAfter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beforeUrl: before,
        afterUrl: after,
        clientName: clientName,
        duration: 8,
        quality: 'high',
        orientation: 'horizontal'
      })
    }
  );
  
  const result = await response.json();
  console.log('Vídeo criado:', result.url);
  
  return result;
}

// Uso
await createBeforeAfterVideo(
  'https://storage.googleapis.com/.../original.jpg',
  'https://storage.googleapis.com/.../mobiliado.jpg',
  'Imobiliária XYZ'
);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "url": "https://storage.googleapis.com/api-ruum.firebasestorage.app/videos/Cliente%20Exemplo/a1b2c3d4-output.mp4?...",
  "metadata": {
    "duration": 45230,
    "videoSizeMB": 2.45,
    "quality": "high",
    "type": "beforeAfter",
    "clientName": "Cliente Exemplo",
    "orientation": "horizontal",
    "breakdown": {
      "downloadMs": 3200,
      "processMs": 38450,
      "uploadMs": 3580
    }
  }
}
```

**Campos da resposta:**
- `success`: Indica sucesso
- `jobId`: ID único do job (para tracking)
- `url`: URL assinada do vídeo (válida por 7 dias)
- `metadata.duration`: Tempo total de processamento (ms)
- `metadata.videoSizeMB`: Tamanho do vídeo gerado
- `metadata.breakdown`: Tempo de cada etapa

---

## 🔗 Merge de Vídeos (Concatenação)

### Endpoint:

```
POST /processVideo?action=mergeVideos
```

### Descrição:

Concatena dois vídeos em sequência, normalizando resolução, FPS e aspect ratio automaticamente. Mantém qualidade e suporta ambas orientações.

**Uso comum:**
- Mesclar Before/After + Camera Magic
- Mesclar Before/After + Magic Motion
- Combinar múltiplos vídeos processados

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `video1Url` | string | ✅ | URL do primeiro vídeo (MP4) |
| `video2Url` | string | ✅ | URL do segundo vídeo (MP4) |
| `clientName` | string | ✅ | Nome do cliente |
| `outputOrientation` | string | ❌ | Orientação final: `horizontal` ou `vertical` (padrão: `horizontal`) |
| `quality` | string | ❌ | Qualidade: `low`, `medium`, `high`, `ultra` (padrão: `high`) |

### Normalização Automática:

A função normaliza automaticamente:
- ✅ **Resolução** → 1280x720 (horizontal) ou 1080x1920 (vertical)
- ✅ **FPS** → 25 fps (normalizado)
- ✅ **Aspect Ratio** → 16:9 ou 9:16
- ✅ **SAR** → 1:1 (square pixels)
- ✅ **Codec** → H.264 (compatibilidade máxima)

### Exemplo com cURL:

```bash
curl -X POST "https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=mergeVideos" \
  -H "Content-Type: application/json" \
  -d '{
    "video1Url": "https://storage.googleapis.com/.../beforeafter.mp4",
    "video2Url": "https://storage.googleapis.com/.../cameramagic.mp4",
    "clientName": "Cliente Exemplo",
    "outputOrientation": "horizontal",
    "quality": "high"
  }'
```

### Exemplo com JavaScript:

```javascript
async function mergeVideos(video1, video2, clientName, orientation = 'horizontal') {
  const response = await fetch(
    'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=mergeVideos',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video1Url: video1,
        video2Url: video2,
        clientName: clientName,
        outputOrientation: orientation,
        quality: 'high'
      })
    }
  );
  
  const result = await response.json();
  console.log('Vídeos mesclados:', result.url);
  console.log('Tamanho:', result.metadata.videoSizeMB, 'MB');
  
  return result;
}

// Uso: Mesclar Before/After + Camera Magic
const beforeAfterUrl = 'https://storage.googleapis.com/.../beforeafter.mp4';
const cameraMagicUrl = 'https://storage.googleapis.com/.../cameramagic.mp4';

await mergeVideos(beforeAfterUrl, cameraMagicUrl, 'Imobiliária ABC', 'horizontal');
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "jobId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "url": "https://storage.googleapis.com/api-ruum.firebasestorage.app/videos/Cliente%20Exemplo/b2c3d4e5-merged.mp4?...",
  "metadata": {
    "duration": 67850,
    "videoSizeMB": 8.23,
    "quality": "high",
    "type": "merged",
    "clientName": "Cliente Exemplo",
    "breakdown": {
      "downloadMs": 12300,
      "mergeMs": 48200,
      "uploadMs": 7350
    }
  }
}
```

---

## ⚠️ Códigos de Erro

### 400 - Missing Required Fields

**Causa:** Campos obrigatórios não fornecidos

```json
{
  "success": false,
  "error": "beforeUrl e afterUrl são obrigatórios"
}
```

**Solução:** Forneça todos os campos obrigatórios (`beforeUrl`, `afterUrl`, `clientName` ou `video1Url`, `video2Url`, `clientName`)

---

### 400 - Invalid Action

**Causa:** Query parameter `action` inválido

```json
{
  "success": false,
  "error": "Action inválida: invalidAction. Use 'processBeforeAfter' ou 'mergeVideos'"
}
```

**Solução:** Use `?action=processBeforeAfter` ou `?action=mergeVideos`

---

### 400 - Invalid Orientation

**Causa:** Valor de `orientation` inválido

```json
{
  "success": false,
  "error": "orientation deve ser \"horizontal\" ou \"vertical\""
}
```

**Solução:** Use `horizontal` ou `vertical`

---

### 500 - Download Failed

**Causa:** Falha ao baixar imagens/vídeos das URLs fornecidas

```json
{
  "success": false,
  "error": "Falha ao baixar após 3 tentativas: Network error",
  "jobId": "..."
}
```

**Possíveis causas:**
1. URL inacessível ou inválida
2. Arquivo não existe
3. Problemas de rede

**Solução:**
1. Verifique se as URLs são públicas e acessíveis
2. Teste as URLs no navegador
3. Certifique-se que os arquivos ainda existem

---

### 500 - FFmpeg Processing Error

**Causa:** Erro durante processamento FFmpeg

```json
{
  "success": false,
  "error": "FFmpeg error: Invalid input format",
  "jobId": "..."
}
```

**Possíveis causas:**
1. Arquivo corrompido
2. Formato não suportado
3. Resolução inválida

**Solução:**
1. Use apenas JPG/PNG para imagens
2. Use apenas MP4 para vídeos
3. Verifique se os arquivos não estão corrompidos

---

## 💡 Exemplos de Uso Completos

### Exemplo 1: Workflow Completo Before/After + Merge

```javascript
async function createCompleteVideo(beforeImg, afterImg, clientName) {
  // PASSO 1: Criar Before/After
  console.log('🎬 Criando vídeo Before/After...');
  const beforeAfterResponse = await fetch(
    'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=processBeforeAfter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beforeUrl: beforeImg,
        afterUrl: afterImg,
        clientName: clientName,
        duration: 8,
        quality: 'high',
        orientation: 'horizontal'
      })
    }
  );
  
  const beforeAfterResult = await beforeAfterResponse.json();
  console.log('✅ Before/After criado:', beforeAfterResult.url);
  
  // PASSO 2: Criar Camera Magic (assumindo que já existe)
  const cameraMagicUrl = 'https://storage.googleapis.com/.../cameramagic.mp4';
  
  // PASSO 3: Mesclar os dois vídeos
  console.log('🔗 Mesclando vídeos...');
  const mergeResponse = await fetch(
    'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=mergeVideos',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video1Url: beforeAfterResult.url,
        video2Url: cameraMagicUrl,
        clientName: clientName,
        outputOrientation: 'horizontal',
        quality: 'high'
      })
    }
  );
  
  const finalResult = await mergeResponse.json();
  console.log('🎉 Vídeo final criado:', finalResult.url);
  console.log('📊 Tamanho:', finalResult.metadata.videoSizeMB, 'MB');
  console.log('⏱️ Tempo total:', finalResult.metadata.duration, 'ms');
  
  return finalResult;
}

// Uso
await createCompleteVideo(
  'https://storage.googleapis.com/.../original.jpg',
  'https://storage.googleapis.com/.../mobiliado.jpg',
  'Imobiliária Premium'
);
```

### Exemplo 2: Before/After Vertical (Stories/Reels)

```javascript
async function createVerticalBeforeAfter(beforeImg, afterImg, clientName) {
  const response = await fetch(
    'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=processBeforeAfter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beforeUrl: beforeImg,
        afterUrl: afterImg,
        clientName: clientName,
        duration: 5, // Vídeos curtos para redes sociais
        quality: 'high',
        orientation: 'vertical' // 1080x1920 (9:16)
      })
    }
  );
  
  const result = await response.json();
  console.log('📱 Vídeo vertical (Stories/Reels) criado:', result.url);
  console.log('📐 Resolução: 1080x1920 @ 60fps');
  
  return result;
}

// Criar vídeo para Instagram Stories/Reels
await createVerticalBeforeAfter(
  'https://storage.googleapis.com/.../sala_vazia.jpg',
  'https://storage.googleapis.com/.../sala_mobiliada.jpg',
  'Imobiliária Social'
);
```

### Exemplo 3: Merge com Tratamento de Erro

```javascript
async function mergeVideosWithRetry(video1, video2, clientName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`);
      
      const response = await fetch(
        'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=mergeVideos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video1Url: video1,
            video2Url: video2,
            clientName: clientName,
            outputOrientation: 'horizontal',
            quality: 'high'
          })
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Merge concluído com sucesso!');
        return result;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Falha após ${maxRetries} tentativas: ${error.message}`);
      }
      
      // Aguardar antes de retry (exponential backoff)
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ Aguardando ${delayMs}ms antes de retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Uso com retry automático
await mergeVideosWithRetry(
  'https://storage.googleapis.com/.../video1.mp4',
  'https://storage.googleapis.com/.../video2.mp4',
  'Cliente Resiliente'
);
```

### Exemplo 4: Batch Processing (Múltiplos Vídeos)

```javascript
async function batchCreateBeforeAfter(imagesPairs, clientName) {
  const results = [];
  
  for (const [index, pair] of imagesPairs.entries()) {
    console.log(`\n📹 Processando vídeo ${index + 1}/${imagesPairs.length}...`);
    
    const response = await fetch(
      'https://us-central1-api-ruum.cloudfunctions.net/processVideo?action=processBeforeAfter',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeUrl: pair.before,
          afterUrl: pair.after,
          clientName: clientName,
          duration: 8,
          quality: 'high',
          orientation: 'horizontal'
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Vídeo ${index + 1} criado: ${result.url}`);
      results.push(result);
    } else {
      console.error(`❌ Vídeo ${index + 1} falhou:`, result.error);
    }
    
    // Aguardar 2s entre requisições para evitar sobrecarga
    if (index < imagesPairs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n🎉 Processamento concluído: ${results.length}/${imagesPairs.length} vídeos`);
  return results;
}

// Processar 5 pares de imagens
const imagesPairs = [
  { before: 'https://.../sala_antes.jpg', after: 'https://.../sala_depois.jpg' },
  { before: 'https://.../quarto_antes.jpg', after: 'https://.../quarto_depois.jpg' },
  { before: 'https://.../cozinha_antes.jpg', after: 'https://.../cozinha_depois.jpg' },
  { before: 'https://.../banheiro_antes.jpg', after: 'https://.../banheiro_depois.jpg' },
  { before: 'https://.../varanda_antes.jpg', after: 'https://.../varanda_depois.jpg' }
];

await batchCreateBeforeAfter(imagesPairs, 'Imobiliária Batch');
```

---

## 📊 Boas Práticas

### ✅ Recomendações:

1. **URLs Públicas:** Certifique-se que as URLs são acessíveis publicamente
2. **Formato Correto:** Use JPG/PNG para imagens, MP4 para vídeos
3. **Timeout:** Configure timeout de 120s+ (processamento pode demorar)
4. **Retry:** Implemente retry com exponential backoff
5. **Qualidade:** Use `high` para produção, `medium` para testes
6. **Orientação:** Escolha baseado no uso (horizontal para web, vertical para stories)

### ❌ Evite:

1. ❌ URLs privadas que exigem autenticação
2. ❌ Arquivos corrompidos ou incompletos
3. ❌ Múltiplas requisições simultâneas (pode causar timeout)
4. ❌ Vídeos muito longos no merge (>2min cada)
5. ❌ Qualidade `ultra` em produção (tempo excessivo)

---

## 🔧 Especificações Técnicas

### Limites e Constraints:

| Recurso | Limite |
|---------|--------|
| **Timeout máximo** | 540 segundos (9 min) |
| **Memória** | 2GB |
| **Tamanho máximo arquivo** | ~500MB |
| **Formatos de imagem** | JPG, PNG, WebP |
| **Formatos de vídeo** | MP4 (H.264) |
| **Duração máxima before/after** | 30 segundos |
| **URL assinada válida** | 7 dias |

### Máscaras Disponíveis:

| Arquivo | Resolução | Orientação | FPS |
|---------|-----------|------------|-----|
| `before_after_mask.mp4` | 1280x720 | Horizontal | 25 |
| `before_after_mask_vertical.mp4` | 1080x1920 | Vertical | 60 |

---

## 🆘 Troubleshooting

### Problema: Timeout após 60s

**Causa:** Cloud Function com timeout padrão de 60s

**Solução:** A function já está configurada com timeout de 540s. Se ainda ocorrer, aumente o timeout no cliente:

```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  signal: AbortSignal.timeout(180000) // 3 minutos
});
```

---

### Problema: Vídeo final com barras pretas

**Causa:** Aspect ratio diferente entre os dois vídeos no merge

**Solução:** A normalização automática já resolve isso. Se persistir, verifique se ambos os vídeos têm a mesma orientação de entrada.

---

### Problema: Vídeo mesclado dessincronizado

**Causa:** FPS diferentes entre os vídeos

**Solução:** A function já normaliza para 25fps. Se persistir, reprocesse os vídeos individualmente antes do merge.

---

### Problema: URL assinada expirada

**Causa:** URLs assinadas têm validade de 7 dias

**Solução:** Faça download do vídeo ou hospede em CDN própria logo após o processamento.

---

## 📖 Documentação Relacionada

- [VIDEO_BEFORE_AFTER.md](../Public/VIDEO_BEFORE_AFTER.md) - Endpoint principal de vídeos (API REST)
- [VIDEO_MAGIC_MOTION.md](../Public/VIDEO_MAGIC_MOTION.md) - Magic Motion
- [VIDEO_MAGIC_DROP.md](../Public/VIDEO_MAGIC_DROP.md) - Magic Drop
- [FIREBASE_STORAGE.md](./FIREBASE_STORAGE.md) - Upload de vídeos/imagens

---

## 🆘 Suporte

- **Email:** renato@ruum.com.br
- **Slack:** #dev-api-ruum
- **Logs:** Google Cloud Logs (Cloud Functions)

---

## 📝 Notas de Implementação

### Características Técnicas:

- ✅ **Retry automático** em downloads (3 tentativas)
- ✅ **Exponential backoff** em falhas de download
- ✅ **Validação de arquivos** antes do processamento
- ✅ **Cleanup automático** de arquivos temporários
- ✅ **Logs detalhados** para debugging
- ✅ **Probe de metadados** antes do merge
- ✅ **Normalização inteligente** de resolução/FPS/SAR
- ✅ **Qualidade preservada** em todas as operações

### Otimizações:

- 🚀 Preset `medium` balanceia velocidade e qualidade
- 🚀 CRF 18 (high) oferece ótima qualidade com tamanho razoável
- 🚀 FPS normalizado para 25 (horizontal) e 60 (vertical)
- 🚀 Upload direto para Firebase Storage com metadados
- 🚀 Cleanup agressivo de arquivos temporários
