import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import http from 'http';
import { uploadVideoToFirebase } from '../connectors/firebaseStorage.js';

class FFmpegService {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'outputs', 'videos');
        this.tempDir = path.join(process.cwd(), 'temp', 'processing');
        this.maskPath = path.join(process.cwd(), 'assets', 'masks', 'before_after_mask.mp4');
        this.jobs = new Map(); // Armazena status dos jobs
    }

    async init() {
        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(this.tempDir, { recursive: true });
        await fs.mkdir(path.join(process.cwd(), 'temp', 'uploads'), { recursive: true });
        
        // Verificar se a máscara estática existe
        try {
            await fs.access(this.maskPath);
            const stats = fsSync.statSync(this.maskPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ Máscara encontrada: ${this.maskPath}`);
            console.log(`📦 Tamanho da máscara: ${sizeMB} MB`);
        } catch (error) {
            console.error(`❌ ERRO: Máscara não encontrada!`);
            console.error(`📂 Esperado em: ${this.maskPath}`);
            console.error(`💡 Por favor, coloque o arquivo before_after_mask.mp4 em assets/masks/`);
            throw new Error('Arquivo de máscara before_after_mask.mp4 não encontrado em assets/masks/');
        }
        
        console.log('✅ FFmpeg Service inicializado');
    }

    /**
     * Baixa arquivo de URL
     */
    async downloadFile(url, outputPath, timeout = 60000) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            const file = fsSync.createWriteStream(outputPath);
            let timeoutId = null;
            
            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                file.close();
                try {
                    fsSync.unlinkSync(outputPath);
                } catch (e) {}
            };
            
            // Timeout de 60 segundos
            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Download timeout após ${timeout/1000}s: ${url}`));
            }, timeout);
            
            const request = client.get(url, (response) => {
                // Segue redirects (301, 302, 303, 307, 308)
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    cleanup();
                    console.log(`↪️  Seguindo redirect: ${response.headers.location}`);
                    this.downloadFile(response.headers.location, outputPath, timeout)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    cleanup();
                    reject(new Error(`Falha ao baixar: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);
                
                file.on('finish', () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    file.close();
                    console.log(`✅ Download concluído: ${path.basename(outputPath)}`);
                    resolve(outputPath);
                });
                
                file.on('error', (err) => {
                    cleanup();
                    reject(err);
                });
            });
            
            request.on('error', (err) => {
                cleanup();
                reject(err);
            });
            
            request.setTimeout(timeout, () => {
                request.destroy();
                cleanup();
                reject(new Error(`Request timeout após ${timeout/1000}s: ${url}`));
            });
        });
    }

    /**
     * Cria vídeo antes/depois a partir de URLs públicas
     * @param {string} beforeUrl - URL da imagem "antes"
     * @param {string} afterUrl - URL da imagem "depois"
     * @param {Object} options - Configurações
     */
    async createBeforeAfterFromUrls(beforeUrl, afterUrl, options = {}) {
        const jobId = uuidv4();
        const {
            duration = 10,
            width = 1280,
            height = 720,
            fps = 25,
            quality = 'high',
            direction = 'left',
            clientName
        } = options;

        this.updateJobStatus(jobId, 'queued', 0);

        console.log(`🎬 Iniciando processamento ${jobId} a partir de URLs...`);
        console.log(`  Before: ${beforeUrl}`);
        console.log(`  After: ${afterUrl}`);
        console.log(`  Direction: ${direction}`);

        // Processa de forma assíncrona
        this.processFromUrlsAsync(
            beforeUrl,
            afterUrl,
            { duration, width, height, fps, quality, direction, clientName },
            jobId
        );

        return {
            success: true,
            renderId: jobId,
            status: 'queued',
            message: 'Processamento de vídeo iniciado'
        };
    }

    /**
     * Processa vídeo a partir de URLs (assíncrono)
     */
    async processFromUrlsAsync(beforeUrl, afterUrl, options, jobId) {
        let beforePath = null;
        let afterPath = null;

        try {
            // Validar clientName
            if (!options.clientName || !options.clientName.trim()) {
                throw new Error('ClientName é obrigatório');
            }

            // Verificar se a máscara existe
            try {
                await fs.access(this.maskPath);
            } catch (error) {
                throw new Error('Arquivo de máscara não encontrado em: ' + this.maskPath);
            }

            this.updateJobStatus(jobId, 'downloading', 5);
            console.log(`📥 Baixando arquivos para ${jobId}...`);

            // Determina extensão a partir da URL
            const getExtension = (url) => {
                const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
                return match ? `.${match[1]}` : '.jpg';
            };

            // Gera nomes temporários
            beforePath = path.join(this.tempDir, `${jobId}-before${getExtension(beforeUrl)}`);
            afterPath = path.join(this.tempDir, `${jobId}-after${getExtension(afterUrl)}`);

            // Baixa arquivos em paralelo (timeout de 180s cada)
            await Promise.all([
                this.downloadFile(beforeUrl, beforePath, 180000),
                this.downloadFile(afterUrl, afterPath, 180000)
            ]);

            console.log(`✅ Downloads concluídos para ${jobId}`);
            this.updateJobStatus(jobId, 'processing', 20);

            // Usa máscara estática
            console.log(`🎭 Usando máscara estática: ${path.basename(this.maskPath)}`);

            this.updateJobStatus(jobId, 'processing', 25);

            // Processa vídeo
            const outputFilename = `before-after-${jobId}.mp4`;
            const outputPath = path.join(this.outputDir, outputFilename);

            await this.processVideoWithMask(
                beforePath,
                afterPath,
                this.maskPath,
                outputPath,
                options,
                jobId
            );

            // Upload para Firebase Storage
            this.updateJobStatus(jobId, 'uploading', 95);
            console.log(`☁️ Fazendo upload do vídeo para Firebase (cliente: ${options.clientName})...`);
            
            const firebaseUrl = await uploadVideoToFirebase(outputPath, options.clientName.trim());
            
            console.log(`✅ Upload para Firebase concluído: ${firebaseUrl}`);

            // Verifica tamanho
            const stats = await fs.stat(outputPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            this.updateJobStatus(jobId, 'done', 100, firebaseUrl);

            console.log(`✅ Vídeo ${jobId} processado e enviado ao Firebase`);
            console.log(`📦 Tamanho: ${sizeMB} MB`);
            console.log(`🌐 URL: ${firebaseUrl}`);

            // Limpa arquivos temporários e output local
            setTimeout(() => {
                this.cleanup([beforePath, afterPath, outputPath]);
            }, 5000);

        } catch (error) {
            console.error(`❌ Erro no processamento ${jobId}:`, error.message);
            this.updateJobStatus(jobId, 'failed', 0, null, error.message);

            // Limpa arquivos em caso de erro
            const filesToClean = [beforePath, afterPath].filter(Boolean);
            if (filesToClean.length > 0) {
                await this.cleanup(filesToClean);
            }
        }
    }

    /**
     * Cria vídeo antes/depois SEM precisar de máscara externa
     * Gera a máscara automaticamente
     */
    async createBeforeAfter(bottomImagePath, topImagePath, options = {}) {
        const jobId = uuidv4();
        const {
            duration = 10,
            width = 1280,
            height = 720,
            fps = 25,
            quality = 'high',
            direction = 'left' // 'left', 'right', 'up', 'down'
        } = options;

        const outputFilename = `before-after-${jobId}.mp4`;
        const outputPath = path.join(this.outputDir, outputFilename);

        this.updateJobStatus(jobId, 'queued', 0);

        console.log(`🎬 Criando vídeo antes/depois ${jobId} (direção: ${direction})...`);

        // Processa de forma assíncrona
        this.processBeforeAfterAsync(
            bottomImagePath,
            topImagePath,
            outputPath,
            { duration, width, height, fps, quality, direction },
            jobId
        );

        return {
            success: true,
            renderId: jobId,
            status: 'queued',
            message: 'Processamento de vídeo iniciado'
        };
    }

    /**
     * Processa vídeo antes/depois (usa máscara estática)
     */
    async processBeforeAfterAsync(bottomPath, topPath, outputPath, options, jobId) {
        try {
            this.updateJobStatus(jobId, 'processing', 5);

            // Verifica se a máscara existe
            try {
                await fs.access(this.maskPath);
            } catch (error) {
                throw new Error('Arquivo de máscara não encontrado em: ' + this.maskPath);
            }

            console.log(`🎭 Usando máscara estática: ${path.basename(this.maskPath)}`);
            
            this.updateJobStatus(jobId, 'processing', 20);

            // Processa vídeo com a máscara estática
            await this.processVideoWithMask(
                bottomPath,
                topPath,
                this.maskPath,
                outputPath,
                options,
                jobId
            );

            const publicUrl = `/outputs/videos/${path.basename(outputPath)}`;
            
            const stats = await fs.stat(outputPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            this.updateJobStatus(jobId, 'done', 100, publicUrl, null, outputPath);

            console.log(`✅ Vídeo ${jobId} processado com sucesso`);
            console.log(`📦 Tamanho: ${sizeMB} MB`);

        } catch (error) {
            console.error(`❌ Erro no processamento ${jobId}:`, error.message);
            this.updateJobStatus(jobId, 'failed', 0, null, error.message);
        }
    }

    /**
     * Cria vídeo com efeito Antes/Depois usando máscara
     * Equivalente ao código Python fornecido
     * @param {string} bottomImagePath - Imagem "por baixo" (antes)
     * @param {string} topImagePath - Imagem "por cima" (depois)
     * @param {string} maskVideoPath - Vídeo da máscara de revelação
     * @param {Object} options - Configurações
     */
    async createBeforeAfterWithMask(bottomImagePath, topImagePath, maskVideoPath, options = {}) {
        const jobId = uuidv4();
        const {
            duration = 10,
            width = 1280,
            height = 720,
            fps = 25,
            quality = 'high'
        } = options;

        const outputFilename = `before-after-${jobId}.mp4`;
        const outputPath = path.join(this.outputDir, outputFilename);

        // Inicializa job
        this.updateJobStatus(jobId, 'queued', 0);

        console.log(`🎬 Iniciando processamento do vídeo ${jobId} com máscara...`);

        // Processa de forma assíncrona
        this.processVideoWithMaskAsync(
            bottomImagePath,
            topImagePath,
            maskVideoPath,
            outputPath,
            { duration, width, height, fps, quality },
            jobId
        );

        return {
            success: true,
            renderId: jobId,
            status: 'queued',
            message: 'Processamento de vídeo iniciado'
        };
    }

    /**
     * Processa vídeo de forma assíncrona
     */
    async processVideoWithMaskAsync(bottomPath, topPath, maskPath, outputPath, options, jobId) {
        try {
            this.updateJobStatus(jobId, 'processing', 0);

            await this.processVideoWithMask(
                bottomPath,
                topPath,
                maskPath,
                outputPath,
                options,
                jobId
            );

            const publicUrl = `/outputs/videos/${path.basename(outputPath)}`;
            
            // Verifica se arquivo foi criado
            const stats = await fs.stat(outputPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            this.updateJobStatus(jobId, 'done', 100, publicUrl, null, outputPath);

            console.log(`✅ Vídeo ${jobId} processado com sucesso`);
            console.log(`📦 Tamanho: ${sizeMB} MB`);

        } catch (error) {
            console.error(`❌ Erro no processamento ${jobId}:`, error.message);
            this.updateJobStatus(jobId, 'failed', 0, null, error.message);
        }
    }

    /**
     * Executa o processamento FFmpeg com máscara
     * Equivalente ao código Python
     */
    processVideoWithMask(bottomPath, topPath, maskPath, outputPath, options, jobId) {
        return new Promise((resolve, reject) => {
            const { duration, width, height, fps, quality } = options;

            const qualityPresets = {
                low: { crf: 28, preset: 'veryfast' },
                medium: { crf: 23, preset: 'medium' },
                high: { crf: 18, preset: 'medium' } // Mudado de 'slow' para 'medium' para Cloud Run
            };

            const { crf, preset } = qualityPresets[quality] || qualityPresets.high;

            /**
             * Lógica equivalente ao Python:
             * 1. input_baixo (por_baixo): imagem de fundo em loop
             * 2. input_cima (por_cima): imagem de topo em loop
             * 3. input_mask (mascara): vídeo de máscara
             * 4. Escala todos para mesma resolução
             * 5. Aplica alphamerge na imagem de cima + máscara
             * 6. Overlay do resultado no fundo
             */
            const complexFilter = [
                // Escala imagem de baixo (fundo)
                `[0:v]scale=${width}:${height},setsar=1[baixo]`,
                
                // Escala imagem de cima
                `[1:v]scale=${width}:${height},setsar=1[cima]`,
                
                // Escala máscara
                `[2:v]scale=${width}:${height},setsar=1[mask]`,
                
                // Aplica alphamerge: combina imagem de cima com máscara
                `[cima][mask]alphamerge[top]`,
                
                // Overlay final: coloca 'top' sobre 'baixo'
                `[baixo][top]overlay=0:0[final]`
            ].join(';');

            console.log('🎥 Iniciando FFmpeg com filtro complexo...');
            console.log(`📍 Verificando arquivos de entrada:`);
            console.log(`   Bottom: ${bottomPath} (existe: ${require('fs').existsSync(bottomPath)})`);
            console.log(`   Top: ${topPath} (existe: ${require('fs').existsSync(topPath)})`);
            console.log(`   Mask: ${maskPath} (existe: ${require('fs').existsSync(maskPath)})`);
            console.log(`📍 Output será: ${outputPath}`);
            console.log(`📍 Preset: ${preset}, CRF: ${crf}, Duração: ${duration}s`);

            ffmpeg()
                // Input 0: imagem de baixo (por_baixo) - loop
                .input(bottomPath)
                .inputOptions([
                    '-loop 1',
                    `-t ${duration}`,
                    `-framerate ${fps}`
                ])
                
                // Input 1: imagem de cima (por_cima) - loop
                .input(topPath)
                .inputOptions([
                    '-loop 1',
                    `-t ${duration}`,
                    `-framerate ${fps}`
                ])
                
                // Input 2: vídeo de máscara
                .input(maskPath)
                
                // Aplica filtro complexo
                .complexFilter(complexFilter)
                
                // Opções de output
                .outputOptions([
                    '-map [final]',
                    '-c:v libx264',
                    `-preset ${preset}`,
                    `-crf ${crf}`,
                    '-pix_fmt yuv420p',
                    `-t ${duration}`,
                    '-movflags +faststart'
                ])
                .output(outputPath)
                
                // Sobrescreve se já existir
                .on('start', (commandLine) => {
                    console.log('📝 Comando FFmpeg:', commandLine);
                    console.log('⏱️  Iniciando execução FFmpeg...');
                })
                
                .on('progress', (progress) => {
                    const percent = Math.min(Math.round(progress.percent || 0), 99);
                    this.updateJobStatus(jobId, 'processing', percent);
                    console.log(`📊 Progresso ${jobId}: ${percent}% | frames: ${progress.frames || 0} | fps: ${progress.currentFps || 0} | time: ${progress.timemark || '0'}`);
                })
                
                .on('end', () => {
                    console.log('✅ Processamento FFmpeg concluído');
                    console.log(`📁 Arquivo gerado: ${outputPath}`);
                    resolve();
                })
                
                .on('error', (err, stdout, stderr) => {
                    console.error('❌ ERRO no FFmpeg:');
                    console.error('📄 STDOUT:', stdout);
                    console.error('📄 STDERR:', stderr);
                    console.error('📄 Error message:', err.message);
                    reject(new Error(stderr || err.message));
                })
                
                .run();
        });
    }

    /**
     * Atualiza status do job (igual ao Shotstack)
     */
    updateJobStatus(jobId, status, progress = 0, url = null, error = null, localPath = null) {
        const job = {
            id: jobId,
            status, // queued, processing, done, failed
            progress,
            url,
            localPath,
            error,
            created: this.jobs.get(jobId)?.created || new Date().toISOString(),
            updated: new Date().toISOString()
        };

        this.jobs.set(jobId, job);
    }

    /**
     * Verifica status de um job (igual ao checkRenderStatus do Shotstack)
     */
    async checkRenderStatus(renderId) {
        const job = this.jobs.get(renderId);
        
        if (!job) {
            return {
                success: false,
                error: 'Renderização não encontrada',
                status: 'error'
            };
        }

        return {
            success: true,
            id: job.id,
            status: job.status,
            url: job.url,
            localPath: job.localPath,
            progress: job.progress,
            error: job.error,
            created: job.created,
            updated: job.updated
        };
    }

    /**
     * Aguarda conclusão (igual ao waitForRenderCompletion do Shotstack)
     */
    async waitForRenderCompletion(renderId, maxWaitTime = 300, pollInterval = 2) {
        const startTime = Date.now();
        const maxWaitMs = maxWaitTime * 1000;
        
        console.log(`⏳ Aguardando conclusão da renderização ${renderId}...`);
        
        while (Date.now() - startTime < maxWaitMs) {
            const result = await this.checkRenderStatus(renderId);
            
            if (!result.success) {
                return result;
            }
            
            console.log(`📊 Status: ${result.status} (${result.progress}%)`);
            
            if (result.status === 'done') {
                console.log(`✅ Renderização concluída! URL: ${result.url}`);
                return result;
            }
            
            if (result.status === 'failed') {
                console.log(`❌ Renderização falhou: ${result.error}`);
                return result;
            }
            
            await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
        }
        
        return {
            success: false,
            error: `Timeout: Renderização não foi concluída em ${maxWaitTime} segundos`,
            status: 'timeout'
        };
    }

    /**
     * Limpa arquivos temporários
     */
    async cleanup(filePaths) {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
                console.log(`🗑️  Arquivo removido: ${filePath}`);
            } catch (error) {
                console.error(`⚠️  Erro ao remover ${filePath}:`, error.message);
            }
        }
    }

    /**
     * Limpa jobs antigos (executa periodicamente)
     */
    cleanOldJobs(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
        const now = Date.now();
        let cleaned = 0;

        for (const [jobId, job] of this.jobs.entries()) {
            const jobAge = now - new Date(job.created).getTime();
            
            if (jobAge > maxAge && (job.status === 'done' || job.status === 'failed')) {
                this.jobs.delete(jobId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} jobs antigos removidos da memória`);
        }
    }

    /**
     * Limpa jobs antigos e travados (forçado via endpoint)
     */
    async cleanupOldJobs(olderThanMinutes = 30) {
        const now = Date.now();
        const cutoffTime = now - (olderThanMinutes * 60 * 1000);
        let cleaned = 0;
        let total = this.jobs.size;

        for (const [jobId, job] of this.jobs.entries()) {
            const jobTime = new Date(job.created).getTime();
            const updatedTime = new Date(job.updated).getTime();
            
            // Remove jobs antigos ou travados em processing
            if (jobTime < cutoffTime || 
                (job.status === 'processing' && updatedTime < cutoffTime)) {
                this.jobs.delete(jobId);
                cleaned++;
                console.log(`🗑️  Job removido: ${jobId} (status: ${job.status}, created: ${job.created})`);
            }
        }

        return {
            success: true,
            message: `Limpeza concluída: ${cleaned} de ${total} jobs removidos`,
            cleaned,
            remaining: this.jobs.size
        };
    }
}

export default new FFmpegService();
