# 🎥 ShotStack - API Documentation

## 📋 **Visão Geral**

A integração com ShotStack permite renderizar vídeos automaticamente usando templates JSON. O serviço oferece capacidades de edição de vídeo programática, ideal para criar conteúdo visual em larga escala.

## 🔑 **Configuração**

### **Variável de Ambiente:**
```bash
SHOTSTACK_API_KEY=sua_chave_aqui
```

**Obs**: Requer conta válida na ShotStack com créditos disponíveis.

## 🛠️ **Endpoints Disponíveis**

### **1. Renderização de Vídeo**
```http
POST /api/send-shotstack
```

**Descrição**: Envia uma configuração JSON para renderizar um vídeo e retorna o ID da renderização.

**Parâmetros da Requisição:**

O corpo da requisição deve ser um objeto JSON válido do ShotStack contendo:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `timeline` | object | ✅ | Configuração da linha do tempo do vídeo |
| `output` | object | ✅ | Configurações de saída do vídeo |

**Exemplo de Requisição:**
```json
{
  "timeline": {
    "soundtrack": {
      "src": "https://example.com/audio.mp3",
      "effect": "fadeIn"
    },
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "https://example.com/video.mp4"
            },
            "start": 0,
            "length": 10,
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

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h"
}
```

### **2. Verificação de Status**
```http
GET /api/shotstack-status/:id
```

**Descrição**: Verifica o status de uma renderização em andamento.

**Parâmetros da URL:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ | ID da renderização retornado na criação |

**Exemplo de Requisição:**
```bash
GET /api/shotstack-status/b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h
```

**Exemplo de Resposta - Em Processamento:**
```json
{
  "success": true,
  "status": "rendering",
  "data": {
    "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
    "status": "rendering",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T10:31:00Z"
  }
}
```

**Exemplo de Resposta - Concluído:**
```json
{
  "success": true,
  "status": "done",
  "data": {
    "id": "b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h",
    "status": "done",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T10:32:00Z",
    "url": "https://cdn.shotstack.io/au/stage/c9b8a7d6e5f4/b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h.mp4"
  }
}
```

## 📊 **Status das Renderizações**

As renderizações do ShotStack passam por diferentes estados:

- **queued**: Renderização na fila
- **fetching**: Baixando assets
- **rendering**: Processando o vídeo
- **saving**: Salvando o arquivo final
- **done**: Renderização concluída
- **failed**: Renderização falhou

## ⚠️ **Tratamento de Erros**

### **Erro de Renderização (500)**
```json
{
  "success": false,
  "message": "No render ID returned from Shotstack"
}
```

### **Erro de API ShotStack (500)**
```json
{
  "success": false,
  "message": "Shotstack API error",
  "error": "Detalhes do erro..."
}
```

### **Erro de Status (500)**
```json
{
  "success": false,
  "message": "Shotstack status API error",
  "error": "Detalhes do erro..."
}
```

## 🔧 **Estrutura de Templates**

### **Template Básico de Vídeo**
```json
{
  "timeline": {
    "soundtrack": {
      "src": "https://example.com/background-music.mp3",
      "effect": "fadeIn"
    },
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
            "effect": "zoomIn",
            "scale": 1.2
          },
          {
            "asset": {
              "type": "image",
              "src": "https://example.com/image2.jpg"
            },
            "start": 3,
            "length": 3,
            "effect": "slideLeft"
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

### **Template com Texto Sobreposto**
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "image",
              "src": "https://example.com/background.jpg"
            },
            "start": 0,
            "length": 5
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "Casa dos Sonhos",
              "style": "future",
              "color": "#ffffff",
              "size": "large"
            },
            "start": 1,
            "length": 3,
            "position": "center"
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "hd"
  }
}
```

## 📝 **Notas Importantes**

1. **Créditos**: Cada renderização consome créditos da conta ShotStack
2. **Tempo de Processamento**: Vídeos podem levar alguns minutos para processar
3. **Formatos Suportados**: MP4, WebM, MP3, GIF
4. **Resolução**: SD (640x480), HD (1280x720), Full HD (1920x1080)
5. **Limites**: Máximo de 30 segundos por vídeo na versão gratuita

## 🚀 **Exemplos de Uso**

### **Renderização de Vídeo Promocional**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/send-shotstack \
  -H "Content-Type: application/json" \
  -d '{
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "image",
                "src": "https://example.com/property1.jpg"
              },
              "start": 0,
              "length": 4,
              "effect": "zoomIn"
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "resolution": "hd",
      "aspectRatio": "16:9"
    }
  }'
```

### **Verificação de Status**
```bash
curl -X GET https://apiruum-667905204535.us-central1.run.app/api/shotstack-status/b7e5c9f4-8a3d-4e2f-9c1b-8d7a6e5f4g3h
```

## 🔗 **Recursos Adicionais**

- [ShotStack API Documentation](https://shotstack.io/docs/api/)
- [Template Examples](https://shotstack.io/docs/templates/)
- [Asset Library](https://shotstack.io/docs/assets/)
