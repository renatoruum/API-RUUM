import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { 
    startRender, 
    checkRenderStatus, 
    waitForRenderCompletion, 
    renderVideo, 
} from "../connectors/shotstack.js";

const router = express.Router();

// Configuração do multer para upload de arquivos JSON
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "./uploads/shotstack";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Aceita apenas arquivos JSON
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos JSON são permitidos'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

/**
 * POST /shotstack/render
 * Inicia uma renderização de vídeo com dados JSON
 * Aceita JSON no body ou arquivo JSON via upload
 */
router.post("/shotstack/render", upload.single('jsonFile'), async (req, res) => {
    try {
        let timelineData;
        
        // Verifica se foi enviado um arquivo JSON
        if (req.file) {
            try {
                const fileContent = fs.readFileSync(req.file.path, 'utf8');
                timelineData = JSON.parse(fileContent);
                
                // Remove o arquivo temporário após leitura
                fs.unlinkSync(req.file.path);
            } catch (error) {
                // Remove o arquivo temporário em caso de erro
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: "Erro ao processar arquivo JSON",
                    error: error.message
                });
            }
        } 
        // Verifica se foi enviado JSON no body
        else if (req.body && (req.body.timeline || req.body.output)) {
            timelineData = req.body;
        } 
        else {
            return res.status(400).json({
                success: false,
                message: "É necessário enviar um arquivo JSON ou dados JSON no body da requisição",
                example: {
                    "timeline": {
                        "tracks": [
                            {
                                "clips": [
                                    {
                                        "asset": {
                                            "type": "text",
                                            "text": "HELLO WORLD"
                                        },
                                        "start": 0,
                                        "length": 5
                                    }
                                ]
                            }
                        ]
                    },
                    "output": {
                        "format": "mp4",
                        "size": {
                            "width": 1024,
                            "height": 576
                        }
                    }
                }
            });
        }

        // Validação básica da estrutura do JSON
        if (!timelineData.timeline) {
            return res.status(400).json({
                success: false,
                message: "O JSON deve conter uma propriedade 'timeline'"
            });
        }

        if (!timelineData.output) {
            return res.status(400).json({
                success: false,
                message: "O JSON deve conter uma propriedade 'output'"
            });
        }

        // Verifica se deve aguardar a conclusão da renderização
        const waitForCompletion = req.query.wait === 'true' || req.body.waitForCompletion === true;
        
        console.log(`🎬 Iniciando renderização Shotstack${waitForCompletion ? ' (aguardando conclusão)' : ''}...`);

        // Inicia a renderização
        const result = await renderVideo(timelineData, waitForCompletion);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Erro ao processar renderização",
                error: result.error
            });
        }

        // Resposta baseada no tipo de processamento
        if (waitForCompletion) {
            // Se aguardou a conclusão, retorna o resultado completo
            res.json({
                success: true,
                message: "Vídeo renderizado com sucesso",
                data: {
                    id: result.id,
                    status: result.status,
                    url: result.url,
                    poster: result.poster,
                    thumbnail: result.thumbnail,
                    duration: result.duration,
                    renderTime: result.renderTime,
                    created: result.created,
                    updated: result.updated
                }
            });
        } else {
            // Se não aguardou, retorna estrutura compatível com React
            res.json({
                success: true,
                message: "Renderização iniciada com sucesso",
                data: {
                    id: result.renderId,
                    renderId: result.renderId,
                    status: result.status || 'queued',
                    statusCheckUrl: `/api/shotstack/status/${result.renderId}`
                }
            });
        }

    } catch (error) {
        console.error('❌ Erro na rota de renderização:', error);
        
        // Remove arquivo temporário se houver erro
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});

/**
 * GET /shotstack/status/:renderId
 * Verifica o status de uma renderização específica
 */
router.get("/shotstack/status/:renderId", async (req, res) => {
    try {
        const { renderId } = req.params;
        
        if (!renderId) {
            return res.status(400).json({
                success: false,
                message: "ID da renderização é obrigatório"
            });
        }

        console.log(`📊 Verificando status da renderização: ${renderId}`);

        const result = await checkRenderStatus(renderId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Erro ao verificar status da renderização",
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                id: result.id,
                status: result.status,
                url: result.url,
                poster: result.poster,
                thumbnail: result.thumbnail,
                duration: result.duration,
                renderTime: result.renderTime,
                created: result.created,
                updated: result.updated,
                error: result.error
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});

/**
 * POST /shotstack/wait/:renderId
 * Aguarda a conclusão de uma renderização com polling
 */
router.post("/shotstack/wait/:renderId", async (req, res) => {
    try {
        const { renderId } = req.params;
        const { maxWaitTime = 300, pollInterval = 5 } = req.body;
        
        if (!renderId) {
            return res.status(400).json({
                success: false,
                message: "ID da renderização é obrigatório"
            });
        }

        console.log(`⏳ Aguardando conclusão da renderização: ${renderId}`);

        const result = await waitForRenderCompletion(renderId, maxWaitTime, pollInterval);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Erro durante a espera pela renderização",
                error: result.error,
                status: result.status
            });
        }

        res.json({
            success: true,
            message: "Renderização concluída com sucesso",
            data: {
                id: result.id,
                status: result.status,
                url: result.url,
                poster: result.poster,
                thumbnail: result.thumbnail,
                duration: result.duration,
                renderTime: result.renderTime,
                created: result.created,
                updated: result.updated
            }
        });

    } catch (error) {
        console.error('❌ Erro ao aguardar renderização:', error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});

/**
 * GET /shotstack/health
 * Verifica se a API do Shotstack está acessível
 */
router.get("/shotstack/health", async (req, res) => {
    try {
        // Tenta fazer uma verificação de status com um ID fake para testar conectividade
        const testResult = await checkRenderStatus('test-connectivity');
        
        // Se chegou até aqui, a API está acessível (mesmo que retorne erro para ID inválido)
        res.json({
            success: true,
            message: "Shotstack API está acessível",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro de conectividade com Shotstack API",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
