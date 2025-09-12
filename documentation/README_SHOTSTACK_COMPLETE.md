# 🎬 ShotStack Integration - Resumo Executivo

## Visão Geral

Implementação completa para edição de vídeos usando múltiplos vídeos e áudios através da API do ShotStack. O sistema permite que o front-end envie vários vídeos com suas respectivas narrações e receba um vídeo editado profissional.

## ✅ O que foi implementado

### Backend
- **Conector ShotStack** (`src/connectors/shotstack.js`)
- **Rotas REST** (`src/routes/sendShotStack.js`)
- **Validação de timeline**
- **Monitoramento de status**
- **Renderização síncrona e assíncrona**

### Frontend
- **Exemplos JavaScript** com diferentes cenários
- **Interface HTML** completa e responsiva
- **Classe VideoBuilder** para facilitar uso
- **Validação de dados**
- **Monitoramento de progresso**

### Documentação
- **Guia completo da API**
- **Documentação do conector**
- **Guia de upload de arquivos**
- **Exemplos práticos**

## 🚀 Como usar

### 1. Chamada Básica (URLs públicas)

```javascript
const timeline = {
    tracks: [
        {
            clips: [
                {
                    asset: { type: "video", src: "https://exemplo.com/video1.mp4" },
                    start: 0,
                    length: 10
                },
                {
                    asset: { type: "video", src: "https://exemplo.com/video2.mp4" },
                    start: 10,
                    length: 15
                }
            ]
        },
        {
            clips: [
                {
                    asset: { type: "audio", src: "https://exemplo.com/audio1.mp3" },
                    start: 0,
                    length: 10,
                    volume: 0.8
                }
            ]
        }
    ]
};

const response = await fetch('/api/shotstack/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        timeline,
        output: { format: "mp4", resolution: "hd" }
    })
});
```

### 2. Interface HTML Pronta

Use o arquivo `examples/video-editor-frontend.html` que inclui:
- ✅ Formulário para múltiplos vídeos e áudios
- ✅ Configurações de qualidade e formato
- ✅ Monitoramento de progresso
- ✅ Preview do resultado
- ✅ Validação de dados

### 3. Classe JavaScript Facilitadora

```javascript
import { VideoBuilder } from './examples/frontend-multiple-videos-example.js';

const builder = new VideoBuilder();

const resultado = await builder
    .adicionarVideoComAudio("url-video1.mp4", "url-audio1.mp3", 10)
    .adicionarVideoComAudio("url-video2.mp4", "url-audio2.mp3", 15)
    .adicionarMusicaDeFundo("url-musica.mp3")
    .renderizar({ resolution: "hd" });
```

## 📋 Requisitos dos Arquivos

### ⚠️ IMPORTANTE: URLs Públicas Obrigatórias

O ShotStack **NÃO aceita uploads diretos**. Os arquivos devem estar em URLs públicas:

✅ **Funciona:**
- AWS S3 com acesso público
- Google Cloud Storage público
- CDNs (CloudFlare, etc.)
- URLs diretas de servidores web

❌ **Não funciona:**
- Arquivos locais (`file://`)
- URLs privadas que precisam de autenticação
- Dados em Base64

### Soluções para arquivos locais:

1. **Upload para storage próprio** (recomendado)
2. **ShotStack Ingest API** (via backend)
3. **Servidor temporário** para desenvolvimento

## 🔧 Configuração do Backend

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# .env
SHOTSTACK_API_KEY=your_api_key_here
SHOTSTACK_API_URL=https://api.shotstack.io/edit/stage  # ou production
```

### 3. Importar rotas no app principal
```javascript
import shotStackRoutes from './src/routes/sendShotStack.js';
app.use('/api', shotStackRoutes);
```

## 📚 Arquivos de Referência

### Arquivos de Referência

### Essenciais
- `src/connectors/shotstack.js` - Conector principal
- `src/routes/sendShotStack.js` - Rotas da API
- `examples/exemplo-chamada-frontend.js` - Exemplo completo

### Interface e Polling
- `examples/video-editor-frontend.html` - Interface completa com polling
- `examples/shotstack-polling.js` - Sistema de polling avançado
- `examples/polling-simples.js` - Polling básico e minimalista
- `examples/frontend-multiple-videos-example.js` - Classe facilitadora

### Documentação
- `SHOTSTACK_ENHANCED_API.md` - Documentação da API
- `SHOTSTACK_CONNECTOR.md` - Documentação do conector
- `FRONTEND_UPLOAD_GUIDE.md` - Guia de upload
- `POLLING_DOCUMENTATION.md` - Documentação completa do polling

## 🎯 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/shotstack/render` | POST | Renderização assíncrona |
| `/api/shotstack/render-sync` | POST | Renderização síncrona |
| `/api/shotstack/status/:id` | GET | Status da renderização |
| `/api/shotstack/status-stream/:id` | GET | Status em tempo real (SSE) |
| `/api/shotstack/poll/:id` | GET | Polling com timeout configurável |
| `/api/shotstack/slideshow` | POST | Criar slideshow de imagens |
| `/api/shotstack/templates` | GET | Listar templates |

## 📊 Sistema de Polling em Tempo Real

### Funcionalidades de Monitoramento
- ✅ **Server-Sent Events (SSE)** para atualizações em tempo real
- ✅ **Polling manual** como fallback
- ✅ **Interface visual** com barras de progresso
- ✅ **Estimativa de tempo** restante
- ✅ **Controles** para parar renderização
- ✅ **Múltiplas renderizações** simultâneas

### Como Usar o Polling

#### Opção 1: Sistema Completo (Recomendado)
```javascript
import { ShotstackPolling, ShotstackStatusUI } from './examples/shotstack-polling.js';

// Configurar polling
const polling = new ShotstackPolling({
    onProgress: (id, progress) => console.log(`${progress.progress}% - ${progress.progressText}`),
    onComplete: (id, url) => console.log('Finalizado:', url),
    onError: (id, error) => console.error('Erro:', error)
});

// Configurar interface
const statusUI = new ShotstackStatusUI('status-container', polling);

// Usar
const result = await fetch('/api/shotstack/render', { /* dados */ });
const { renderId } = await result.json();

statusUI.addRender(renderId);
const videoUrl = await polling.startSmartPolling(renderId);
```

#### Opção 2: Polling Simples
```javascript
import { pollingInteligente } from './examples/polling-simples.js';

const videoUrl = await pollingInteligente(renderId);
```

#### Opção 3: Server-Sent Events Direto
```javascript
const eventSource = new EventSource(`/api/shotstack/status-stream/${renderId}`);
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'status') {
        console.log(`${data.progress}% - ${data.progressText}`);
    }
};
```

## 🔍 Exemplo de Timeline Completa

```javascript
{
    "tracks": [
        {
            // Track 0: Vídeos principais
            "clips": [
                {
                    "asset": { "type": "video", "src": "https://exemplo.com/video1.mp4" },
                    "start": 0,
                    "length": 10
                },
                {
                    "asset": { "type": "video", "src": "https://exemplo.com/video2.mp4" },
                    "start": 10,
                    "length": 15
                }
            ]
        },
        {
            // Track 1: Narração do primeiro vídeo
            "clips": [
                {
                    "asset": { "type": "audio", "src": "https://exemplo.com/narracao1.mp3" },
                    "start": 0,
                    "length": 10,
                    "volume": 0.8
                }
            ]
        },
        {
            // Track 2: Narração do segundo vídeo
            "clips": [
                {
                    "asset": { "type": "audio", "src": "https://exemplo.com/narracao2.mp3" },
                    "start": 10,
                    "length": 15,
                    "volume": 0.8
                }
            ]
        },
        {
            // Track 3: Música de fundo
            "clips": [
                {
                    "asset": { "type": "audio", "src": "https://exemplo.com/musica.mp3" },
                    "start": 0,
                    "length": 25,
                    "volume": 0.3
                }
            ]
        }
    ]
}
```

## 🚦 Status de Renderização

| Status | Descrição |
|--------|-----------|
| `queued` | Na fila de processamento |
| `fetching` | Baixando assets |
| `rendering` | Renderizando vídeo |
| `done` | Concluído com sucesso |
| `failed` | Falha na renderização |

## 💡 Dicas Importantes

1. **Performance**: Use renderização assíncrona para vídeos longos
2. **Timeout**: Renderizações podem levar 1-5 minutos
3. **Validação**: Sempre valide URLs antes de enviar
4. **Volumes**: Mantenha narração em 0.7-0.9 e música de fundo em 0.2-0.4
5. **Formato**: MP4 + HD é a combinação mais compatível

## 🆘 Troubleshooting

### Erro: "Timeline inválida"
- Verifique se há pelo menos uma track com clips
- Confirme que todas as URLs são válidas e públicas

### Erro: "Asset não encontrado"
- Teste as URLs diretamente no navegador
- Verifique se os arquivos são publicamente acessíveis

### Renderização falha
- Verifique logs do ShotStack no dashboard
- Confirme que a API key está correta
- Teste com assets de exemplo primeiro

### Timeout
- Vídeos longos podem demorar mais
- Implemente retry logic se necessário
- Use resolução menor para testes

## 📞 Próximos Passos

1. **Testar** com os exemplos fornecidos
2. **Adaptar** a interface conforme necessário
3. **Implementar** upload de arquivos se necessário
4. **Monitorar** performance e custos
5. **Escalar** conforme demanda

---

**✅ Sistema pronto para produção!** 

Use os exemplos como base e adapte conforme suas necessidades específicas.
