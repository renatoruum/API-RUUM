import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';

/**
 * Script para testar a captura de URLs de propriedades no XML do Kenlo
 */

async function testUrlCapture() {
    
    try {
        // Ler o XML real do Kenlo que salvamos
        const xmlPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/kenlo-real.xml';
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        
        
        // Parse do XML
        const parser = await parseStringPromise(xmlContent, {
            explicitArray: false,
            mergeAttrs: true
        });
        
        const imoveis = parser.Carga.Imoveis.Imovel;
        
        // Analisar os primeiros 5 imóveis para verificar URLs
        const imoveisParaAnalise = Array.isArray(imoveis) ? imoveis.slice(0, 5) : [imoveis];
        
        imoveisParaAnalise.forEach((imovel, index) => {
        });
        
        // Verificar estatísticas de URLs
        const totalImoveis = Array.isArray(imoveis) ? imoveis.length : 1;
        const imoveisComUrl = Array.isArray(imoveis) 
            ? imoveis.filter(imovel => imovel.URLGaiaSite).length
            : (imoveis.URLGaiaSite ? 1 : 0);
            
        
        // Exemplos de URLs encontradas
        if (Array.isArray(imoveis)) {
            const urlsExemplo = imoveis
                .filter(imovel => imovel.URLGaiaSite)
                .slice(0, 3)
                .map(imovel => imovel.URLGaiaSite);
                
            urlsExemplo.forEach((url, i) => {
            });
        }
        
        
    } catch (error) {
    }
}

// Executar o teste
testUrlCapture();
