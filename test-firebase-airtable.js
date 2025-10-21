/**
 * Teste simples para validar a integração Firebase Storage com organização por cliente
 * Para executar: node test-firebase-airtable.js
 */

import { uploadToFirebase } from './src/connectors/firebaseStorage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFirebaseStorageWithClient() {
    console.log('🧪 [TEST] Iniciando teste do Firebase Storage com organização por cliente');
    
    try {
        // Cliente de teste
        const testClientName = 'Cliente_Teste_Ruum';
        console.log(`👤 [TEST] Cliente: ${testClientName}`);
        
        // Verificar se temos uma imagem de teste
        const testImagePath = path.join(__dirname, 'images', 'kaazaa_KZ6125.jpg');
        
        if (!fs.existsSync(testImagePath)) {
            console.log('❌ [TEST] Imagem de teste não encontrada:', testImagePath);
            console.log('📋 [TEST] Criando um buffer de teste simulado...');
            
            // Criar um buffer simulado para teste
            const mockImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
            
            console.log('📤 [TEST] Testando upload para Firebase Storage com organização por cliente...');
            const firebaseUrl = await uploadToFirebase(mockImageBuffer, 'test-image.png', 'image/png', testClientName);
            
            console.log('✅ [TEST] Upload para Firebase concluído!');
            console.log('🌐 [TEST] URL Firebase:', firebaseUrl);
            console.log('📁 [TEST] Estrutura esperada: clients/cliente_teste_ruum/images/');
            
            return { success: true, url: firebaseUrl, clientName: testClientName };
        }
        
        // Se temos imagem real, usar ela
        const imageBuffer = fs.readFileSync(testImagePath);
        
        console.log('📤 [TEST] Testando upload para Firebase Storage com organização por cliente...');
        console.log('📊 [TEST] Tamanho da imagem:', imageBuffer.length, 'bytes');
        
        const firebaseUrl = await uploadToFirebase(imageBuffer, 'kaazaa_KZ6125.jpg', 'image/jpeg', testClientName);
        
        console.log('✅ [TEST] Upload para Firebase concluído!');
        console.log('🌐 [TEST] URL Firebase:', firebaseUrl);
        console.log('📁 [TEST] Estrutura esperada: clients/cliente_teste_ruum/images/');
        
        return { success: true, url: firebaseUrl, clientName: testClientName };
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error.message);
        return { success: false, error: error.message };
    }
}

// Executar o teste se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testFirebaseStorageWithClient()
        .then(result => {
            console.log('\n📋 [TEST] Resultado final:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ [TEST] Erro crítico:', error);
            process.exit(1);
        });
}

export { testFirebaseStorageWithClient };