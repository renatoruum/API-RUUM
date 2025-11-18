import fetch from "node-fetch";

/**
 * Freepik API Connector
 * Documentação: https://developers.freepik.com/docs
 */

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_BASE_URL = "https://api.freepik.com/v1";

/**
 * Função genérica para fazer requisições à API do Freepik
 * @param {string} endpoint - O endpoint da API (sem o base URL)
 * @param {string} method - GET ou POST
 * @param {object} body - Corpo da requisição
 * @param {string} contentType - application/json ou application/x-www-form-urlencoded
 */
async function freepikRequest(endpoint, method = "GET", body = null, contentType = "application/json") {
    try {
        const url = `${FREEPIK_BASE_URL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                "x-freepik-api-key": FREEPIK_API_KEY,
            },
        };

        // Para application/x-www-form-urlencoded (usado pelo remove-background)
        if (contentType === "application/x-www-form-urlencoded") {
            options.headers["Content-Type"] = "application/x-www-form-urlencoded";
            if (body && (method === "POST" || method === "PUT")) {
                // Converte objeto em URL-encoded string
                const params = new URLSearchParams(body);
                options.body = params.toString();
            }
        } else {
            // Para application/json (padrão)
            options.headers["Content-Type"] = "application/json";
            if (body && (method === "POST" || method === "PUT")) {
                options.body = JSON.stringify(body);
            }
        }

        console.log(`🎨 Freepik API Request: ${method} ${url}`);
        console.log(`Content-Type: ${contentType}`);
        if (body) {
            console.log("Request body:", body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Freepik API Error:", data);
            throw new Error(data.message || `Freepik API error: ${response.status}`);
        }

        console.log("✅ Freepik API Response received");
        return data;

    } catch (error) {
        console.error("❌ Error in Freepik request:", error.message);
        throw error;
    }
}

/**
 * Background Removal: Remove o fundo de uma imagem
 * Documentação: https://docs.freepik.com/api-reference/remove-background/post-beta-remove-background
 * 
 * A API retorna URLs temporárias válidas por 5 minutos:
 * - original: URL da imagem original
 * - high_resolution: URL da imagem em alta resolução sem fundo
 * - preview: URL da versão preview
 * - url: URL direta para download em alta resolução
 */
export async function removeBackground(imageUrl) {
    const body = {
        image_url: imageUrl,
    };

    return await freepikRequest(
        "/ai/beta/remove-background", 
        "POST", 
        body,
        "application/x-www-form-urlencoded"
    );
}

/**
 * Upscale: Melhora a resolução de uma imagem com IA (Magnific V2)
 * Documentação: https://docs.freepik.com/api-reference/image-upscaler-precision-v2/post-image-upscaler-precision-v2
 * 
 * A API retorna um task_id para consultar o status posteriormente.
 * O processo é assíncrono.
 * 
 * @param {string} imageUrl - URL da imagem ou base64
 * @param {object} options - Opções de upscale
 * @param {number} options.scale_factor - Fator de escala (2-16), padrão: 2
 * @param {number} options.sharpen - Nitidez (0-100), padrão: 7
 * @param {number} options.smart_grain - Granulação inteligente (0-100), padrão: 7
 * @param {number} options.ultra_detail - Detalhamento ultra (0-100), padrão: 30
 * @param {string} options.flavor - Estilo: "sublime", "photo", "photo_denoiser"
 * @param {string} options.webhook_url - URL de callback opcional
 */
export async function upscaleImage(imageUrl, options = {}) {
    const body = {
        image: imageUrl,
        scale_factor: options.scale_factor || 2,
        sharpen: options.sharpen !== undefined ? options.sharpen : 7,
        smart_grain: options.smart_grain !== undefined ? options.smart_grain : 7,
        ultra_detail: options.ultra_detail !== undefined ? options.ultra_detail : 30,
        flavor: options.flavor || "photo",
        ...(options.webhook_url && { webhook_url: options.webhook_url }),
    };

    return await freepikRequest("/ai/image-upscaler-precision-v2", "POST", body);
}

/**
 * Reimagine Flux: Recria uma imagem com IA mantendo a composição
 * Documentação: https://docs.freepik.com/api-reference/text-to-image/reimagine-flux/post-reimagine-flux
 * 
 * A API é síncrona e retorna as imagens geradas diretamente.
 * 
 * @param {string} imageBase64 - Imagem em base64 (não URL)
 * @param {object} options - Opções de reimaginação
 * @param {string} options.prompt - Prompt de texto opcional
 * @param {string} options.imagination - Tipo: "wild", "subtle", "vivid"
 * @param {string} options.aspect_ratio - Aspect ratio desejado (original, square_1_1, widescreen_16_9, etc.)
 * @param {string} options.webhook_url - URL de callback opcional
 */
export async function reimagineImage(imageBase64, options = {}) {
    const body = {
        image: imageBase64, // Base64 da imagem (não URL!)
        ...(options.prompt && { prompt: options.prompt }),
        ...(options.imagination && { imagination: options.imagination }),
        ...(options.aspect_ratio && { aspect_ratio: options.aspect_ratio }),
        ...(options.webhook_url && { webhook_url: options.webhook_url }),
    };

    return await freepikRequest("/ai/beta/text-to-image/reimagine-flux", "POST", body);
}

/**
 * Verificar status de uma task de upscale
 * Documentação: https://docs.freepik.com/api-reference/image-upscaler-precision-v2/get-image-upscaler-precision-v2
 */
export async function checkUpscaleStatus(taskId) {
    return await freepikRequest(`/ai/image-upscaler-precision-v2/${taskId}`, "GET");
}

/**
 * Listar todas as tasks de upscale precision V2
 * Documentação: https://docs.freepik.com/api-reference/image-upscaler-precision-v2/get-image-upscaler-precision-v2
 */
export async function listUpscaleTasks(page = 1, per_page = 20) {
    return await freepikRequest(`/ai/image-upscaler-precision-v2?page=${page}&per_page=${per_page}`, "GET");
}

export default {
    removeBackground,
    upscaleImage,
    reimagineImage,
    checkUpscaleStatus,
    listUpscaleTasks,
    freepikRequest,
};
