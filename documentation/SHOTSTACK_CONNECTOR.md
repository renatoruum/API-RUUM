# 🎬 ShotStack Connector - Documentation

## 📋 **Visão Geral**

O conector ShotStack fornece uma interface completa para a API do ShotStack, permitindo renderização de vídeos profissionais, monitoramento de status e criação de templates personalizados. Suporta operações síncronas e assíncronas.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
SHOTSTACK_API_KEY=sua_chave_aqui
```

### **Importação:**
```javascript
import { 
    startRender, 
    checkRenderStatus, 
    waitForRenderCompletion, 
    renderVideo, 
    createImageSlideshow,
    validateTimeline 
} from "../connectors/shotstack.js";
```

## 🛠️ **Funções Disponíveis**

### **1. startRender(timeline, output)**
Inicia uma renderização no ShotStack.

**Parâmetros:**
- `timeline` (object, obrigatório): Configuração da timeline
- `output` (object, opcional): Configurações de saída

**Exemplo:**
```javascript
const result = await startRender({
    tracks: [{
        clips: [{
            asset: {
                type: "image",
                src: "https://example.com/image.jpg"
            },
            start: 0,
            length: 5,
            effect: "zoomIn"
        }]
    }]
}, {
    format: "mp4",
    resolution: "hd"
});

console.log("Renderização iniciada:", result.id);
```

### **2. checkRenderStatus(renderId)**
Verifica o status de uma renderização.

**Parâmetros:**
- `renderId` (string, obrigatório): ID da renderização

**Exemplo:**
```javascript
const status = await checkRenderStatus("render-id-123");
console.log("Status:", status.data.status);
console.log("URL:", status.data.url); // disponível quando status = "done"
```

### **3. waitForRenderCompletion(renderId, maxAttempts, intervalMs)**
Aguarda a conclusão de uma renderização com polling.

**Parâmetros:**
- `renderId` (string, obrigatório): ID da renderização
- `maxAttempts` (number, opcional): Máximo de tentativas (padrão: 60)
- `intervalMs` (number, opcional): Intervalo entre verificações (padrão: 5000ms)

**Exemplo:**
```javascript
const result = await waitForRenderCompletion("render-id-123", 60, 5000);
console.log("Vídeo pronto:", result.url);
```

### **4. renderVideo(timeline, output, waitForCompletion)**
Renderiza um vídeo completo com opção de aguardar conclusão.

**Parâmetros:**
- `timeline` (object, obrigatório): Configuração da timeline
- `output` (object, opcional): Configurações de saída
- `waitForCompletion` (boolean, opcional): Aguardar conclusão (padrão: true)

**Exemplo:**
```javascript
// Modo síncrono (aguarda conclusão)
const result = await renderVideo(timeline, output, true);
console.log("Vídeo finalizado:", result.url);

// Modo assíncrono (retorna ID imediatamente)
const result = await renderVideo(timeline, output, false);
console.log("Renderização iniciada:", result.id);
```

### **5. createImageSlideshow(images, duration, options)**
Cria uma timeline para slideshow de imagens.

**Parâmetros:**
- `images` (array, obrigatório): URLs das imagens
- `duration` (number, opcional): Duração por imagem (padrão: 3s)
- `options` (object, opcional): Opções adicionais

**Exemplo:**
```javascript
const timeline = createImageSlideshow([
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
], 4, {
    soundtrack: 'https://example.com/music.mp3',
    transition: 'fade',
    textOverlay: {
        text: 'Minha Propriedade',
        style: 'future',
        color: '#ffffff',
        size: 'large',
        start: 0,
        length: 3,
        position: 'center'
    }
});

const result = await renderVideo(timeline);
```

### **6. validateTimeline(timeline)**
Valida uma configuração de timeline.

**Parâmetros:**
- `timeline` (object, obrigatório): Timeline para validar

**Exemplo:**
```javascript
const isValid = validateTimeline({
    tracks: [{
        clips: [{
            asset: { type: "image", src: "https://example.com/image.jpg" },
            start: 0,
            length: 3
        }]
    }]
});

if (isValid) {
    console.log("Timeline válida");
} else {
    console.log("Timeline inválida");
}
```

## 📊 **Configurações de Saída**

### **Formatos Suportados:**
- `mp4` - Vídeo MP4 (padrão)
- `webm` - Vídeo WebM
- `gif` - GIF animado
- `mp3` - Áudio MP3

### **Resoluções Disponíveis:**
- `preview` - 512x288
- `mobile` - 640x360
- `sd` - 1024x576
- `hd` - 1280x720 (padrão)
- `fhd` - 1920x1080

### **Configuração Padrão:**
```javascript
const defaultOutput = {
    format: "mp4",
    resolution: "hd",
    aspectRatio: "16:9",
    fps: 30
};
```

## 🎨 **Assets Suportados**

### **Imagens:**
```javascript
{
    type: "image",
    src: "https://example.com/image.jpg"
}
```

### **Vídeos:**
```javascript
{
    type: "video",
    src: "https://example.com/video.mp4",
    trim: 5 // opcional: cortar primeiros 5 segundos
}
```

### **Títulos/Texto:**
```javascript
{
    type: "title",
    text: "Título do Vídeo",
    style: "future", // future, minimal, blockbuster, vogue, sketch
    color: "#ffffff",
    size: "large" // small, medium, large
}
```

### **Áudio:**
```javascript
{
    type: "audio",
    src: "https://example.com/audio.mp3",
    effect: "fadeIn" // fadeIn, fadeOut
}
```

## 🔄 **Status das Renderizações**

### **Estados Possíveis:**
- `queued` - Na fila de processamento
- `fetching` - Baixando recursos
- `rendering` - Renderizando vídeo
- `saving` - Salvando arquivo
- `done` - Concluído
- `failed` - Falhou

### **Exemplo de Monitoramento:**
```javascript
const monitorRender = async (renderId) => {
    const statusMap = {
        'queued': 'Na fila...',
        'fetching': 'Baixando recursos...',
        'rendering': 'Renderizando...',
        'saving': 'Salvando...',
        'done': 'Concluído!'
    };
    
    try {
        const result = await waitForRenderCompletion(renderId);
        console.log("Vídeo pronto:", result.url);
        return result.url;
    } catch (error) {
        console.error("Erro na renderização:", error.message);
        throw error;
    }
};
```

## ⚠️ **Tratamento de Erros**

### **Erros Comuns:**
- **Timeline obrigatória**: Falta configuração de timeline
- **ID obrigatório**: Falta ID da renderização
- **Timeout**: Renderização demorou muito para concluir
- **Renderização falhou**: Erro durante o processamento

### **Exemplo de Tratamento:**
```javascript
try {
    const result = await renderVideo(timeline, output, true);
    console.log("Sucesso:", result.url);
} catch (error) {
    if (error.message.includes('Timeout')) {
        console.error('Renderização demorou muito:', error.message);
    } else if (error.message.includes('falhou')) {
        console.error('Erro na renderização:', error.message);
    } else {
        console.error('Erro geral:', error.message);
    }
}
```

## 🚀 **Exemplos Práticos**

### **Slideshow Básico:**
```javascript
const createBasicSlideshow = async () => {
    const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
    ];
    
    const timeline = createImageSlideshow(images, 3, {
        transition: 'fade'
    });
    
    const videoUrl = await renderVideo(timeline);
    console.log('Slideshow criado:', videoUrl);
};
```

### **Vídeo com Texto:**
```javascript
const createVideoWithText = async () => {
    const timeline = {
        tracks: [
            {
                clips: [{
                    asset: {
                        type: "image",
                        src: "https://example.com/background.jpg"
                    },
                    start: 0,
                    length: 10,
                    effect: "zoomIn"
                }]
            },
            {
                clips: [{
                    asset: {
                        type: "title",
                        text: "Apartamento Moderno",
                        style: "future",
                        color: "#ffffff",
                        size: "large"
                    },
                    start: 1,
                    length: 8,
                    position: "center"
                }]
            }
        ]
    };
    
    const videoUrl = await renderVideo(timeline, {
        format: "mp4",
        resolution: "hd"
    });
    
    console.log('Vídeo com texto criado:', videoUrl);
};
```

### **Renderização com Monitoramento:**
```javascript
const renderWithProgress = async (timeline) => {
    try {
        // Iniciar renderização
        const startResult = await startRender(timeline);
        console.log('Renderização iniciada:', startResult.id);
        
        // Monitorar progresso
        const result = await waitForRenderCompletion(startResult.id, 60, 3000);
        console.log('Renderização concluída:', result.url);
        
        return result.url;
    } catch (error) {
        console.error('Erro na renderização:', error.message);
        throw error;
    }
};
```

## 📝 **Melhores Práticas**

### **Performance:**
1. **Otimize imagens**: Use imagens comprimidas
2. **Resolução adequada**: HD para web, FHD apenas se necessário
3. **Duração otimizada**: Vídeos curtos renderizam mais rápido
4. **Cache**: Reutilize vídeos já renderizados

### **Recursos:**
1. **Monitore créditos**: Cada renderização consome créditos
2. **Timeouts apropriados**: Ajuste conforme duração esperada
3. **Retry logic**: Implemente retry para falhas temporárias
4. **Validação**: Sempre valide timeline antes de renderizar

### **Exemplo de Implementação Robusta:**
```javascript
const robustRender = async (timeline, output = {}, maxRetries = 3) => {
    // Validar timeline
    if (!validateTimeline(timeline)) {
        throw new Error('Timeline inválida');
    }
    
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            const result = await renderVideo(timeline, output, true);
            return result.url;
        } catch (error) {
            attempt++;
            
            if (attempt >= maxRetries) {
                throw error;
            }
            
            console.log(`Tentativa ${attempt} falhou, tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};
```

## 🔗 **Recursos Relacionados**

- [ShotStack API Documentation](https://shotstack.io/docs/api/)
- [ShotStack Enhanced API](./SHOTSTACK_ENHANCED_API.md)
- [Timeline Builder](https://shotstack.io/demo/timeline-builder/)
- [Asset Library](https://shotstack.io/docs/assets/)

## ⚙️ **Limitações**

- **Créditos**: Cada renderização consome créditos
- **Tempo limite**: Renderizações podem levar vários minutos
- **Formatos**: Verificar formatos suportados
- **Taxa de requisições**: Limitação de API calls por minuto
- **Tamanho de arquivo**: Limites de tamanho para uploads
