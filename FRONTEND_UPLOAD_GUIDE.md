# Upload de Arquivos para ShotStack - Guia do Frontend

## Visão Geral

O ShotStack trabalha exclusivamente com **URLs públicas** de arquivos. Se o front-end possui apenas arquivos locais, é necessário primeiro fazer upload desses arquivos para um storage público antes de usar a API de edição.

## Opções de Upload

### 1. Upload para Storage Próprio (Recomendado)

Se você já possui um sistema de storage (AWS S3, Google Cloud Storage, etc.):

```javascript
// Exemplo com AWS S3
async function uploadParaS3(arquivo) {
    const formData = new FormData();
    formData.append('file', arquivo);
    
    const response = await fetch('/api/upload/s3', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    return result.url; // URL pública do arquivo
}

// Uso
const arquivoVideo = document.getElementById('file-input').files[0];
const urlPublica = await uploadParaS3(arquivoVideo);
```

### 2. Upload via ShotStack Ingest API

O ShotStack oferece uma API de ingest para transformar uploads em URLs:

```javascript
async function uploadViaShotStackIngest(arquivo) {
    try {
        // 1. Primeiro, obter uma URL de upload assinada
        const uploadResponse = await fetch('/api/shotstack/ingest/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: arquivo.name,
                filesize: arquivo.size
            })
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
            throw new Error(uploadData.message);
        }
        
        // 2. Fazer upload do arquivo para a URL assinada
        const uploadFileResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: arquivo,
            headers: {
                'Content-Type': arquivo.type
            }
        });
        
        if (!uploadFileResponse.ok) {
            throw new Error('Falha no upload do arquivo');
        }
        
        // 3. Confirmar o upload e obter a URL pública
        const confirmResponse = await fetch('/api/shotstack/ingest/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uploadId: uploadData.uploadId
            })
        });
        
        const confirmData = await confirmResponse.json();
        
        if (!confirmData.success) {
            throw new Error(confirmData.message);
        }
        
        return confirmData.url; // URL pública para usar na timeline
        
    } catch (error) {
        console.error('Erro no upload via ShotStack:', error);
        throw error;
    }
}
```

### 3. Implementação Completa com Upload

Aqui está um exemplo completo que combina upload de arquivos com edição:

```javascript
class VideoEditorComUpload {
    constructor() {
        this.arquivosUploadados = new Map();
    }
    
    // Upload de um arquivo e cache da URL
    async uploadArquivo(arquivo, tipo = 'video') {
        const cacheKey = `${arquivo.name}-${arquivo.size}`;
        
        // Verificar se já foi uploadado
        if (this.arquivosUploadados.has(cacheKey)) {
            return this.arquivosUploadados.get(cacheKey);
        }
        
        try {
            // Mostrar progresso
            this.mostrarProgressoUpload(arquivo.name, 0);
            
            // Escolher método de upload (substitua pela sua implementação)
            const url = await this.uploadParaStorage(arquivo, (progresso) => {
                this.mostrarProgressoUpload(arquivo.name, progresso);
            });
            
            // Cache da URL
            this.arquivosUploadados.set(cacheKey, url);
            this.esconderProgressoUpload(arquivo.name);
            
            return url;
            
        } catch (error) {
            this.mostrarErroUpload(arquivo.name, error.message);
            throw error;
        }
    }
    
    // Upload múltiplos arquivos
    async uploadMultiplosArquivos(arquivos) {
        const urls = [];
        
        for (const arquivo of arquivos) {
            const url = await this.uploadArquivo(arquivo);
            urls.push(url);
        }
        
        return urls;
    }
    
    // Processar formulário com arquivos locais
    async processarFormularioComArquivos() {
        try {
            // Coletar arquivos de vídeo
            const videosFiles = Array.from(document.querySelectorAll('.video-file-input'))
                .map(input => input.files[0])
                .filter(file => file);
            
            // Coletar arquivos de áudio
            const audiosFiles = Array.from(document.querySelectorAll('.audio-file-input'))
                .map(input => input.files[0])
                .filter(file => file);
            
            // Arquivo de música de fundo
            const musicaFile = document.getElementById('musica-file-input').files[0];
            
            if (videosFiles.length === 0) {
                throw new Error('Pelo menos um vídeo deve ser selecionado');
            }
            
            if (audiosFiles.length !== videosFiles.length) {
                throw new Error('Número de áudios deve ser igual ao número de vídeos');
            }
            
            // Upload dos arquivos
            console.log('Iniciando uploads...');
            
            const videosUrls = await this.uploadMultiplosArquivos(videosFiles);
            const audiosUrls = await this.uploadMultiplosArquivos(audiosFiles);
            const musicaUrl = musicaFile ? await this.uploadArquivo(musicaFile) : null;
            
            // Criar dados para renderização
            const dados = {
                videos: videosUrls,
                audios: audiosUrls,
                musicaFundo: musicaUrl,
                duracoes: Array.from(document.querySelectorAll('.video-duration'))
                    .map(input => parseInt(input.value)),
                volumes: Array.from(document.querySelectorAll('.audio-volume'))
                    .map(input => parseFloat(input.value))
            };
            
            // Renderizar vídeo
            return await this.renderizarVideo(dados);
            
        } catch (error) {
            console.error('Erro no processamento:', error);
            throw error;
        }
    }
    
    // Método de upload - implementar conforme seu backend
    async uploadParaStorage(arquivo, callbackProgresso) {
        // Exemplo genérico - substitua pela sua implementação
        const formData = new FormData();
        formData.append('file', arquivo);
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Monitorar progresso
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentual = Math.round((event.loaded / event.total) * 100);
                    callbackProgresso(percentual);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.url);
                } else {
                    reject(new Error(`Erro no upload: ${xhr.status}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Erro de rede no upload'));
            });
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        });
    }
    
    // Renderizar vídeo (usando os métodos já criados)
    async renderizarVideo(dados) {
        const timeline = this.criarTimeline(dados);
        
        const response = await fetch('/api/shotstack/render', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                timeline,
                output: { format: "mp4", resolution: "hd" }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            return await this.aguardarRenderizacao(result.renderId);
        } else {
            throw new Error(result.message);
        }
    }
    
    // Utilitários de UI para progresso de upload
    mostrarProgressoUpload(nomeArquivo, percentual) {
        // Implementar UI de progresso
        console.log(`Upload ${nomeArquivo}: ${percentual}%`);
    }
    
    esconderProgressoUpload(nomeArquivo) {
        console.log(`Upload ${nomeArquivo}: Concluído`);
    }
    
    mostrarErroUpload(nomeArquivo, erro) {
        console.error(`Erro no upload ${nomeArquivo}:`, erro);
    }
    
    // Outros métodos (criarTimeline, aguardarRenderizacao, etc.)
    // ... (usar os métodos dos exemplos anteriores)
}

// Uso da classe
const editor = new VideoEditorComUpload();

// Processar formulário quando o usuário clicar em "Renderizar"
document.getElementById('btn-renderizar').addEventListener('click', async () => {
    try {
        const videoUrl = await editor.processarFormularioComArquivos();
        console.log('Vídeo finalizado:', videoUrl);
    } catch (error) {
        console.error('Erro:', error);
    }
});
```

## Implementação no Backend (Node.js)

### Rota para Upload Próprio

```javascript
// routes/upload.js
import express from "express";
import multer from "multer";
import AWS from "aws-sdk";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configurar AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

router.post("/upload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Nenhum arquivo enviado"
            });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        const result = await s3.upload(uploadParams).promise();

        res.json({
            success: true,
            url: result.Location,
            filename: fileName
        });

    } catch (error) {
        console.error("Erro no upload:", error);
        res.status(500).json({
            success: false,
            message: "Erro no upload",
            error: error.message
        });
    }
});

export default router;
```

### Rotas para ShotStack Ingest API

```javascript
// Adicionar ao connectors/shotstack.js

export async function criarUploadUrl(filename, filesize) {
    try {
        const response = await fetch(`${API_BASE_URL}/ingest/sources`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename,
                filesize
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao criar URL de upload');
        }

        return {
            success: true,
            uploadId: data.response.id,
            uploadUrl: data.response.url
        };

    } catch (error) {
        console.error('Erro ao criar URL de upload:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

export async function confirmarUpload(uploadId) {
    try {
        const response = await fetch(`${API_BASE_URL}/ingest/sources/${uploadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao confirmar upload');
        }

        return {
            success: true,
            url: data.response.url,
            status: data.response.status
        };

    } catch (error) {
        console.error('Erro ao confirmar upload:', error);
        return {
            success: false,
            message: error.message
        };
    }
}
```

### Rotas para Ingest

```javascript
// Adicionar ao routes/sendShotStack.js

// Criar URL de upload
router.post("/shotstack/ingest/upload-url", async (req, res) => {
    try {
        const { filename, filesize } = req.body;

        if (!filename || !filesize) {
            return res.status(400).json({
                success: false,
                message: "Filename e filesize são obrigatórios"
            });
        }

        const result = await criarUploadUrl(filename, filesize);
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/ingest/upload-url:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});

// Confirmar upload
router.post("/shotstack/ingest/confirm", async (req, res) => {
    try {
        const { uploadId } = req.body;

        if (!uploadId) {
            return res.status(400).json({
                success: false,
                message: "uploadId é obrigatório"
            });
        }

        const result = await confirmarUpload(uploadId);
        res.json(result);

    } catch (error) {
        console.error("Erro na rota /shotstack/ingest/confirm:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor",
            error: error.message
        });
    }
});
```

## Resumo das Opções

1. **URLs Diretas**: Se já possui arquivos em URLs públicas, use diretamente
2. **Upload Próprio**: Para máximo controle, implemente upload para seu storage
3. **ShotStack Ingest**: Para simplicidade, use a API de ingest do ShotStack

O exemplo HTML criado anteriormente funciona com URLs diretas. Para arquivos locais, adapte usando os métodos de upload mostrados acima.
