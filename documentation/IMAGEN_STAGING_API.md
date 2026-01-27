# API Imagen Staging - Virtual Staging com Google Imagen 3

## 📋 Visão Geral

API para geração automática de Virtual Staging usando **Google Imagen 3** através da Gemini API. O sistema utiliza uma arquitetura de **3 agentes inteligentes** que trabalham em sequência para garantir qualidade e precisão:

1. **Agente de Layout** - Analisa a imagem e planeja o layout de móveis
2. **Agente de Geração** - Gera a imagem de virtual staging com Imagen 3
3. **Agente de Verificação** - Valida a qualidade e detecta alucinações

### 🎨 Estilos de Design Disponíveis

A API suporta **8 estilos de design** diferentes. O frontend pode especificar o estilo desejado via parâmetro `design_style`. Se não especificado, o **padrão é Contemporary Minimalist**.

| Estilo | Key | Descrição |
|--------|-----|-----------|
| **Contemporary Minimalist** ⭐ (padrão) | `contemporary_minimalist` | Elegância sem esforço com paleta neutra e suave, móveis de linhas limpas com formas orgânicas, texturas variadas como madeira polida, tecidos leves e couro sofisticado |
| **Modern** | `modern` | Design elegante e contemporâneo com formas geométricas ousadas, esquemas monocromáticos com cores de destaque, mix de materiais como vidro, metal e couro |
| **Scandinavian** | `scandinavian` | Espaços leves e arejados com tons de madeira natural, cores brancas e pastéis, móveis funcionais de linhas simples, ênfase em luz natural e conforto |
| **Industrial** | `industrial` | Materiais crus e expostos como tijolo e concreto, acessórios metálicos, móveis de madeira recuperada, paleta neutra com acentos escuros |
| **Bohemian** | `bohemian` | Mix eclético de padrões e texturas, cores vibrantes, materiais naturais, têxteis em camadas, plantas e peças vintage |
| **Luxury** | `luxury` | Materiais de alta qualidade como mármore, veludo e latão, paleta rica com tons de joias, móveis elegantes com detalhes sofisticados |
| **Coastal** | `coastal` | Estética leve e fresca com tons de branco e azul, materiais naturais como rattan e linho, acentos náuticos, madeira envelhecida |
| **Mid-Century Modern** | `midcentury` | Design icônico dos anos 50-60 com curvas orgânicas, pernas cônicas, tons de madeira quente, padrões geométricos ousados |

---

## 🏗️ Arquitetura dos 3 Agentes

### 🔍 Agente 1: Layout Analyzer

**Função:** Analisa a imagem original e cria uma descrição detalhada do layout de móveis

**Prompt:**
```
Role: You are a Senior Architect specialized in interior design. 
Your job is to create a cohesive furnishing layout for the space 
in the Input Image composed by distinct furniture islands.

- Observa áreas funcionais visíveis (sala, varanda, cozinha, etc.)
- Segmenta em clusters de uso onde móveis serão adicionados
- Descreve layout coeso sem obstruir circulação ou vistas
- Dimensiona cada ilha de móveis conforme área disponível
- Estilo: Minimalista contemporâneo com paleta neutra e suave
- Móveis de varanda: Materiais apropriados para clima tropical
```

### 🎨 Agente 2: Staging Generator

**Função:** Gera a imagem de virtual staging usando Imagen 3

**Instruções:**
```
- Aplicar o layout descrito pelo Agente 1
- NÃO obstruir circulação, portas, janelas ou vistas
- Manter relação espacial coesa entre ilhas de móveis
- Estilo minimalista contemporâneo
- CRÍTICO: Não mudar nada além de adicionar móveis e acabamentos
```

**Negative Prompt Padrão:**
```
distorted furniture, unrealistic shadows, obstructed doors, 
blocked windows, changed walls, altered architecture, 
low quality, blurry
```

### ✅ Agente 3: Quality Verifier

**Função:** Executa 6 verificações sequenciais para detectar alucinações

**Verificações (executadas uma por vez):**

1. **Paredes** - Mapeia comprimento das paredes em ambas as imagens
2. **Portas/Janelas** - Verifica posições de portas e janelas
3. **Acesso Periférico** - Valida acessos a áreas adjacentes
4. **Forma** - Compara formato do floorplan visível
5. **Obstruções** - Detecta bloqueios de circulação pelos móveis
6. **Câmera** - Analisa posição, ângulo, focal e vanishing points

**Resultado:** 
- `passed: true` - Todas as verificações OK
- `passed: false` - Problemas detectados (retorna detalhes)

---

## 🚀 Endpoints Disponíveis

### 1. Testar Conexão

```http
GET /api/imagen-staging/test
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com Gemini AI funcionando",
  "data": {
    "authenticated": true,
    "test_response": "Test connection"
  }
}
```

---

### 2. Executar Apenas Agente 1 (Análise de Layout)

```http
POST /api/imagen-staging/analyze-layout
```

**Body:**
```json
{
  "image_url": "https://example.com/empty-room.jpg",
  "design_style": "contemporary_minimalist"
}
```

**Parâmetros:**
- `image_url` (obrigatório) - URL da imagem vazia
- `design_style` (opcional) - Estilo de design. Padrão: `contemporary_minimalist`

**Resposta:**
```json
{
  "success": true,
  "message": "Layout analisado com sucesso",
  "data": {
    "layoutDescription": "The visible space comprises three distinct functional areas:\n\n1. Living Room Area (approximately 20m²)...",
    "timestamp": "2026-01-23T10:30:00.000Z"
  }
}
```

---

### 3. Executar Apenas Agente 2 (Geração)

```http
POST /api/imagen-staging/generate
```

**Body:**
```json
{
  "layout_description": "Descrição detalhada do layout obtida do Agente 1",
  "aspect_ratio": "16:9",
  "number_of_images": 1,
  "negative_prompt": "distorted furniture, unrealistic shadows",
  "safety_filter_level": "block_some",
  "design_style": "scandinavian"
}
```

**Parâmetros:**
- `layout_description` (obrigatório) - Descrição do Agente 1
- `aspect_ratio` (opcional) - `1:1`, `16:9`, `9:16`, `4:3`, `3:4`
- `number_of_images` (opcional) - Padrão: 1
- `negative_prompt` (opcional) - O que NÃO deve aparecer
- `safety_filter_level` (opcional) - `block_some`, `block_few`, `block_fewest`
- `design_style` (opcional) - Estilo de design. Padrão: `contemporary_minimalist`

**Resposta:**
```json
{
  "success": true,
  "message": "Imagem gerada com sucesso",
  "data": {
    "image_base64": "/9j/4AAQSkZJRgABAQAAAQAB...",
    "mime_type": "image/jpeg",
    "timestamp": "2026-01-23T10:31:00.000Z"
  }
}
```

---

### 4. Executar Apenas Agente 3 (Verificação)

```http
POST /api/imagen-staging/verify
```

**Body:**
```json
{
  "original_image_url": "https://example.com/empty-room.jpg",
  "generated_image_base64": "/9j/4AAQSkZJRgABAQAAAQAB..."
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Verificação passou",
  "data": {
    "passed": true,
    "checks": {
      "walls": "Walls: same",
      "doors_windows": "Doors/windows placement: same",
      "peripheral_access": "Peripheral access: same",
      "shape": "Shape: same",
      "obstructions": "Obstructions: Clear",
      "camera": "Camera: same"
    },
    "timestamp": "2026-01-23T10:32:00.000Z"
  }
}
```

**Se falhar:**
```json
{
  "success": true,
  "message": "Verificação falhou",
  "data": {
    "passed": false,
    "checks": {
      "walls": "Walls: same",
      "doors_windows": "Doors/windows placement: different - The window on the left wall appears shifted 30cm to the right in the AI render",
      "peripheral_access": "Peripheral access: same",
      "shape": "Shape: same",
      "obstructions": "Obstructions: hindered - Large sofa partially blocks access to balcony door",
      "camera": "Camera: same"
    },
    "timestamp": "2026-01-23T10:32:00.000Z"
  }
}
```

---

### 5. 🌟 Pipeline Completo (RECOMENDADO)

```http
POST /api/imagen-staging/full-pipeline
```

**Body:**
```json
{
  "image_url": "https://example.com/empty-room.jpg",
  "aspect_ratio": "16:9",
  "negative_prompt": "distorted furniture, unrealistic shadows, obstructed doors",
  "number_of_images": 1,
  "safety_filter_level": "block_some",
  "upload_to_firebase": true,
  "client_name": "meu-cliente",
  "design_style": "luxury"
}
```

**Parâmetros:**
- `image_url` (obrigatório) - URL da imagem vazia
- `aspect_ratio` (opcional) - Padrão: `16:9`
- `negative_prompt` (opcional) - Customização
- `number_of_images` (opcional) - Padrão: 1
- `safety_filter_level` (opcional) - Padrão: `block_some`
- `upload_to_firebase` (opcional) - Padrão: `true`
- `client_name` (opcional) - Nome da pasta no Firebase
- `design_style` (opcional) - Estilo de design. Padrão: `contemporary_minimalist`

**Resposta (Sucesso com verificação OK):**
```json
{
  "success": true,
  "message": "Virtual staging concluído com sucesso - Verificação PASSOU",
  "data": {
    "layout_description": "The visible space comprises three distinct functional areas...",
    "verification": {
      "passed": true,
      "checks": {
        "walls": "Walls: same",
        "doors_windows": "Doors/windows placement: same",
        "peripheral_access": "Peripheral access: same",
        "shape": "Shape: same",
        "obstructions": "Obstructions: Clear",
        "camera": "Camera: same"
      }
    },
    "image_base64": "/9j/4AAQSkZJRgABAQAAAQAB...",
    "mime_type": "image/jpeg",
    "firebase_url": "https://storage.googleapis.com/bucket/virtual-staging/meu-cliente/staging-1234567890.jpg",
    "metadata": {
      "originalImageUrl": "https://example.com/empty-room.jpg",
      "processingTime": "45.23s",
      "timestamp": "2026-01-23T10:32:00.000Z"
    }
  }
}
```

**Resposta (Sucesso mas com avisos):**
```json
{
  "success": true,
  "message": "Virtual staging concluído com AVISOS - Verificação identificou possíveis problemas",
  "warning": "A imagem gerada pode ter problemas de qualidade",
  "data": {
    "layout_description": "...",
    "verification": {
      "passed": false,
      "checks": {
        "walls": "Walls: same",
        "doors_windows": "Doors/windows placement: different - Window shifted",
        "peripheral_access": "Peripheral access: same",
        "shape": "Shape: same",
        "obstructions": "Obstructions: hindered - Sofa blocks balcony",
        "camera": "Camera: same"
      }
    },
    "image_base64": "...",
    "firebase_url": "...",
    "metadata": {...}
  }
}
```

---

### 6. Listar Modelos e Configurações

```http
GET /api/imagen-staging/models
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "models": {
      "IMAGEN_3_GENERATE": "imagen-3.0-generate-001",
      "IMAGEN_3_FAST": "imagen-3.0-fast-generate-001",
      "GEMINI_FLASH": "gemini-2.0-flash-exp",
      "GEMINI_PRO": "gemini-1.5-pro-latest"
    },
    "aspect_ratios": {
      "SQUARE": "1:1",
      "PORTRAIT": "9:16",
      "LANDSCAPE": "16:9",
      "PORTRAIT_4_3": "3:4",
      "LANDSCAPE_4_3": "4:3"
    },
    "agents": {
      "agent_1": "Layout Analyzer - Analisa e descreve o layout de móveis",
      "agent_2": "Staging Generator - Gera a imagem de virtual staging",
      "agent_3": "Quality Verifier - Verifica se não houve alucinações"
    }
  }
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Pipeline Completo Simples

```javascript
const response = await fetch('https://seu-servidor.com/api/imagen-staging/full-pipeline', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url: 'https://example.com/empty-living-room.jpg',
    design_style: 'scandinavian' // Opcional, padrão é contemporary_minimalist
  })
});

const result = await response.json();

if (result.success && result.data.verification.passed) {
  console.log('✅ Virtual staging OK!');
  console.log('Firebase URL:', result.data.firebase_url);
} else {
  console.log('⚠️ Virtual staging com avisos');
  console.log('Problemas:', result.data.verification.checks);
}
```

### Exemplo 2: Testando Diferentes Estilos

```javascript
const styles = ['contemporary_minimalist', 'luxury', 'scandinavian', 'industrial'];
const imageUrl = 'https://example.com/room.jpg';

for (const style of styles) {
  const response = await fetch('https://seu-servidor.com/api/imagen-staging/full-pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      design_style: style,
      client_name: `test-${style}`
    })
  });
  
  const result = await response.json();
  console.log(`Estilo ${style}:`, result.data.firebase_url);
}
```

```javascript
// PASSO 1: Analisar layout
const layoutResponse = await fetch('https://seu-servidor.com/api/imagen-staging/analyze-layout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/room.jpg'
  })
});
const layoutData = await layoutResponse.json();
const layoutDescription = layoutData.data.layoutDescription;

// PASSO 2: Customizar e gerar
const customLayout = layoutDescription + "\nAdditional instruction: Add tropical plants";

const generateResponse = await fetch('https://seu-servidor.com/api/imagen-staging/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    layout_description: customLayout,
    aspect_ratio: '16:9',
    negative_prompt: 'dark furniture, heavy curtains'
  })
});
const generatedData = await generateResponse.json();

// PASSO 3: Verificar qualidade
const verifyResponse = await fetch('https://seu-servidor.com/api/imagen-staging/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    original_image_url: 'https://example.com/room.jpg',
    generated_image_base64: generatedData.data.image_base64
  })
});
const verifyData = await verifyResponse.json();

console.log('Verificação passou?', verifyData.data.passed);
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Google Gemini API Key (obrigatória)
GEMINI_API_KEY=AIzaSy...
```

### Obter API Key

1. Acesse [Google AI Studio](https://ai.google.dev/)
2. Faça login com conta Google
3. Clique em "Get API Key"
4. Copie a chave e adicione ao `.env`

---

## 📊 Performance e Custos

### Tempo de Processamento Estimado

- **Agente 1 (Layout):** ~5-8 segundos
- **Agente 2 (Geração):** ~15-30 segundos
- **Agente 3 (Verificação - 6 checks):** ~8-12 segundos
- **Pipeline Completo:** ~30-50 segundos

### Custos Aproximados (Google AI)

- **Gemini Flash (Agentes 1 e 3):** ~$0.002 por requisição
- **Imagen 3 Generate (Agente 2):** ~$0.04 por imagem
- **Total por staging completo:** ~$0.042

---

## 🔍 Troubleshooting

### Erro: "GEMINI_API_KEY não definida"

**Solução:** Adicione a variável de ambiente no `.env`

### Verificação sempre falha

**Possíveis causas:**
- Imagem original muito pequena ou com baixa qualidade
- Prompt muito complexo gerando mudanças estruturais
- Aspect ratio diferente da imagem original

**Solução:** Use imagens de alta qualidade e aspect ratio correto

### Imagem gerada muito diferente

**Solução:** Ajuste o `negative_prompt`:
```json
{
  "negative_prompt": "changed walls, altered windows, moved doors, different architecture, distorted perspective"
}
```

---

## 🎯 Boas Práticas

1. **Use o pipeline completo** - Garante qualidade com verificação automática
2. **Imagens de alta qualidade** - Mínimo 1920x1080 para melhores resultados
3. **Aspect ratio correto** - Use o mesmo da imagem original
4. **Upload para Firebase** - Mantenha `upload_to_firebase: true` para persistência
5. **Monitore verificações** - Se `passed: false`, investigue os checks detalhados

---

## 📚 Arquivos Relacionados

- **Conector:** [`src/connectors/imagenStaging.js`](../src/connectors/imagenStaging.js)
- **Rota:** [`src/routes/sendImagenStaging.js`](../src/routes/sendImagenStaging.js)
- **Configuração:** [`src/app.js`](../src/app.js)

---

## 🆚 Comparação com Virtual Staging AI

| Característica | Imagen Staging | Virtual Staging AI |
|---------------|----------------|-------------------|
| Modelo | Google Imagen 3 | Proprietário |
| Verificação | 3 agentes com 6 checks | Manual |
| Customização | Alta (prompts) | Média (estilos fixos) |
| Custo/imagem | ~$0.042 | ~$0.50 |
| Tempo | 30-50s | 60-120s |
| Qualidade | Fotorrealística | Alta |

---

**Criado em:** 23 de janeiro de 2026  
**Versão da API:** 1.0.0
