# 🎬 Runway Connector - Documentation

## 📋 **Visão Geral**

O conector Runway ML fornece integração com a API da Runway para geração de imagens e conversão de imagens para vídeos usando inteligência artificial. Utiliza o SDK oficial da Runway ML para operações simplificadas.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
RUNWAYML_API_SECRET=sua_chave_aqui
```

### **Dependências:**
```bash
npm install @runwayml/sdk
```

### **Importação:**
```javascript
import { generateWithRunway, imageToVideoWithRunway } from "../connectors/runway.js";
```

## 🛠️ **Funções Disponíveis**

### **1. generateWithRunway(options)**
Gera uma imagem usando Runway ML baseada em um prompt textual.

**Parâmetros:**
- `options.prompt` (string, obrigatório): Descrição textual da imagem
- `options.params` (object, opcional): Parâmetros adicionais

**Retorna:**
- `Promise<Object>`: Resposta da API do Runway

**Sintaxe:**
```javascript
const response = await generateWithRunway({
  prompt: "Modern living room with minimalist furniture",
  params: {
    aspectRatio: "16:9",
    quality: "high"
  }
});
```

**Exemplo de Resposta:**
```javascript
{
  id: "gen_xxxxxxxxxxxxxx",
  status: "PENDING",
  createdAt: "2024-01-15T10:30:00Z",
  prompt: "Modern living room with minimalist furniture",
  seed: 1234567890,
  output: []
}
```

### **2. imageToVideoWithRunway(options)**
Converte uma imagem em vídeo usando Runway ML.

**Parâmetros:**
- `options.image_url` (string, obrigatório): URL da imagem
- `options.motion_prompt` (string, opcional): Descrição do movimento
- `options.params` (object, opcional): Parâmetros adicionais

**Retorna:**
- `Promise<Object>`: Resposta da API do Runway

**Sintaxe:**
```javascript
const response = await imageToVideoWithRunway({
  image_url: "https://example.com/room.jpg",
  motion_prompt: "Gentle camera pan from left to right",
  params: {
    duration: 4,
    fps: 24
  }
});
```

**Exemplo de Resposta:**
```javascript
{
  id: "vid_xxxxxxxxxxxxxx",
  status: "PENDING",
  createdAt: "2024-01-15T10:30:00Z",
  image_url: "https://example.com/room.jpg",
  motion_prompt: "Gentle camera pan from left to right",
  output: []
}
```

## 🔄 **Estados das Tarefas**

### **Status Possíveis:**
- **PENDING**: Tarefa na fila de processamento
- **RUNNING**: Processamento em andamento
- **SUCCEEDED**: Processamento concluído com sucesso
- **FAILED**: Processamento falhou

### **Monitoramento de Status:**
```javascript
const checkTaskStatus = async (taskId) => {
  try {
    const task = await runwayClient.tasks.retrieve(taskId);
    
    switch (task.status) {
      case 'SUCCEEDED':
        console.log('Tarefa concluída:', task.output);
        break;
      case 'FAILED':
        console.error('Tarefa falhou:', task.failure);
        break;
      case 'RUNNING':
        console.log('Processando...');
        break;
      default:
        console.log('Status:', task.status);
    }
    
    return task;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
};
```

## ⚠️ **Tratamento de Erros**

### **Erros Comuns:**
- **Prompt obrigatório**: Falta do parâmetro prompt
- **URL inválida**: URL da imagem não acessível
- **Tarefa falhou**: Erro durante processamento
- **Limite de créditos**: Créditos insuficientes

### **Exemplo de Tratamento:**
```javascript
try {
  const response = await generateWithRunway({
    prompt: "Beautiful landscape"
  });
  
  console.log("Geração iniciada:", response.id);
} catch (error) {
  if (error instanceof TaskFailedError) {
    console.error("Tarefa falhou:", error.message);
  } else {
    console.error("Erro geral:", error.message);
  }
}
```

## 🎨 **Parâmetros Avançados**

### **Geração de Imagens:**
```javascript
const advancedGeneration = await generateWithRunway({
  prompt: "Luxurious bedroom with marble finishes",
  params: {
    aspectRatio: "3:4",        // Proporção da imagem
    quality: "high",           // Qualidade (low, medium, high)
    style: "photorealistic",   // Estilo da imagem
    seed: 42                   // Seed para reprodutibilidade
  }
});
```

### **Conversão para Vídeo:**
```javascript
const videoGeneration = await imageToVideoWithRunway({
  image_url: "https://example.com/bedroom.jpg",
  motion_prompt: "Smooth camera movement revealing room details",
  params: {
    duration: 5,               // Duração em segundos
    fps: 30,                   // Frames por segundo
    motion_intensity: 0.8,     // Intensidade do movimento (0-1)
    camera_motion: "pan_right" // Tipo de movimento da câmera
  }
});
```

## 📊 **Monitoramento e Logging**

### **Logs Detalhados:**
```javascript
const generateWithLogging = async (options) => {
  console.log("Iniciando geração Runway:", options.prompt);
  
  try {
    const response = await generateWithRunway(options);
    
    console.log("Resposta recebida:", {
      id: response.id,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    
    return response;
  } catch (error) {
    console.error("Erro na geração:", {
      error: error.message,
      prompt: options.prompt,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};
```

## 🚀 **Exemplos de Uso**

### **Geração de Imagem de Ambiente:**
```javascript
const generateRoomImage = async (roomType, style) => {
  const prompt = `${style} ${roomType} with natural lighting, high quality, photorealistic`;
  
  try {
    const response = await generateWithRunway({
      prompt: prompt,
      params: {
        aspectRatio: "16:9",
        quality: "high"
      }
    });
    
    console.log(`Geração iniciada para ${roomType}:`, response.id);
    return response;
  } catch (error) {
    console.error(`Erro ao gerar ${roomType}:`, error);
    throw error;
  }
};

// Uso
const bedroom = await generateRoomImage("bedroom", "modern");
const livingRoom = await generateRoomImage("living room", "scandinavian");
```

### **Conversão de Imagem para Vídeo:**
```javascript
const createPropertyVideo = async (imageUrl, roomDescription) => {
  const motionPrompt = `Smooth cinematic camera movement showcasing ${roomDescription}`;
  
  try {
    const response = await imageToVideoWithRunway({
      image_url: imageUrl,
      motion_prompt: motionPrompt,
      params: {
        duration: 4,
        fps: 24
      }
    });
    
    console.log("Conversão para vídeo iniciada:", response.id);
    return response;
  } catch (error) {
    console.error("Erro na conversão para vídeo:", error);
    throw error;
  }
};

// Uso
const video = await createPropertyVideo(
  "https://example.com/luxury-kitchen.jpg",
  "luxury kitchen with marble countertops"
);
```

### **Processamento em Lote:**
```javascript
const batchGeneration = async (prompts) => {
  const results = [];
  
  for (const prompt of prompts) {
    try {
      const response = await generateWithRunway({
        prompt: prompt,
        params: { quality: "high" }
      });
      
      results.push({
        prompt: prompt,
        success: true,
        id: response.id
      });
      
      // Pausa entre requisições para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        prompt: prompt,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};
```

## 📝 **Melhores Práticas**

### **Prompts Eficazes:**
- Use descrições específicas e detalhadas
- Inclua informações sobre iluminação e estilo
- Mencione qualidade desejada (4K, photorealistic, etc.)
- Evite prompts muito longos ou confusos

### **Exemplos de Prompts:**
```javascript
// Bom prompt
"Modern living room with white sofa, glass coffee table, natural lighting, minimalist decor, 4K quality, photorealistic"

// Prompt básico
"living room"

// Prompt para vídeo
"Gentle camera pan revealing the spacious modern kitchen with marble countertops"
```

### **Gerenciamento de Recursos:**
- Monitore uso de créditos
- Implemente retry logic para falhas temporárias
- Use rate limiting para evitar sobrecarga
- Armazene resultados para evitar regeneração

## 🔗 **Recursos Relacionados**

- [Runway ML API Documentation](https://docs.runwayml.com/)
- [Runway ML SDK](https://www.npmjs.com/package/@runwayml/sdk)
- [Runway API Routes](./RUNWAY_API.md)

## ⚙️ **Limitações**

- **Créditos**: Cada geração consome créditos
- **Tempo**: Gerações podem levar vários minutos
- **Qualidade**: Resultados dependem da qualidade do prompt
- **Rate Limits**: Limitação de requisições por minuto
- **Formatos**: Verificar formatos suportados de input/output
