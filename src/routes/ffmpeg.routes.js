import express from 'express';
import multer from 'multer';
import path from 'path';
import ffmpegService from '../services/ffmpeg.service.js';

const router = express.Router();

// Configuração do multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { 
        fileSize: 20 * 1024 * 1024 // 20MB (maior por causa do vídeo de máscara)
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'mask') {
            // Máscara aceita vídeos
            const allowedTypes = /mp4|mov|avi/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = file.mimetype.includes('video');

            if (mimetype || extname) {
                return cb(null, true);
            }
            cb(new Error('Máscara deve ser um vídeo (mp4, mov, avi)'));
        } else {
            // Imagens aceitas para bottom/top
            const allowedTypes = /jpeg|jpg|png/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = file.mimetype.includes('image');

            if (mimetype || extname) {
                return cb(null, true);
            }
            cb(new Error('Imagens devem ser jpg ou png'));
        }
    }
});

/**
 * POST /api/ffmpeg/before-after
 * Modo recomendado: Usa URLs públicas (igual ao Shotstack)
 */
router.post('/before-after', async (req, res) => {
    try {
        const { beforeUrl, afterUrl, clientName, ...options } = req.body;

        if (!beforeUrl || !afterUrl) {
            return res.status(400).json({
                success: false,
                error: 'É necessário fornecer: beforeUrl e afterUrl'
            });
        }

        if (!clientName || !clientName.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Nome do cliente (clientName) é obrigatório'
            });
        }

        console.log('📥 Processando vídeo a partir de URLs:');
        console.log('  Before:', beforeUrl);
        console.log('  After:', afterUrl);
        console.log('  Cliente:', clientName);

        const result = await ffmpegService.createBeforeAfterFromUrls(
            beforeUrl,
            afterUrl,
            {
                duration: parseInt(options.duration) || 10,
                width: parseInt(options.width) || 1280,
                height: parseInt(options.height) || 720,
                fps: parseInt(options.fps) || 25,
                quality: options.quality || 'high',
                direction: options.direction || 'left',
                clientName: clientName.trim()
            }
        );

        res.json(result);

    } catch (error) {
        console.error('❌ Erro na rota /before-after:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ffmpeg/before-after-upload
 * Modo alternativo: Upload de arquivos direto
 */
router.post('/before-after-upload', upload.fields([
    { name: 'before', maxCount: 1 },
    { name: 'after', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files?.before || !req.files?.after) {
            return res.status(400).json({
                success: false,
                error: 'É necessário enviar as imagens "before" e "after"'
            });
        }

        const beforePath = req.files.before[0].path;
        const afterPath = req.files.after[0].path;

        const options = {
            duration: parseInt(req.body.duration) || 10,
            width: parseInt(req.body.width) || 1280,
            height: parseInt(req.body.height) || 720,
            fps: parseInt(req.body.fps) || 25,
            quality: req.body.quality || 'high',
            direction: req.body.direction || 'left'
        };

        console.log('📥 Arquivos recebidos (upload direto):');
        console.log('  Before:', beforePath);
        console.log('  After:', afterPath);
        console.log('  Direção:', options.direction);

        const result = await ffmpegService.createBeforeAfter(
            beforePath,
            afterPath,
            options
        );

        setTimeout(() => {
            ffmpegService.cleanup([beforePath, afterPath]);
        }, 10000);

        res.json(result);

    } catch (error) {
        console.error('❌ Erro na rota /before-after-upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ffmpeg/before-after-custom
 * Modo avançado: Usa máscara customizada fornecida pelo usuário
 */
router.post('/before-after-custom', upload.fields([
    { name: 'bottom', maxCount: 1 },  // por_baixo (antes)
    { name: 'top', maxCount: 1 },     // por_cima (depois)
    { name: 'mask', maxCount: 1 }      // máscara (vídeo)
]), async (req, res) => {
    try {
        if (!req.files?.bottom || !req.files?.top || !req.files?.mask) {
            return res.status(400).json({
                success: false,
                error: 'É necessário enviar: bottom (imagem antes), top (imagem depois) e mask (vídeo máscara)'
            });
        }

        const bottomPath = req.files.bottom[0].path;
        const topPath = req.files.top[0].path;
        const maskPath = req.files.mask[0].path;

        const options = {
            duration: parseInt(req.body.duration) || 10,
            width: parseInt(req.body.width) || 1280,
            height: parseInt(req.body.height) || 720,
            fps: parseInt(req.body.fps) || 25,
            quality: req.body.quality || 'high'
        };

        console.log('📥 Arquivos recebidos (modo customizado):');
        console.log('  Bottom:', bottomPath);
        console.log('  Top:', topPath);
        console.log('  Mask:', maskPath);
        console.log('  Options:', options);

        // Inicia processamento (retorna imediatamente)
        const result = await ffmpegService.createBeforeAfterWithMask(
            bottomPath,
            topPath,
            maskPath,
            options
        );

        // Agenda limpeza dos arquivos temporários
        setTimeout(() => {
            ffmpegService.cleanup([bottomPath, topPath, maskPath]);
        }, 10000); // 10s depois

        res.json(result);

    } catch (error) {
        console.error('❌ Erro na rota /before-after-custom:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ffmpeg/status/:renderId
 * Verifica status de renderização (igual ao Shotstack)
 */
router.get('/status/:renderId', async (req, res) => {
    const result = await ffmpegService.checkRenderStatus(req.params.renderId);
    res.json(result);
});

/**
 * POST /api/ffmpeg/wait/:renderId
 * Aguarda conclusão da renderização
 */
router.post('/wait/:renderId', async (req, res) => {
    try {
        const maxWaitTime = parseInt(req.body.maxWaitTime) || 300;
        const pollInterval = parseInt(req.body.pollInterval) || 2;

        const result = await ffmpegService.waitForRenderCompletion(
            req.params.renderId,
            maxWaitTime,
            pollInterval
        );

        res.json(result);

    } catch (error) {
        console.error('❌ Erro ao aguardar renderização:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ffmpeg/cleanup
 * Limpa jobs antigos e travados
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { olderThanMinutes = 30 } = req.body;
        const result = await ffmpegService.cleanupOldJobs(olderThanMinutes);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao limpar jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
