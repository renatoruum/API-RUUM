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
    createImageSlideshow,
    validateTimeline,
    diagnoseShotstack,
    testShotstackAuth,
    testShotstackRender
} from "../connectors/shotstack.js";

const router = express.Router();

// Configuração do multer para upload de áudio
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        // Criar diretório se não existir
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único para o arquivo
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});

const audioUpload = multer({
    storage: audioStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        console.log(`🔍 Verificando arquivo: ${file.originalname}, MIME: ${file.mimetype}`);
        
        // Verificar se é um arquivo de áudio
        const allowedMimes = [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/ogg',
            'audio/aac',
            'audio/webm',
            'audio/x-m4a',
            'audio/aiff',
            'audio/x-aiff'
        ];
        
        // Verificar extensão do arquivo como fallback
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.webm', '.m4a', '.aiff'];
        
        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            console.log(`✅ Arquivo aceito: ${file.originalname}`);
            cb(null, true);
        } else {
            console.log(`❌ Arquivo rejeitado: ${file.originalname} (MIME: ${file.mimetype}, EXT: ${ext})`);
            cb(new Error(`Tipo de arquivo não suportado. MIME: ${file.mimetype}, Extensão: ${ext}`));
        }
    }
});

// Função para limpar arquivos antigos (executar periodicamente)
const cleanupOldAudioFiles = () => {
    const audioDir = path.join(process.cwd(), 'uploads', 'audio');
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas em ms
    
    if (!fs.existsSync(audioDir)) return;
    
    try {
        const files = fs.readdirSync(audioDir);
        files.forEach(file => {
            const filePath = path.join(audioDir, file);
            const stats = fs.statSync(filePath);
            
            if (Date.now() - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Arquivo de áudio antigo removido: ${file}`);
            }
        });
    } catch (error) {
        console.error('Erro ao limpar arquivos antigos:', error);
    }
};

// Executar limpeza a cada hora
setInterval(cleanupOldAudioFiles, 60 * 60 * 1000);

// Rota para upload de áudio
router.post("/audio/upload", (req, res) => {
    console.log("📤 Recebendo upload de áudio...");
    
    audioUpload.single('audio')(req, res, async (err) => {
        try {
            if (err) {
                console.error("Erro do multer:", err);
                return res.status(400).json({
                    success: false,
                    message: "Erro no upload de áudio",
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum arquivo de áudio foi enviado"
                });
            }

            const audioId = path.parse(req.file.filename).name;
            const audioUrl = `${req.protocol}://${req.get('host')}/api/audio/${audioId}`;

            console.log(`✅ Upload de áudio realizado: ${req.file.filename}`);
            console.log(`🔗 URL pública: ${audioUrl}`);

            res.json({
                success: true,
                message: "Upload de áudio realizado com sucesso",
                audioId: audioId,
                url: audioUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            });

        } catch (error) {
            console.error("Erro no upload de áudio:", error);
            res.status(500).json({
                success: false,
                message: "Erro interno no upload de áudio",
                error: error.message
            });
        }
    });
});

// Rota para testar configuração do multer
router.get("/audio/test-config", (req, res) => {
    try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        
        // Verificar se diretório existe
        const dirExists = fs.existsSync(uploadDir);
        
        // Tentar criar diretório se não existir
        if (!dirExists) {
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("✅ Diretório uploads/audio criado");
            } catch (mkdirError) {
                console.error("❌ Erro ao criar diretório:", mkdirError);
                return res.status(500).json({
                    success: false,
                    message: "Erro ao criar diretório de uploads",
                    error: mkdirError.message,
                    uploadDir: uploadDir
                });
            }
        }
        
        // Verificar permissões
        let canWrite = false;
        try {
            fs.accessSync(uploadDir, fs.constants.W_OK);
            canWrite = true;
        } catch (accessError) {
            console.error("❌ Sem permissão de escrita:", accessError);
        }
        
        res.json({
            success: true,
            message: "Configuração testada",
            config: {
                uploadDir: uploadDir,
                dirExists: fs.existsSync(uploadDir),
                canWrite: canWrite,
                cwd: process.cwd()
            }
        });
        
    } catch (error) {
        console.error("Erro no teste de configuração:", error);
        res.status(500).json({
            success: false,
            message: "Erro no teste de configuração",
            error: error.message
        });
    }
});

// Rota para servir arquivos de áudio publicamente
router.get("/audio/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID do áudio é obrigatório"
            });
        }

        const audioDir = path.join(process.cwd(), 'uploads', 'audio');
        
        // Procurar arquivo com o ID (independente da extensão)
        const files = fs.readdirSync(audioDir);
        const audioFile = files.find(file => file.startsWith(id));

        if (!audioFile) {
            return res.status(404).json({
                success: false,
                message: "Arquivo de áudio não encontrado"
            });
        }

        const audioPath = path.join(audioDir, audioFile);
        
        // Verificar se arquivo existe
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({
                success: false,
                message: "Arquivo de áudio não encontrado"
            });
        }

        // Obter informações do arquivo
        const stats = fs.statSync(audioPath);
        const ext = path.extname(audioFile).toLowerCase();
        
        // Determinar Content-Type baseado na extensão
        const contentTypes = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.aac': 'audio/aac',
            '.webm': 'audio/webm'
        };

        const contentType = contentTypes[ext] || 'audio/mpeg';

        // Configurar headers para cache e streaming
        res.set({
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
            'Accept-Ranges': 'bytes',
            'Content-Disposition': `inline; filename="${audioFile}"`
        });

        // Stream do arquivo para o cliente
        const stream = fs.createReadStream(audioPath);
        stream.pipe(res);

    } catch (error) {
        console.error("Erro ao servir áudio:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao servir áudio",
            error: error.message
        });
    }
});

// Rota para deletar arquivo de áudio (opcional)
router.delete("/audio/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID do áudio é obrigatório"
            });
        }

        const audioDir = path.join(process.cwd(), 'uploads', 'audio');
        
        // Procurar arquivo com o ID
        const files = fs.readdirSync(audioDir);
        const audioFile = files.find(file => file.startsWith(id));

        if (!audioFile) {
            return res.status(404).json({
                success: false,
                message: "Arquivo de áudio não encontrado"
            });
        }

        const audioPath = path.join(audioDir, audioFile);
        
        // Remover arquivo
        fs.unlinkSync(audioPath);
        
        console.log(`🗑️ Arquivo de áudio removido: ${audioFile}`);

        res.json({
            success: true,
            message: "Arquivo de áudio removido com sucesso",
            audioId: id,
            filename: audioFile
        });

    } catch (error) {
        console.error("Erro ao deletar áudio:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao deletar áudio",
            error: error.message
        });
    }
});

// Rota para listar arquivos de áudio (debug/admin)
router.get("/audio", async (req, res) => {
    try {
        const audioDir = path.join(process.cwd(), 'uploads', 'audio');
        
        if (!fs.existsSync(audioDir)) {
            return res.json({
                success: true,
                message: "Diretório de áudio não existe",
                files: []
            });
        }

        const files = fs.readdirSync(audioDir);
        const audioFiles = files.map(file => {
            const filePath = path.join(audioDir, file);
            const stats = fs.statSync(filePath);
            const audioId = path.parse(file).name;
            
            return {
                id: audioId,
                filename: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `${req.protocol}://${req.get('host')}/api/audio/${audioId}`
            };
        });

        res.json({
            success: true,
            message: "Lista de arquivos de áudio",
            count: audioFiles.length,
            files: audioFiles
        });

    } catch (error) {
        console.error("Erro ao listar áudios:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao listar áudios",
            error: error.message
        });
    }
});

// Rota para iniciar renderização (modo async)
router.post("/shotstack/render", async (req, res) => {
    try {
        const { timeline, output } = req.body;

        // Validação básica
        if (!timeline) {
            return res.status(400).json({
                success: false,
                message: "Timeline é obrigatória"
            });
        }

        if (!validateTimeline(timeline)) {
            return res.status(400).json({
                success: false,
                message: "Timeline inválida. Deve conter pelo menos uma track com clips."
            });
        }

        // Inicia renderização
        const result = await startRender(timeline, output);
        
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/render:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});

// Rota para verificar status da renderização
router.get("/shotstack/status/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID da renderização é obrigatório"
            });
        }

        const result = await checkRenderStatus(id);
        
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/status:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao verificar status",
            error: error.message
        });
    }
});

// Rota para renderizar e aguardar conclusão (modo sync)
router.post("/shotstack/render-sync", async (req, res) => {
    try {
        const { timeline, output, timeout = 300000 } = req.body; // 5 minutos default

        // Validação básica
        if (!timeline) {
            return res.status(400).json({
                success: false,
                message: "Timeline é obrigatória"
            });
        }

        if (!validateTimeline(timeline)) {
            return res.status(400).json({
                success: false,
                message: "Timeline inválida"
            });
        }

        // Configurar timeout da requisição
        req.setTimeout(timeout);

        // Renderizar e aguardar conclusão
        const result = await renderVideo(timeline, output, true);
        
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/render-sync:", error);
        
        if (error.message.includes("Timeout")) {
            return res.status(408).json({
                success: false,
                message: "Timeout na renderização",
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Erro na renderização",
            error: error.message
        });
    }
});

// Rota para criar slideshow de imagens
router.post("/shotstack/slideshow", async (req, res) => {
    try {
        const { 
            images, 
            duration = 3, 
            output = {}, 
            soundtrack = null, 
            transition = "fade",
            textOverlay = null,
            waitForCompletion = false
        } = req.body;

        // Validação
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Array de imagens é obrigatório e deve conter pelo menos uma imagem"
            });
        }

        // Validar URLs das imagens
        const invalidImages = images.filter(img => {
            try {
                new URL(img);
                return false;
            } catch {
                return true;
            }
        });

        if (invalidImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "URLs de imagens inválidas encontradas",
                invalidImages
            });
        }

        // Criar timeline para slideshow
        const timeline = createImageSlideshow(images, duration, {
            soundtrack,
            transition,
            textOverlay
        });

        // Renderizar
        const result = await renderVideo(timeline, output, waitForCompletion);
        
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/slideshow:", error);
        res.status(500).json({
            success: false,
            message: "Erro na criação do slideshow",
            error: error.message
        });
    }
});

// Rota para templates pré-definidos
router.post("/shotstack/template/:templateName", async (req, res) => {
    try {
        const { templateName } = req.params;
        const { data, output = {}, waitForCompletion = false } = req.body;

        let timeline;

        switch (templateName) {
            case "property-showcase":
                timeline = createPropertyShowcaseTemplate(data);
                break;
            case "image-gallery":
                timeline = createImageGalleryTemplate(data);
                break;
            case "promotional-video":
                timeline = createPromotionalVideoTemplate(data);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Template '${templateName}' não encontrado`,
                    availableTemplates: ["property-showcase", "image-gallery", "promotional-video"]
                });
        }

        const result = await renderVideo(timeline, output, waitForCompletion);
        
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/template:", error);
        res.status(500).json({
            success: false,
            message: "Erro na renderização do template",
            error: error.message
        });
    }
});

// Rota para polling com Server-Sent Events (tempo real)
router.get("/shotstack/status-stream/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID da renderização é obrigatório"
            });
        }

        // Configurar headers para SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Enviar dados iniciais
        res.write('data: {"type": "connected", "message": "Conexão estabelecida"}\n\n');

        const pollInterval = setInterval(async () => {
            try {
                const result = await checkRenderStatus(id);
                
                // Enviar status atual
                res.write(`data: ${JSON.stringify({
                    type: 'status',
                    ...result,
                    timestamp: new Date().toISOString()
                })}\n\n`);

                // Se concluído ou falhou, encerrar stream
                if (result.status === 'done' || result.status === 'failed') {
                    res.write(`data: ${JSON.stringify({
                        type: 'complete',
                        finalStatus: result.status,
                        url: result.url
                    })}\n\n`);
                    
                    clearInterval(pollInterval);
                    res.end();
                }

            } catch (error) {
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                })}\n\n`);
                
                clearInterval(pollInterval);
                res.end();
            }
        }, 3000); // Polling a cada 3 segundos

        // Cleanup quando cliente desconecta
        req.on('close', () => {
            clearInterval(pollInterval);
            res.end();
        });

        req.on('end', () => {
            clearInterval(pollInterval);
            res.end();
        });

    } catch (error) {
        console.error("Erro na rota /shotstack/status-stream:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao iniciar stream de status",
            error: error.message
        });
    }
});

// Rota para polling com timeout configurável
router.get("/shotstack/poll/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { timeout = 300000, interval = 5000 } = req.query; // 5 min timeout, 5s interval

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID da renderização é obrigatório"
            });
        }

        const startTime = Date.now();
        const maxWait = parseInt(timeout);
        const pollInterval = parseInt(interval);

        // Função de polling
        const poll = async () => {
            const result = await checkRenderStatus(id);
            
            // Se concluído, retornar resultado
            if (result.status === 'done' || result.status === 'failed') {
                return res.json({
                    success: true,
                    completed: true,
                    duration: Date.now() - startTime,
                    ...result
                });
            }

            // Se ainda em progresso e não expirou timeout
            if (Date.now() - startTime < maxWait) {
                setTimeout(poll, pollInterval);
            } else {
                // Timeout
                return res.json({
                    success: false,
                    completed: false,
                    timeout: true,
                    duration: Date.now() - startTime,
                    message: "Timeout: renderização ainda em progresso",
                    lastStatus: result
                });
            }
        };

        // Iniciar polling
        await poll();

    } catch (error) {
        console.error("Erro na rota /shotstack/poll:", error);
        res.status(500).json({
            success: false,
            message: "Erro no polling",
            error: error.message
        });
    }
});

// Rota para diagnóstico da API ShotStack
router.get("/shotstack/diagnose", async (req, res) => {
    try {
        console.log("🔍 Iniciando diagnóstico ShotStack via API...");
        
        const results = await diagnoseShotstack();
        
        // Determinar status HTTP baseado nos resultados
        const statusCode = results.tests.authentication.success ? 200 : 500;
        
        res.status(statusCode).json({
            success: results.tests.authentication.success,
            message: results.tests.authentication.success ? 
                "Diagnóstico concluído com sucesso" : 
                "Problemas detectados na configuração ShotStack",
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Erro na rota /shotstack/diagnose:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao executar diagnóstico",
            error: error.message
        });
    }
});

// Rota para teste rápido de autenticação
router.get("/shotstack/test-auth", async (req, res) => {
    try {
        console.log("🔑 Testando autenticação ShotStack...");
        
        const result = await testShotstackAuth();
        
        const statusCode = result.success ? 200 : 401;
        
        res.status(statusCode).json({
            success: result.success,
            message: result.message,
            error: result.error,
            details: result.details,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Erro na rota /shotstack/test-auth:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao testar autenticação",
            error: error.message
        });
    }
});

// Rota para teste de renderização mínima
router.post("/shotstack/test-render", async (req, res) => {
    try {
        console.log("🧪 Testando renderização mínima...");
        
        const result = await testShotstackRender();
        
        const statusCode = result.success ? 200 : 400;
        
        res.status(statusCode).json({
            success: result.success,
            message: result.message,
            renderId: result.renderId,
            error: result.error,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Erro na rota /shotstack/test-render:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao testar renderização",
            error: error.message
        });
    }
});

// Rota para diagnóstico de upload
router.get("/shotstack/audio-debug", (req, res) => {
    try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        
        // Verificar se diretório existe
        const dirExists = fs.existsSync(uploadDir);
        
        // Tentar criar diretório se não existir
        if (!dirExists) {
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("✅ Diretório uploads/audio criado");
            } catch (mkdirError) {
                console.error("❌ Erro ao criar diretório:", mkdirError);
                return res.status(500).json({
                    success: false,
                    message: "Erro ao criar diretório de uploads",
                    error: mkdirError.message,
                    uploadDir: uploadDir
                });
            }
        }
        
        // Verificar permissões
        let canWrite = false;
        try {
            fs.accessSync(uploadDir, fs.constants.W_OK);
            canWrite = true;
        } catch (accessError) {
            console.error("❌ Sem permissão de escrita:", accessError);
        }
        
        res.json({
            success: true,
            message: "Configuração testada",
            config: {
                uploadDir: uploadDir,
                dirExists: fs.existsSync(uploadDir),
                canWrite: canWrite,
                cwd: process.cwd(),
                platform: process.platform,
                env: process.env.NODE_ENV || 'development'
            }
        });
        
    } catch (error) {
        console.error("Erro no teste de configuração:", error);
        res.status(500).json({
            success: false,
            message: "Erro no teste de configuração",
            error: error.message
        });
    }
});

// Funções auxiliares para templates
function createPropertyShowcaseTemplate(data) {
    const { images, title, description, duration = 4 } = data;
    
    const imageClips = images.map((img, index) => ({
        asset: {
            type: "image",
            src: img
        },
        start: index * duration,
        length: duration,
        effect: "zoomIn"
    }));

    const timeline = {
        tracks: [
            {
                clips: imageClips
            }
        ]
    };

    if (title) {
        timeline.tracks.push({
            clips: [{
                asset: {
                    type: "title",
                    text: title,
                    style: "future",
                    color: "#ffffff",
                    size: "large"
                },
                start: 0,
                length: 3,
                position: "center"
            }]
        });
    }

    return timeline;
}

function createImageGalleryTemplate(data) {
    const { images, duration = 2, transition = "slideLeft" } = data;
    
    return {
        tracks: [{
            clips: images.map((img, index) => ({
                asset: {
                    type: "image",
                    src: img
                },
                start: index * duration,
                length: duration,
                effect: transition
            }))
        }]
    };
}

function createPromotionalVideoTemplate(data) {
    const { images, title, subtitle, soundtrack, duration = 5 } = data;
    
    const timeline = {
        tracks: [
            {
                clips: images.map((img, index) => ({
                    asset: {
                        type: "image",
                        src: img
                    },
                    start: index * duration,
                    length: duration,
                    effect: "zoomIn"
                }))
            }
        ]
    };

    // Adicionar trilha sonora
    if (soundtrack) {
        timeline.soundtrack = {
            src: soundtrack,
            effect: "fadeIn"
        };
    }

    // Adicionar textos
    if (title) {
        timeline.tracks.push({
            clips: [{
                asset: {
                    type: "title",
                    text: title,
                    style: "future",
                    color: "#ffffff",
                    size: "large"
                },
                start: 0,
                length: 3,
                position: "center"
            }]
        });
    }

    if (subtitle) {
        timeline.tracks.push({
            clips: [{
                asset: {
                    type: "title",
                    text: subtitle,
                    style: "minimal",
                    color: "#cccccc",
                    size: "medium"
                },
                start: 1,
                length: 4,
                position: "bottom"
            }]
        });
    }

    return timeline;
}

export default router;
