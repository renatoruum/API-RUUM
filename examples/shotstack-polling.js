/**
 * SHOTSTACK POLLING COMPONENT
 * ==========================
 * 
 * Componente JavaScript para monitorar o status de renderização em tempo real
 * com diferentes opções de polling: SSE, manual, e WebSocket simulation.
 */

class ShotstackPolling {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || '/api';
        this.defaultInterval = options.interval || 3000; // 3 segundos
        this.defaultTimeout = options.timeout || 300000; // 5 minutos
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onError = options.onError || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.activePolls = new Map();
        this.eventSources = new Map();
    }

    /**
     * Inicia monitoramento via Server-Sent Events (tempo real)
     * @param {string} renderId - ID da renderização
     * @returns {Promise<string>} URL do vídeo finalizado
     */
    startSSEPolling(renderId) {
        return new Promise((resolve, reject) => {
            // Encerrar polling anterior se existir
            this.stopPolling(renderId);

            const eventSource = new EventSource(`${this.baseUrl}/shotstack/status-stream/${renderId}`);
            this.eventSources.set(renderId, eventSource);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleSSEMessage(renderId, data, resolve, reject);
                } catch (error) {
                    console.error('Erro ao parsear dados SSE:', error);
                    this.onError(renderId, error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Erro na conexão SSE:', error);
                this.stopSSEPolling(renderId);
                this.onError(renderId, new Error('Conexão SSE falhou'));
                reject(error);
            };

            // Timeout de segurança
            setTimeout(() => {
                if (this.eventSources.has(renderId)) {
                    this.stopSSEPolling(renderId);
                    reject(new Error('Timeout do SSE'));
                }
            }, this.defaultTimeout);
        });
    }

    /**
     * Manipula mensagens SSE
     */
    handleSSEMessage(renderId, data, resolve, reject) {
        switch (data.type) {
            case 'connected':
                console.log('📡 Conexão SSE estabelecida para', renderId);
                break;

            case 'status':
                this.onProgress(renderId, {
                    status: data.status,
                    progress: data.progress,
                    progressText: data.progressText,
                    estimatedTime: data.estimatedTime,
                    timestamp: data.timestamp
                });

                this.onStatusChange(renderId, data.status);
                break;

            case 'complete':
                console.log('✅ Renderização concluída via SSE:', renderId);
                this.stopSSEPolling(renderId);
                
                if (data.finalStatus === 'done') {
                    this.onComplete(renderId, data.url);
                    resolve(data.url);
                } else {
                    const error = new Error(`Renderização falhou: ${data.finalStatus}`);
                    this.onError(renderId, error);
                    reject(error);
                }
                break;

            case 'error':
                console.error('❌ Erro SSE:', data.message);
                this.stopSSEPolling(renderId);
                const error = new Error(data.message);
                this.onError(renderId, error);
                reject(error);
                break;
        }
    }

    /**
     * Inicia monitoramento via polling manual
     * @param {string} renderId - ID da renderização
     * @param {Object} options - Opções de configuração
     * @returns {Promise<string>} URL do vídeo finalizado
     */
    startManualPolling(renderId, options = {}) {
        return new Promise((resolve, reject) => {
            // Encerrar polling anterior se existir
            this.stopPolling(renderId);

            const interval = options.interval || this.defaultInterval;
            const timeout = options.timeout || this.defaultTimeout;
            const startTime = Date.now();

            const poll = async () => {
                try {
                    // Verificar timeout
                    if (Date.now() - startTime > timeout) {
                        this.stopManualPolling(renderId);
                        const error = new Error('Timeout: renderização não concluída no tempo esperado');
                        this.onError(renderId, error);
                        reject(error);
                        return;
                    }

                    // Fazer requisição de status
                    const response = await fetch(`${this.baseUrl}/shotstack/status/${renderId}`);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Erro ao verificar status');
                    }

                    // Notificar progresso
                    this.onProgress(renderId, {
                        status: data.status,
                        progress: data.progress,
                        progressText: data.progressText,
                        estimatedTime: data.estimatedTime,
                        timestamp: new Date().toISOString()
                    });

                    this.onStatusChange(renderId, data.status);

                    // Verificar se concluído
                    if (data.status === 'done') {
                        console.log('✅ Renderização concluída via polling:', renderId);
                        this.stopManualPolling(renderId);
                        this.onComplete(renderId, data.url);
                        resolve(data.url);
                        return;
                    }

                    if (data.status === 'failed') {
                        console.error('❌ Renderização falhou:', renderId);
                        this.stopManualPolling(renderId);
                        const error = new Error('Renderização falhou');
                        this.onError(renderId, error);
                        reject(error);
                        return;
                    }

                    // Continuar polling
                    const timeoutId = setTimeout(poll, interval);
                    this.activePolls.set(renderId, timeoutId);

                } catch (error) {
                    console.error('Erro no polling:', error);
                    this.stopManualPolling(renderId);
                    this.onError(renderId, error);
                    reject(error);
                }
            };

            // Iniciar polling
            poll();
        });
    }

    /**
     * Inicia monitoramento com fallback automático (SSE -> Manual)
     * @param {string} renderId - ID da renderização
     * @param {Object} options - Opções de configuração
     * @returns {Promise<string>} URL do vídeo finalizado
     */
    startSmartPolling(renderId, options = {}) {
        console.log('🚀 Iniciando smart polling para', renderId);

        // Tentar SSE primeiro
        if (typeof EventSource !== 'undefined') {
            console.log('📡 Tentando SSE...');
            return this.startSSEPolling(renderId).catch((error) => {
                console.warn('⚠️ SSE falhou, fallback para polling manual:', error.message);
                return this.startManualPolling(renderId, options);
            });
        } else {
            console.log('📊 SSE não suportado, usando polling manual');
            return this.startManualPolling(renderId, options);
        }
    }

    /**
     * Para o polling de um renderização específica
     * @param {string} renderId - ID da renderização
     */
    stopPolling(renderId) {
        this.stopSSEPolling(renderId);
        this.stopManualPolling(renderId);
    }

    /**
     * Para o polling SSE
     */
    stopSSEPolling(renderId) {
        const eventSource = this.eventSources.get(renderId);
        if (eventSource) {
            eventSource.close();
            this.eventSources.delete(renderId);
            console.log('📡 SSE encerrado para', renderId);
        }
    }

    /**
     * Para o polling manual
     */
    stopManualPolling(renderId) {
        const timeoutId = this.activePolls.get(renderId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activePolls.delete(renderId);
            console.log('📊 Polling manual encerrado para', renderId);
        }
    }

    /**
     * Para todos os pollings ativos
     */
    stopAllPolling() {
        // Parar SSE
        for (const [renderId, eventSource] of this.eventSources) {
            eventSource.close();
            console.log('📡 SSE encerrado para', renderId);
        }
        this.eventSources.clear();

        // Parar polling manual
        for (const [renderId, timeoutId] of this.activePolls) {
            clearTimeout(timeoutId);
            console.log('📊 Polling manual encerrado para', renderId);
        }
        this.activePolls.clear();
    }

    /**
     * Verifica se há polling ativo para uma renderização
     * @param {string} renderId - ID da renderização
     * @returns {boolean} Se há polling ativo
     */
    isPollingActive(renderId) {
        return this.eventSources.has(renderId) || this.activePolls.has(renderId);
    }

    /**
     * Lista todas as renderizações sendo monitoradas
     * @returns {Array<string>} Lista de IDs de renderização
     */
    getActivePolls() {
        const ssePolls = Array.from(this.eventSources.keys());
        const manualPolls = Array.from(this.activePolls.keys());
        return [...new Set([...ssePolls, ...manualPolls])];
    }
}

/**
 * COMPONENTE UI PARA EXIBIR STATUS
 * ================================
 */

class ShotstackStatusUI {
    constructor(containerId, polling) {
        this.container = document.getElementById(containerId);
        this.polling = polling;
        this.activeRenders = new Map();
        
        if (!this.container) {
            throw new Error(`Container com ID '${containerId}' não encontrado`);
        }

        this.setupPollingEvents();
        this.createBaseUI();
    }

    /**
     * Configura eventos do polling
     */
    setupPollingEvents() {
        this.polling.onProgress = (renderId, progress) => {
            this.updateProgress(renderId, progress);
        };

        this.polling.onComplete = (renderId, url) => {
            this.showComplete(renderId, url);
        };

        this.polling.onError = (renderId, error) => {
            this.showError(renderId, error);
        };

        this.polling.onStatusChange = (renderId, status) => {
            this.updateStatus(renderId, status);
        };
    }

    /**
     * Cria interface base
     */
    createBaseUI() {
        this.container.innerHTML = `
            <div class="shotstack-status-container">
                <h3>📊 Status de Renderização</h3>
                <div id="renders-list" class="renders-list">
                    <p class="no-renders">Nenhuma renderização ativa</p>
                </div>
            </div>
        `;

        // Adicionar estilos
        this.addStyles();
    }

    /**
     * Adiciona estilos CSS
     */
    addStyles() {
        if (!document.getElementById('shotstack-status-styles')) {
            const style = document.createElement('style');
            style.id = 'shotstack-status-styles';
            style.textContent = `
                .shotstack-status-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin: 20px 0;
                }

                .renders-list {
                    margin-top: 15px;
                }

                .render-item {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 10px;
                    border-left: 4px solid #007bff;
                    transition: all 0.3s ease;
                }

                .render-item.completed {
                    border-left-color: #28a745;
                    background: #d4edda;
                }

                .render-item.failed {
                    border-left-color: #dc3545;
                    background: #f8d7da;
                }

                .render-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .render-id {
                    font-family: monospace;
                    font-size: 14px;
                    color: #666;
                }

                .render-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .status-queued { background: #ffeaa7; color: #2d3436; }
                .status-fetching { background: #74b9ff; color: white; }
                .status-rendering { background: #fd79a8; color: white; }
                .status-saving { background: #fdcb6e; color: #2d3436; }
                .status-done { background: #00b894; color: white; }
                .status-failed { background: #e17055; color: white; }

                .progress-container {
                    margin: 10px 0;
                }

                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #007bff, #0056b3);
                    transition: width 0.5s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                .progress-text {
                    margin-top: 5px;
                    font-size: 14px;
                    color: #666;
                }

                .estimated-time {
                    font-size: 12px;
                    color: #999;
                    margin-top: 5px;
                }

                .completed-video {
                    margin-top: 15px;
                    text-align: center;
                }

                .download-btn {
                    background: #28a745;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    text-decoration: none;
                    font-size: 14px;
                    margin: 5px;
                    display: inline-block;
                    cursor: pointer;
                }

                .download-btn:hover {
                    background: #218838;
                }

                .no-renders {
                    text-align: center;
                    color: #999;
                    font-style: italic;
                    padding: 20px;
                }

                .stop-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                    cursor: pointer;
                    margin-left: 10px;
                }

                .stop-btn:hover {
                    background: #c82333;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Adiciona uma nova renderização ao monitoramento
     * @param {string} renderId - ID da renderização
     * @param {Object} options - Opções iniciais
     */
    addRender(renderId, options = {}) {
        const rendersList = document.getElementById('renders-list');
        const noRenders = rendersList.querySelector('.no-renders');
        
        if (noRenders) {
            noRenders.style.display = 'none';
        }

        const renderItem = document.createElement('div');
        renderItem.className = 'render-item';
        renderItem.id = `render-${renderId}`;
        
        renderItem.innerHTML = `
            <div class="render-header">
                <div>
                    <strong>Renderização:</strong>
                    <span class="render-id">${renderId}</span>
                </div>
                <div>
                    <span class="render-status status-queued">Iniciando</span>
                    <button class="stop-btn" onclick="window.shotstackPolling.stopPolling('${renderId}')">
                        ⏹️ Parar
                    </button>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%">0%</div>
                </div>
                <div class="progress-text">Iniciando...</div>
                <div class="estimated-time">Tempo estimado: calculando...</div>
            </div>
        `;

        rendersList.appendChild(renderItem);
        this.activeRenders.set(renderId, renderItem);
    }

    /**
     * Atualiza o progresso de uma renderização
     */
    updateProgress(renderId, progress) {
        const renderItem = this.activeRenders.get(renderId);
        if (!renderItem) return;

        const progressFill = renderItem.querySelector('.progress-fill');
        const progressText = renderItem.querySelector('.progress-text');
        const estimatedTime = renderItem.querySelector('.estimated-time');

        if (progressFill) {
            progressFill.style.width = `${progress.progress}%`;
            progressFill.textContent = `${progress.progress}%`;
        }

        if (progressText) {
            progressText.textContent = progress.progressText;
        }

        if (estimatedTime) {
            estimatedTime.textContent = `Tempo estimado: ${progress.estimatedTime}`;
        }
    }

    /**
     * Atualiza o status de uma renderização
     */
    updateStatus(renderId, status) {
        const renderItem = this.activeRenders.get(renderId);
        if (!renderItem) return;

        const statusEl = renderItem.querySelector('.render-status');
        if (statusEl) {
            statusEl.className = `render-status status-${status}`;
            statusEl.textContent = status.toUpperCase();
        }
    }

    /**
     * Mostra renderização concluída
     */
    showComplete(renderId, url) {
        const renderItem = this.activeRenders.get(renderId);
        if (!renderItem) return;

        renderItem.className = 'render-item completed';
        
        const progressContainer = renderItem.querySelector('.progress-container');
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%; background: #28a745;">100% ✅</div>
            </div>
            <div class="progress-text">Renderização concluída com sucesso!</div>
            <div class="completed-video">
                <a href="${url}" class="download-btn" target="_blank">📥 Baixar Vídeo</a>
                <a href="${url}" class="download-btn" target="_blank">👁️ Visualizar</a>
            </div>
        `;

        // Remover botão de parar
        const stopBtn = renderItem.querySelector('.stop-btn');
        if (stopBtn) stopBtn.remove();
    }

    /**
     * Mostra erro na renderização
     */
    showError(renderId, error) {
        const renderItem = this.activeRenders.get(renderId);
        if (!renderItem) return;

        renderItem.className = 'render-item failed';
        
        const progressContainer = renderItem.querySelector('.progress-container');
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%; background: #dc3545;">❌ Erro</div>
            </div>
            <div class="progress-text">Erro: ${error.message}</div>
        `;

        // Remover botão de parar
        const stopBtn = renderItem.querySelector('.stop-btn');
        if (stopBtn) stopBtn.remove();
    }

    /**
     * Remove uma renderização da lista
     */
    removeRender(renderId) {
        const renderItem = this.activeRenders.get(renderId);
        if (renderItem) {
            renderItem.remove();
            this.activeRenders.delete(renderId);
        }

        // Mostrar mensagem se não há renderizações
        if (this.activeRenders.size === 0) {
            const noRenders = document.querySelector('.no-renders');
            if (noRenders) {
                noRenders.style.display = 'block';
            }
        }
    }

    /**
     * Limpa todas as renderizações
     */
    clearAll() {
        const rendersList = document.getElementById('renders-list');
        rendersList.innerHTML = '<p class="no-renders">Nenhuma renderização ativa</p>';
        this.activeRenders.clear();
    }
}

// Export para uso em módulos
export { ShotstackPolling, ShotstackStatusUI };
