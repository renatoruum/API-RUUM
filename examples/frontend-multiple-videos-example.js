/**
 * EXEMPLO PRÁTICO: Como enviar múltiplos vídeos e áudios para edição
 * =================================================================
 * 
 * Este exemplo mostra como o front-end deve estruturar as chamadas para a API
 * do ShotStack através do nosso backend, enviando múltiplos vídeos e áudios
 * para criar um vídeo editado encadeado.
 * 
 * IMPORTANTE: Os arquivos devem estar em URLs públicas acessíveis
 * (AWS S3, Google Cloud Storage, CDN, etc.)
 */

// ============================================================================
// EXEMPLO 1: Vídeos em sequência com narração única
// ============================================================================

async function criarVideoComNarracao() {
    const timeline = {
        soundtrack: {
            src: "https://meucdn.com/audio/narracao-completa.mp3", // Narração única para todo o vídeo
            effect: "fadeIn"
        },
        tracks: [
            {
                clips: [
                    // Primeiro vídeo (0-10 segundos)
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/intro.mp4"
                        },
                        start: 0,
                        length: 10
                    },
                    // Segundo vídeo (10-25 segundos)
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/conteudo-principal.mp4"
                        },
                        start: 10,
                        length: 15
                    },
                    // Terceiro vídeo (25-35 segundos)
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/conclusao.mp4"
                        },
                        start: 25,
                        length: 10
                    }
                ]
            }
        ],
        fonts: [
            {
                src: "https://templates.shotstack.io/basic/asset/font/OpenSans-Regular.ttf"
            }
        ]
    };

    const output = {
        format: "mp4",
        resolution: "hd"
    };

    try {
        // Renderização assíncrona (recomendada para vídeos longos)
        const response = await fetch('/api/shotstack/render', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timeline, output })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Renderização iniciada:', result.renderId);
            
            // Aguardar conclusão
            await aguardarRenderizacao(result.renderId);
        } else {
            console.error('Erro:', result.message);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// ============================================================================
// EXEMPLO 2: Vídeos com áudios individuais em tracks separadas
// ============================================================================

async function criarVideoComAudiosIndividuais() {
    const timeline = {
        tracks: [
            // Track principal de vídeo
            {
                clips: [
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/video1.mp4"
                        },
                        start: 0,
                        length: 8
                    },
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/video2.mp4"
                        },
                        start: 8,
                        length: 12
                    },
                    {
                        asset: {
                            type: "video",
                            src: "https://meucdn.com/videos/video3.mp4"
                        },
                        start: 20,
                        length: 10
                    }
                ]
            },
            // Track de áudio 1 - para o primeiro vídeo
            {
                clips: [
                    {
                        asset: {
                            type: "audio",
                            src: "https://meucdn.com/audio/locuacao1.mp3"
                        },
                        start: 0,
                        length: 8,
                        volume: 0.8
                    }
                ]
            },
            // Track de áudio 2 - para o segundo vídeo
            {
                clips: [
                    {
                        asset: {
                            type: "audio",
                            src: "https://meucdn.com/audio/locuacao2.mp3"
                        },
                        start: 8,
                        length: 12,
                        volume: 0.8
                    }
                ]
            },
            // Track de áudio 3 - para o terceiro vídeo
            {
                clips: [
                    {
                        asset: {
                            type: "audio",
                            src: "https://meucdn.com/audio/locuacao3.mp3"
                        },
                        start: 20,
                        length: 10,
                        volume: 0.8
                    }
                ]
            },
            // Track de música de fundo (opcional)
            {
                clips: [
                    {
                        asset: {
                            type: "audio",
                            src: "https://meucdn.com/audio/musica-fundo.mp3"
                        },
                        start: 0,
                        length: 30,
                        volume: 0.3 // Volume baixo para não sobrepor a narração
                    }
                ]
            }
        ]
    };

    try {
        // Renderização síncrona (para vídeos mais curtos)
        const response = await fetch('/api/shotstack/render-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                timeline, 
                output: { format: "mp4", resolution: "hd" }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Vídeo renderizado:', result.url);
            return result.url;
        } else {
            console.error('Erro:', result.message);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// ============================================================================
// EXEMPLO 3: Classe para facilitar a criação de vídeos complexos
// ============================================================================

class VideoBuilder {
    constructor() {
        this.timeline = {
            tracks: []
        };
        this.currentTime = 0;
    }

    // Adiciona um vídeo com áudio específico
    adicionarVideoComAudio(videoUrl, audioUrl, duracao, volume = 0.8) {
        // Track de vídeo
        if (!this.timeline.tracks[0]) {
            this.timeline.tracks[0] = { clips: [] };
        }
        
        this.timeline.tracks[0].clips.push({
            asset: {
                type: "video",
                src: videoUrl
            },
            start: this.currentTime,
            length: duracao
        });

        // Track de áudio
        const audioTrackIndex = this.timeline.tracks.length;
        this.timeline.tracks[audioTrackIndex] = {
            clips: [{
                asset: {
                    type: "audio",
                    src: audioUrl
                },
                start: this.currentTime,
                length: duracao,
                volume: volume
            }]
        };

        this.currentTime += duracao;
        return this;
    }

    // Adiciona música de fundo para todo o vídeo
    adicionarMusicaDeFundo(musicaUrl, volume = 0.2) {
        const musicaTrackIndex = this.timeline.tracks.length;
        this.timeline.tracks[musicaTrackIndex] = {
            clips: [{
                asset: {
                    type: "audio",
                    src: musicaUrl
                },
                start: 0,
                length: this.currentTime,
                volume: volume
            }]
        };
        return this;
    }

    // Renderiza o vídeo final
    async renderizar(opcoes = {}) {
        const output = {
            format: opcoes.format || "mp4",
            resolution: opcoes.resolution || "hd"
        };

        try {
            const response = await fetch('/api/shotstack/render', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    timeline: this.timeline, 
                    output 
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Erro ao renderizar:', error);
            throw error;
        }
    }
}

// Exemplo de uso da classe VideoBuilder
async function exemploVideoBuilder() {
    const builder = new VideoBuilder();
    
    const resultado = await builder
        .adicionarVideoComAudio(
            "https://meucdn.com/videos/abertura.mp4",
            "https://meucdn.com/audio/abertura-naracao.mp3",
            10
        )
        .adicionarVideoComAudio(
            "https://meucdn.com/videos/meio.mp4", 
            "https://meucdn.com/audio/meio-naracao.mp3",
            15
        )
        .adicionarVideoComAudio(
            "https://meucdn.com/videos/final.mp4",
            "https://meucdn.com/audio/final-naracao.mp3", 
            8
        )
        .adicionarMusicaDeFundo("https://meucdn.com/audio/background.mp3")
        .renderizar({ resolution: "hd" });

    console.log('Resultado:', resultado);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// Aguarda a conclusão da renderização
async function aguardarRenderizacao(renderId) {
    const maxTentativas = 60; // 5 minutos (tentativas de 5s)
    let tentativas = 0;

    while (tentativas < maxTentativas) {
        try {
            const response = await fetch(`/api/shotstack/status/${renderId}`);
            const status = await response.json();

            console.log(`Status da renderização: ${status.status}`);

            if (status.status === 'done') {
                console.log('Vídeo finalizado:', status.url);
                return status.url;
            } else if (status.status === 'failed') {
                console.error('Renderização falhou:', status.error);
                return null;
            }

            // Aguarda 5 segundos antes da próxima verificação
            await new Promise(resolve => setTimeout(resolve, 5000));
            tentativas++;

        } catch (error) {
            console.error('Erro ao verificar status:', error);
            tentativas++;
        }
    }

    console.error('Timeout: renderização demorou mais que o esperado');
    return null;
}

// Valida URLs antes de enviar
function validarUrls(urls) {
    const urlPattern = /^https?:\/\/.+/;
    const urlsInvalidas = urls.filter(url => !urlPattern.test(url));
    
    if (urlsInvalidas.length > 0) {
        throw new Error(`URLs inválidas encontradas: ${urlsInvalidas.join(', ')}`);
    }
}

// ============================================================================
// EXEMPLO DE USO COMPLETO
// ============================================================================

// Dados que o front-end receberia do usuário
const dadosDoUsuario = {
    videos: [
        "https://meucdn.com/videos/parte1.mp4",
        "https://meucdn.com/videos/parte2.mp4", 
        "https://meucdn.com/videos/parte3.mp4"
    ],
    audios: [
        "https://meucdn.com/audio/naracao1.mp3",
        "https://meucdn.com/audio/naracao2.mp3",
        "https://meucdn.com/audio/naracao3.mp3"
    ],
    musicaFundo: "https://meucdn.com/audio/background.mp3",
    duracoes: [12, 18, 10] // duração de cada vídeo em segundos
};

async function processarVideoDoUsuario(dados) {
    try {
        // Validar URLs
        validarUrls([...dados.videos, ...dados.audios, dados.musicaFundo]);

        // Criar timeline dinamicamente
        const timeline = {
            tracks: [
                // Track principal de vídeos
                {
                    clips: dados.videos.map((videoUrl, index) => ({
                        asset: {
                            type: "video",
                            src: videoUrl
                        },
                        start: dados.duracoes.slice(0, index).reduce((a, b) => a + b, 0),
                        length: dados.duracoes[index]
                    }))
                },
                // Tracks de áudio individuais
                ...dados.audios.map((audioUrl, index) => ({
                    clips: [{
                        asset: {
                            type: "audio",
                            src: audioUrl
                        },
                        start: dados.duracoes.slice(0, index).reduce((a, b) => a + b, 0),
                        length: dados.duracoes[index],
                        volume: 0.8
                    }]
                })),
                // Track de música de fundo
                {
                    clips: [{
                        asset: {
                            type: "audio",
                            src: dados.musicaFundo
                        },
                        start: 0,
                        length: dados.duracoes.reduce((a, b) => a + b, 0),
                        volume: 0.3
                    }]
                }
            ]
        };

        // Renderizar
        const response = await fetch('/api/shotstack/render', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                timeline,
                output: { format: "mp4", resolution: "hd" }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Renderização iniciada com ID:', result.renderId);
            const videoFinal = await aguardarRenderizacao(result.renderId);
            return videoFinal;
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao processar vídeo:', error);
        throw error;
    }
}

// ============================================================================
// EXPORT PARA USO EM MÓDULOS
// ============================================================================

export {
    criarVideoComNarracao,
    criarVideoComAudiosIndividuais,
    VideoBuilder,
    aguardarRenderizacao,
    validarUrls,
    processarVideoDoUsuario
};
