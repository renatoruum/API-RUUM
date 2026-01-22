import express from 'express';
import {
    createRuumDropVideo,
    getVideoStatus,
    imageToVideo,
    textToVideo
} from '../connectors/pixverse.js';

const router = express.Router();

/**
 * Rota para criar RUUM Drop - Vídeo de composição de ambientes
 * POST /pixverse/ruum-drop
 * Body: {
 *   imageEmpty: string (URL),
 *   imageFurnished: string (URL),
 *   prompt?: string,
 *   model?: string ('v3.5', 'v4', 'v4.5', 'v5', 'v5.5'),
 *   duration?: number (5, 8, 10),
 *   quality?: string ('360p', '540p', '720p', '1080p'),
 *   seed?: number
 * }
 */
router.post('/pixverse/ruum-drop', async (req, res) => {
    try {
        const { imageEmpty, imageFurnished, prompt, model, duration, quality, seed } = req.body;

        if (!imageEmpty || !imageFurnished) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: imageEmpty and imageFurnished'
            });
        }

        const response = await createRuumDropVideo({
            imageEmpty,
            imageFurnished,
            prompt,
            model,
            duration,
            quality,
            seed
        });

        res.json({
            success: true,
            data: response,
            message: 'RUUM Drop video generation started'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing RUUM Drop request',
            error: error.message
        });
    }
});

/**
 * Rota para gerar vídeo a partir de imagem
 * POST /pixverse/image-to-video
 * Body: {
 *   imageUrl: string (URL),
 *   prompt?: string,
 *   aspectRatio?: string,
 *   duration?: number,
 *   motionStrength?: string,
 *   seed?: string
 * }
 */
router.post('/pixverse/image-to-video', async (req, res) => {
    try {
        const { imageUrl, prompt, aspectRatio, duration, motionStrength, seed } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: imageUrl'
            });
        }

        const response = await imageToVideo({
            imageUrl,
            prompt,
            aspectRatio,
            duration,
            motionStrength,
            seed
        });

        res.json({
            success: true,
            data: response,
            message: 'Image-to-video generation started'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing image-to-video request',
            error: error.message
        });
    }
});

/**
 * Rota para gerar vídeo a partir de texto
 * POST /pixverse/text-to-video
 * Body: {
 *   prompt: string,
 *   aspectRatio?: string,
 *   duration?: number,
 *   seed?: string
 * }
 */
router.post('/pixverse/text-to-video', async (req, res) => {
    try {
        const { prompt, aspectRatio, duration, seed } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: prompt'
            });
        }

        const response = await textToVideo({
            prompt,
            aspectRatio,
            duration,
            seed
        });

        res.json({
            success: true,
            data: response,
            message: 'Text-to-video generation started'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing text-to-video request',
            error: error.message
        });
    }
});

/**
 * Rota para verificar status de geração
 * GET /pixverse/status/:videoId
 */
router.get('/pixverse/status/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: videoId'
            });
        }

        const response = await getVideoStatus(parseInt(videoId));

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking video status',
            error: error.message
        });
    }
});

export default router;
