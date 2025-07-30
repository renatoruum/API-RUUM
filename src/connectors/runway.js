import RunwayML, { TaskFailedError } from '@runwayml/sdk';
import dotenv from "dotenv";
dotenv.config();

// Verifica se a API key está configurada
if (!process.env.RUNWAYML_API_SECRET) {
    throw new Error('RUNWAYML_API_SECRET is not defined in environment variables');
}

// Inicializa o cliente do SDK Runway
const runwayClient = new RunwayML({
    apiKey: process.env.RUNWAYML_API_SECRET
});

/**
 * Gera uma imagem usando Runway ML
 * @param {Object} options - Opções de geração
 * @param {string} options.prompt - Descrição textual da imagem a ser gerada
 * @param {Object} [options.params] - Parâmetros adicionais para a API do Runway
 * @returns {Promise<Object>} Resposta da API do Runway
 */
export async function generateWithRunway(options) {
    try {
        const { prompt, params = {} } = options;

        if (!prompt) {
            throw new Error("O prompt é obrigatório para gerar imagens com o Runway");
        }

        // Usando o SDK para geração de imagens
        const task = await runwayClient.text2Image
            .create({
                prompt,
                ...params
            })
            .waitForTaskOutput();

        return task;

    } catch (error) {
        if (error instanceof TaskFailedError) {
            console.error("❌ Erro na geração de imagem Runway:", error.taskDetails);
            throw new Error(`Runway Task Failed: ${JSON.stringify(error.taskDetails)}`);
        } else {
            console.error("❌ Erro ao chamar API Runway:", error.message);
            throw error;
        }
    }
}

/**
 * Gera um vídeo a partir de uma imagem usando Runway ML
 * @param {Object} options - Opções de geração
 * @param {string} options.promptImage - URL da imagem para gerar o vídeo
 * @param {string} options.promptText - Descrição textual para guiar a geração do vídeo
 * @param {string} [options.ratio='1280:720'] - Proporção do vídeo (ex: '1280:720', '1024:1024')
 * @param {number} [options.duration=4] - Duração do vídeo em segundos
 * @param {string} [options.model='gen4_turbo'] - Modelo a ser utilizado
 * @returns {Promise<Object>} Resposta com os detalhes da tarefa e URL do vídeo
 */

export async function imageToVideoWithRunway(options) {
    try {
        const {
            promptImage,
            promptText,
            ratio = '1280:720',
            duration,
            model = 'gen4_turbo'
        } = options;

        if (!promptImage) {
            throw new Error("A URL da imagem é obrigatória para gerar vídeo com o Runway");
        }

        // Usando o SDK para conversão de imagem para vídeo
        const task = await runwayClient.imageToVideo
            .create({
                model,
                promptImage,
                promptText,
                ratio,
                duration,
            })
            .waitForTaskOutput();

        console.log('Task complete:', task);
        return task;

    } catch (error) {
        if (error instanceof TaskFailedError) {
            console.error("❌ Erro na geração de vídeo Runway:", error.taskDetails);
            throw new Error(`Runway Task Failed: ${JSON.stringify(error.taskDetails)}`);
        } else {
            console.error("❌ Erro ao chamar API Runway:", error.message);
            throw error;
        }
    }
}