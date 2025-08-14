import express from "express";
import { parseImoveisXml } from "../connectors/xmlParser.js";
import { syncImoveisWithAirtable } from "../connectors/airtable.js";

const router = express.Router();

// Endpoint específico para dados do Gaia que podem vir em diferentes formatos
router.post("/gaia-webhook", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
        console.log('=== GAIA WEBHOOK ===');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Content-Length:', req.headers['content-length']);
        console.log('User-Agent:', req.headers['user-agent']);
        
        const rawBody = req.body;
        const bodyStr = rawBody.toString('utf8');
        
        console.log('Body preview (first 500 chars):', bodyStr.substring(0, 500));
        console.log('Body preview (last 500 chars):', bodyStr.substring(bodyStr.length - 500));
        
        let imoveis;
        
        // Detectar tipo de conteúdo
        const trimmed = bodyStr.trim();
        
        if (trimmed.startsWith('<')) {
            // É XML
            console.log('Detectado conteúdo XML, processando...');
            imoveis = await parseImoveisXml(bodyStr);
            
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // É JSON
            console.log('Detectado conteúdo JSON');
            try {
                const jsonData = JSON.parse(bodyStr);
                console.log('JSON structure:', Object.keys(jsonData));
                
                // Se o JSON contém uma URL de XML, fazer download
                if (jsonData.xmlUrl || jsonData.xml_url || jsonData.url) {
                    const xmlUrl = jsonData.xmlUrl || jsonData.xml_url || jsonData.url;
                    console.log('Downloading XML from:', xmlUrl);
                    
                    const fetch = await import('node-fetch');
                    const response = await fetch.default(xmlUrl);
                    const xmlString = await response.text();
                    imoveis = await parseImoveisXml(xmlString);
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        message: "JSON não contém URL de XML válida" 
                    });
                }
                
            } catch (jsonError) {
                console.error('Erro ao fazer parse do JSON:', jsonError.message);
                return res.status(400).json({ 
                    success: false, 
                    message: "JSON inválido: " + jsonError.message 
                });
            }
            
        } else {
            // Formato não reconhecido
            console.log('Formato não reconhecido');
            return res.status(400).json({ 
                success: false, 
                message: "Formato de dados não reconhecido" 
            });
        }
        
        // Sincronizar com Airtable
        if (imoveis && imoveis.length > 0) {
            await syncImoveisWithAirtable(imoveis);
            console.log(`Processados ${imoveis.length} imóveis`);
            
            res.json({ 
                success: true, 
                count: imoveis.length,
                message: `${imoveis.length} imóveis processados com sucesso`
            });
        } else {
            res.json({ 
                success: true, 
                count: 0,
                message: "Nenhum imóvel encontrado para processar"
            });
        }
        
    } catch (error) {
        console.error('Erro no gaia-webhook:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

export default router;
