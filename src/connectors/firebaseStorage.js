import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

console.log('🔥 [Firebase] Inicializando com configuração:', {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    hasApiKey: !!firebaseConfig.apiKey
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Faz upload de arquivo para Firebase Storage organizado por cliente
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} mimeType - Tipo MIME do arquivo
 * @param {string} clientName - Nome do cliente (para organizar pasta)
 * @returns {Promise<string>} URL pública do arquivo
 */
export async function uploadToFirebase(fileBuffer, fileName, mimeType, clientName = 'default') {
    console.log(`🔥 [uploadToFirebase] Fazendo upload: ${fileName}`);
    console.log(`👤 [uploadToFirebase] Cliente: ${clientName}`);
    console.log(`📊 [uploadToFirebase] Tamanho: ${fileBuffer.length} bytes, Tipo: ${mimeType}`);
    
    try {
        // Sanitizar nome do cliente para usar como pasta
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        
        // Criar referência única para o arquivo organizada por cliente
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `clients/${sanitizedClientName}/images/${timestamp}_${sanitizedFileName}`;
        const storageRef = ref(storage, uniqueFileName);
        
        console.log(`📁 [uploadToFirebase] Caminho no storage: ${uniqueFileName}`);
        
        // Metadados do arquivo
        const metadata = {
            contentType: mimeType,
            customMetadata: {
                uploadedAt: new Date().toISOString(),
                originalName: fileName,
                clientName: clientName,
                sanitizedClientName: sanitizedClientName,
                source: 'ruum-api'
            }
        };
        
        // Fazer upload
        console.log(`📤 [uploadToFirebase] Iniciando upload...`);
        const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
        
        console.log(`📋 [uploadToFirebase] Upload realizado, obtendo URL pública...`);
        
        // Obter URL pública
        const publicUrl = await getDownloadURL(snapshot.ref);
        
        console.log(`✅ [uploadToFirebase] Upload concluído com sucesso!`);
        console.log(`🌐 [uploadToFirebase] URL pública: ${publicUrl.substring(0, 80)}...`);
        
        return publicUrl;
        
    } catch (error) {
        console.error(`❌ [uploadToFirebase] Erro no upload:`, error.message);
        console.error(`📋 [uploadToFirebase] Detalhes do erro:`, error);
        throw new Error(`Erro no upload para Firebase: ${error.message}`);
    }
}

/**
 * Faz upload de múltiplos arquivos para Firebase Storage organizados por cliente
 * @param {Array} files - Array de objetos file do multer
 * @param {string} clientName - Nome do cliente (para organizar pasta)
 * @returns {Promise<Array>} Array com URLs públicas
 */
export async function uploadMultipleToFirebase(files, clientName = 'default') {
    console.log(`🔥 [uploadMultipleToFirebase] Fazendo upload de ${files.length} arquivos`);
    console.log(`👤 [uploadMultipleToFirebase] Cliente: ${clientName}`);
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 [uploadMultipleToFirebase] Processando ${i + 1}/${files.length}: ${file.originalname}`);
        
        try {
            const url = await uploadToFirebase(file.buffer, file.originalname, file.mimetype, clientName);
            results.push({
                success: true,
                url: url,
                originalName: file.originalname,
                clientName: clientName,
                index: i
            });
        } catch (error) {
            console.error(`❌ [uploadMultipleToFirebase] Erro no arquivo ${file.originalname}:`, error.message);
            results.push({
                success: false,
                error: error.message,
                originalName: file.originalname,
                clientName: clientName,
                index: i
            });
        }
        
        // Pequena pausa para evitar rate limiting
        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 [uploadMultipleToFirebase] Concluído: ${successCount}/${files.length} sucessos para cliente ${clientName}`);
    
    return results;
}

/**
 * Faz upload de vídeo para Firebase Storage organizado por cliente
 * @param {string} filePath - Caminho local do vídeo
 * @param {string} clientName - Nome do cliente (para organizar pasta)
 * @returns {Promise<string>} URL pública do vídeo
 */
export async function uploadVideoToFirebase(filePath, clientName = 'default') {
    console.log(`🎬 [uploadVideoToFirebase] Fazendo upload de vídeo: ${filePath}`);
    console.log(`👤 [uploadVideoToFirebase] Cliente: ${clientName}`);
    
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Lê o arquivo do disco
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const mimeType = 'video/mp4';
        
        console.log(`📊 [uploadVideoToFirebase] Tamanho: ${fileBuffer.length} bytes`);
        
        // Sanitizar nome do cliente
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        
        // Criar referência única organizada por cliente
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `clients/${sanitizedClientName}/videos/${timestamp}_${sanitizedFileName}`;
        const storageRef = ref(storage, uniqueFileName);
        
        console.log(`📁 [uploadVideoToFirebase] Caminho no storage: ${uniqueFileName}`);
        
        // Metadados do vídeo
        const metadata = {
            contentType: mimeType,
            customMetadata: {
                uploadedAt: new Date().toISOString(),
                originalName: fileName,
                clientName: clientName,
                sanitizedClientName: sanitizedClientName,
                source: 'ruum-api-ffmpeg',
                type: 'before-after-video'
            }
        };
        
        // Fazer upload
        console.log(`📤 [uploadVideoToFirebase] Iniciando upload do vídeo...`);
        const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
        
        console.log(`📋 [uploadVideoToFirebase] Upload realizado, obtendo URL pública...`);
        
        // Obter URL pública
        const publicUrl = await getDownloadURL(snapshot.ref);
        
        console.log(`✅ [uploadVideoToFirebase] Upload de vídeo concluído com sucesso!`);
        console.log(`🌐 [uploadVideoToFirebase] URL pública: ${publicUrl.substring(0, 80)}...`);
        
        return publicUrl;
        
    } catch (error) {
        console.error(`❌ [uploadVideoToFirebase] Erro no upload de vídeo:`, error.message);
        console.error(`📋 [uploadVideoToFirebase] Detalhes do erro:`, error);
        throw new Error(`Erro no upload de vídeo para Firebase: ${error.message}`);
    }
}