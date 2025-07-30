/**
 * EXEMPLO PRÁTICO DE CHAMADA DO FRONT-END
 * ======================================
 * 
 * Este arquivo mostra exatamente como o front-end deve fazer uma chamada
 * para renderizar um vídeo com múltiplos vídeos e áudios usando a API atual.
 */

// ============================================================================
// CENÁRIO: 3 vídeos + 3 narrações + música de fundo
// ============================================================================

async function exemploRealDeRenderizacao() {
    console.log('🎬 Iniciando exemplo de renderização...');
    
    // Dados que o front-end coletaria do formulário/interface
    const dadosDoProjeto = {
        videos: [
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/beach-overhead.mp4",
                duracao: 10 // segundos
            },
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/city-timelapse.mp4", 
                duracao: 12
            },
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/surf.mp4",
                duracao: 8
            }
        ],
        audios: [
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/voiceover-male.mp3",
                volume: 0.8
            },
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/voiceover-female.mp3",
                volume: 0.9
            },
            {
                url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/voiceover-male.mp3",
                volume: 0.7
            }
        ],
        musicaFundo: {
            url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/happy.mp3",
            volume: 0.3
        },
        configuracoes: {
            resolucao: "hd",
            formato: "mp4"
        }
    };

    try {
        // 1. CONSTRUIR A TIMELINE
        const timeline = construirTimeline(dadosDoProjeto);
        console.log('📋 Timeline criada:', JSON.stringify(timeline, null, 2));

        // 2. CONFIGURAR OUTPUT
        const output = {
            format: dadosDoProjeto.configuracoes.formato,
            resolution: dadosDoProjeto.configuracoes.resolucao
        };

        // 3. FAZER A CHAMADA PARA O BACKEND
        console.log('🚀 Enviando para renderização...');
        
        const response = await fetch('/api/shotstack/render', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                timeline, 
                output 
            })
        });

        // 4. PROCESSAR RESPOSTA
        const resultado = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${resultado.message || 'Erro desconhecido'}`);
        }

        if (!resultado.success) {
            throw new Error(resultado.message || 'Falha na renderização');
        }

        console.log('✅ Renderização iniciada!');
        console.log(`📊 ID da renderização: ${resultado.renderId}`);
        console.log(`⏱️ Tempo estimado: ${resultado.estimated || 'N/A'}`);

        // 5. AGUARDAR CONCLUSÃO
        console.log('⏳ Aguardando conclusão...');
        const videoFinal = await monitorarRenderizacao(resultado.renderId);

        if (videoFinal) {
            console.log('🎉 Vídeo finalizado com sucesso!');
            console.log(`🔗 URL do vídeo: ${videoFinal}`);
            return videoFinal;
        } else {
            throw new Error('Renderização falhou ou expirou');
        }

    } catch (error) {
        console.error('❌ Erro na renderização:', error);
        throw error;
    }
}

// ============================================================================
// FUNÇÃO PARA CONSTRUIR A TIMELINE
// ============================================================================

function construirTimeline(dados) {
    const timeline = {
        tracks: []
    };

    let tempoAtual = 0;

    // Track 0: Vídeos em sequência
    const trackVideos = {
        clips: dados.videos.map((video, index) => {
            const clip = {
                asset: {
                    type: "video",
                    src: video.url
                },
                start: tempoAtual,
                length: video.duracao
            };
            
            tempoAtual += video.duracao;
            return clip;
        })
    };
    
    timeline.tracks.push(trackVideos);

    // Tracks 1-N: Áudios individuais (uma track por áudio)
    tempoAtual = 0; // Reset para sincronizar com vídeos
    
    dados.audios.forEach((audio, index) => {
        const trackAudio = {
            clips: [{
                asset: {
                    type: "audio",
                    src: audio.url
                },
                start: tempoAtual,
                length: dados.videos[index].duracao, // Duração do vídeo correspondente
                volume: audio.volume
            }]
        };
        
        timeline.tracks.push(trackAudio);
        tempoAtual += dados.videos[index].duracao;
    });

    // Track final: Música de fundo (se especificada)
    if (dados.musicaFundo && dados.musicaFundo.url) {
        const duracaoTotal = dados.videos.reduce((total, video) => total + video.duracao, 0);
        
        const trackMusica = {
            clips: [{
                asset: {
                    type: "audio",
                    src: dados.musicaFundo.url
                },
                start: 0,
                length: duracaoTotal,
                volume: dados.musicaFundo.volume
            }]
        };
        
        timeline.tracks.push(trackMusica);
    }

    return timeline;
}

// ============================================================================
// FUNÇÃO PARA MONITORAR A RENDERIZAÇÃO
// ============================================================================

async function monitorarRenderizacao(renderId) {
    const INTERVALO_VERIFICACAO = 5000; // 5 segundos
    const TIMEOUT_MAXIMO = 300000; // 5 minutos
    
    const tempoInicio = Date.now();
    let ultimoStatus = '';

    while (Date.now() - tempoInicio < TIMEOUT_MAXIMO) {
        try {
            const response = await fetch(`/api/shotstack/status/${renderId}`);
            const statusData = await response.json();

            if (!response.ok) {
                throw new Error(`Erro ao verificar status: ${statusData.message}`);
            }

            const status = statusData.status;
            
            // Log apenas se o status mudou
            if (status !== ultimoStatus) {
                console.log(`📊 Status: ${status.toUpperCase()}`);
                ultimoStatus = status;
            }

            // Verificar se concluído
            if (status === 'done') {
                console.log('✅ Renderização concluída!');
                return statusData.url;
            }

            // Verificar se falhou
            if (status === 'failed') {
                console.error('❌ Renderização falhou:', statusData.error);
                return null;
            }

            // Status válidos em progresso: queued, fetching, rendering
            if (!['queued', 'fetching', 'rendering'].includes(status)) {
                console.warn(`⚠️ Status inesperado: ${status}`);
            }

            // Aguardar antes da próxima verificação
            await new Promise(resolve => setTimeout(resolve, INTERVALO_VERIFICACAO));

        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            await new Promise(resolve => setTimeout(resolve, INTERVALO_VERIFICACAO));
        }
    }

    console.error('⏰ Timeout: renderização excedeu o tempo limite');
    return null;
}

// ============================================================================
// EXEMPLO COM VALIDAÇÃO COMPLETA
// ============================================================================

async function exemploComValidacao() {
    // Simular dados que viriam de um formulário
    const dadosFormulario = {
        videosUrls: [
            "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/beach-overhead.mp4",
            "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/city-timelapse.mp4"
        ],
        videoDuracoes: [15, 12],
        audiosUrls: [
            "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/voiceover-male.mp3",
            "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/voiceover-female.mp3"
        ],
        audioVolumes: [0.8, 0.9],
        musicaFundoUrl: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/happy.mp3",
        musicaVolume: 0.3,
        resolucao: "hd",
        formato: "mp4"
    };

    try {
        // 1. VALIDAÇÃO DOS DADOS
        console.log('🔍 Validando dados...');
        
        if (!validarDadosFormulario(dadosFormulario)) {
            throw new Error('Dados do formulário inválidos');
        }

        // 2. TRANSFORMAR EM FORMATO ESPERADO
        const dadosProjeto = transformarDadosFormulario(dadosFormulario);

        // 3. RENDERIZAR
        const videoUrl = await exemploRealDeRenderizacao.bind(null, dadosProjeto)();
        
        return videoUrl;

    } catch (error) {
        console.error('❌ Erro no exemplo:', error);
        throw error;
    }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO E TRANSFORMAÇÃO
// ============================================================================

function validarDadosFormulario(dados) {
    // Verificar se há pelo menos um vídeo
    if (!dados.videosUrls || dados.videosUrls.length === 0) {
        console.error('❌ Erro: Pelo menos um vídeo deve ser informado');
        return false;
    }

    // Verificar se número de áudios = número de vídeos
    if (dados.audiosUrls.length !== dados.videosUrls.length) {
        console.error('❌ Erro: Número de áudios deve ser igual ao número de vídeos');
        return false;
    }

    // Verificar se há durações para todos os vídeos
    if (dados.videoDuracoes.length !== dados.videosUrls.length) {
        console.error('❌ Erro: Duração deve ser especificada para todos os vídeos');
        return false;
    }

    // Validar URLs
    const todasUrls = [...dados.videosUrls, ...dados.audiosUrls];
    if (dados.musicaFundoUrl) todasUrls.push(dados.musicaFundoUrl);

    const urlPattern = /^https?:\/\/.+/;
    const urlsInvalidas = todasUrls.filter(url => !urlPattern.test(url));
    
    if (urlsInvalidas.length > 0) {
        console.error('❌ URLs inválidas:', urlsInvalidas);
        return false;
    }

    // Validar volumes
    const todosVolumes = [...dados.audioVolumes, dados.musicaVolume].filter(v => v !== undefined);
    const volumesInvalidos = todosVolumes.filter(v => v < 0 || v > 1);
    
    if (volumesInvalidos.length > 0) {
        console.error('❌ Volumes inválidos (devem estar entre 0 e 1):', volumesInvalidos);
        return false;
    }

    console.log('✅ Dados validados com sucesso');
    return true;
}

function transformarDadosFormulario(dados) {
    return {
        videos: dados.videosUrls.map((url, index) => ({
            url,
            duracao: dados.videoDuracoes[index]
        })),
        audios: dados.audiosUrls.map((url, index) => ({
            url,
            volume: dados.audioVolumes[index] || 0.8
        })),
        musicaFundo: dados.musicaFundoUrl ? {
            url: dados.musicaFundoUrl,
            volume: dados.musicaVolume || 0.3
        } : null,
        configuracoes: {
            resolucao: dados.resolucao || "hd",
            formato: dados.formato || "mp4"
        }
    };
}

// ============================================================================
// EXEMPLO DE USO EM FORMULÁRIO HTML
// ============================================================================

function conectarFormulario() {
    const btnRenderizar = document.getElementById('btn-renderizar');
    
    if (btnRenderizar) {
        btnRenderizar.addEventListener('click', async () => {
            try {
                // Desabilitar botão durante processamento
                btnRenderizar.disabled = true;
                btnRenderizar.textContent = 'Renderizando...';

                // Coletar dados do formulário (implementar conforme seu HTML)
                const dados = coletarDadosDoFormulario();
                
                // Processar
                const videoUrl = await processarRenderizacao(dados);
                
                // Mostrar resultado
                mostrarVideoFinalizado(videoUrl);

            } catch (error) {
                console.error('Erro:', error);
                alert(`Erro na renderização: ${error.message}`);
            } finally {
                // Reabilitar botão
                btnRenderizar.disabled = false;
                btnRenderizar.textContent = 'Renderizar Vídeo';
            }
        });
    }
}

function coletarDadosDoFormulario() {
    // Implementar conforme sua estrutura HTML
    return {
        videosUrls: Array.from(document.querySelectorAll('.video-url')).map(input => input.value),
        videoDuracoes: Array.from(document.querySelectorAll('.video-duration')).map(input => parseInt(input.value)),
        audiosUrls: Array.from(document.querySelectorAll('.audio-url')).map(input => input.value),
        audioVolumes: Array.from(document.querySelectorAll('.audio-volume')).map(input => parseFloat(input.value)),
        musicaFundoUrl: document.getElementById('musica-fundo').value,
        musicaVolume: parseFloat(document.getElementById('musica-volume').value),
        resolucao: document.getElementById('resolucao').value,
        formato: document.getElementById('formato').value
    };
}

async function processarRenderizacao(dadosFormulario) {
    if (!validarDadosFormulario(dadosFormulario)) {
        throw new Error('Dados do formulário inválidos');
    }

    const dadosProjeto = transformarDadosFormulario(dadosFormulario);
    const timeline = construirTimeline(dadosProjeto);
    
    const response = await fetch('/api/shotstack/render', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            timeline,
            output: {
                format: dadosProjeto.configuracoes.formato,
                resolution: dadosProjeto.configuracoes.resolucao
            }
        })
    });

    const resultado = await response.json();
    
    if (!resultado.success) {
        throw new Error(resultado.message);
    }

    return await monitorarRenderizacao(resultado.renderId);
}

function mostrarVideoFinalizado(url) {
    // Implementar conforme sua UI
    console.log('🎉 Vídeo finalizado:', url);
    
    const videoElement = document.getElementById('video-resultado');
    if (videoElement) {
        videoElement.src = url;
        videoElement.style.display = 'block';
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Para testar diretamente no console do navegador
window.testarRenderizacao = exemploRealDeRenderizacao;
window.testarComValidacao = exemploComValidacao;

// Para conectar ao formulário quando a página carregar
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', conectarFormulario);
}

// Export para uso em módulos
export {
    exemploRealDeRenderizacao,
    exemploComValidacao,
    construirTimeline,
    monitorarRenderizacao,
    validarDadosFormulario,
    transformarDadosFormulario
};
