# 📊 Sistema de Polling ShotStack - Documentação

## Visão Geral

O sistema de polling permite monitorar o status de renderização em tempo real, fornecendo feedback contínuo ao usuário sobre o progresso da renderização de vídeos.

## 🔧 Funcionalidades Implementadas

### 1. **Server-Sent Events (SSE)** - Tempo Real
- Conexão persistente com o servidor
- Atualizações automáticas a cada 3 segundos
- Baixa latência e uso eficiente de recursos
- Encerramento automático quando concluído

### 2. **Polling Manual** - Backup Robusto
- Requisições HTTP periódicas
- Compatível com todos os navegadores
- Fallback automático quando SSE falha
- Configurável (intervalo e timeout)

### 3. **Polling Inteligente** - Melhor dos Dois
- Tenta SSE primeiro
- Fallback automático para polling manual
- Transparente para o desenvolvedor

### 4. **Interface Visual** - Experiência do Usuário
- Cards de status em tempo real
- Barras de progresso animadas
- Estimativa de tempo restante
- Controles para parar renderização

## 🚀 Endpoints da API

### Status Simples
```
GET /api/shotstack/status/:id
```
**Resposta:**
```json
{
    "success": true,
    "id": "render-12345",
    "status": "rendering",
    "progress": 60,
    "progressText": "Renderizando vídeo",
    "estimatedTime": "30 segundos - 2 minutos",
    "url": null
}
```

### Server-Sent Events
```
GET /api/shotstack/status-stream/:id
```
**Stream de dados:**
```
data: {"type":"connected","message":"Conexão estabelecida"}

data: {"type":"status","status":"fetching","progress":25,"progressText":"Baixando arquivos de mídia","timestamp":"2025-01-10T10:30:00Z"}

data: {"type":"complete","finalStatus":"done","url":"https://shotstack.s3.amazonaws.com/video.mp4"}
```

### Polling com Timeout
```
GET /api/shotstack/poll/:id?timeout=300000&interval=5000
```
**Resposta (quando concluído):**
```json
{
    "success": true,
    "completed": true,
    "duration": 45000,
    "status": "done",
    "url": "https://shotstack.s3.amazonaws.com/video.mp4"
}
```

## 📱 Como Usar no Frontend

### Opção 1: Sistema Completo (Recomendado)

```javascript
// Importar o sistema de polling
import { ShotstackPolling, ShotstackStatusUI } from './shotstack-polling.js';

// Configurar polling
const polling = new ShotstackPolling({
    baseUrl: '/api',
    interval: 3000,
    onProgress: (renderId, progress) => {
        console.log(`${progress.progress}% - ${progress.progressText}`);
    },
    onComplete: (renderId, url) => {
        console.log('Vídeo pronto:', url);
    },
    onError: (renderId, error) => {
        console.error('Erro:', error);
    }
});

// Configurar UI
const statusUI = new ShotstackStatusUI('status-container', polling);

// Iniciar monitoramento
async function renderizarVideo() {
    const response = await fetch('/api/shotstack/render', {
        method: 'POST',
        body: JSON.stringify({ timeline, output })
    });
    
    const result = await response.json();
    
    if (result.success) {
        // Adicionar à UI
        statusUI.addRender(result.renderId);
        
        // Iniciar polling
        const videoUrl = await polling.startSmartPolling(result.renderId);
        console.log('Finalizado:', videoUrl);
    }
}
```

### Opção 2: Polling Simples

```javascript
import { pollingInteligente } from './polling-simples.js';

async function monitorarRenderizacao(renderId) {
    try {
        const videoUrl = await pollingInteligente(renderId);
        console.log('Vídeo pronto:', videoUrl);
    } catch (error) {
        console.error('Erro:', error);
    }
}
```

### Opção 3: Apenas SSE

```javascript
function monitorarViaSSE(renderId) {
    const eventSource = new EventSource(`/api/shotstack/status-stream/${renderId}`);
    
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status') {
            console.log(`${data.progress}% - ${data.progressText}`);
            updateProgressBar(data.progress);
        } else if (data.type === 'complete') {
            console.log('Concluído:', data.url);
            eventSource.close();
        }
    };
}
```

## 🎨 Estados de Renderização

| Status | Progresso | Descrição | Tempo Estimado |
|--------|-----------|-----------|----------------|
| `queued` | 10% | Na fila de processamento | 2-5 minutos |
| `fetching` | 25% | Baixando arquivos de mídia | 1-3 minutos |
| `rendering` | 60% | Renderizando vídeo | 30s - 2 minutos |
| `saving` | 85% | Salvando arquivo final | 10-30 segundos |
| `done` | 100% | Renderização concluída | Finalizado |
| `failed` | 0% | Renderização falhou | Falha |

## 🔧 Configurações Avançadas

### Personalizar Intervalos
```javascript
const polling = new ShotstackPolling({
    interval: 2000,        // 2 segundos (mais rápido)
    timeout: 600000,       // 10 minutos (mais tempo)
    onProgress: (id, progress) => {
        // Callback customizado
    }
});
```

### Múltiplas Renderizações
```javascript
// Monitorar várias renderizações simultaneamente
const renderIds = ['render-1', 'render-2', 'render-3'];

renderIds.forEach(async (renderId) => {
    statusUI.addRender(renderId);
    
    try {
        const url = await polling.startSmartPolling(renderId);
        console.log(`${renderId} finalizado:`, url);
    } catch (error) {
        console.error(`${renderId} falhou:`, error);
    }
});
```

### Controles Manuais
```javascript
// Parar monitoramento específico
polling.stopPolling('render-12345');

// Parar todos os monitoramentos
polling.stopAllPolling();

// Verificar status manual
const response = await fetch('/api/shotstack/status/render-12345');
const status = await response.json();
```

## 🎯 Integração com Formulários HTML

### HTML Base
```html
<div id="render-form">
    <!-- Seus campos de formulário -->
    <button onclick="iniciarRenderizacao()">Renderizar</button>
</div>

<div id="status-container">
    <!-- Status será inserido aqui automaticamente -->
</div>
```

### JavaScript de Integração
```javascript
async function iniciarRenderizacao() {
    const formData = coletarDadosFormulario();
    
    // Renderizar
    const response = await fetch('/api/shotstack/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
        // Adicionar ao monitoramento
        statusUI.addRender(result.renderId);
        
        // Iniciar polling
        const videoUrl = await polling.startSmartPolling(result.renderId);
        
        // Mostrar resultado
        mostrarVideoFinalizado(videoUrl);
    }
}
```

## 🐛 Tratamento de Erros

### Tipos de Erro
1. **Erro de Conexão**: Falha na rede
2. **Erro de Autenticação**: API key inválida
3. **Erro de Renderização**: Falha no processamento
4. **Timeout**: Renderização muito longa
5. **Asset não encontrado**: URL inválida

### Exemplo de Tratamento
```javascript
const polling = new ShotstackPolling({
    onError: (renderId, error) => {
        console.error(`Erro em ${renderId}:`, error);
        
        switch (error.message) {
            case 'Timeout SSE':
                // Tentar polling manual
                polling.startManualPolling(renderId);
                break;
                
            case 'Renderização falhou':
                // Mostrar erro para usuário
                alert('Falha na renderização. Verifique os arquivos enviados.');
                break;
                
            case 'Asset não encontrado':
                // URLs inválidas
                alert('Alguns arquivos não foram encontrados. Verifique as URLs.');
                break;
                
            default:
                // Erro genérico
                alert(`Erro: ${error.message}`);
        }
    }
});
```

## 📊 Monitoramento e Debug

### Logs Detalhados
```javascript
// Ativar logs detalhados
const polling = new ShotstackPolling({
    debug: true,  // Ativa logs extras
    onProgress: (renderId, progress) => {
        console.log(`[${new Date().toLocaleTimeString()}] ${renderId}: ${progress.progressText}`);
    }
});
```

### Verificar Estado
```javascript
// Renderizações ativas
const ativas = polling.getActivePolls();
console.log('Renderizações ativas:', ativas);

// Estado de uma renderização específica
const isActive = polling.isPollingActive('render-12345');
console.log('Está ativa:', isActive);
```

### Estatísticas
```javascript
// Tempo total de renderização
const startTime = Date.now();

polling.onComplete = (renderId, url) => {
    const duration = Date.now() - startTime;
    console.log(`Renderização levou ${duration/1000} segundos`);
};
```

## 🚀 Performance e Otimização

### Boas Práticas
1. **Use SSE** quando possível (mais eficiente)
2. **Configure timeouts** apropriados para seu caso
3. **Pare pollings** desnecessários
4. **Monitore** apenas renderizações ativas
5. **Implemente retry** logic para casos especiais

### Configuração Otimizada
```javascript
const polling = new ShotstackPolling({
    interval: 3000,      // Não muito rápido (economiza recursos)
    timeout: 300000,     // 5 minutos (suficiente para maioria)
    maxRetries: 3,       // Retry em caso de erro
    retryDelay: 5000     // Aguarda 5s antes de retry
});
```

## 🔐 Segurança

### Validação no Backend
```javascript
// Validar ID de renderização
router.get("/shotstack/status/:id", async (req, res) => {
    const { id } = req.params;
    
    // Validar formato do ID
    if (!/^[a-zA-Z0-9\-]{8,50}$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: "ID de renderização inválido"
        });
    }
    
    // Continuar processamento...
});
```

### Rate Limiting
```javascript
// Limitar número de requisições por IP
const rateLimit = require('express-rate-limit');

const statusLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 20,             // 20 requisições por minuto
    message: 'Muitas requisições de status'
});

router.get("/shotstack/status/:id", statusLimiter, async (req, res) => {
    // Lógica da rota...
});
```

## 📱 Responsividade Mobile

O sistema é totalmente responsivo e funciona em dispositivos móveis. A interface se adapta automaticamente ao tamanho da tela.

### CSS Mobile-First
```css
.render-item {
    padding: 10px;          /* Mobile */
}

@media (min-width: 768px) {
    .render-item {
        padding: 15px;      /* Desktop */
    }
}
```

---

**✅ Sistema de polling completo e pronto para produção!**

Com essas funcionalidades, o usuário terá feedback visual em tempo real sobre o status de todas as renderizações ativas.
