import express from "express";
import {
    removeBackground,
    upscaleImage,
    reimagineImage,
    checkUpscaleStatus,
    listUpscaleTasks,
} from "../connectors/freepik.js";

const router = express.Router();

/**
 * POST /api/freepik/remove-background
 * Remove o fundo de uma imagem
 * 
 * Body:
 * {
 *   "image_url": "https://example.com/image.jpg"
 * }
 */
/**
 * POST /api/freepik/remove-background
 * Remove o fundo de uma imagem
 * 
 * Body:
 * {
 *   "image_url": "https://example.com/image.jpg",
 *   "use_proxy": true  // opcional: tenta contornar restrições de URL
 * }
 * 
 * IMPORTANTE: 
 * - A API do Freepik pode ter problemas com certas URLs (Firebase Storage com caracteres especiais)
 * - Se receber erro "Failed to download the image", tente use_proxy: true
 * - O modo proxy tenta fazer uma requisição simplificada da URL
 */
router.post("/freepik/remove-background", async (req, res) => {
    try {
        console.log("🎨 Freepik Remove Background request received");
        let { image_url, use_proxy = false } = req.body;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: "image_url is required",
            });
        }

        // Modo 1: Tentar diretamente (funciona com URLs simples)
        let result;
        let usedProxy = false;
        
        try {
            console.log(`📸 Trying direct URL: ${image_url.substring(0, 100)}...`);
            result = await removeBackground(image_url);
        } catch (directError) {
            // Se falhou e não forçou proxy, tenta automático
            if (!use_proxy && directError.message.includes("Failed to download")) {
                console.log("⚠️ Direct URL failed, trying with URL encoding...");
                try {
                    // Tenta URL-encode da URL inteira
                    const encodedUrl = encodeURI(image_url);
                    result = await removeBackground(encodedUrl);
                    usedProxy = true;
                } catch (encodedError) {
                    // Se ainda falhou, retorna erro com sugestão
                    throw new Error("Failed to download image. The Freepik API cannot access this URL. Try uploading the image to a public hosting service like img.freepik.com, imgur.com, or similar.");
                }
            } else {
                throw directError;
            }
        }

        res.status(200).json({
            success: true,
            message: "Background removal completed" + (usedProxy ? " (using URL encoding)" : ""),
            data: result,
            ...(usedProxy && { note: "URL was encoded to bypass restrictions" }),
        });
    } catch (error) {
        console.error("❌ Error in remove-background:", error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to remove background",
            suggestion: "If you're using Firebase Storage or complex URLs, consider re-uploading the image to a simpler public URL (imgur.com, img.freepik.com, etc.)",
        });
    }
});

/**
 * POST /api/freepik/upscale
 * Melhora a resolução de uma imagem com IA (Magnific V2)
 * 
 * Body:
 * {
 *   "image_url": "https://example.com/image.jpg",
 *   "scale_factor": 2,       // 2-16, padrão: 2
 *   "sharpen": 7,            // 0-100, padrão: 7
 *   "smart_grain": 7,        // 0-100, padrão: 7
 *   "ultra_detail": 30,      // 0-100, padrão: 30
 *   "flavor": "photo",       // "sublime", "photo", "photo_denoiser"
 *   "webhook_url": "https://..." // opcional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "task_id": "uuid",
 *     "status": "CREATED",
 *     "generated": []
 *   }
 * }
 */
router.post("/freepik/upscale", async (req, res) => {
    try {
        console.log("🎨 Freepik Upscale request received");
        const { image_url, scale_factor, sharpen, smart_grain, ultra_detail, flavor, webhook_url } = req.body;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: "image_url is required",
            });
        }

        const options = {
            ...(scale_factor && { scale_factor }),
            ...(sharpen !== undefined && { sharpen }),
            ...(smart_grain !== undefined && { smart_grain }),
            ...(ultra_detail !== undefined && { ultra_detail }),
            ...(flavor && { flavor }),
            ...(webhook_url && { webhook_url }),
        };

        const result = await upscaleImage(image_url, options);

        res.status(200).json({
            success: true,
            message: "Image upscale initiated (async). Use task_id to check status.",
            data: result.data || result,
        });
    } catch (error) {
        console.error("❌ Error in upscale:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to upscale image",
        });
    }
});

/**
 * POST /api/freepik/reimagine
 * Recria uma imagem com IA mantendo a composição (Reimagine Flux)
 * 
 * Body:
 * {
 *   "image_base64": "iVBORw0KGgoAAAA...",  // Base64 da imagem (OBRIGATÓRIO)
 *   "prompt": "modern style",              // opcional
 *   "imagination": "wild",                 // "wild", "subtle", "vivid"
 *   "aspect_ratio": "square_1_1",         // aspect ratio desejado
 *   "webhook_url": "https://..."           // opcional
 * }
 * 
 * Response (síncrono):
 * {
 *   "success": true,
 *   "data": {
 *     "task_id": "uuid",
 *     "status": "COMPLETED",
 *     "generated": ["https://url1.jpg", "https://url2.jpg"]
 *   }
 * }
 */
router.post("/freepik/reimagine", async (req, res) => {
    try {
        console.log("🎨 Freepik Reimagine request received");
        const { image_base64, prompt, imagination, aspect_ratio, webhook_url } = req.body;

        if (!image_base64) {
            return res.status(400).json({
                success: false,
                message: "image_base64 is required (base64 encoded image, not URL)",
            });
        }

        const options = {
            ...(prompt && { prompt }),
            ...(imagination && { imagination }),
            ...(aspect_ratio && { aspect_ratio }),
            ...(webhook_url && { webhook_url }),
        };

        const result = await reimagineImage(image_base64, options);

        res.status(200).json({
            success: true,
            message: "Image reimagine completed",
            data: result.data || result,
        });
    } catch (error) {
        console.error("❌ Error in reimagine:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to reimagine image",
        });
    }
});

/**
 * GET /api/freepik/upscale/status/:task_id
 * Verificar status de uma task de upscale
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "task_id": "uuid",
 *     "status": "COMPLETED",
 *     "generated": ["https://url.jpg"]
 *   }
 * }
 */
router.get("/freepik/upscale/status/:task_id", async (req, res) => {
    try {
        console.log("🎨 Freepik Check Upscale Status request received");
        const { task_id } = req.params;

        const result = await checkUpscaleStatus(task_id);

        res.status(200).json({
            success: true,
            message: "Upscale status retrieved",
            data: result.data || result,
        });
    } catch (error) {
        console.error("❌ Error checking upscale status:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to check upscale status",
        });
    }
});

/**
 * GET /api/freepik/upscale/tasks
 * Listar todas as tasks de upscale
 * 
 * Query params:
 * - page: número da página (padrão: 1)
 * - per_page: itens por página (padrão: 20)
 */
router.get("/freepik/upscale/tasks", async (req, res) => {
    try {
        console.log("🎨 Freepik List Upscale Tasks request received");
        const { page = 1, per_page = 20 } = req.query;

        const result = await listUpscaleTasks(parseInt(page), parseInt(per_page));

        res.status(200).json({
            success: true,
            message: "Upscale tasks list retrieved",
            data: result.data || result,
        });
    } catch (error) {
        console.error("❌ Error listing upscale tasks:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to list upscale tasks",
        });
    }
});

export default router;
