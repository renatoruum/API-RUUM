import axios from 'axios';
import { analyzeLayoutAgent, generateStagingAgent } from './src/connectors/imagenStaging.js';
import { uploadToFirebase } from './src/connectors/firebaseStorage.js';
import dotenv from 'dotenv';

dotenv.config();

async function testVertexAI(imageUrl) {
  try {
    console.log('🧪 TESTE VERTEX AI - Iniciando...\n');
    console.log('📸 URL da imagem:', imageUrl);
    console.log('');

    // Passo 1: Analisar layout
    console.log('📊 Passo 1: Analisando layout...');
    const layoutResult = await analyzeLayoutAgent(imageUrl);
    console.log('✅ Layout analisado');
    console.log('📝 Descrição:', layoutResult.layoutDescription.substring(0, 100) + '...\n');

    // Passo 2: Gerar staging com Vertex AI
    console.log('🎨 Passo 2: Gerando staging com Vertex AI (modo INPAINTING)...');
    const stagingResult = await generateStagingAgent(
      layoutResult.layoutDescription,
      layoutResult.originalImageBase64,
      {
        aspectRatio: '16:9',
        designStyle: 'contemporary_minimalist',
        numberOfImages: 1,
        safetyFilterLevel: 'block_low_and_above'
      }
    );
    console.log('✅ Imagem gerada com Vertex AI');
    console.log('📊 Tamanho:', (stagingResult.imageBuffer.length / 1024).toFixed(2), 'KB\n');

    // Passo 3: Upload para Firebase
    console.log('☁️ Passo 3: Fazendo upload para Firebase...');
    const firebaseUrl = await uploadToFirebase(
      stagingResult.imageBuffer,
      'test-vertex-ai',
      'staging.png'
    );
    console.log('✅ Upload concluído\n');

    // Resultado final
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!\n');
    console.log('=' .repeat(60));
    console.log('📸 IMAGEM ORIGINAL:');
    console.log(imageUrl);
    console.log('');
    console.log('✨ IMAGEM PROCESSADA (VERTEX AI):');
    console.log(firebaseUrl);
    console.log('=' .repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Resposta:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Pegar URL da linha de comando
const imageUrl = process.argv[2];

if (!imageUrl) {
  console.error('❌ Erro: Forneça a URL da imagem como argumento');
  console.log('');
  console.log('Uso:');
  console.log('  node test-vertex-ai.js "https://exemplo.com/imagem.jpg"');
  process.exit(1);
}

testVertexAI(imageUrl);
