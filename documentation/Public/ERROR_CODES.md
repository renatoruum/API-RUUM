# ⚠️ Códigos de Erro e Troubleshooting

> Guia completo de erros, causas e soluções para a API Ruum

---

## 📋 Visão Geral

A API Ruum retorna erros estruturados no formato JSON com informações detalhadas para facilitar o debugging.

### Formato Padrão de Erro

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição legível do erro",
    "details": "Informações adicionais específicas",
    "timestamp": "2026-02-02T18:00:00Z"
  }
}
```

---

## 🔴 Códigos de Erro HTTP

| Código | Categoria | Significado |
|--------|-----------|-------------|
| **2xx** | Sucesso | Requisição bem-sucedida |
| **4xx** | Erro do Cliente | Problema com a requisição enviada |
| **5xx** | Erro do Servidor | Problema no servidor Ruum |

---

## 📝 Erros de Validação (400)

### 400 - MISSING_REQUIRED_FIELD

**Causa:** Parâmetro obrigatório ausente

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Missing required parameter: imageUrl",
    "details": "The 'imageUrl' field is mandatory for this endpoint"
  }
}
```

**Solução:**
```javascript
// ❌ Errado
axios.post('/api/imagen-staging/full-pipeline', {
  designStyle: 'modern'
});

// ✅ Correto
axios.post('/api/imagen-staging/full-pipeline', {
  imageUrl: 'https://example.com/image.jpg',
  designStyle: 'modern'
});
```

---

### 400 - INVALID_IMAGE_URL

**Causa:** URL da imagem está inacessível, inválida ou não é pública

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "The image URL is not accessible",
    "details": "Failed to download image. Ensure the URL is public and returns a valid image (JPG, PNG, WebP)"
  }
}
```

**Solução:**
1. Verifique se a URL é pública
2. Teste a URL no navegador
3. Confirme o formato: JPG, PNG ou WebP
4. Verifique se o servidor de origem permite hotlinking

```bash
# Teste se a URL é acessível
curl -I https://sua-imagem.jpg
# Deve retornar: HTTP/1.1 200 OK
# Content-Type: image/jpeg
```

---

### 400 - INVALID_IMAGE_FORMAT

**Causa:** Formato de imagem não suportado

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_FORMAT",
    "message": "Image format not supported",
    "details": "Supported formats: JPG, PNG, WebP. Received: GIF"
  }
}
```

**Solução:** Converta a imagem para JPG, PNG ou WebP antes de enviar

---

### 400 - IMAGE_TOO_LARGE

**Causa:** Imagem excede o tamanho máximo permitido

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "Image file size exceeds maximum allowed",
    "details": "Max size: 10MB. Received: 15.3MB"
  }
}
```

**Solução:** Comprima ou redimensione a imagem para menos de 10MB

```bash
# Usando ImageMagick para comprimir
convert original.jpg -quality 85 -resize 1920x1080\> compressed.jpg
```

---

### 400 - INVALID_IMAGE_DIMENSIONS

**Causa:** Dimensões incompatíveis (Before/After) ou muito pequenas

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_DIMENSIONS",
    "message": "Image dimensions are invalid",
    "details": "For Before/After videos, both images must have the same dimensions. bottom: 1920x1080, top: 1280x720"
  }
}
```

**Solução:** Redimensione as imagens para mesma resolução

```javascript
// Exemplo: Verificar dimensões antes de enviar
const sharp = require('sharp');

const img1 = await sharp('before.jpg').metadata();
const img2 = await sharp('after.jpg').metadata();

if (img1.width !== img2.width || img1.height !== img2.height) {
  console.error('Dimensões incompatíveis!');
  // Redimensione uma delas
  await sharp('before.jpg')
    .resize(img2.width, img2.height)
    .toFile('before_resized.jpg');
}
```

---

### 400 - INVALID_PARAMETER

**Causa:** Parâmetro com valor inválido

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid value for parameter 'designStyle'",
    "details": "Allowed values: contemporary_minimalist, modern, scandinavian, industrial, bohemian, luxury, coastal, midcentury. Received: 'futuristic'"
  }
}
```

**Solução:** Consulte a documentação para valores válidos

---

## 🚫 Erros de Quota e Rate Limit (429)

### 429 - RATE_LIMIT_EXCEEDED

**Causa:** Excedeu o limite de requisições por minuto

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": "You can make up to 60 requests per minute. Try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

**Solução:** Implemente retry com backoff exponencial

```javascript
async function makeRequestWithRetry(url, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.post(url, data);
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.error.retryAfter || 60;
        console.log(`Rate limit hit, waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 429 - QUOTA_EXCEEDED

**Causa:** Quota mensal esgotada

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly quota exceeded",
    "details": "You have used 10000/10000 requests this month. Quota resets on 2026-03-01.",
    "quotaReset": "2026-03-01T00:00:00Z"
  }
}
```

**Solução:** Aguarde o reset da quota ou contate o suporte para aumentar o plano

---

## 🔧 Erros de Processamento (422, 500)

### 422 - PROCESSING_FAILED

**Causa:** Falha durante o processamento da imagem/vídeo

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "Failed to process image",
    "details": "AI processing error: Image quality too low for staging generation"
  }
}
```

**Soluções:**
1. Use imagens de maior qualidade
2. Verifique se a imagem não está muito escura
3. Tente com outra imagem
4. Verifique se a imagem tem estrutura arquitetônica clara

---

### 500 - INTERNAL_SERVER_ERROR

**Causa:** Erro interno do servidor

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": "Request ID: req_abc123xyz for support reference"
  }
}
```

**Solução:**
1. Tente novamente em alguns segundos
2. Se persistir, contate o suporte com o `Request ID`

---

### 503 - SERVICE_UNAVAILABLE

**Causa:** Serviço temporariamente indisponível (manutenção ou sobrecarga)

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable",
    "details": "The API is undergoing maintenance. Expected to be back at 2026-02-02T20:00:00Z",
    "retryAfter": 300
  }
}
```

**Solução:** Aguarde e tente novamente após o tempo indicado

---

## ⏱️ Erros de Timeout

### 504 - GATEWAY_TIMEOUT

**Causa:** Processamento demorou mais que o esperado

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_TIMEOUT",
    "message": "Request timeout",
    "details": "Processing took longer than 120 seconds"
  }
}
```

**Solução:**
1. Para endpoints síncronos: Reduza o tamanho da imagem
2. Para endpoints assíncronos: Implemente polling correto
3. Tente novamente

---

## 🎬 Erros Específicos de Vídeo

### VIDEO_GENERATION_ERROR

**Causa:** Erro no processamento de vídeo com IA

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "VIDEO_GENERATION_ERROR",
    "message": "Video generation failed",
    "details": "Insufficient content in image. Try an image with more depth or objects."
  }
}
```

**Solução:** Use imagens com mais profundidade e objetos definidos

**Para Magic Drop:** Use imagens do mesmo ambiente e ângulo

---

### VIDEO_GENERATION_TIMEOUT

**Causa:** Geração de vídeo excedeu tempo limite

**Resposta:**
```json
{
  "success": false,
  "error": {
    "code": "VIDEO_GENERATION_TIMEOUT",
    "message": "Video generation timed out",
    "details": "Processing exceeded 15 minutes. The task has been cancelled."
  }
}
```

**Solução:**
1. Reduza a duração do vídeo
2. Use imagens de menor resolução
3. Tente novamente (pode ter sido sobrecarga temporária)

---

## 🔍 Debugging Sistemático

### Checklist de Troubleshooting

```javascript
// 1. Verifique a URL da imagem
const testImageUrl = async (url) => {
  const response = await axios.head(url);
  console.log('Status:', response.status);
  console.log('Content-Type:', response.headers['content-type']);
  console.log('Content-Length:', response.headers['content-length']);
};

// 2. Valide os parâmetros
const validateParams = (params) => {
  const required = ['imageUrl'];
  for (const field of required) {
    if (!params[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};

// 3. Implemente retry com logs
const makeRequestWithLogging = async (url, data) => {
  console.log('📤 Request:', { url, data });
  
  try {
    const response = await axios.post(url, data);
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      code: error.response?.data?.error?.code,
      message: error.response?.data?.error?.message,
      details: error.response?.data?.error?.details
    });
    throw error;
  }
};
```

---

## 📊 Tabela Resumo de Erros

| Código | Error Code | Causa Comum | Ação |
|--------|------------|-------------|------|
| 400 | INVALID_IMAGE_URL | URL inacessível | Torne a URL pública |
| 400 | IMAGE_TOO_LARGE | Imagem >10MB | Comprima a imagem |
| 429 | RATE_LIMIT_EXCEEDED | Muitas requisições | Implemente retry |
| 429 | QUOTA_EXCEEDED | Quota esgotada | Aguarde reset ou upgrade |
| 422 | PROCESSING_FAILED | Processamento falhou | Use imagem de melhor qualidade |
| 422 | VIDEO_GENERATION_ERROR | Erro em vídeo com IA | Verifique imagem/parâmetros |
| 500 | INTERNAL_SERVER_ERROR | Erro do servidor | Retry ou contate suporte |
| 503 | SERVICE_UNAVAILABLE | Manutenção | Aguarde e tente novamente |
| 504 | GATEWAY_TIMEOUT | Timeout | Reduza tamanho ou retry |

---

## 🆘 Quando Contatar o Suporte

Contate o suporte quando:

✅ **Erro 500** persistir após 3 tentativas  
✅ **Erro 503** durar mais de 30 minutos  
✅ **Comportamento inesperado** que não está documentado  
✅ **Quota** parecer incorreta  
✅ **Performance** muito abaixo do esperado

**Informações para incluir no ticket:**
- Request ID (se disponível no erro)
- Timestamp do erro
- Código HTTP e código de erro
- Exemplo de payload enviado
- Logs completos

**Contato:**
- 📧 Email: renato@ruum.com.br
- 💬 Slack: #api-suporte

---

## 📚 Referências Relacionadas

- [Rate Limits](./RATE_LIMITS.md) - Resolver erros 429
- [Quick Start](./QUICKSTART.md) - Exemplos funcionais

---


**Última atualização:** Fevereiro 2026
