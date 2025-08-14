/**
 * Teste da função updateImageSuggestionsStatus
 */

import { updateImageSuggestionsStatus } from './src/connectors/airtable.js';

async function testUpdateSuggestionsStatus() {
    console.log('🧪 TESTE - updateImageSuggestionsStatus\n');
    
    // Teste 1: Array vazio
    console.log('📋 Teste 1: Array vazio');
    try {
        const result1 = await updateImageSuggestionsStatus([]);
        console.log('Resultado:', result1);
        console.log('✅ Teste 1 passou\n');
    } catch (error) {
        console.error('❌ Teste 1 falhou:', error.message, '\n');
    }
    
    // Teste 2: Array null/undefined
    console.log('📋 Teste 2: Array null');
    try {
        const result2 = await updateImageSuggestionsStatus(null);
        console.log('Resultado:', result2);
        console.log('✅ Teste 2 passou\n');
    } catch (error) {
        console.error('❌ Teste 2 falhou:', error.message, '\n');
    }
    
    // Teste 3: IDs inválidos (simulação)
    console.log('📋 Teste 3: IDs inválidos');
    try {
        const result3 = await updateImageSuggestionsStatus(['INVALID_ID_1', 'INVALID_ID_2'], 'Rejected');
        console.log('Resultado:', result3);
        console.log('✅ Teste 3 executado (erros esperados)\n');
    } catch (error) {
        console.error('❌ Teste 3 com erro inesperado:', error.message, '\n');
    }
    
    console.log('🎯 Testes concluídos!');
}

// Executar teste se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testUpdateSuggestionsStatus().catch(console.error);
}
