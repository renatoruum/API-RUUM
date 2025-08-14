/**
 * Script para debugar erro de JSON parsing
 */

import fetch from 'node-fetch';

async function testGaiaUrl() {
    console.log('🔍 TESTANDO URL DO GAIA PARA IDENTIFICAR PROBLEMA JSON...\n');
    
    const url = 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d';
    
    try {
        console.log('📡 Fazendo requisição para:', url);
        
        const response = await fetch(url);
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        const text = await response.text();
        console.log('Tamanho da resposta:', text.length, 'caracteres');
        console.log('Primeiros 500 caracteres:', text.substring(0, 500));
        console.log('Últimos 500 caracteres:', text.substring(text.length - 500));
        
        // Tentar identificar se é XML ou JSON
        const trimmed = text.trim();
        
        if (trimmed.startsWith('<')) {
            console.log('✅ Conteúdo parece ser XML');
            
            // Verificar se tem caracteres problemáticos no XML
            const problematicChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
            if (problematicChars) {
                console.log('⚠️ Caracteres problemáticos encontrados:', problematicChars);
            }
            
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            console.log('📄 Conteúdo parece ser JSON');
            
            try {
                const parsed = JSON.parse(text);
                console.log('✅ JSON válido');
                console.log('Estrutura:', Object.keys(parsed));
            } catch (jsonError) {
                console.log('❌ JSON inválido:', jsonError.message);
                
                // Tentar identificar onde está o problema
                const match = jsonError.message.match(/position (\d+)/);
                if (match) {
                    const position = parseInt(match[1]);
                    const start = Math.max(0, position - 50);
                    const end = Math.min(text.length, position + 50);
                    
                    console.log('Contexto do erro:');
                    console.log('Antes:', text.substring(start, position));
                    console.log('Caractere problemático:', text.charAt(position));
                    console.log('Depois:', text.substring(position + 1, end));
                }
            }
            
        } else {
            console.log('🤔 Conteúdo não identificado - primeiros caracteres:', trimmed.substring(0, 100));
        }
        
    } catch (error) {
        console.error('❌ Erro ao fazer requisição:', error.message);
    }
}

// Executar teste
testGaiaUrl();
