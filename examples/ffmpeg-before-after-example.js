/**
 * Exemplo de uso do endpoint FFmpeg Before/After
 * Demonstra como criar vídeos com efeito de revelação usando máscara
 */

// ========================================
// 1. EXEMPLO BÁSICO - cURL
// ========================================

/*
# Upload de arquivos e criação do vídeo
curl -X POST http://localhost:3000/api/ffmpeg/before-after \
  -F "bottom=@/caminho/para/imagem_antes.jpg" \
  -F "top=@/caminho/para/imagem_depois.jpg" \
  -F "mask=@/caminho/para/mascara.mp4" \
  -F "duration=10" \
  -F "quality=high"

# Resposta:
# {
#   "success": true,
#   "renderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
#   "status": "queued",
#   "message": "Processamento de vídeo iniciado"
# }
*/

// ========================================
// 2. EXEMPLO JAVASCRIPT - Fetch API
// ========================================

async function createBeforeAfterVideo(bottomImg, topImg, maskVideo) {
    // Cria FormData
    const formData = new FormData();
    formData.append('bottom', bottomImg); // File object
    formData.append('top', topImg);       // File object
    formData.append('mask', maskVideo);   // File object
    
    // Opções opcionais
    formData.append('duration', '10');
    formData.append('width', '1280');
    formData.append('height', '720');
    formData.append('fps', '25');
    formData.append('quality', 'high'); // low, medium, high

    try {
        // Inicia processamento
        const response = await fetch('http://localhost:3000/api/ffmpeg/before-after', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Processamento iniciado:', result.renderId);
            return result.renderId;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Erro ao criar vídeo:', error);
        throw error;
    }
}

// ========================================
// 3. POLLING DE STATUS
// ========================================

async function checkVideoStatus(renderId) {
    try {
        const response = await fetch(`http://localhost:3000/api/ffmpeg/status/${renderId}`);
        const status = await response.json();
        
        console.log(`Status: ${status.status} (${status.progress}%)`);
        
        return status;
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        throw error;
    }
}

// ========================================
// 4. AGUARDAR CONCLUSÃO (POLLING)
// ========================================

async function waitForVideoCompletion(renderId, maxWaitTime = 300) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime * 1000) {
        const status = await checkVideoStatus(renderId);
        
        if (status.status === 'done') {
            console.log('✅ Vídeo pronto!');
            console.log('URL:', status.url);
            console.log('Caminho local:', status.localPath);
            return status;
        }
        
        if (status.status === 'failed') {
            throw new Error(`Processamento falhou: ${status.error}`);
        }
        
        // Aguarda 2 segundos antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Timeout: Vídeo não foi concluído no tempo limite');
}

// ========================================
// 5. FLUXO COMPLETO
// ========================================

async function exemploCompleto() {
    try {
        // Simula arquivos (em produção, viria de um input file)
        const bottomImg = new File([/* blob */], 'antes.jpg', { type: 'image/jpeg' });
        const topImg = new File([/* blob */], 'depois.jpg', { type: 'image/jpeg' });
        const maskVideo = new File([/* blob */], 'mascara.mp4', { type: 'video/mp4' });
        
        // 1. Inicia processamento
        console.log('🎬 Iniciando processamento...');
        const renderId = await createBeforeAfterVideo(bottomImg, topImg, maskVideo);
        
        // 2. Aguarda conclusão
        console.log('⏳ Aguardando conclusão...');
        const result = await waitForVideoCompletion(renderId);
        
        // 3. Vídeo pronto!
        console.log('🎉 Sucesso!');
        console.log('URL do vídeo:', result.url);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    }
}

// ========================================
// 6. EXEMPLO COM REACT
// ========================================

/*
import React, { useState } from 'react';

function BeforeAfterVideoCreator() {
    const [bottomImage, setBottomImage] = useState(null);
    const [topImage, setTopImage] = useState(null);
    const [maskVideo, setMaskVideo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!bottomImage || !topImage || !maskVideo) {
            alert('Selecione todos os arquivos');
            return;
        }

        setStatus('uploading');
        
        try {
            // Upload e inicia processamento
            const formData = new FormData();
            formData.append('bottom', bottomImage);
            formData.append('top', topImage);
            formData.append('mask', maskVideo);
            formData.append('duration', '10');
            formData.append('quality', 'high');

            const response = await fetch('http://localhost:3000/api/ffmpeg/before-after', {
                method: 'POST',
                body: formData
            });

            const { renderId } = await response.json();
            
            setStatus('processing');
            
            // Polling de status
            const checkStatus = async () => {
                const statusRes = await fetch(`http://localhost:3000/api/ffmpeg/status/${renderId}`);
                const statusData = await statusRes.json();
                
                setProgress(statusData.progress);
                
                if (statusData.status === 'done') {
                    setVideoUrl(statusData.url);
                    setStatus('done');
                    return;
                }
                
                if (statusData.status === 'failed') {
                    setStatus('error');
                    alert('Erro: ' + statusData.error);
                    return;
                }
                
                // Continua polling
                setTimeout(checkStatus, 2000);
            };
            
            checkStatus();
            
        } catch (error) {
            setStatus('error');
            alert('Erro: ' + error.message);
        }
    };

    return (
        <div>
            <h2>Criar Vídeo Antes/Depois</h2>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Imagem Antes:</label>
                    <input 
                        type="file" 
                        accept="image/jpeg,image/png"
                        onChange={(e) => setBottomImage(e.target.files[0])}
                    />
                </div>
                
                <div>
                    <label>Imagem Depois:</label>
                    <input 
                        type="file" 
                        accept="image/jpeg,image/png"
                        onChange={(e) => setTopImage(e.target.files[0])}
                    />
                </div>
                
                <div>
                    <label>Vídeo Máscara:</label>
                    <input 
                        type="file" 
                        accept="video/mp4,video/quicktime"
                        onChange={(e) => setMaskVideo(e.target.files[0])}
                    />
                </div>
                
                <button type="submit" disabled={status !== 'idle'}>
                    Criar Vídeo
                </button>
            </form>
            
            {status === 'processing' && (
                <div>
                    <p>Processando... {progress}%</p>
                    <progress value={progress} max="100" />
                </div>
            )}
            
            {status === 'done' && videoUrl && (
                <div>
                    <h3>Vídeo Pronto!</h3>
                    <video src={videoUrl} controls width="640" />
                    <a href={videoUrl} download>Download</a>
                </div>
            )}
        </div>
    );
}

export default BeforeAfterVideoCreator;
*/

// ========================================
// 7. EXEMPLO NODE.JS (Backend)
// ========================================

/*
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function createVideoFromFiles() {
    const formData = new FormData();
    
    // Adiciona arquivos do sistema
    formData.append('bottom', fs.createReadStream('./antes.jpg'));
    formData.append('top', fs.createReadStream('./depois.jpg'));
    formData.append('mask', fs.createReadStream('./mascara.mp4'));
    formData.append('duration', '10');
    formData.append('quality', 'high');
    
    const response = await fetch('http://localhost:3000/api/ffmpeg/before-after', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
    });
    
    const result = await response.json();
    console.log('Render ID:', result.renderId);
    
    return result.renderId;
}
*/

// ========================================
// 8. COMPARAÇÃO COM SHOTSTACK
// ========================================

/*
// API idêntica ao Shotstack para facilitar migração

// FFmpeg:
const ffmpegResult = await fetch('/api/ffmpeg/before-after', { ... });
const { renderId } = await ffmpegResult.json();
const status = await fetch(`/api/ffmpeg/status/${renderId}`);

// Shotstack:
const shotstackResult = await fetch('/api/shotstack/render', { ... });
const { renderId } = await shotstackResult.json();
const status = await fetch(`/api/shotstack/status/${renderId}`);

// Estrutura de resposta é a mesma!
*/

export {
    createBeforeAfterVideo,
    checkVideoStatus,
    waitForVideoCompletion,
    exemploCompleto
};
