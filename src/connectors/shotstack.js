import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Verifica se a API key está configurada
if (!process.env.SHOTSTACK_API_KEY) {
    throw new Error('SHOTSTACK_API_KEY is not defined in environment variables');
}

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_RENDER_URL = "https://api.shotstack.io/edit/stage/render";
const SHOTSTACK_STATUS_URL = "https://api.shotstack.io/edit/stage/render/";

/**
 * Inicia uma renderização no ShotStack
 * @param {Object} timeline - Configuração da timeline do ShotStack
 * @param {Object} output - Configurações de saída do vídeo
 * @returns {Promise<Object>} Resposta da API do ShotStack com ID da renderização
 */
export async function startRender(timeline, output = {}) {
    try {
        if (!timeline) {
            throw new Error("Timeline é obrigatória para renderização");
        }

        // Configurações padrão de saída
        const defaultOutput = {
            format: "mp4",
            resolution: "hd",
            aspectRatio: "16:9",
            fps: 30
        };

        const renderPayload = {
            timeline,
            output: { ...defaultOutput, ...output }
        };

        console.log("Iniciando renderização ShotStack:", JSON.stringify(renderPayload, null, 2));

        const response = await axios.post(SHOTSTACK_RENDER_URL, renderPayload, {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": SHOTSTACK_API_KEY,
            },
        });

        if (!response.data.response?.id) {
            throw new Error("Nenhum ID de renderização foi retornado pelo ShotStack");
        }

        console.log("Renderização iniciada com ID:", response.data.response.id);
        
        return {
            success: true,
            id: response.data.response.id,
            message: "Renderização iniciada com sucesso",
            data: response.data.response
        };

    } catch (error) {
        console.error("Erro na renderização ShotStack:", error.message);
        throw error;
    }
}

/**
 * Verifica o status de uma renderização
 * @param {string} renderId - ID da renderização
 * @returns {Promise<Object>} Status da renderização
 */
export async function checkRenderStatus(renderId) {
    try {
        if (!renderId) {
            throw new Error("ID da renderização é obrigatório");
        }

        const response = await axios.get(`${SHOTSTACK_STATUS_URL}${renderId}`, {
            headers: {
                "x-api-key": SHOTSTACK_API_KEY,
            },
        });

        const renderData = response.data.response;
        
        // Calcular informações de progresso
        const statusInfo = calculateProgress(renderData.status);
        
        return {
            success: true,
            id: renderId,
            status: renderData.status,
            url: renderData.url,
            progress: statusInfo.progress,
            progressText: statusInfo.text,
            estimatedTime: statusInfo.estimatedTime,
            created: renderData.created,
            updated: renderData.updated,
            data: renderData
        };

    } catch (error) {
        console.error("Erro ao verificar status:", error.message);
        return {
            success: false,
            message: error.message,
            id: renderId,
            status: 'error',
            progress: 0,
            progressText: 'Erro ao verificar status'
        };
    }
}

/**
 * Calcula informações de progresso baseado no status
 * @param {string} status - Status atual da renderização
 * @returns {Object} Informações de progresso
 */
function calculateProgress(status) {
    const progressMap = {
        'queued': {
            progress: 10,
            text: 'Na fila de processamento',
            estimatedTime: '2-5 minutos'
        },
        'fetching': {
            progress: 25,
            text: 'Baixando arquivos de mídia',
            estimatedTime: '1-3 minutos'
        },
        'rendering': {
            progress: 60,
            text: 'Renderizando vídeo',
            estimatedTime: '30 segundos - 2 minutos'
        },
        'saving': {
            progress: 85,
            text: 'Salvando arquivo final',
            estimatedTime: '10-30 segundos'
        },
        'done': {
            progress: 100,
            text: 'Renderização concluída',
            estimatedTime: 'Finalizado'
        },
        'failed': {
            progress: 0,
            text: 'Renderização falhou',
            estimatedTime: 'Falha'
        }
    };

    return progressMap[status] || {
        progress: 5,
        text: 'Status desconhecido',
        estimatedTime: 'N/A'
    };
}

/**
 * Aguarda a conclusão de uma renderização (polling)
 * @param {string} renderId - ID da renderização
 * @param {number} maxAttempts - Número máximo de tentativas (padrão: 60)
 * @param {number} intervalMs - Intervalo entre verificações em ms (padrão: 5000)
 * @returns {Promise<Object>} Resultado final da renderização
 */
export async function waitForRenderCompletion(renderId, maxAttempts = 60, intervalMs = 5000) {
    try {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const statusResult = await checkRenderStatus(renderId);
            const status = statusResult.data.status;
            
            console.log(`Tentativa ${attempts + 1}: Status da renderização ${renderId}: ${status}`);
            
            if (status === "done") {
                return {
                    success: true,
                    id: renderId,
                    status: "done",
                    url: statusResult.data.url,
                    data: statusResult.data
                };
            }
            
            if (status === "failed") {
                throw new Error(`Renderização falhou: ${statusResult.data.error || "Erro desconhecido"}`);
            }
            
            // Status: queued, fetching, rendering, saving
            attempts++;
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
        throw new Error(`Timeout: Renderização não foi concluída após ${maxAttempts} tentativas`);
        
    } catch (error) {
        console.error("Erro ao aguardar renderização:", error.message);
        throw error;
    }
}

/**
 * Renderiza um vídeo e aguarda a conclusão
 * @param {Object} timeline - Configuração da timeline
 * @param {Object} output - Configurações de saída
 * @param {boolean} waitForCompletion - Se deve aguardar a conclusão
 * @returns {Promise<Object>} Resultado da renderização
 */
export async function renderVideo(timeline, output = {}, waitForCompletion = true) {
    try {
        // Inicia a renderização
        const renderResult = await startRender(timeline, output);
        
        if (!waitForCompletion) {
            return renderResult;
        }
        
        // Aguarda a conclusão
        const completionResult = await waitForRenderCompletion(renderResult.id);
        
        return completionResult;
        
    } catch (error) {
        console.error("Erro na renderização completa:", error.message);
        throw error;
    }
}

/**
 * Cria uma timeline básica para imagens
 * @param {Array} images - Array de URLs de imagens
 * @param {number} duration - Duração de cada imagem em segundos
 * @param {Object} options - Opções adicionais
 * @returns {Object} Timeline configurada
 */
export function createImageSlideshow(images, duration = 3, options = {}) {
    const {
        soundtrack = null,
        transition = "fade",
        textOverlay = null
    } = options;

    const clips = images.map((imageUrl, index) => ({
        asset: {
            type: "image",
            src: imageUrl
        },
        start: index * duration,
        length: duration,
        effect: transition === "fade" ? "zoomIn" : transition
    }));

    const timeline = {
        tracks: [
            {
                clips: clips
            }
        ]
    };

    // Adicionar soundtrack se fornecido
    if (soundtrack) {
        timeline.soundtrack = {
            src: soundtrack,
            effect: "fadeIn"
        };
    }

    // Adicionar overlay de texto se fornecido
    if (textOverlay) {
        timeline.tracks.push({
            clips: [{
                asset: {
                    type: "title",
                    text: textOverlay.text || "Título",
                    style: textOverlay.style || "future",
                    color: textOverlay.color || "#ffffff",
                    size: textOverlay.size || "large"
                },
                start: textOverlay.start || 0,
                length: textOverlay.length || duration,
                position: textOverlay.position || "center"
            }]
        });
    }

    return timeline;
}

/**
 * Valida uma configuração de timeline
 * @param {Object} timeline - Timeline para validar
 * @returns {boolean} True se válida
 */
export function validateTimeline(timeline) {
    if (!timeline || typeof timeline !== 'object') {
        return false;
    }

    if (!timeline.tracks || !Array.isArray(timeline.tracks)) {
        return false;
    }

    if (timeline.tracks.length === 0) {
        return false;
    }

    return true;
}

/**
 * Testa a autenticação e status da API do ShotStack
 * @returns {Promise<Object>} Resultado do teste
 */
export async function testShotstackAuth() {
    try {
        console.log('🔍 Testando autenticação ShotStack...');
        console.log('🔑 API Key:', SHOTSTACK_API_KEY ? `${SHOTSTACK_API_KEY.substring(0, 10)}...` : 'NÃO DEFINIDA');
        console.log('🌐 Base URL:', SHOTSTACK_RENDER_URL);
        
        // Teste 1: Verificar se a API key está definida
        if (!SHOTSTACK_API_KEY) {
            return {
                success: false,
                error: 'API_KEY_MISSING',
                message: 'SHOTSTACK_API_KEY não está definida nas variáveis de ambiente'
            };
        }

        // Teste 2: Fazer uma requisição de teste básica (POST vazio para testar auth)
        // Isso deve retornar 400 (Bad Request) se a auth estiver OK, 401 se não
        const response = await axios.post('https://api.shotstack.io/edit/stage/render', {}, {
            headers: {
                'x-api-key': SHOTSTACK_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
            validateStatus: function (status) {
                // Status 400 significa que a auth passou mas o payload está vazio (esperado)
                // Status 401 significa auth falhou
                // Status 403 significa sem permissão
                // Status 402 significa sem créditos
                return status === 400 || status === 401 || status === 403 || status === 402;
            }
        });

        console.log('✅ Resposta da API:', response.status, response.statusText);
        console.log('📊 Dados recebidos:', response.data);

        // Status 400 significa que a autenticação passou mas o payload está vazio
        // Isso é o que esperamos para um teste de auth
        if (response.status === 400) {
            return {
                success: true,
                status: response.status,
                data: response.data,
                message: 'Autenticação ShotStack funcionando (testado com payload vazio)'
            };
        }

        // Outros status codes indicam problemas
        return {
            success: false,
            error: `HTTP_${response.status}`,
            message: `Erro HTTP ${response.status}: ${response.statusText}`,
            details: {
                status: response.status,
                statusText: response.statusText,
                responseData: response.data
            }
        };

    } catch (error) {
        console.error('❌ Erro na autenticação ShotStack:', error.message);
        
        let errorType = 'UNKNOWN_ERROR';
        let errorMessage = error.message;

        if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            
            console.error('📊 Status da resposta:', status, statusText);
            console.error('📋 Headers da resposta:', error.response.headers);
            console.error('💬 Dados da resposta:', error.response.data);

            switch (status) {
                case 401:
                    errorType = 'UNAUTHORIZED';
                    errorMessage = 'API Key inválida ou expirada';
                    break;
                case 403:
                    errorType = 'FORBIDDEN';
                    errorMessage = 'Acesso negado - verifique permissões da API Key';
                    break;
                case 402:
                    errorType = 'PAYMENT_REQUIRED';
                    errorMessage = 'Créditos insuficientes ou conta suspensa';
                    break;
                case 429:
                    errorType = 'RATE_LIMIT';
                    errorMessage = 'Muitas requisições - limite de rate excedido';
                    break;
                case 500:
                    errorType = 'SERVER_ERROR';
                    errorMessage = 'Erro interno do servidor ShotStack';
                    break;
                default:
                    errorType = 'HTTP_ERROR';
                    errorMessage = `Erro HTTP ${status}: ${statusText}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorType = 'TIMEOUT';
            errorMessage = 'Timeout - servidor não respondeu em 10 segundos';
        } else if (error.code === 'ENOTFOUND') {
            errorType = 'DNS_ERROR';
            errorMessage = 'Erro de DNS - não foi possível resolver o hostname';
        } else if (error.code === 'ECONNREFUSED') {
            errorType = 'CONNECTION_REFUSED';
            errorMessage = 'Conexão recusada pelo servidor';
        }

        return {
            success: false,
            error: errorType,
            message: errorMessage,
            details: {
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data
            }
        };
    }
}

/**
 * Testa uma renderização mínima para verificar se a API está funcionando
 * @returns {Promise<Object>} Resultado do teste
 */
export async function testShotstackRender() {
    try {
        console.log('🧪 Testando renderização mínima...');

        // Timeline mínima de teste
        const testTimeline = {
            tracks: [
                {
                    clips: [
                        {
                            asset: {
                                type: "title",
                                text: "Teste API",
                                style: "future",
                                color: "#ffffff",
                                size: "medium"
                            },
                            start: 0,
                            length: 3
                        }
                    ]
                }
            ]
        };

        const testOutput = {
            format: "mp4",
            resolution: "preview", // Resolução mínima para economizar créditos
            fps: 25
        };

        console.log('📋 Timeline de teste:', JSON.stringify(testTimeline, null, 2));

        const result = await startRender(testTimeline, testOutput);
        
        console.log('✅ Renderização de teste iniciada:', result.id);
        
        return {
            success: true,
            renderId: result.id,
            message: 'Renderização de teste iniciada com sucesso'
        };

    } catch (error) {
        console.error('❌ Erro na renderização de teste:', error.message);
        
        let errorMessage = 'Falha na renderização de teste';
        
        if (error.response) {
            const status = error.response.status;
            console.error('📊 Status da resposta:', status, error.response.statusText);
            console.error('📋 Dados da resposta:', error.response.data);
            
            switch (status) {
                case 403:
                    errorMessage = 'Sem permissão para renderizar - verifique créditos ou plano da conta';
                    break;
                case 402:
                    errorMessage = 'Créditos insuficientes - adicione créditos na conta';
                    break;
                case 401:
                    errorMessage = 'API Key inválida para renderização';
                    break;
                case 400:
                    errorMessage = 'Timeline de teste inválida';
                    break;
                default:
                    errorMessage = `Erro HTTP ${status}: ${error.response.statusText}`;
            }
        }
        
        return {
            success: false,
            error: error.message,
            message: errorMessage,
            details: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                responseData: error.response.data
            } : null
        };
    }
}

/**
 * Executa diagnóstico completo da API ShotStack
 * @returns {Promise<Object>} Resultado completo do diagnóstico
 */
export async function diagnoseShotstack() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO SHOTSTACK ===');
    
    const results = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            apiKey: SHOTSTACK_API_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
            apiKeyPreview: SHOTSTACK_API_KEY ? `${SHOTSTACK_API_KEY.substring(0, 10)}...` : 'N/A'
        },
        tests: {}
    };

    // Teste 1: Autenticação
    console.log('\n1️⃣ Testando autenticação...');
    results.tests.authentication = await testShotstackAuth();

    // Teste 2: Renderização (só se autenticação passou)
    if (results.tests.authentication.success) {
        console.log('\n2️⃣ Testando renderização...');
        results.tests.rendering = await testShotstackRender();
    } else {
        console.log('\n⏭️ Pulando teste de renderização (autenticação falhou)');
        results.tests.rendering = {
            success: false,
            skipped: true,
            message: 'Teste pulado devido à falha na autenticação'
        };
    }

    // Teste 3: Verificar status de uma renderização existente (se disponível)
    if (results.tests.rendering.success && results.tests.rendering.renderId) {
        console.log('\n3️⃣ Testando verificação de status...');
        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2 segundos
            const statusResult = await checkRenderStatus(results.tests.rendering.renderId);
            results.tests.status = {
                success: statusResult.success,
                status: statusResult.status,
                message: statusResult.success ? 'Status verificado com sucesso' : statusResult.message
            };
        } catch (error) {
            results.tests.status = {
                success: false,
                error: error.message,
                message: 'Erro ao verificar status'
            };
        }
    }

    // Resumo final
    console.log('\n📊 === RESUMO DO DIAGNÓSTICO ===');
    console.log('🔑 Autenticação:', results.tests.authentication.success ? '✅ OK' : '❌ FALHA');
    console.log('🎬 Renderização:', results.tests.rendering.success ? '✅ OK' : results.tests.rendering.skipped ? '⏭️ PULADO' : '❌ FALHA');
    console.log('📊 Status:', results.tests.status?.success ? '✅ OK' : results.tests.status ? '❌ FALHA' : '⏭️ PULADO');

    if (!results.tests.authentication.success) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
        console.log('   Tipo:', results.tests.authentication.error);
        console.log('   Mensagem:', results.tests.authentication.message);
        
        // Sugestões de solução
        switch (results.tests.authentication.error) {
            case 'API_KEY_MISSING':
                console.log('\n💡 SOLUÇÃO: Defina a variável SHOTSTACK_API_KEY no arquivo .env');
                break;
            case 'UNAUTHORIZED':
                console.log('\n💡 SOLUÇÃO: Verifique se a API Key está correta no painel do ShotStack');
                break;
            case 'PAYMENT_REQUIRED':
                console.log('\n💡 SOLUÇÃO: Verifique créditos e status da conta no painel do ShotStack');
                break;
            case 'RATE_LIMIT':
                console.log('\n💡 SOLUÇÃO: Aguarde alguns minutos antes de tentar novamente');
                break;
        }
    }

    console.log('\n🔗 Painel ShotStack: https://dashboard.shotstack.io/');
    console.log('📖 Documentação: https://shotstack.io/docs/');
    
    return results;
}
