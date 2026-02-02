import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

// Verifica se a API key está configurada
if (!process.env.PIXVERSE_API_KEY) {
    throw new Error('PIXVERSE_API_KEY is not defined in environment variables');
}

const PIXVERSE_API_BASE_URL = 'https://app-api.pixverse.ai';
const API_KEY = process.env.PIXVERSE_API_KEY;

/**
 * Helper para fazer retry com exponential backoff em caso de rate limit (429)
 * @param {Function} fn - Função async a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base em ms
 * @returns {Promise} Resultado da função
 */
async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 2000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isRateLimit = error.response?.status === 429;
            const isLastAttempt = attempt === maxRetries;
            
            if (!isRateLimit || isLastAttempt) {
                throw error;
            }

            // Calcula delay exponencial: 2s, 4s, 8s, 16s, 32s...
            const delay = baseDelay * Math.pow(2, attempt);
            const jitter = Math.random() * 1000; // Adiciona variação aleatória
            const totalDelay = delay + jitter;

            console.log(`[PixVerse] Rate limit detected (429). Retrying in ${Math.round(totalDelay)}ms (attempt ${attempt + 1}/${maxRetries})...`);
            
            await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
    }
}

/**
 * Faz upload de uma imagem para o PixVerse
 * Baixa a imagem da URL e faz upload como arquivo
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<number>} img_id
 */
async function uploadImageFromUrl(imageUrl) {
    return retryWithBackoff(async () => {
        try {
            console.log(`[PixVerse] Downloading image from: ${imageUrl.substring(0, 100)}...`);
            
            // Primeiro, baixa a imagem
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000 // 30 segundos
            });

            console.log(`[PixVerse] Image downloaded: ${imageResponse.data.length} bytes, type: ${imageResponse.headers['content-type']}`);

            // Cria FormData e adiciona a imagem
            const formData = new FormData();
            formData.append('image', Buffer.from(imageResponse.data), {
                filename: 'image.jpg',
                contentType: imageResponse.headers['content-type'] || 'image/jpeg'
            });

            console.log(`[PixVerse] Uploading to PixVerse API...`);

            // Faz upload para o PixVerse
            const response = await axios.post(
                `${PIXVERSE_API_BASE_URL}/openapi/v2/image/upload`,
                formData,
                {
                    headers: {
                        'API-KEY': API_KEY,
                        'Ai-Trace-Id': uuidv4(),
                        ...formData.getHeaders()
                    },
                    timeout: 60000, // 60 segundos
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            console.log(`[PixVerse] Upload response:`, response.data);

            if (response.data.ErrCode !== 0) {
                throw new Error(`PixVerse Upload Error: ${response.data.ErrMsg}`);
            }

            console.log(`[PixVerse] Image uploaded successfully, img_id: ${response.data.Resp.img_id}`);
            return response.data.Resp.img_id;
        } catch (error) {
            console.error(`[PixVerse] Upload error:`, error.message);
            if (error.response) {
                console.error(`[PixVerse] Error response:`, error.response.status, error.response.data);
                throw new Error(`PixVerse Upload API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    });
}

/**
 * Cria um vídeo usando PixVerse Transition (RUUM Drop) - First/Last Frame
 * @param {Object} options - Opções de geração
 * @param {string} options.imageEmpty - URL da imagem do ambiente vazio (first frame)
 * @param {string} options.imageFurnished - URL da imagem do ambiente mobiliado (last frame)
 * @param {string} [options.prompt] - Prompt de texto para guiar a geração
 * @param {string} [options.model='v5'] - Modelo ('v3.5', 'v4', 'v4.5', 'v5', 'v5.5')
 * @param {number} [options.duration=5] - Duração do vídeo (5, 8 ou 10)
 * @param {string} [options.quality='540p'] - Qualidade ('360p', '540p', '720p', '1080p')
 * @param {number} [options.seed] - Seed para geração determinística
 * @returns {Promise<Object>} Resposta com video_id
 */
export async function createRuumDropVideo(options) {
    try {
        const {
            imageEmpty,
            imageFurnished,
            prompt = 'Furniture elegantly falling and arranging themselves in the room',
            model = 'v5',
            duration = 5,
            quality = '540p',
            seed
        } = options;

        if (!imageEmpty || !imageFurnished) {
            throw new Error('Both imageEmpty and imageFurnished are required');
        }

        // 1. Upload das imagens
        console.log('Uploading first frame (empty room)...');
        const firstFrameImgId = await uploadImageFromUrl(imageEmpty);
        
        console.log('Uploading last frame (furnished room)...');
        const lastFrameImgId = await uploadImageFromUrl(imageFurnished);

        // 2. Criar vídeo de transição
        const requestData = {
            prompt,
            model,
            duration,
            quality,
            first_frame_img: firstFrameImgId,
            last_frame_img: lastFrameImgId,
            ...(seed !== undefined && { seed })
        };

        console.log('Creating transition video...', requestData);

        const videoResponse = await retryWithBackoff(async () => {
            return await axios.post(
                `${PIXVERSE_API_BASE_URL}/openapi/v2/video/transition/generate`,
                requestData,
                {
                    headers: {
                        'API-KEY': API_KEY,
                        'Ai-Trace-Id': uuidv4(),
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        console.log('[PixVerse] Transition video response:', JSON.stringify(videoResponse.data, null, 2));

        if (videoResponse.data.ErrCode !== 0) {
            console.error(`[PixVerse] Error Code: ${videoResponse.data.ErrCode}, Message: ${videoResponse.data.ErrMsg}`);
            throw new Error(`PixVerse Generation Error: ${videoResponse.data.ErrMsg}`);
        }

        if (!videoResponse.data.Resp || !videoResponse.data.Resp.video_id) {
            console.error('[PixVerse] Missing video_id in response:', videoResponse.data);
            throw new Error('PixVerse API did not return a video_id');
        }

        console.log(`[PixVerse] Video created successfully, video_id: ${videoResponse.data.Resp.video_id}`);

        return {
            video_id: videoResponse.data.Resp.video_id,
            status: 'processing',
            message: 'Video generation started'
        };

    } catch (error) {
        if (error.response) {
            throw new Error(`PixVerse API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Verifica o status de um vídeo sendo gerado
 * @param {number} videoId - ID do vídeo
 * @returns {Promise<Object>} Status do vídeo
 */
export async function getVideoStatus(videoId) {
    try {
        if (!videoId) {
            throw new Error('videoId is required');
        }

        const response = await axios.get(
            `${PIXVERSE_API_BASE_URL}/openapi/v2/video/result/${videoId}`,
            {
                headers: {
                    'API-KEY': API_KEY,
                    'Ai-Trace-Id': uuidv4()
                }
            }
        );

        if (response.data.ErrCode !== 0) {
            throw new Error(`PixVerse Status Error: ${response.data.ErrMsg}`);
        }

        const data = response.data.Resp;
        
        // Status: 1=completed, 5=processing, 6=deleted, 7=moderation failed, 8=generation failed
        let statusText = 'unknown';
        if (data.status === 1) statusText = 'completed';
        else if (data.status === 5) statusText = 'processing';
        else if (data.status === 6) statusText = 'deleted';
        else if (data.status === 7) statusText = 'moderation_failed';
        else if (data.status === 8) statusText = 'failed';

        return {
            video_id: data.id,
            status: statusText,
            statusCode: data.status,
            url: data.url || null,
            prompt: data.prompt,
            seed: data.seed,
            size: data.size,
            created_at: data.create_time,
            updated_at: data.modify_time,
            width: data.outputWidth,
            height: data.outputHeight
        };

    } catch (error) {
        if (error.response) {
            throw new Error(`PixVerse API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Gera vídeo a partir de uma única imagem (Image-to-Video)
 * @param {Object} options - Opções de geração
 * @param {string} options.imageUrl - URL da imagem
 * @param {string} [options.prompt] - Prompt de texto para guiar a geração
 * @param {string} [options.model='v5'] - Modelo
 * @param {number} [options.duration=5] - Duração do vídeo em segundos
 * @param {string} [options.quality='540p'] - Qualidade
 * @param {string} [options.motionStrength='medium'] - Intensidade do movimento ('low', 'medium', 'high')
 * @param {number} [options.seed] - Seed para geração determinística
 * @returns {Promise<Object>} Resposta da API do PixVerse
 */
export async function imageToVideo(options) {
    try {
        const {
            imageUrl,
            prompt = 'Animate this image with natural movement',
            model = 'v5',
            duration = 5,
            quality = '540p',
            motionStrength = 'medium',
            seed
        } = options;

        if (!imageUrl) {
            throw new Error('imageUrl is required');
        }

        // Upload da imagem
        const imgId = await uploadImageFromUrl(imageUrl);

        // Criar vídeo
        const requestData = {
            prompt,
            model,
            duration,
            quality,
            img_id: imgId,
            motion_mode: motionStrength === 'high' ? 'fast' : 'normal',
            ...(seed !== undefined && { seed })
        };

        const response = await retryWithBackoff(async () => {
            return await axios.post(
                `${PIXVERSE_API_BASE_URL}/openapi/v2/video/image_to_video/generate`,
                requestData,
                {
                    headers: {
                        'API-KEY': API_KEY,
                        'Ai-Trace-Id': uuidv4(),
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        if (response.data.ErrCode !== 0) {
            throw new Error(`PixVerse Generation Error: ${response.data.ErrMsg}`);
        }

        return {
            video_id: response.data.Resp.video_id,
            status: 'processing',
            message: 'Video generation started'
        };

    } catch (error) {
        if (error.response) {
            throw new Error(`PixVerse API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Gera vídeo a partir de texto (Text-to-Video)
 * @param {Object} options - Opções de geração
 * @param {string} options.prompt - Prompt de texto descrevendo o vídeo
 * @param {string} [options.model='v5'] - Modelo
 * @param {number} [options.duration=5] - Duração do vídeo em segundos
 * @param {string} [options.quality='540p'] - Qualidade
 * @param {number} [options.seed] - Seed para geração determinística
 * @returns {Promise<Object>} Resposta da API do PixVerse
 */
export async function textToVideo(options) {
    try {
        const {
            prompt,
            model = 'v5',
            duration = 5,
            quality = '540p',
            seed
        } = options;

        if (!prompt) {
            throw new Error('prompt is required');
        }

        const requestData = {
            prompt,
            model,
            duration,
            quality,
            ...(seed !== undefined && { seed })
        };

        const response = await retryWithBackoff(async () => {
            return await axios.post(
                `${PIXVERSE_API_BASE_URL}/openapi/v2/video/text_to_video/generate`,
                requestData,
                {
                    headers: {
                        'API-KEY': API_KEY,
                        'Ai-Trace-Id': uuidv4(),
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        if (response.data.ErrCode !== 0) {
            throw new Error(`PixVerse Generation Error: ${response.data.ErrMsg}`);
        }

        return {
            video_id: response.data.Resp.video_id,
            status: 'processing',
            message: 'Video generation started'
        };

    } catch (error) {
        if (error.response) {
            throw new Error(`PixVerse API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}
