import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Verifica se a API key está configurada
if (!process.env.SHOTSTACK_API_KEY) {
    throw new Error('SHOTSTACK_API_KEY is not defined in environment variables');
}

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
// URLs de PRODUÇÃO (v1) - sem marca d'água e qualidade máxima
const SHOTSTACK_RENDER_URL = "https://api.shotstack.io/edit/v1/render";
const SHOTSTACK_STATUS_URL = "https://api.shotstack.io/edit/v1/render/";

// Headers padrão para requisições à API do Shotstack
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-api-key': SHOTSTACK_API_KEY
});

/**
 * Inicia o processo de renderização de um vídeo
 * @param {Object} timelineData - Dados do timeline do Shotstack
 * @returns {Promise<Object>} - Resposta com ID do render e status
 */
export const startRender = async (timelineData) => {
    try {
        console.log('🎬 Iniciando renderização Shotstack...');
        
        const response = await axios.post(SHOTSTACK_RENDER_URL, timelineData, {
            headers: getHeaders()
        });

        const { id, status } = response.data.response;
        
        console.log(`✅ Renderização iniciada com ID: ${id}`);
        
        return {
            success: true,
            renderId: id,
            status: status,
            message: 'Renderização iniciada com sucesso'
        };
    } catch (error) {
        console.error('❌ Erro ao iniciar renderização:', error.response?.data || error.message);
        
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: 'error'
        };
    }
};

/**
 * Verifica o status de uma renderização
 * @param {string} renderId - ID da renderização
 * @returns {Promise<Object>} - Status atual da renderização
 */
export const checkRenderStatus = async (renderId) => {
    try {
        const response = await axios.get(`${SHOTSTACK_STATUS_URL}${renderId}`, {
            headers: getHeaders()
        });

        const renderData = response.data.response;
        
        return {
            success: true,
            id: renderData.id,
            status: renderData.status,
            url: renderData.url,
            poster: renderData.poster,
            thumbnail: renderData.thumbnail,
            duration: renderData.duration,
            renderTime: renderData.renderTime,
            created: renderData.created,
            updated: renderData.updated,
            error: renderData.error
        };
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
        
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: 'error'
        };
    }
};

/**
 * Aguarda a conclusão da renderização com polling
 * @param {string} renderId - ID da renderização
 * @param {number} maxWaitTime - Tempo máximo de espera em segundos (padrão: 300s)
 * @param {number} pollInterval - Intervalo entre verificações em segundos (padrão: 5s)
 * @returns {Promise<Object>} - Resultado final da renderização
 */
export const waitForRenderCompletion = async (renderId, maxWaitTime = 300, pollInterval = 5) => {
    const startTime = Date.now();
    const maxWaitMs = maxWaitTime * 1000;
    
    console.log(`⏳ Aguardando conclusão da renderização ${renderId}...`);
    
    while (Date.now() - startTime < maxWaitMs) {
        const result = await checkRenderStatus(renderId);
        
        if (!result.success) {
            return result;
        }
        
        console.log(`📊 Status: ${result.status}`);
        
        if (result.status === 'done') {
            console.log(`✅ Renderização concluída! URL: ${result.url}`);
            return result;
        }
        
        if (result.status === 'failed') {
            console.log(`❌ Renderização falhou: ${result.error}`);
            return {
                success: false,
                error: result.error || 'Renderização falhou',
                status: 'failed'
            };
        }
        
        // Aguarda antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
    }
    
    return {
        success: false,
        error: `Timeout: Renderização não foi concluída em ${maxWaitTime} segundos`,
        status: 'timeout'
    };
};

/**
 * Função completa para renderizar vídeo (inicia e aguarda conclusão)
 * @param {Object} timelineData - Dados do timeline do Shotstack
 * @param {boolean} waitForCompletion - Se deve aguardar a conclusão (padrão: false)
 * @returns {Promise<Object>} - Resultado da renderização
 */
export const renderVideo = async (timelineData, waitForCompletion = false) => {
    // Inicia a renderização
    const startResult = await startRender(timelineData);
    
    if (!startResult.success) {
        return startResult;
    }
    
    // Se não deve aguardar, retorna apenas o ID
    if (!waitForCompletion) {
        return startResult;
    }
    
    // Aguarda a conclusão
    return await waitForRenderCompletion(startResult.renderId);
};
