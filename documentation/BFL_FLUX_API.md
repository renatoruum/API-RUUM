# 🎨 BFL FLUX API - Documentação Completa

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints Individuais FLUX](#endpoints-individuais-flux)
- [Endpoints Pipeline](#endpoints-pipeline)
- [Modelos Disponíveis](#modelos-disponíveis)
- [Exemplos de Uso](#exemplos-de-uso)
- [Erros Comuns](#erros-comuns)

---

## 🎯 Visão Geral

A integração com **Black Forest Labs (BFL)** permite gerar e melhorar imagens usando os modelos **FLUX**, conhecidos por sua alta qualidade e velocidade. Nossa API oferece:

### 🏗️ **Arquitetura de 3 Camadas**

1. **Conector (`bflFlux.js`)** - Funções puras para interagir com a API BFL
2. **Rotas Individuais (`sendFlux.js`)** - Endpoints para usar FLUX independentemente
3. **Pipeline Orquestrado (`sendImagePipeline.js`)** - Virtual Staging + FLUX em um único fluxo

### ✨ **Funcionalidades**

- ✅ Geração de imagens do zero (text-to-image)
- ✅ Melhoria de iluminação e qualidade de imagens existentes
- ✅ Pipeline automatizado: Virtual Staging → FLUX Enhancement
- ✅ Processamento síncrono e assíncrono
- ✅ Múltiplos modelos FLUX disponíveis
- ✅ Tratamento robusto de erros

---

## 🔐 Autenticação

Todas as requisições para a API BFL requerem uma chave de API válida configurada no ambiente:

```bash
BFL_API_KEY=sua_chave_aqui
```

A chave é enviada automaticamente no header `x-key` de todas as requisições.

---

## 🚀 Endpoints Individuais FLUX

### 1. **Testar Conexão**

```http
GET /api/flux/test
```

Verifica se a API Key está válida e a conexão está funcionando.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Conexão com BFL API funcionando",
  "data": {
    "authenticated": true
  }
}
```

---

### 2. **Melhorar Iluminação de Imagem**

```http
POST /api/flux/enhance
```

Melhora a iluminação, qualidade e detalhes de uma imagem existente.

**Parâmetros do Body:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `image_url` | string | ✅ Sim | - | URL da imagem a ser melhorada |
| `prompt` | string | ❌ Não | "Professional real estate photography..." | Descrição da melhoria desejada |
| `model` | string | ❌ Não | "flux-pro-1.1" | Modelo FLUX a ser usado |
| `width` | number | ❌ Não | 1024 | Largura da imagem de saída |
| `height` | number | ❌ Não | 768 | Altura da imagem de saída |
| `prompt_upsampling` | boolean | ❌ Não | false | Melhorar automaticamente o prompt |
| `safety_tolerance` | number | ❌ Não | 2 | Nível de tolerância do filtro de segurança (0-6) |
| `seed` | number | ❌ Não | null | Seed para resultados reproduzíveis |
| `output_format` | string | ❌ Não | "jpeg" | Formato de saída: "jpeg" ou "png" |
| `wait_for_completion` | boolean | ❌ Não | false | Aguardar conclusão antes de retornar |

**Exemplo de Requisição:**

```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/flux/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "prompt": "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image'\''s light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
    "wait_for_completion": true
  }'
```

**Resposta (wait_for_completion: false):**
```json
{
  "success": true,
  "message": "Processamento iniciado - use o task_id para verificar o progresso",
  "task_id": "abc123xyz",
  "status": "Pending",
  "status_endpoint": "/api/flux/status/abc123xyz"
}
```

**Resposta (wait_for_completion: true):**
```json
{
  "success": true,
  "message": "Imagem processada com sucesso",
  "task_id": "abc123xyz",
  "status": "Ready",
  "result_url": "https://storage.googleapis.com/.../output.jpg",
  "data": {
    "id": "abc123xyz",
    "status": "Ready",
    "result": {
      "sample": "https://storage.googleapis.com/.../output.jpg"
    }
  }
}
```

---

### 3. **Gerar Imagem do Zero**

```http
POST /api/flux/generate
```

Gera uma imagem completamente nova a partir de um prompt de texto.

**Parâmetros do Body:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `prompt` | string | ✅ Sim | - | Descrição detalhada da imagem desejada |
| `model` | string | ❌ Não | "flux-pro-1.1" | Modelo FLUX a ser usado |
| `width` | number | ❌ Não | 1024 | Largura da imagem |
| `height` | number | ❌ Não | 768 | Altura da imagem |
| `prompt_upsampling` | boolean | ❌ Não | false | Melhorar automaticamente o prompt |
| `safety_tolerance` | number | ❌ Não | 2 | Nível de tolerância (0-6) |
| `seed` | number | ❌ Não | null | Seed para resultados reproduzíveis |
| `output_format` | string | ❌ Não | "jpeg" | Formato: "jpeg" ou "png" |
| `wait_for_completion` | boolean | ❌ Não | false | Aguardar conclusão |

**Exemplo de Requisição:**

```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/flux/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Modern luxury living room with floor-to-ceiling windows, minimalist furniture, natural light, 8k quality",
    "width": 1920,
    "height": 1080,
    "wait_for_completion": true
  }'
```

---

### 4. **Verificar Status de Task**

```http
GET /api/flux/status/:task_id
```

Verifica o status e resultado de uma task em processamento.

**Exemplo de Requisição:**

```bash
curl https://apiruum-2cpzkgiiia-uc.a.run.app/api/flux/status/abc123xyz
```

**Resposta (Pendente):**
```json
{
  "success": true,
  "message": "Processamento em andamento",
  "task_id": "abc123xyz",
  "status": "Pending",
  "data": {
    "id": "abc123xyz",
    "status": "Pending"
  }
}
```

**Resposta (Concluído):**
```json
{
  "success": true,
  "message": "Processamento concluído",
  "task_id": "abc123xyz",
  "status": "Ready",
  "result_url": "https://storage.googleapis.com/.../output.jpg",
  "data": {
    "id": "abc123xyz",
    "status": "Ready",
    "result": {
      "sample": "https://storage.googleapis.com/.../output.jpg"
    }
  }
}
```

---

### 5. **Informações da API**

```http
GET /api/flux/info
```

Retorna informações sobre modelos, configurações e endpoints disponíveis.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "models": {
      "FLUX_PRO_11": "flux-pro-1.1",
      "FLUX_PRO": "flux-pro",
      "FLUX_PRO_11_ULTRA": "flux-pro-1.1-ultra",
      "FLUX_DEV": "flux-dev"
    },
    "aspect_ratios": {
      "SQUARE": "1:1",
      "PORTRAIT": "9:16",
      "LANDSCAPE": "16:9"
    },
    "supported_formats": ["jpeg", "png"],
    "default_settings": {
      "model": "flux-pro-1.1",
      "width": 1024,
      "height": 768
    }
  }
}
```

---

## 🔄 Endpoints Pipeline

### 1. **Pipeline Completo: Virtual Staging + FLUX**

```http
POST /api/pipeline/staging-and-enhance
```

Executa um pipeline completo: aplica virtual staging e depois melhora com FLUX.

**Parâmetros do Body:**

**Configuração da Imagem:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `image_url` | string | ✅ Sim | URL da imagem original |

**Parâmetros Virtual Staging:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `room_type` | string | "living" | Tipo de ambiente (living, bedroom, kitchen, etc) |
| `style` | string | "modern" | Estilo decorativo (modern, scandinavian, luxury, etc) |
| `declutter_mode` | string | "off" | Modo de limpeza: "off", "on", "auto" |
| `add_furniture` | boolean | true | Adicionar móveis |

**Parâmetros FLUX:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `flux_prompt` | string | "Professional real estate..." | Prompt para melhoria |
| `flux_model` | string | "flux-pro-1.1" | Modelo FLUX |
| `flux_width` | number | 1024 | Largura |
| `flux_height` | number | 768 | Altura |

**Controle do Pipeline:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `wait_for_completion` | boolean | true | Aguardar conclusão completa |
| `skip_staging` | boolean | false | Pular etapa de staging |
| `skip_enhancement` | boolean | false | Pular etapa FLUX |

**Exemplo de Requisição Completa:**

```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/staging-and-enhance \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/room.jpg",
    "room_type": "living",
    "style": "modern",
    "flux_prompt": "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image'\''s light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
    "wait_for_completion": true
  }'
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Pipeline concluído com sucesso",
  "pipeline_id": "pipeline_1699999999999",
  "original_image": "https://example.com/room.jpg",
  "final_image": "https://storage.googleapis.com/.../final.jpg",
  "data": {
    "pipeline_id": "pipeline_1699999999999",
    "original_image": "https://example.com/room.jpg",
    "steps": [
      {
        "step": 1,
        "name": "virtual_staging",
        "status": "completed",
        "render_id": "xyz123",
        "result_url": "https://storage.googleapis.com/.../staged.jpg",
        "room_type": "living",
        "style": "modern"
      },
      {
        "step": 2,
        "name": "flux_enhancement",
        "status": "completed",
        "task_id": "abc789",
        "result_url": "https://storage.googleapis.com/.../final.jpg",
        "model": "flux-pro-1.1"
      }
    ],
    "processing_time_ms": 35000,
    "processing_time_seconds": "35.00",
    "errors": []
  }
}
```

---

### 2. **Pipeline: Apenas Staging**

```http
POST /api/pipeline/staging-only
```

Executa apenas o virtual staging, sem enhancement FLUX.

Mesmos parâmetros do endpoint principal, mas `skip_enhancement` é automaticamente definido como `true`.

---

### 3. **Pipeline: Apenas Enhancement**

```http
POST /api/pipeline/enhance-only
```

Executa apenas o enhancement FLUX, sem virtual staging.

Mesmos parâmetros do endpoint principal, mas `skip_staging` é automaticamente definido como `true`.

---

### 4. **Informações do Pipeline**

```http
GET /api/pipeline/info
```

Retorna informações sobre o pipeline e suas configurações.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "endpoints": {
      "main_pipeline": "POST /api/pipeline/staging-and-enhance",
      "staging_only": "POST /api/pipeline/staging-only",
      "enhance_only": "POST /api/pipeline/enhance-only"
    },
    "steps": [
      {
        "step": 1,
        "name": "Virtual Staging",
        "description": "Adiciona ou remove móveis, aplica estilos decorativos",
        "configurable": true,
        "skippable": true
      },
      {
        "step": 2,
        "name": "FLUX Enhancement",
        "description": "Melhora iluminação, qualidade e detalhes da imagem",
        "configurable": true,
        "skippable": true
      }
    ],
    "features": {
      "async_processing": true,
      "intermediate_results": true,
      "error_recovery": true,
      "partial_completion": true
    }
  }
}
```

---

## 🎨 Modelos Disponíveis

| Modelo | Velocidade | Qualidade | Uso Recomendado |
|--------|-----------|-----------|-----------------|
| **flux-pro-1.1** | ⚡⚡⚡ Muito Rápido | ⭐⭐⭐⭐ Alta | Uso geral, produção |
| **flux-pro** | ⚡⚡ Rápido | ⭐⭐⭐⭐ Alta | Qualidade consistente |
| **flux-pro-1.1-ultra** | ⚡ Lento | ⭐⭐⭐⭐⭐ Máxima | Marketing premium |
| **flux-dev** | ⚡⚡⚡ Muito Rápido | ⭐⭐⭐ Boa | Testes, desenvolvimento |

---

## 📝 Exemplos de Uso

### Exemplo 1: Enhancement Rápido (Assíncrono)

```javascript
// 1. Iniciar processamento
const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/flux/enhance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/image.jpg',
    wait_for_completion: false
  })
});

const { task_id } = await response.json();

// 2. Verificar status periodicamente
const checkStatus = async () => {
  const statusResponse = await fetch(
    `https://apiruum-2cpzkgiiia-uc.a.run.app/api/flux/status/${task_id}`
  );
  const data = await statusResponse.json();
  
  if (data.status === 'Ready') {
    console.log('Imagem pronta:', data.result_url);
  } else {
    setTimeout(checkStatus, 5000); // Verificar novamente em 5s
  }
};

checkStatus();
```

### Exemplo 2: Pipeline Completo (Síncrono)

```javascript
const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/staging-and-enhance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/empty-room.jpg',
    room_type: 'living',
    style: 'modern',
    flux_prompt: 'Professional photography, perfect lighting, HDR',
    wait_for_completion: true
  })
});

const result = await response.json();
console.log('Imagem final:', result.final_image);
console.log('Tempo de processamento:', result.data.processing_time_seconds + 's');
```

### Exemplo 3: Apenas Enhancement (sem staging)

```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/enhance-only \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/staged-room.jpg",
    "flux_model": "flux-pro-1.1-ultra",
    "wait_for_completion": true
  }'
```

---

## ⚠️ Erros Comuns

### 1. **API Key Inválida (401)**

```json
{
  "success": false,
  "message": "Erro interno do servidor",
  "error": "Chave de API inválida ou não fornecida"
}
```

**Solução:** Verifique se `BFL_API_KEY` está configurada corretamente no `.env`.

---

### 2. **Créditos Insuficientes (402)**

```json
{
  "success": false,
  "message": "Erro interno do servidor",
  "error": "Créditos insuficientes na conta BFL"
}
```

**Solução:** Recarregue créditos na sua conta BFL.

---

### 3. **Task Não Encontrada (404)**

```json
{
  "success": false,
  "message": "Task não encontrada"
}
```

**Solução:** Verifique se o `task_id` está correto ou aguarde alguns segundos após criar a task.

---

### 4. **Timeout no Pipeline**

```json
{
  "success": false,
  "message": "Erro ao aguardar conclusão",
  "error": "Timeout: Task não foi concluída no tempo esperado",
  "suggestion": "Use o endpoint /flux/status/:task_id para verificar o status manualmente"
}
```

**Solução:** Use `wait_for_completion: false` e faça polling manual com `/flux/status/:task_id`.

---

### 5. **Conteúdo Moderado**

```json
{
  "success": false,
  "message": "Processamento encontrou erros",
  "error": "Requisição moderada: Content Moderated"
}
```

**Solução:** Ajuste o prompt ou a imagem para estar de acordo com as políticas de conteúdo da BFL.

---

## 🔧 Configuração de Ambiente

Para propagar a chave da API no Cloud Run:

```bash
gcloud run services update apiruum \
  --region=us-central1 \
  --update-env-vars BFL_API_KEY="sua_chave_aqui"
```

---

## 📊 Status de Tasks

| Status | Descrição |
|--------|-----------|
| `Pending` | Task em processamento |
| `Ready` | Task concluída, resultado disponível |
| `Request Moderated` | Requisição bloqueada por moderação |
| `Content Moderated` | Conteúdo gerado bloqueado por moderação |

---

## 🎯 Melhores Práticas

1. **Use `wait_for_completion: false` para múltiplas imagens** - Processe em paralelo
2. **Cache resultados** - Salve as URLs das imagens processadas
3. **Monitore créditos** - Implemente alertas de créditos baixos
4. **Use o modelo adequado** - `flux-pro-1.1` para maioria dos casos
5. **Implemente retry logic** - Para casos de timeout ou erros temporários
6. **Salve `pipeline_id`** - Para rastreabilidade e debugging

---

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação BFL: https://docs.bfl.ai/
- Logs do servidor: Verifique os logs do Cloud Run
- Status da API: Use `/api/flux/test` para verificar conectividade

---

**Última atualização:** 12 de novembro de 2025
