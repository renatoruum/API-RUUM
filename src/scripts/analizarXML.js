import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * Script para analisar XML e descobrir TODOS os campos disponíveis
 * Ajuda a identificar se existe um campo de URL do imóvel no CRM
 */

function analizarEstruturalXML(xmlContent) {
    
    // Extrair primeiro objeto completo do XML para análise
    const primeiroImovelMatch = xmlContent.match(/<imovel[^>]*>(.*?)<\/imovel>/s);
    if (primeiroImovelMatch) {
    }

    // Buscar todos os tags únicos
    const tags = xmlContent.match(/<([^\/\s>]+)[^>]*>/g) || [];
    const uniqueTags = [...new Set(tags.map(tag => tag.replace(/<([^\/\s>]+).*/, '$1')))];
    
    uniqueTags.sort().forEach(tag => {
    });
    
    
    // Buscar especificamente por possíveis URLs
    const possiveisURLs = [
        'url', 'link', 'site', 'website', 'portal', 'crm', 'detalhes', 
        'visualizar', 'ver', 'anuncio', 'pagina', 'href', 'www'
    ];
    
    
    let urlsEncontradas = false;
    possiveisURLs.forEach(termo => {
        const regex = new RegExp(`<([^>]*${termo}[^>]*)>`, 'gi');
        const matches = xmlContent.match(regex);
        if (matches) {
            urlsEncontradas = true;
        }
    });
    
    if (!urlsEncontradas) {
    }
    
    
    // Buscar por atributos nos tags
    const tagsComAtributos = xmlContent.match(/<[^\/][^>]*\s+[^>]*>/g) || [];
    tagsComAtributos.forEach(tag => {
    });
    
    if (tagsComAtributos.length === 0) {
    }
}

function analizarConteudo(xmlContent) {
    
    // Procurar por URLs no conteúdo
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const urls = xmlContent.match(urlPattern) || [];
    
    if (urls.length > 0) {
        const uniqueUrls = [...new Set(urls)];
        uniqueUrls.forEach(url => {
        });
        
        // Analisar tipos de URL
        const tipos = {
            fotos: urls.filter(url => /\.(jpg|jpeg|png|gif|webp)/i.test(url)).length,
            firebase: urls.filter(url => url.includes('firebase')).length,
            outros: urls.filter(url => !/\.(jpg|jpeg|png|gif|webp)/i.test(url) && !url.includes('firebase')).length
        };
        
    } else {
    }
}

// Executar análise
async function main() {
    try {
        
        // URL do XML do Kenlo fornecida pelo usuário
        const xmlUrl = 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d';
        
        
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const xmlContent = await response.text();
        
        // Salvar uma cópia local para análise
        const localPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/kenlo-real.xml';
        fs.writeFileSync(localPath, xmlContent);
        
        analizarEstruturalXML(xmlContent);
        analizarConteudo(xmlContent);
        
        
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
            }
        });
        
        
    } catch (error) {
        
        // Fallback para XML local
        const xmlPath = '/Users/renatopalacio/Documents/Ruum/API_Ruum/xml/imobiliariaX.xml';
        
        if (fs.existsSync(xmlPath)) {
            const xmlContent = fs.readFileSync(xmlPath, 'utf8');
            analizarEstruturalXML(xmlContent);
            analizarConteudo(xmlContent);
        } else {
        }
    }
}

main();
