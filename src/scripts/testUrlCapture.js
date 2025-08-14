import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';

/**
 * Script para testar a captura de URLs de propriedades no XML do Kenlo
 */

async function testUrlCapture() {
    console.log('🔍 TESTANDO CAPTURA DE URLs DE PROPRIEDADES');
    console.log('================================================\n');
    
    try {
        // Ler o XML real do Kenlo que salvamos
        const xmlPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/kenlo-real.xml';
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        
        console.log('📄 XML carregado com sucesso');
        
        // Parse do XML
        const parser = await parseStringPromise(xmlContent, {
            explicitArray: false,
            mergeAttrs: true
        });
        
        const imoveis = parser.Carga.Imoveis.Imovel;
        console.log(`📊 Total de imóveis no XML: ${Array.isArray(imoveis) ? imoveis.length : 1}\n`);
        
        // Analisar os primeiros 5 imóveis para verificar URLs
        const imoveisParaAnalise = Array.isArray(imoveis) ? imoveis.slice(0, 5) : [imoveis];
        
        imoveisParaAnalise.forEach((imovel, index) => {
            console.log(`🏠 IMÓVEL ${index + 1}:`);
            console.log(`   Código: ${imovel.CodigoImovel}`);
            console.log(`   Título: ${imovel.TituloImovel}`);
            console.log(`   URL da Propriedade: ${imovel.URLGaiaSite || 'NÃO ENCONTRADA'}`);
            console.log(`   Tipo: ${imovel.TipoImovel}`);
            console.log(`   Bairro: ${imovel.Bairro}, ${imovel.Cidade}/${imovel.Estado}`);
            console.log(`   Valor: R$ ${imovel.PrecoVenda}`);
            console.log('   ---');
        });
        
        // Verificar estatísticas de URLs
        const totalImoveis = Array.isArray(imoveis) ? imoveis.length : 1;
        const imoveisComUrl = Array.isArray(imoveis) 
            ? imoveis.filter(imovel => imovel.URLGaiaSite).length
            : (imoveis.URLGaiaSite ? 1 : 0);
            
        console.log('\n📈 ESTATÍSTICAS:');
        console.log(`   Total de imóveis: ${totalImoveis}`);
        console.log(`   Imóveis com URL: ${imoveisComUrl}`);
        console.log(`   Percentual com URL: ${((imoveisComUrl / totalImoveis) * 100).toFixed(1)}%`);
        
        // Exemplos de URLs encontradas
        if (Array.isArray(imoveis)) {
            const urlsExemplo = imoveis
                .filter(imovel => imovel.URLGaiaSite)
                .slice(0, 3)
                .map(imovel => imovel.URLGaiaSite);
                
            console.log('\n🔗 EXEMPLOS DE URLs ENCONTRADAS:');
            urlsExemplo.forEach((url, i) => {
                console.log(`   ${i + 1}. ${url}`);
            });
        }
        
        console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
    }
}

// Executar o teste
testUrlCapture();
