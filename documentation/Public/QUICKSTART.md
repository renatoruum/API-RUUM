# 🚀 Quick Start: Primeiros Passos com a API Ruum

> **Objetivo:** Em 5 minutos, você estará gerando imagens e vídeos com Virtual Staging e Before/After

---

## 📋 Pré-requisitos

- **Acesso à Internet** (para baixar imagens e fazer chamadas HTTP)
- Ferramenta HTTP (cURL, Postman, código Python/JavaScript)
- **URLs públicas** de imagens (JPG, PNG, WebP)

---

## 🎨 Passo 1: Gere sua Primeira Imagem (Virtual Staging)

### Usando cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://sua-imagem-vazia.jpg",
    "designStyle": "scandinavian",
    "roomType": "living_room"
  }'
```

### Usando Python:

```python
import requests

def generate_virtual_staging():
    url = "https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline"
    payload = {
        "imageUrl": "https://sua-imagem-vazia.jpg",
        "designStyle": "scandinavian",
        "roomType": "living_room"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Imagem gerada: {data['generatedImageUrl']}")
        return data
    else:
        print(f"❌ Erro: {response.json()}")

generate_virtual_staging()
```

---

## 📦 Passo 2: Entenda a Resposta

### Resposta de Sucesso:

```json
{
  "success": true,
  "generatedImageUrl": "https://storage.googleapis.com/.../staged_room.jpg",
  "originalImageUrl": "https://sua-imagem-vazia.jpg",
  "designStyle": "scandinavian",
  "roomType": "living_room",
  "metadata": {
    "processingTime": 42.3,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### ✅ O que fazer com a resposta:

1. **Salve** `generatedImageUrl` (URL pública da imagem mobiliada)
2. **Exiba** no seu CRM para o cliente
3. **Armazene** em seu banco de dados
4. **(Opcional)** Salve também `originalImageUrl` para comparação

---

## 🎬 Passo 3: Gere seu Primeiro Vídeo (Antes/Depois)

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/ffmpeg/before-after \
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
  "videoUrl": "https://storage.googleapis.com/.../before_after_video.mp4",
  "metadata": {
    "duration": 5,
    "quality": "high",
    "aspectRatio": "16:9",
    "processingTime": 18.7
  }
}
```

**Uso:** Baixe o vídeo da `videoUrl` ou incorpore diretamente no seu CRM.

---

## 🔄 Passo 4: Trabalhe com Requisições Assíncronas (Magic Motion)

Algumas funcionalidades (Magic Motion, Magic Drop) são **assíncronas** e requerem polling:

### 1. Inicie o Processamento:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/runway/image-to-video \
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
  "taskId": "abc123-def456-ghi789",
  "status": "processing",
  "estimatedTime": "2-3 minutes"
}
```

### 3. Faça Polling (a cada 10-15 segundos):

```javascript
async function waitForCompletion(taskId) {
  let attempts = 0;
  const maxAttempts = 40; // 10 minutos
  
  while (attempts < maxAttempts) {
    const response = await axios.get(
      `https://apiruum-562831020087.us-central1.run.app/api/runway/status/${taskId}`
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

## 📚 Referências Rápidas

### 🎨 Design Styles (Virtual Staging):

| Nome | Código | Descrição |
|------|--------|-----------|
| Escandinavo | `scandinavian` | Minimalista, madeira clara |
| Moderno | `modern` | Linhas retas, neutro |
| Industrial | `industrial` | Concreto, metal, tijolo |
| Contemporâneo | `contemporary` | Elegante, sofisticado |
| Minimalista | `minimalist` | Poucos móveis, clean |
| Luxuoso | `luxurious` | Acabamentos premium |
| Boho | `bohemian` | Colorido, plantas |
| Rústico | `rustic` | Madeira natural |

### 🏠 Room Types:

| Nome | Código | Aplicação |
|------|--------|-----------|
| Sala de Estar/Jantar | `living_room` | Salas de estar e jantar |
| Quarto | `bedroom` | Quartos de casal/solteiro |
| Quarto Infantil | `kids_bedroom` | Quartos infantis |
| Quarto de Bebê | `baby_bedroom` | Quartos de bebê |
| Home Office | `home_office` | Escritórios residenciais |
| Cozinha | `kitchen` | Cozinhas |
| Área Externa | `outdoor` | Varandas, jardins, churrasqueiras |

---

## ⚠️ Erros Comuns e Soluções

### 1. Erro 400 - Bad Request
```json
{
  "error": "Missing required parameter: imageUrl"
}
```
**Solução:** Certifique-se de enviar todos os parâmetros obrigatórios

---

### 2. Erro 400 - Invalid Image
```json
{
  "error": "Invalid image format. Use JPG, PNG or WebP"
}
```
**Solução:** Certifique-se que a URL é pública e o formato é JPG/PNG/WebP.

---

### 3. Erro 429 - Rate Limit
```json
{
  "error": "Rate limit exceeded. Try again in 60 seconds"
}
```
**Solução:** Aguarde 1 minuto ou reduza a frequência de chamadas.

---

### 4. Timeout em Requisições Assíncronas
**Sintoma:** Task fica em `processing` por mais de 10 minutos

**Causas possíveis:**
- Imagem muito grande (>10MB)
- Formato de imagem incompatível
- Sobrecarga temporária do servidor

**Solução:**
1. Verifique se a imagem está entre 1-10MB
2. Certifique-se que é JPG/PNG
3. Tente novamente em 5 minutos

---

## ✅ Checklist Pré-Produção

Antes de ir para produção, certifique-se de:

- [ ] Tratamento de erros implementado
- [ ] Polling com retry implementado para Magic Motion/Drop
- [ ] Validação de URLs antes de enviar
- [ ] Timeout configurado (90s síncronas, 10min assíncronas)
- [ ] Logs de erro para monitoramento

---

## 📖 Próximos Passos

Agora que você já gerou sua primeira imagem e vídeo, explore:

1. **[Virtual Staging Completo](./VIRTUAL_STAGING.md)** - Todos os design styles e room types
2. **[Video Before/After](./VIDEO_BEFORE_AFTER.md)** - Máscaras, qualidades e aspect ratios
3. **[Magic Motion](./VIDEO_MAGIC_MOTION.md)** - Movimentos de câmera cinematográficos
4. **[Magic Drop](./VIDEO_MAGIC_DROP.md)** - Animações de móveis caindo
5. **[Error Codes](./ERROR_CODES.md)** - Referência completa de erros
6. **[Rate Limits](./RATE_LIMITS.md)** - Limites e best practices

---

## 🆘 Suporte


- **Documentação:** `README.md` (pasta CRM_INTEGRATION)
- **Email:** renato@ruum.com.br
- **Resposta:** 24-48h úteis
