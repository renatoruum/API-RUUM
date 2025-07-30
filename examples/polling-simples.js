/**
 * EXEMPLO SIMPLES DE POLLING SHOTSTACK
 * ====================================
 * 
 * Este exemplo mostra como implementar polling de forma simples,
 * sem usar a interface completa, apenas para monitorar o status.
 */

// ============================================================================
// EXEMPLO 1: Polling Manual Simples
// ============================================================================

async function pollingSimples(renderId) {
    console.log('🚀 Iniciando polling simples para', renderId);
    
    const INTERVAL = 3000; // 3 segundos
    const MAX_TIME = 300000; // 5 minutos
    const startTime = Date.now();
    
    const poll = async () => {
        try {
            // Verificar timeout
            if (Date.now() - startTime > MAX_TIME) {
                console.error('⏰ Timeout: renderização não concluída');
                return null;
            }
            
            // Fazer requisição
            const response = await fetch(`/api/shotstack/status/${renderId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            console.log(`📊 ${data.status.toUpperCase()}: ${data.progressText} (${data.progress}%)`);
            
            // Verificar se concluído
            if (data.status === 'done') {
                console.log('✅ Concluído!', data.url);
                return data.url;
            }
            
            if (data.status === 'failed') {
                console.error('❌ Falhou');
                return null;
            }
            
            // Continuar polling
            setTimeout(poll, INTERVAL);
            
        } catch (error) {
            console.error('❌ Erro no polling:', error);
            return null;
        }
    };
    
    return poll();
}

// ============================================================================
// EXEMPLO 2: Polling com Server-Sent Events
// ============================================================================

function pollingSSE(renderId) {
    return new Promise((resolve, reject) => {
        console.log('📡 Iniciando SSE para', renderId);
        
        const eventSource = new EventSource(`/api/shotstack/status-stream/${renderId}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'connected':
                        console.log('📡 Conectado ao SSE');
                        break;
                        
                    case 'status':
                        console.log(`📊 ${data.status.toUpperCase()}: ${data.progressText} (${data.progress}%)`);
                        break;
                        
                    case 'complete':
                        console.log('✅ Concluído via SSE!', data.url);
                        eventSource.close();
                        resolve(data.url);
                        break;
                        
                    case 'error':
                        console.error('❌ Erro SSE:', data.message);
                        eventSource.close();
                        reject(new Error(data.message));
                        break;
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar SSE:', error);
                eventSource.close();
                reject(error);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error('❌ Erro na conexão SSE:', error);
            eventSource.close();
            reject(error);
        };
        
        // Timeout de segurança
        setTimeout(() => {
            if (eventSource.readyState !== EventSource.CLOSED) {
                eventSource.close();
                reject(new Error('Timeout SSE'));
            }
        }, 300000); // 5 minutos
    });
}

// ============================================================================
// EXEMPLO 3: Polling Inteligente (SSE com fallback)
// ============================================================================

async function pollingInteligente(renderId) {
    console.log('🧠 Iniciando polling inteligente para', renderId);
    
    // Tentar SSE primeiro
    if (typeof EventSource !== 'undefined') {
        try {
            console.log('📡 Tentando SSE...');
            return await pollingSSE(renderId);
        } catch (error) {
            console.warn('⚠️ SSE falhou, fallback para polling manual:', error.message);
        }
    }
    
    // Fallback para polling manual
    console.log('📊 Usando polling manual');
    return await pollingSimples(renderId);
}

// ============================================================================
// EXEMPLO 4: Interface Minimalista com Callback
// ============================================================================

class MiniPolling {
    constructor(options = {}) {
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onError = options.onError || (() => {});
    }
    
    async start(renderId) {
        try {
            if (typeof EventSource !== 'undefined') {
                return await this.startSSE(renderId);
            } else {
                return await this.startManual(renderId);
            }
        } catch (error) {
            this.onError(renderId, error);
            throw error;
        }
    }
    
    startSSE(renderId) {
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(`/api/shotstack/status-stream/${renderId}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'status') {
                    this.onProgress(renderId, {
                        status: data.status,
                        progress: data.progress,
                        text: data.progressText
                    });
                } else if (data.type === 'complete') {
                    eventSource.close();
                    this.onComplete(renderId, data.url);
                    resolve(data.url);
                } else if (data.type === 'error') {
                    eventSource.close();
                    this.onError(renderId, new Error(data.message));
                    reject(new Error(data.message));
                }
            };
            
            eventSource.onerror = (error) => {
                eventSource.close();
                reject(error);
            };
        });
    }
    
    async startManual(renderId) {
        const poll = async () => {
            const response = await fetch(`/api/shotstack/status/${renderId}`);
            const data = await response.json();
            
            this.onProgress(renderId, {
                status: data.status,
                progress: data.progress,
                text: data.progressText
            });
            
            if (data.status === 'done') {
                this.onComplete(renderId, data.url);
                return data.url;
            }
            
            if (data.status === 'failed') {
                throw new Error('Renderização falhou');
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            return poll();
        };
        
        return poll();
    }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

// Uso básico
async function exemploBasico() {
    const renderId = 'render-12345'; // ID obtido da renderização
    
    try {
        const videoUrl = await pollingInteligente(renderId);
        console.log('🎉 Vídeo pronto:', videoUrl);
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

// Uso com callbacks
function exemploComCallbacks() {
    const polling = new MiniPolling({
        onProgress: (renderId, progress) => {
            console.log(`📈 ${renderId}: ${progress.progress}% - ${progress.text}`);
            
            // Atualizar UI
            const progressBar = document.getElementById('progress');
            if (progressBar) {
                progressBar.style.width = `${progress.progress}%`;
                progressBar.textContent = progress.text;
            }
        },
        
        onComplete: (renderId, url) => {
            console.log(`✅ ${renderId} concluído:`, url);
            
            // Mostrar vídeo na página
            const video = document.getElementById('resultado');
            if (video) {
                video.src = url;
                video.style.display = 'block';
            }
        },
        
        onError: (renderId, error) => {
            console.error(`❌ ${renderId} erro:`, error);
            alert(`Erro na renderização: ${error.message}`);
        }
    });
    
    // Iniciar monitoramento
    const renderId = 'render-12345';
    polling.start(renderId);
}

// Uso em formulário HTML
function conectarFormulario() {
    const form = document.getElementById('render-form');
    const statusDiv = document.getElementById('status');
    
    if (!form || !statusDiv) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // 1. Enviar dados para renderização
            const formData = new FormData(form);
            const timeline = criarTimelineDoFormulario(formData);
            
            const response = await fetch('/api/shotstack/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeline, output: { format: 'mp4' } })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            // 2. Mostrar status inicial
            statusDiv.innerHTML = `
                <div class="alert alert-info">
                    <strong>Renderização iniciada:</strong> ${result.renderId}
                    <div class="progress-container">
                        <div id="progress-bar" class="progress-bar" style="width: 0%">0%</div>
                        <div id="progress-text">Iniciando...</div>
                    </div>
                </div>
            `;
            
            // 3. Iniciar polling
            const polling = new MiniPolling({
                onProgress: (renderId, progress) => {
                    const progressBar = document.getElementById('progress-bar');
                    const progressText = document.getElementById('progress-text');
                    
                    if (progressBar) {
                        progressBar.style.width = `${progress.progress}%`;
                        progressBar.textContent = `${progress.progress}%`;
                    }
                    
                    if (progressText) {
                        progressText.textContent = progress.text;
                    }
                },
                
                onComplete: (renderId, url) => {
                    statusDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>✅ Renderização concluída!</strong><br>
                            <a href="${url}" target="_blank" class="btn btn-primary">📥 Baixar Vídeo</a>
                            <video src="${url}" controls style="width: 100%; margin-top: 10px;"></video>
                        </div>
                    `;
                },
                
                onError: (renderId, error) => {
                    statusDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>❌ Erro na renderização:</strong> ${error.message}
                        </div>
                    `;
                }
            });
            
            await polling.start(result.renderId);
            
        } catch (error) {
            statusDiv.innerHTML = `
                <div class="alert alert-danger">
                    <strong>❌ Erro:</strong> ${error.message}
                </div>
            `;
        }
    });
}

// Função auxiliar para criar timeline do formulário
function criarTimelineDoFormulario(formData) {
    // Implementar conforme estrutura do seu formulário
    return {
        tracks: [
            {
                clips: [
                    {
                        asset: {
                            type: "video",
                            src: formData.get('video-url')
                        },
                        start: 0,
                        length: parseInt(formData.get('video-duration'))
                    }
                ]
            }
        ]
    };
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Para usar em páginas HTML
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        conectarFormulario();
        
        // Tornar funções disponíveis globalmente
        window.pollingSimples = pollingSimples;
        window.pollingSSE = pollingSSE;
        window.pollingInteligente = pollingInteligente;
        window.MiniPolling = MiniPolling;
    });
}

// Export para uso em módulos
export {
    pollingSimples,
    pollingSSE,
    pollingInteligente,
    MiniPolling
};
