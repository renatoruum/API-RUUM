import express from "express";
import {
    generateVideo,
    checkVideoStatus,
    listVideos,
} from "../connectors/seedance.js";

const router = express.Router();

/**
 * POST /api/seedance/generate
 * Gera vídeo com Seedance (versão unificada via Freepik API)
 * 
 * Body:
 * {
 *   "version": "pro",          // "pro" ou "lite"
 *   "quality": "1080p",        // "1080p" ou "720p"
 *   "image": "https://example.com/image.jpg",  // URL ou base64
 *   "prompt": "A beautiful scene with gentle camera movement",  // OBRIGATÓRIO
 *   "duration": "5",           // "5" ou "10" (segundos)
 *   "camera_fixed": false,     // true/false (opcional)
 *   "aspect_ratio": "widescreen_16_9",  // opcional
 *   "frames_per_second": 24,   // opcional
 *   "seed": -1,                // -1 para aleatório (opcional)
 *   "webhook_url": "https://..." // opcional
 * }
 */
router.post("/seedance/generate", async (req, res) => {
    try {
        console.log("🎬 Seedance Video Generation request received");
        console.log("Request body:", JSON.stringify(req.body, null, 2));

        const {
            version = "pro",
            quality = "1080p",
            image,
            prompt,
            duration = "5",
            camera_fixed = false,
            aspect_ratio = "widescreen_16_9",
            frames_per_second = 24,
            seed = -1,
            webhook_url,
        } = req.body;

        // Validação básica
        if (!image) {
            return res.status(400).json({
                success: false,
                message: "image is required (URL or base64)",
            });
        }

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "prompt is required - describe the video animation",
            });
        }

        // Log da configuração escolhida
        console.log(`📹 Generating with Seedance ${version.toUpperCase()} ${quality}`);

        const result = await generateVideo({
            version,
            quality,
            image,
            prompt,
            duration,
            camera_fixed,
            aspect_ratio,
            frames_per_second,
            seed,
            webhook_url,
        });

        res.status(200).json({
            success: true,
            message: `Video generation initiated with Seedance ${version.toUpperCase()} ${quality}`,
            config: {
                version,
                quality,
                duration: `${duration}s`,
            },
            data: result.data, // Freepik retorna { data: { task_id, status } }
        });
    } catch (error) {
        console.error("❌ Error in Seedance video generation:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to generate video",
        });
    }
});

/**
 * GET /api/seedance/status/:id
 * Verifica o status de uma geração de vídeo
 * Query params opcionais: version, quality (para saber qual modelo consultar)
 */
router.get("/seedance/status/:id", async (req, res) => {
    try {
        console.log("🎬 Seedance Check Status request received");
        const { id } = req.params;
        const { version = "pro", quality = "1080p" } = req.query;

        const result = await checkVideoStatus(id, version, quality);

        res.status(200).json({
            success: true,
            message: "Video status retrieved",
            data: result.data,
        });
    } catch (error) {
        console.error("❌ Error checking video status:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to check video status",
        });
    }
});

/**
 * GET /api/seedance/videos
 * Lista todos os vídeos gerados
 * Query params: version, quality, page, limit
 */
router.get("/seedance/videos", async (req, res) => {
    try {
        console.log("🎬 Seedance List Videos request received");
        const { 
            version = "pro", 
            quality = "1080p",
            page = 1, 
            limit = 20 
        } = req.query;

        const result = await listVideos(version, quality, parseInt(page), parseInt(limit));

        res.status(200).json({
            success: true,
            message: "Videos list retrieved",
            data: result.data,
        });
    } catch (error) {
        console.error("❌ Error listing videos:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to list videos",
        });
    }
});

export default router;
