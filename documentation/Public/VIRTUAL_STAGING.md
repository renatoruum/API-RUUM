# 🖼️ Virtual Staging API

> Geração automatizada de mobília virtual com IA

---

## 📋 Visão Geral

O Virtual Staging permite transformar ambientes vazios em espaços mobiliados utilizando IA generativa. O sistema:

1. **Analisa** o layout arquitetônico da imagem
2. **Gera** mobília virtual apropriada ao estilo escolhido
3. **Verifica** qualidade através de 5 checks sequenciais
4. **Retorna** a melhor imagem gerada (até 3 tentativas automáticas)

---

## 🎯 Endpoint Principal

```
POST /api/imagen-staging/full-pipeline
```

**Tipo:** Síncrono (resposta imediata)  
**Tempo médio:** 30-60 segundos  
**Timeout:** 120 segundos

---

## 📨 Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parâmetro | Tipo | Obrigatório | Default | Descrição |
|-----------|------|-------------|---------|-----------|
| `imageUrl` | string | ✅ | - | URL pública da imagem vazia (JPG/PNG/WebP) |
| `designStyle` | string | ❌ | `contemporary_minimalist` | Estilo de design (veja estilos abaixo) |
| `roomType` | string | ❌ | `living_room` | Tipo de cômodo (veja tipos abaixo) |
| `aspectRatio` | string | ❌ | `16:9` | Proporção da imagem (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`) |

### Exemplo de Request

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.example.com/empty-living-room.jpg",
    "designStyle": "scandinavian",
    "roomType": "living_room",
    "aspectRatio": "16:9"
  }'
```

---

## 📬 Response

### ✅ Sucesso (200 OK)

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
        "✅ Estrutura arquitetônica preservada",
        "✅ Móveis apropriados ao cômodo",
        "✅ Iluminação consistente com original",
        "✅ Perspectiva e proporções corretas",
        "✅ Paleta de cores harmoniosa"
      ],
      "processingTime": "42s",
      "attempts": 1,
      "timestamp": "2026-02-02T14:30:00Z"
    }
  }
}
```

### ⚠️ Sucesso Parcial (200 OK - Melhor Tentativa)

Quando nenhuma tentativa passa em todos os checks, retorna a que chegou mais longe:

```json
{
  "success": true,
  "data": {
    "generatedImageUrl": "https://storage.googleapis.com/ruum-staging/staged_xyz789.jpg",
    "originalImageUrl": "https://storage.googleapis.com/ruum-staging/original_xyz789.jpg",
    "metadata": {
      "designStyle": "modern",
      "roomType": "living_room",
      "qualityScore": 4,
      "checksPassados": [
        "✅ Estrutura arquitetônica preservada",
        "✅ Móveis apropriados ao cômodo",
        "✅ Iluminação consistente com original",
        "✅ Perspectiva e proporções corretas"
      ],
      "checksFalhados": [
        "❌ Paleta de cores harmoniosa: Cores muito saturadas"
      ],
      "processingTime": "98s",
      "attempts": 3,
      "warning": "Retornando melhor tentativa após 3 gerações",
      "timestamp": "2026-02-02T14:35:00Z"
    }
  }
}
```

### ❌ Erro (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "A URL da imagem não está acessível ou o formato não é suportado",
    "details": "Supported formats: JPG, PNG, WebP. Max size: 10MB",
    "timestamp": "2026-02-02T14:40:00Z"
  }
}
```

---

## 🎨 Estilos de Design Disponíveis

### 1. Contemporary Minimalist (`contemporary_minimalist`)
**Descrição:** Elegância minimalista com paleta neutra, móveis de linhas limpas e formas orgânicas.  
**Ideal para:** Apartamentos modernos, lofts, espaços corporativos

### 2. Modern (`modern`)
**Descrição:** Design contemporâneo com formas geométricas, esquema monocromático com cores de destaque.  
**Ideal para:** Imóveis urbanos, escritórios, espaços comerciais

### 3. Scandinavian (`scandinavian`)
**Descrição:** Estilo nórdico com tons de madeira clara, cores pastel, móveis funcionais.  
**Ideal para:** Apartamentos pequenos, espaços que precisam parecer maiores

### 4. Industrial (`industrial`)
**Descrição:** Materiais expostos (tijolo, concreto), metal, madeira reciclada, paleta neutra.  
**Ideal para:** Lofts, espaços convertidos, imóveis com pegada urbana

### 5. Bohemian (`bohemian`)
**Descrição:** Mix eclético de padrões, cores vibrantes, materiais naturais, plantas.  
**Ideal para:** Imóveis com personalidade, públicos criativos

### 6. Luxury (`luxury`)
**Descrição:** Materiais nobres (mármore, veludo, latão), cores ricas, iluminação sofisticada.  
**Ideal para:** Imóveis de alto padrão, coberturas, mansões

### 7. Coastal (`coastal`)
**Descrição:** Estética leve com tons azuis e brancos, materiais naturais, temática náutica.  
**Ideal para:** Imóveis de praia, casas de veraneio, apartamentos com vista mar

### 8. Mid-Century Modern (`midcentury`)
**Descrição:** Design icônico anos 50-60, curvas orgânicas, tons de madeira quente, padrões geométricos.  
**Ideal para:** Imóveis vintage, apartamentos retrô, espaços com arquitetura da época

---

## 🏠 Tipos de Cômodos Suportados

| Tipo | Chave | Móveis Típicos | Checks Específicos |
|------|-------|----------------|-------------------|
| Sala de Estar/Jantar | `living_room` | Sofá, poltronas, mesa de centro, TV | Verificação de sofá centralizado |
| Quarto | `bedroom` | Cama, criado-mudo, guarda-roupa | Verificação de cama como peça central |
| Quarto Infantil | `kids_bedroom` | Cama infantil, brinquedos, escrivaninha | Verificação de elementos infantis |
| Quarto de Bebê | `baby_bedroom` | Berço, poltrona de amamentação, cômoda | Verificação de berço como peça central |
| Home Office | `home_office` | Mesa de trabalho, cadeira, estante | Verificação de setup de trabalho |
| Cozinha | `kitchen` | Bancada, armários, eletrodomésticos | Verificação de materiais de cozinha |
| Área Externa | `outdoor` | Móveis para jardim, plantas, churrasqueira | Verificação de móveis resistentes a clima |

---

## 🔍 Sistema de Verificação de Qualidade

O sistema executa **5 checks sequenciais** em cada imagem gerada:

### Check 1: Estrutura Arquitetônica
✅ **Passa:** Paredes, janelas, portas preservadas  
❌ **Falha:** Estrutura deformada ou móveis cobrindo elementos arquitetônicos

### Check 2: Móveis Apropriados
✅ **Passa:** Móveis típicos do cômodo (ex: sofá em living_room)  
❌ **Falha:** Móveis inadequados ou ausentes

### Check 3: Iluminação
✅ **Passa:** Luz e sombras consistentes com a imagem original  
❌ **Falha:** Iluminação artificial ou inconsistente

### Check 4: Perspectiva e Proporções
✅ **Passa:** Móveis em escala correta e perspectiva natural  
❌ **Falha:** Móveis desproporcionais ou perspectiva distorcida

### Check 5: Paleta de Cores
✅ **Passa:** Cores harmoniosas e apropriadas ao estilo  
❌ **Falha:** Cores muito saturadas ou desarmônicas

---

## 🔄 Sistema de Regeneração Inteligente

Se a imagem falhar em algum check, o sistema:

1. **Identifica** o ponto de falha específico
2. **Ajusta** o prompt com instruções adicionais
3. **Gera** nova imagem (até 3 tentativas)
4. **Retorna** a melhor tentativa (que passou em mais checks)

### Exemplo de Prompt Incremental:

**Tentativa 1 (Falhou no Check 5 - Cores):**
```
Prompt base: [descrição do staging]
```

**Tentativa 2 (Com ajuste):**
```
Prompt base + "ATENÇÃO: Use paleta de cores suave e harmoniosa, 
evite cores muito saturadas ou contrastantes. Mantenha tons neutros."
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Sala Minimalista

```javascript
const response = await axios.post('/api/imagen-staging/full-pipeline', {
  imageUrl: 'https://example.com/empty-living.jpg',
  designStyle: 'contemporary_minimalist',
  roomType: 'living_room'
});

console.log(response.data.generatedImageUrl);
// https://storage.googleapis.com/.../staged_abc.jpg
```

### Exemplo 2: Varanda Coastal

```javascript
const response = await axios.post('/api/imagen-staging/full-pipeline', {
  imageUrl: 'https://example.com/empty-balcony.jpg',
  designStyle: 'coastal',
  roomType: 'outdoor',
  aspectRatio: '9:16'
});

console.log(response.data.generatedImageUrl);
// https://storage.googleapis.com/.../staged_xyz.jpg
```

### Exemplo 3: Cozinha Luxury

```javascript
const response = await axios.post('/api/imagen-staging/full-pipeline', {
  imageUrl: 'https://example.com/empty-kitchen.jpg',
  designStyle: 'luxury',
  roomType: 'kitchen'
});

console.log(response.data.metadata.qualityScore);
// 5 (passou em todos os checks)
```

---

## ⚠️ Limitações e Recomendações

### ✅ Imagens Ideais:
- Resolução mínima: 1024x1024 pixels
- Formato: JPG, PNG ou WebP
- Tamanho máximo: 10MB
- Ambiente vazio ou semi-vazio
- Boa iluminação natural
- Paredes, janelas e estrutura visíveis

### ❌ Evite:
- Imagens muito escuras ou superexpostas
- Ambientes já mobiliados (use imagens vazias)
- Fotos com pessoas ou animais
- Imagens de baixa resolução (<800px)
- Ângulos muito distorcidos (fisheye)

---

## 🔒 Segurança e Armazenamento

- **URLs públicas** são geradas com URLs assinadas (signed URLs)
- **Validade padrão:** 7 dias
- **Armazenamento:** Google Cloud Storage
- **Região:** us-central1
- **Nenhum dado** é salvo no Airtable da Ruum

---

## 📊 Métricas de Performance

| Métrica | Valor Médio | P95 | P99 |
|---------|-------------|-----|-----|
| Tempo de processamento | 42s | 68s | 95s |
| Taxa de sucesso (5/5 checks) | 78% | - | - |
| Taxa de sucesso (4/5 checks) | 94% | - | - |
| Tentativas médias | 1.3 | 2 | 3 |

---

## 🐛 Troubleshooting


### Problema: Imagem demora mais de 2 minutos
**Causa:** Imagem muito grande ou servidor sobrecarregado  
**Solução:** Reduza o tamanho da imagem para <5MB

### Problema: Móveis aparecem distorcidos
**Causa:** Perspectiva muito acentuada na imagem original  
**Solução:** Use fotos com perspectiva mais frontal

### Problema: Cores muito saturadas
**Causa:** Falha no Check 5  
**Solução:** Sistema regenera automaticamente. Se persistir, tente outro `designStyle`

### Problema: Qualidade Score baixo (1-2)
**Causa:** Imagem original inadequada  
**Solução:** Verifique qualidade da foto (iluminação, resolução, ângulo)

---

## 📚 Referências Relacionadas

- [Quick Start Guide](./QUICKSTART.md) - Seu primeiro request
- [Códigos de Erro](./ERROR_CODES.md) - Troubleshooting completo
- [Rate Limits](./RATE_LIMITS.md) - Limites de uso

---

**Dúvidas?** renato@ruum.com.br
