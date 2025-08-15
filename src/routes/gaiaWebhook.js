import express from "express";
import { parseImoveisXml } from "../connectors/xmlParser.js";
import { syncImoveisWithAirtable } from "../connectors/airtable.js";

const router = express.Router();

// Endpoint específico para dados do Gaia que podem vir em diferentes formatos
router.post("/gaia-webhook", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
        
        const rawBody = req.body;
        const bodyStr = rawBody.toString('utf8');
        
        
        let imoveis;
        
        // Detectar tipo de conteúdo
        const trimmed = bodyStr.trim();
        
        if (trimmed.startsWith('<')) {
            // É XML
            imoveis = await parseImoveisXml(bodyStr);
            
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // É JSON
            try {
                const jsonData = JSON.parse(bodyStr);
                
                // Se o JSON contém uma URL de XML, fazer download
                if (jsonData.xmlUrl || jsonData.xml_url || jsonData.url) {
                    const xmlUrl = jsonData.xmlUrl || jsonData.xml_url || jsonData.url;
                    
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
                return res.status(400).json({ 
                    success: false, 
                    message: "JSON inválido: " + jsonError.message 
                });
            }
            
        } else {
            // Formato não reconhecido
            return res.status(400).json({ 
                success: false, 
                message: "Formato de dados não reconhecido" 
            });
        }
        
        // Sincronizar com Airtable
        if (imoveis && imoveis.length > 0) {
            await syncImoveisWithAirtable(imoveis);
            
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
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

export default router;
