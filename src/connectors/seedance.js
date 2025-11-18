import fetch from "node-fetch";

/**
 * Seedance API Connector (via Freepik API)
 * Documentação: https://docs.freepik.com/api-reference/image-to-video/
 */

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_BASE_URL = "https://api.freepik.com/v1";

/**
 * Mapeamento de endpoints Seedance via Freepik
 */
const SEEDANCE_ENDPOINTS = {
    "pro-1080p": "/ai/image-to-video/seedance-pro-1080p",
    "pro-720p": "/ai/image-to-video/seedance-pro-720p",
    "lite-1080p": "/ai/image-to-video/seedance-lite-1080p",
    "lite-720p": "/ai/image-to-video/seedance-lite-720p",
};

/**
 * Função genérica para fazer requisições à API do Seedance via Freepik
 */
async function seedanceRequest(endpoint, method = "POST", body = null) {
    try {
        const url = `${FREEPIK_BASE_URL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
                "x-freepik-api-key": FREEPIK_API_KEY,
            },
        };

        if (body && (method === "POST" || method === "PUT")) {
            options.body = JSON.stringify(body);
        }

        console.log(`🎬 Seedance API Request: ${method} ${url}`);
        if (body) {
            console.log("Request body:", JSON.stringify(body, null, 2));
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Seedance API Error:", data);
            throw new Error(data.message || `Seedance API error: ${response.status}`);
        }

        console.log("✅ Seedance API Response received");
        return data;

    } catch (error) {
        console.error("❌ Error in Seedance request:", error.message);
        throw error;
    }
}

/**
 * Gera vídeo com Seedance (via Freepik API)
 * @param {Object} params - Parâmetros da geração
 * @param {string} params.version - "pro" ou "lite"
 * @param {string} params.quality - "1080p" ou "720p"
 * @param {string} params.image - URL ou base64 da imagem de entrada
 * @param {string} params.prompt - Descrição do vídeo a ser gerado (obrigatório)
 * @param {string} params.duration - "5" ou "10" (segundos)
 * @param {boolean} params.camera_fixed - Se a câmera deve ficar fixa (default: false)
 * @param {string} params.aspect_ratio - Proporção do vídeo
 * @param {number} params.frames_per_second - FPS (default: 24)
 * @param {number} params.seed - Seed para reprodutibilidade (-1 para aleatório)
 * @param {string} params.webhook_url - URL para receber callback (opcional)
 */
export async function generateVideo(params) {
    const {
        version = "pro",     // "pro" ou "lite"
        quality = "1080p",   // "1080p" ou "720p"
        image,
        prompt,
        duration = "5",      // "5" ou "10"
        camera_fixed = false,
        aspect_ratio = "widescreen_16_9",
        frames_per_second = 24,
        seed = -1,
        webhook_url = null,
    } = params;

    // Validações
    if (!image) {
        throw new Error("image is required (URL or base64)");
    }

    if (!prompt) {
        throw new Error("prompt is required");
    }

    const validVersions = ["pro", "lite"];
    const validQualities = ["1080p", "720p"];
    const validDurations = ["5", "10"];

    if (!validVersions.includes(version.toLowerCase())) {
        throw new Error(`Invalid version: ${version}. Must be "pro" or "lite"`);
    }

    if (!validQualities.includes(quality.toLowerCase())) {
        throw new Error(`Invalid quality: ${quality}. Must be "1080p" or "720p"`);
    }

    if (!validDurations.includes(duration.toString())) {
        throw new Error(`Invalid duration: ${duration}. Must be "5" or "10"`);
    }

    // Monta a chave do endpoint
    const endpointKey = `${version.toLowerCase()}-${quality.toLowerCase()}`;
    const endpoint = SEEDANCE_ENDPOINTS[endpointKey];

    if (!endpoint) {
        throw new Error(`Endpoint not found for ${endpointKey}`);
    }

    // Monta o body da requisição conforme documentação Freepik
    const body = {
        prompt,
        image,
        duration,
        camera_fixed,
        aspect_ratio,
        frames_per_second,
        seed,
    };

    if (webhook_url) {
        body.webhook_url = webhook_url;
    }

    return await seedanceRequest(endpoint, "POST", body);
}

/**
 * Verifica o status de uma geração (task)
 * Endpoint: GET /v1/ai/image-to-video/seedance-{version}-{quality}/tasks/{task_id}
 */
export async function checkVideoStatus(taskId, version = "pro", quality = "1080p") {
    const endpointKey = `${version.toLowerCase()}-${quality.toLowerCase()}`;
    const endpoint = SEEDANCE_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
        throw new Error(`Endpoint not found for ${endpointKey}`);
    }

    return await seedanceRequest(`${endpoint}/tasks/${taskId}`, "GET");
}

/**
 * Lista todas as tasks de vídeo
 * Endpoint: GET /v1/ai/image-to-video/seedance-{version}-{quality}/tasks
 */
export async function listVideos(version = "pro", quality = "1080p", page = 1, limit = 20) {
    const endpointKey = `${version.toLowerCase()}-${quality.toLowerCase()}`;
    const endpoint = SEEDANCE_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
        throw new Error(`Endpoint not found for ${endpointKey}`);
    }

    return await seedanceRequest(`${endpoint}/tasks?page=${page}&limit=${limit}`, "GET");
}

export default {
    generateVideo,
    checkVideoStatus,
    listVideos,
    seedanceRequest,
};
