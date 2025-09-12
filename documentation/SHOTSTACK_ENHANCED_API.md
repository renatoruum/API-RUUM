# 🎥 ShotStack Enhanced API - Documentation

## 📋 **Visão Geral**

A API ShotStack Enhanced permite criar vídeos profissionais através de JSON, com suporte a renderização síncrona e assíncrona, templates pré-definidos e criação de slideshows. Ideal para criar conteúdo visual automatizado para imóveis.

## 🔑 **Configuração**

### **Variável de Ambiente:**
```bash
SHOTSTACK_API_KEY=sua_chave_aqui
```

## 🛠️ **Endpoints Disponíveis**

### **1. Renderização Assíncrona**
```http
POST /api/shotstack/render
```

**Descrição**: Inicia uma renderização e retorna imediatamente o ID para acompanhamento posterior.

**Parâmetros:**
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "image",
              "src": "https://example.com/image1.jpg"
            },
            "start": 0,
            "length": 3,
            "effect": "zoomIn"
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "hd",
    "aspectRatio": "16:9",
    "fps": 30
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
  "message": "Renderização iniciada com sucesso",
  "data": {
    "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
    "status": "queued",
    "created": "2024-01-15T10:30:00Z"
  }
}
```

### **2. Verificação de Status**
```http
GET /api/shotstack/status/:id
```

**Descrição**: Verifica o status de uma renderização em andamento.

**Resposta - Concluído:**
```json
{
  "success": true,
  "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
  "status": "done",
  "data": {
    "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
    "status": "done",
    "url": "https://cdn.shotstack.io/au/stage/c9b8a7d6e5f4/video.mp4",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T10:32:00Z"
  }
}
```

### **3. Renderização Síncrona**
```http
POST /api/shotstack/render-sync
```

**Descrição**: Renderiza o vídeo e aguarda a conclusão antes de retornar a resposta.

**Parâmetros:**
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "image",
              "src": "https://example.com/image1.jpg"
            },
            "start": 0,
            "length": 3
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "hd"
  },
  "timeout": 300000
}
```

**Resposta:**
```json
{
  "success": true,
  "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
  "status": "done",
  "url": "https://cdn.shotstack.io/au/stage/c9b8a7d6e5f4/video.mp4",
  "data": {
    "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
    "status": "done",
    "url": "https://cdn.shotstack.io/au/stage/c9b8a7d6e5f4/video.mp4",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T10:32:00Z"
  }
}
```

### **4. Criação de Slideshow**
```http
POST /api/shotstack/slideshow
```

**Descrição**: Cria um slideshow automático a partir de uma lista de imagens.

**Parâmetros:**
```json
{
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "duration": 3,
  "transition": "fade",
  "soundtrack": "https://example.com/music.mp3",
  "textOverlay": {
    "text": "Apartamento Moderno",
    "style": "future",
    "color": "#ffffff",
    "size": "large",
    "start": 0,
    "length": 3,
    "position": "center"
  },
  "output": {
    "format": "mp4",
    "resolution": "hd"
  },
  "waitForCompletion": true
}
```

**Resposta:**
```json
{
  "success": true,
  "id": "slideshow-id",
  "status": "done",
  "url": "https://cdn.shotstack.io/au/stage/c9b8a7d6e5f4/slideshow.mp4"
}
```

### **5. Templates Pré-definidos**
```http
POST /api/shotstack/template/:templateName
```

**Descrição**: Usa templates pré-configurados para criar vídeos específicos.

#### **Template: property-showcase**
```json
{
  "data": {
    "images": [
      "https://example.com/sala.jpg",
      "https://example.com/quarto.jpg",
      "https://example.com/cozinha.jpg"
    ],
    "title": "Casa dos Sonhos",
    "description": "Localizada em bairro nobre",
    "duration": 4
  },
  "output": {
    "format": "mp4",
    "resolution": "hd"
  },
  "waitForCompletion": false
}
```

#### **Template: image-gallery**
```json
{
  "data": {
    "images": [
      "https://example.com/foto1.jpg",
      "https://example.com/foto2.jpg"
    ],
    "duration": 2,
    "transition": "slideLeft"
  }
}
```

#### **Template: promotional-video**
```json
{
  "data": {
    "images": [
      "https://example.com/exterior.jpg",
      "https://example.com/interior.jpg"
    ],
    "title": "Imóvel Premium",
    "subtitle": "Entre em contato conosco",
    "soundtrack": "https://example.com/background.mp3",
    "duration": 5
  }
}
```

## 🎨 **Configurações Avançadas**

### **Efeitos de Transição:**
- `zoomIn` - Zoom de entrada
- `zoomOut` - Zoom de saída  
- `slideLeft` - Deslizar para esquerda
- `slideRight` - Deslizar para direita
- `fade` - Fade in/out
- `wipe` - Transição de limpeza

### **Estilos de Texto:**
- `future` - Estilo futurista
- `minimal` - Estilo minimalista
- `blockbuster` - Estilo cinematográfico
- `vogue` - Estilo elegante
- `sketch` - Estilo esboço

### **Resoluções Suportadas:**
- `preview` - 512x288
- `mobile` - 640x360
- `sd` - 1024x576
- `hd` - 1280x720
- `fhd` - 1920x1080

## 🚀 **Exemplos de Uso Front-end**

### **JavaScript/React - Slideshow Simples**
```javascript
const createSlideshow = async (images) => {
  const response = await fetch('/api/shotstack/slideshow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      images: images,
      duration: 3,
      transition: 'fade',
      waitForCompletion: true,
      output: {
        format: 'mp4',
        resolution: 'hd'
      }
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Vídeo criado:', result.url);
    return result.url;
  } else {
    console.error('Erro:', result.message);
  }
};
```

### **JavaScript/React - Template Property Showcase**
```javascript
const createPropertyVideo = async (propertyData) => {
  const response = await fetch('/api/shotstack/template/property-showcase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        images: propertyData.images,
        title: propertyData.title,
        description: propertyData.description,
        duration: 4
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '16:9'
      },
      waitForCompletion: false
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Acompanhar progresso
    const videoUrl = await pollForCompletion(result.id);
    return videoUrl;
  }
};

const pollForCompletion = async (renderId) => {
  const checkStatus = async () => {
    const response = await fetch(`/api/shotstack/status/${renderId}`);
    const result = await response.json();
    
    if (result.data.status === 'done') {
      return result.data.url;
    } else if (result.data.status === 'failed') {
      throw new Error('Renderização falhou');
    } else {
      // Aguardar 5 segundos e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await checkStatus();
    }
  };
  
  return await checkStatus();
};
```

### **Vue.js - Componente de Upload e Criação**
```vue
<template>
  <div>
    <input 
      type="file" 
      multiple 
      @change="handleFileUpload" 
      accept="image/*"
    />
    <button @click="createVideo" :disabled="loading">
      {{ loading ? 'Criando...' : 'Criar Vídeo' }}
    </button>
    <div v-if="videoUrl">
      <video :src="videoUrl" controls></video>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      images: [],
      loading: false,
      videoUrl: null
    };
  },
  methods: {
    handleFileUpload(event) {
      // Código para upload das imagens
      // e obter URLs das imagens
      this.images = [...]; // URLs das imagens
    },
    
    async createVideo() {
      this.loading = true;
      
      try {
        const response = await fetch('/api/shotstack/slideshow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            images: this.images,
            duration: 3,
            transition: 'zoomIn',
            textOverlay: {
              text: 'Meu Imóvel',
              style: 'future',
              color: '#ffffff'
            },
            waitForCompletion: true
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.videoUrl = result.url;
        }
      } catch (error) {
        console.error('Erro ao criar vídeo:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

## ⚠️ **Tratamento de Erros**

### **Validação de Timeline (400)**
```json
{
  "success": false,
  "message": "Timeline inválida. Deve conter pelo menos uma track com clips."
}
```

### **Timeout de Renderização (408)**
```json
{
  "success": false,
  "message": "Timeout na renderização",
  "error": "Timeout: Renderização não foi concluída após 60 tentativas"
}
```

### **Template Não Encontrado (400)**
```json
{
  "success": false,
  "message": "Template 'custom-template' não encontrado",
  "availableTemplates": ["property-showcase", "image-gallery", "promotional-video"]
}
```

## 📊 **Monitoramento**

### **Status das Renderizações:**
- **queued**: Na fila de processamento
- **fetching**: Baixando assets
- **rendering**: Renderizando vídeo
- **saving**: Salvando arquivo
- **done**: Concluído
- **failed**: Falhou

### **Timeouts Recomendados:**
- Vídeos curtos (< 30s): 2-3 minutos
- Vídeos médios (30-60s): 3-5 minutos
- Vídeos longos (> 60s): 5-10 minutos

## 🔗 **Recursos Relacionados**

- [ShotStack API Documentation](https://shotstack.io/docs/api/)
- [ShotStack Connector](./SHOTSTACK_CONNECTOR.md)
- [Timeline Builder Tool](https://shotstack.io/demo/timeline-builder/)

## 💡 **Dicas de Performance**

1. **Use resolução apropriada**: HD para web, FHD apenas se necessário
2. **Otimize imagens**: Comprima imagens antes do upload
3. **Limite duração**: Vídeos mais curtos renderizam mais rápido
4. **Cache resultados**: Armazene vídeos gerados para reutilização
5. **Modo assíncrono**: Use para vídeos longos ou múltiplas renderizações
