import express from 'express';
import multer from 'multer';
import { uploadToFirebase, uploadMultipleToFirebase } from '../connectors/firebaseStorage.js';

const router = express.Router();

// Configuração do multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB por arquivo
        files: 10 // Máximo 10 arquivos
    },
    fileFilter: (req, file, cb) => {
        console.log(`📋 [multer] Validando arquivo: ${file.originalname}, tipo: ${file.mimetype}`);
        
        if (file.mimetype.startsWith('image/')) {
            console.log(`✅ [multer] Arquivo aceito: ${file.originalname}`);
            cb(null, true);
        } else {
            console.error(`❌ [multer] Tipo de arquivo rejeitado: ${file.mimetype}`);
            cb(new Error('Apenas arquivos de imagem são permitidos'), false);
        }
    }
});

// Middleware para tratar erros do multer
const handleMulterError = (error, req, res, next) => {
    console.error(`❌ [multer] Erro:`, error.message);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'Arquivo muito grande. Máximo permitido: 15MB',
                error: 'LIMIT_FILE_SIZE'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(413).json({
                success: false,
                message: 'Muitos arquivos. Máximo permitido: 10 arquivos',
                error: 'LIMIT_FILE_COUNT'
            });
        }
    }
    
    return res.status(400).json({
        success: false,
        message: error.message,
        error: 'MULTER_ERROR'
    });
};

/**
 * ROTA PRINCIPAL - Upload único de imagem
 * POST /api/firebase/upload-image
 */
router.post('/upload-image', upload.single('image'), handleMulterError, async (req, res) => {
    console.log(`🚀 [POST /firebase/upload-image] ===== INICIANDO UPLOAD ÚNICO =====`);
    console.log(`📋 [POST /firebase/upload-image] URL: ${req.originalUrl}`);
    console.log(`📋 [POST /firebase/upload-image] Method: ${req.method}`);
    console.log(`📋 [POST /firebase/upload-image] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`📋 [POST /firebase/upload-image] Body:`, req.body);
    console.log(`📋 [POST /firebase/upload-image] File:`, req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
    } : 'Nenhum arquivo');
    
    try {
        // Validar arquivo
        if (!req.file) {
            console.error(`❌ [POST /firebase/upload-image] Nenhum arquivo enviado`);
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo de imagem foi enviado',
                error: 'NO_FILE'
            });
        }
        
        // Validar clientName
        const { clientName } = req.body;
        if (!clientName || !clientName.trim()) {
            console.error(`❌ [POST /firebase/upload-image] ClientName não fornecido:`, clientName);
            return res.status(400).json({
                success: false,
                message: 'Nome do cliente é obrigatório',
                error: 'NO_CLIENT_NAME'
            });
        }
        
        console.log(`📤 [POST /firebase/upload-image] Fazendo upload para Firebase...`);
        console.log(`👤 [POST /firebase/upload-image] Cliente: ${clientName}`);
        console.log(`📁 [POST /firebase/upload-image] Arquivo: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Upload para Firebase usando o connector
        const publicUrl = await uploadToFirebase(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            clientName.trim()
        );
        
        console.log(`✅ [POST /firebase/upload-image] Upload concluído com sucesso!`);
        console.log(`🌐 [POST /firebase/upload-image] URL: ${publicUrl.substring(0, 80)}...`);
        
        // Resposta padronizada
        const result = {
            success: true,
            message: 'Upload realizado com sucesso',
            data: {
                publicUrl: publicUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                clientName: clientName.trim(),
                uploadedAt: new Date().toISOString()
            }
        };
        
        console.log(`📤 [POST /firebase/upload-image] Enviando resposta:`, {
            success: result.success,
            publicUrl: result.data.publicUrl.substring(0, 50) + '...'
        });
        console.log(`🏁 [POST /firebase/upload-image] ===== UPLOAD ÚNICO CONCLUÍDO =====`);
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error(`❌ [POST /firebase/upload-image] Erro no upload:`, error.message);
        console.error(`📋 [POST /firebase/upload-image] Stack:`, error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor durante upload',
            error: error.message
        });
    }
});

/**
 * ROTA SECUNDÁRIA - Upload múltiplo de imagens
 * POST /api/firebase/upload-multiple-images
 */
router.post('/upload-multiple-images', upload.array('images', 10), handleMulterError, async (req, res) => {
    console.log(`🚀 [POST /firebase/upload-multiple-images] ===== INICIANDO UPLOAD MÚLTIPLO =====`);
    console.log(`📋 [POST /firebase/upload-multiple-images] URL: ${req.originalUrl}`);
    console.log(`📋 [POST /firebase/upload-multiple-images] Files:`, req.files ? req.files.length : 0);
    console.log(`📋 [POST /firebase/upload-multiple-images] Body:`, req.body);
    
    if (req.files) {
        req.files.forEach((file, index) => {
            console.log(`📁 [POST /firebase/upload-multiple-images] File ${index + 1}:`, {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
        });
    }
    
    try {
        // Validar arquivos
        if (!req.files || req.files.length === 0) {
            console.error(`❌ [POST /firebase/upload-multiple-images] Nenhum arquivo enviado`);
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo de imagem foi enviado',
                error: 'NO_FILES'
            });
        }
        
        // Validar clientName
        const { clientName } = req.body;
        if (!clientName || !clientName.trim()) {
            console.error(`❌ [POST /firebase/upload-multiple-images] ClientName não fornecido`);
            return res.status(400).json({
                success: false,
                message: 'Nome do cliente é obrigatório',
                error: 'NO_CLIENT_NAME'
            });
        }
        
        console.log(`📤 [POST /firebase/upload-multiple-images] Fazendo upload de ${req.files.length} arquivos`);
        console.log(`👤 [POST /firebase/upload-multiple-images] Cliente: ${clientName}`);
        
        // Upload múltiplo usando o connector
        const results = await uploadMultipleToFirebase(req.files, clientName.trim());
        
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        
        console.log(`📊 [POST /firebase/upload-multiple-images] Resultado: ${successCount} sucessos, ${errorCount} erros`);
        
        // Resposta padronizada
        const response = {
            success: errorCount === 0,
            message: errorCount === 0 
                ? `${successCount} arquivos enviados com sucesso`
                : `${successCount} de ${req.files.length} arquivos enviados com sucesso`,
            data: {
                totalProcessed: req.files.length,
                successCount: successCount,
                errorCount: errorCount,
                results: results,
                publicUrls: results.filter(r => r.success).map(r => r.url)
            }
        };
        
        console.log(`📤 [POST /firebase/upload-multiple-images] Enviando resposta:`, {
            success: response.success,
            successCount: successCount,
            errorCount: errorCount
        });
        console.log(`🏁 [POST /firebase/upload-multiple-images] ===== UPLOAD MÚLTIPLO CONCLUÍDO =====`);
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error(`❌ [POST /firebase/upload-multiple-images] Erro no upload:`, error.message);
        console.error(`📋 [POST /firebase/upload-multiple-images] Stack:`, error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor durante upload múltiplo',
            error: error.message
        });
    }
});

export default router;