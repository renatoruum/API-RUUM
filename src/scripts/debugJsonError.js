/**
 * Script para debugar erro de JSON parsing
 */

import fetch from 'node-fetch';

async function testGaiaUrl() {
    
    const url = 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d';
    
    try {
        
        const response = await fetch(url);
        
        const text = await response.text();
        
        // Tentar identificar se é XML ou JSON
        const trimmed = text.trim();
        
        if (trimmed.startsWith('<')) {
            
            // Verificar se tem caracteres problemáticos no XML
            const problematicChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
            if (problematicChars) {
            }
            
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            
            try {
                const parsed = JSON.parse(text);
            } catch (jsonError) {
                
                // Tentar identificar onde está o problema
                const match = jsonError.message.match(/position (\d+)/);
                if (match) {
                    const position = parseInt(match[1]);
                    const start = Math.max(0, position - 50);
                    const end = Math.min(text.length, position + 50);
                    
                }
            }
            
        } else {
        }
        
    } catch (error) {
    }
}

// Executar teste
testGaiaUrl();
