# 🚀 Quick Start Guide - API Ruum

> Faça seu primeiro request em 5 minutos!

---

## 📋 Pré-requisitos

Antes de começar, você precisará de:

1. **API Key** fornecida pela equipe Ruum
2. **Ferramentas:** curl, Postman, ou código JavaScript/Python
3. **Imagem de teste** (JPG ou PNG de um ambiente vazio)

---

## 🔑 Passo 1: Configure sua API Key

Adicione a API Key ao header de todas as requisições:

```bash
export RUUM_API_KEY="sua-api-key-aqui"
```

---

## 🖼️ Passo 2: Seu Primeiro Virtual Staging

### Usando curl:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline \
  -H "Authorization: Bearer $RUUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://sua-imagem-vazia.jpg",
    "designStyle": "scandinavian",
    "roomType": "living_room"
  }'
```

### Usando JavaScript (Node.js):

```javascript
const axios = require('axios');

async function generateVirtualStaging() {
  try {
    const response = await axios.post(
      'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline',
      {
        imageUrl: 'https://sua-imagem-vazia.jpg',
        designStyle: 'scandinavian',
        roomType: 'living_room'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUUM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Imagem gerada:', response.data.generatedImageUrl);
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

generateVirtualStaging();
```

### Usando Python:

```python
import requests
import os

def generate_virtual_staging():
    url = "https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline"
    headers = {
        "Authorization": f"Bearer {os.getenv('RUUM_API_KEY')}",
        "Content-Type": "application/json"
    }
    payload = {
        "imageUrl": "https://sua-imagem-vazia.jpg",
        "designStyle": "scandinavian",
        "roomType": "living_room"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Imagem gerada: {data['generatedImageUrl']}")
        return data
    else:
        print(f"❌ Erro: {response.json()}")

generate_virtual_staging()
```

---

## 📦 Passo 3: Entenda a Resposta

### Resposta de Sucesso:

```json
{
  "success": true,
  "data": {
    "generatedImageUrl": "https://storage.googleapis.com/ruum-staging/staged_abc123.jpg",
    "originalImageUrl": "https://storage.googleapis.com/ruum-staging/original_abc123.jpg",
    "metadata": {
      "designStyle": "scandinavian",
      "roomType": "living_room",
      "qualityScore": 5,
      "checksPassados": [
        "Estrutura preservada",
        "Móveis apropriados",
        "Iluminação consistente",
        "Perspectiva correta",
        "Cores harmoniosas"
      ],
      "processingTime": "38s",
      "attempts": 1
    }
  }
}
```

### ✅ O que fazer com a resposta:

1. **Salve a URL** `generatedImageUrl` no seu banco de dados
2. **Use a URL** diretamente em seu CRM/aplicação
3. **Mostre ao usuário** final a imagem processada
4. **(Opcional)** Salve também `originalImageUrl` para comparação

---

## 🎬 Passo 4: Gere seu Primeiro Vídeo (Antes/Depois)

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/ffmpeg/before-after \
  -H "Authorization: Bearer $RUUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bottom": "https://imagem-antes.jpg",
    "top": "https://imagem-depois.jpg",
    "duration": 5,
    "quality": "high"
  }'
```

### Resposta:

```json
{
  "success": true,
  "videoUrl": "https://storage.googleapis.com/ruum-videos/before_after_xyz789.mp4",
  "duration": 5,
  "processingTime": "18s"
}
```

---

## 🔄 Passo 5: Trabalhe com Requisições Assíncronas (Magic Motion)

Algumas funcionalidades (Magic Motion, Magic Drop) são **assíncronas** e requerem polling:

### 1. Inicie o Processamento:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/runway/image-to-video \
  -H "Authorization: Bearer $RUUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://sua-imagem.jpg",
    "promptText": "Smooth camera push in, cinematic movement",
    "duration": 5
  }'
```

### 2. Receba o Task ID:

```json
{
  "success": true,
  "taskId": "runway_abc123xyz",
  "status": "processing",
  "message": "Vídeo em processamento. Use o endpoint de status para verificar."
}
```

### 3. Faça Polling (a cada 10-15 segundos):

```javascript
async function waitForCompletion(taskId) {
  let attempts = 0;
  const maxAttempts = 40; // 10 minutos
  
  while (attempts < maxAttempts) {
    const response = await axios.get(
      `https://apiruum-562831020087.us-central1.run.app/api/runway/status/${taskId}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.RUUM_API_KEY}` }
      }
    );
    
    if (response.data.status === 'completed') {
      console.log('✅ Vídeo pronto:', response.data.videoUrl);
      return response.data;
    }
    
    if (response.data.status === 'failed') {
      console.error('❌ Processamento falhou:', response.data.error);
      return null;
    }
    
    console.log(`⏳ Processando... (${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 segundos
    attempts++;
  }
  
  throw new Error('Timeout: Processamento demorou mais de 10 minutos');
}
```

---

## 🎨 Estilos de Design Disponíveis

Para Virtual Staging, você pode escolher entre 8 estilos:

| Estilo | Chave | Descrição |
|--------|-------|-----------|
| Contemporary Minimalist | `contemporary_minimalist` | Elegância minimalista, paleta neutra |
| Modern | `modern` | Design contemporâneo, linhas limpas |
| Scandinavian | `scandinavian` | Estilo nórdico, tons claros |
| Industrial | `industrial` | Materiais expostos, visual urbano |
| Bohemian | `bohemian` | Eclético, colorido, artístico |
| Luxury | `luxury` | Alto padrão, materiais nobres |
| Coastal | `coastal` | Inspiração praia, tons azuis/brancos |
| Mid-Century Modern | `midcentury` | Retrô anos 50-60 |

---

## 🏠 Tipos de Cômodos Suportados

| Tipo | Chave | Uso |
|------|-------|-----|
| Sala de Estar | `living_room` | Mais comum |
| Área Externa | `outdoor` | Varandas, terraços |
| Cozinha | `kitchen` | Cozinhas |
| Quarto | `bedroom` | Dormitórios |
| Banheiro | `bathroom` | Banheiros |

---

## ⚠️ Erros Comuns e Soluções

### 1. Erro 401 - Unauthorized
```json
{
  "error": "Invalid or missing API key"
}
```
**Solução:** Verifique se o header `Authorization: Bearer YOUR_KEY` está correto.

### 2. Erro 400 - Invalid Image
```json
{
  "error": "Image URL is not accessible or invalid format"
}
```
**Solução:** Certifique-se que a URL é pública e o formato é JPG/PNG/WebP.

### 3. Erro 429 - Rate Limit
```json
{
  "error": "Rate limit exceeded. Try again in 60 seconds"
}
```
**Solução:** Aguarde 1 minuto ou aumente sua quota.

### 4. Timeout em Requisições Assíncronas
**Solução:** Aumente o intervalo de polling ou verifique logs da API.

---

## 📊 Checklist de Integração

Antes de ir para produção, certifique-se de:

- [ ] API Key configurada corretamente
- [ ] Tratamento de erros implementado
- [ ] Polling implementado para requisições assíncronas
- [ ] URLs públicas salvas no seu banco de dados
- [ ] Timeout configurado (30s para síncronos, 10min para assíncronos)
- [ ] Retry logic para falhas temporárias
- [ ] Logs de requisições para debugging
- [ ] Testes em ambiente de staging

---

## 🎯 Próximos Passos

Agora que você fez seu primeiro request:

1. 📖 Leia a documentação detalhada de cada endpoint:
   - [Virtual Staging](./VIRTUAL_STAGING.md)
   - [Vídeo Antes/Depois](./VIDEO_BEFORE_AFTER.md)
   - [Magic Motion](./VIDEO_MAGIC_MOTION.md)
   - [Magic Drop](./VIDEO_MAGIC_DROP.md)

2. 🔒 Configure [autenticação](./AUTHENTICATION.md) adequada

3. ⚠️ Entenda os [códigos de erro](./ERROR_CODES.md)

4. 📊 Verifique os [limites de uso](./RATE_LIMITS.md)

---

**Dúvidas?** Entre em contato: suporte@ruum.com.br
