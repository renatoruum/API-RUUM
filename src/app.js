import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch"; 
//Routes
import chatgptRoute from "./routes/sendChatGpt.js";
import importXmlRoute from "./routes/importXml.js";
import updateImagesAirtableRoute from "./routes/updateImagesAirtable.js";
import xmlWatcherRoute from "./routes/xmlWatcher.js";
import sendShotStackRoute from "./routes/sendShotStack.js";
import sendRunwayRoute from "./routes/sendRunway.js";
import sendElevenLabsRoute from "./routes/sendElevenLabs.js";
import sendVirtualStagingRoute from "./routes/sendVirtualStaging.js";
import gaiaWebhookRoute from "./routes/gaiaWebhook.js";

const app = express();
app.use(cors());

// Middleware para logging de requisições
app.use((req, res, next) => {
    next();
});

// Middleware customizado para parsing JSON com melhor tratamento de erro
app.use('/api', express.json({
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
        try {
            // Tenta fazer um parse preliminar para verificar se é JSON válido
            if (buf && buf.length > 0) {
                const bodyStr = buf.toString(encoding || 'utf8');
                
                // Só tenta fazer parse se parecer ser JSON
                if (bodyStr.trim().startsWith('{') || bodyStr.trim().startsWith('[')) {
                    JSON.parse(bodyStr);
                } else if (bodyStr.trim().startsWith('<')) {
                    // Se for XML, rejeitar com erro específico
                    throw new Error('XML content received on JSON endpoint. Use Content-Type: application/xml or text/xml');
                }
            }
        } catch (error) {
            
            if (buf && buf.length > 0) {
                const bodyStr = buf.toString(encoding || 'utf8');
                const position = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
                const start = Math.max(0, position - 50);
                const end = Math.min(bodyStr.length, position + 50);
                
            }
            
            // Re-throw o erro para que o Express possa lidar com ele
            throw error;
        }
    }
}));

// Middleware para webhooks e outros endpoints não-API (pode receber diferentes tipos de conteúdo)
app.use(express.json({
    limit: '50mb'
}));

// Rotas
app.use("/api", chatgptRoute);
app.use("/api", importXmlRoute);
app.use("/api", updateImagesAirtableRoute);
app.use("/api", xmlWatcherRoute);
app.use("/api", sendRunwayRoute);
app.use("/api", sendShotStackRoute);
app.use("/api", sendElevenLabsRoute);
app.use("/api", sendVirtualStagingRoute);
app.use("/api", gaiaWebhookRoute);

// Endpoint /webhook
app.post("/webhook", async (req, res) => {
    try {

        const { image_url, room_type, style } = req.body;

        // Validação básica
        if (!image_url || !room_type || !style) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Faz uma requisição interna para a rota /api/chatgpt
        const chatGPTResponse = await fetch(`https://apiruum-667905204535.us-central1.run.app/api/chatgpt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url, room_type, style }),
        });

        const chatGPTData = await chatGPTResponse.json();

        // Retorna a resposta ao cliente (Airtable)
        res.status(200).json({
            success: true,
            message: "Data processed successfully",
            chatGPTResponse: chatGPTData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Middleware de tratamento de erro global
app.use((error, req, res, next) => {
    
    // Erro específico de JSON parsing
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format',
            message: 'The request body contains malformed JSON',
            details: error.message
        });
    }
    
    // Outros erros
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
