import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * Script para analisar XML e descobrir TODOS os campos disponíveis
 * Ajuda a identificar se existe um campo de URL do imóvel no CRM
 */

function analizarEstruturalXML(xmlContent) {
    console.log('=== ANÁLISE ESTRUTURAL DO XML ===\n');
    
    // Extrair primeiro objeto completo do XML para análise
    const primeiroImovelMatch = xmlContent.match(/<imovel[^>]*>(.*?)<\/imovel>/s);
    if (primeiroImovelMatch) {
        console.log('📋 PRIMEIRO IMÓVEL COMPLETO:');
        console.log(primeiroImovelMatch[0]);
        console.log('\n' + '='.repeat(50) + '\n');
    }

    // Buscar todos os tags únicos
    const tags = xmlContent.match(/<([^\/\s>]+)[^>]*>/g) || [];
    const uniqueTags = [...new Set(tags.map(tag => tag.replace(/<([^\/\s>]+).*/, '$1')))];
    
    console.log('🏷️  TODOS OS CAMPOS/TAGS ENCONTRADOS:');
    uniqueTags.sort().forEach(tag => {
        console.log(`   - ${tag}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Buscar especificamente por possíveis URLs
    const possiveisURLs = [
        'url', 'link', 'site', 'website', 'portal', 'crm', 'detalhes', 
        'visualizar', 'ver', 'anuncio', 'pagina', 'href', 'www'
    ];
    
    console.log('🔍 PROCURANDO POR CAMPOS DE URL/LINK:');
    
    let urlsEncontradas = false;
    possiveisURLs.forEach(termo => {
        const regex = new RegExp(`<([^>]*${termo}[^>]*)>`, 'gi');
        const matches = xmlContent.match(regex);
        if (matches) {
            console.log(`   ✅ Possível campo de URL encontrado: ${matches.join(', ')}`);
            urlsEncontradas = true;
        }
    });
    
    if (!urlsEncontradas) {
        console.log('   ❌ Nenhum campo óbvio de URL encontrado');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Buscar por atributos nos tags
    console.log('📊 ATRIBUTOS DOS TAGS:');
    const tagsComAtributos = xmlContent.match(/<[^\/][^>]*\s+[^>]*>/g) || [];
    tagsComAtributos.forEach(tag => {
        console.log(`   ${tag}`);
    });
    
    if (tagsComAtributos.length === 0) {
        console.log('   ❌ Nenhum tag com atributos encontrado');
    }
}

function analizarConteudo(xmlContent) {
    console.log('\n🔎 ANÁLISE DE CONTEÚDO:\n');
    
    // Procurar por URLs no conteúdo
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = xmlContent.match(urlPattern) || [];
    
    console.log('🌐 URLs ENCONTRADAS:');
    if (urls.length > 0) {
        const uniqueUrls = [...new Set(urls)];
        uniqueUrls.forEach(url => {
            console.log(`   - ${url}`);
        });
        
        // Analisar tipos de URL
        console.log('\n📝 TIPOS DE URL:');
        const tipos = {
            fotos: urls.filter(url => /\.(jpg|jpeg|png|gif|webp)/i.test(url)).length,
            firebase: urls.filter(url => url.includes('firebase')).length,
            outros: urls.filter(url => !/\.(jpg|jpeg|png|gif|webp)/i.test(url) && !url.includes('firebase')).length
        };
        
        console.log(`   - Fotos: ${tipos.fotos}`);
        console.log(`   - Firebase: ${tipos.firebase}`);
        console.log(`   - Outros: ${tipos.outros}`);
    } else {
        console.log('   ❌ Nenhuma URL encontrada');
    }
}

// Executar análise
async function main() {
    try {
        console.log('🔍 ANALISADOR DE XML KENLO - BUSCA POR CAMPOS DE URL\n');
        
        // URL do XML do Kenlo fornecida pelo usuário
        const xmlUrl = 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d';
        
        console.log('📡 Fazendo download do XML do Kenlo...');
        console.log('URL:', xmlUrl);
        
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const xmlContent = await response.text();
        console.log(`✅ XML baixado com sucesso! Tamanho: ${xmlContent.length} caracteres\n`);
        
        // Salvar uma cópia local para análise
        const localPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/kenlo-real.xml';
        fs.writeFileSync(localPath, xmlContent);
        console.log(`💾 XML salvo localmente em: ${localPath}\n`);
        
        analizarEstruturalXML(xmlContent);
        analizarConteudo(xmlContent);
        
        console.log('\n🎯 CAMPOS ESPECÍFICOS DO KENLO:');
        
        // Procurar por campos específicos do Kenlo
        const camposKenlo = [
            'CodigoImovel', 'TipoImovel', 'Finalidade', 'PrecoVenda', 
            'Bairro', 'Cidade', 'Estado', 'AreaUtil', 'QtdDormitorios',
            'QtdSuites', 'QtdBanheiros', 'QtdVagas', 'Observacao', 'TituloImovel',
            'URLDetalhes', 'LinkImovel', 'UrlCRM', 'SiteURL', 'LinkAnuncio'
        ];
        
        camposKenlo.forEach(campo => {
            const regex = new RegExp(`<${campo}[^>]*>([^<]*)<\/${campo}>`, 'i');
            const match = xmlContent.match(regex);
            if (match) {
                console.log(`   ✅ ${campo}: ${match[1] ? match[1].substring(0, 100) + (match[1].length > 100 ? '...' : '') : '(vazio)'}`);
            }
        });
        
        console.log('\n💡 RESULTADO DA ANÁLISE:');
        console.log('✅ XML do Kenlo analisado com sucesso!');
        console.log('📁 Arquivo salvo para referência futura');
        
    } catch (error) {
        console.error('❌ Erro ao analisar XML do Kenlo:', error.message);
        console.log('\n🔄 Tentando analisar XML local como fallback...');
        
        // Fallback para XML local
        const xmlPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/imobiliariaX.xml';
        
        if (fs.existsSync(xmlPath)) {
            const xmlContent = fs.readFileSync(xmlPath, 'utf8');
            analizarEstruturalXML(xmlContent);
            analizarConteudo(xmlContent);
        } else {
            console.log('❌ Nenhum XML disponível para análise');
        }
    }
}

main();
