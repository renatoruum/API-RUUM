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

const app = express();
app.use(cors());
app.use(express.json());

// Rota para o ChatGPT
app.use("/api", chatgptRoute);
app.use("/api", importXmlRoute);
app.use("/api", updateImagesAirtableRoute);
app.use("/api", xmlWatcherRoute);
app.use("/api", sendRunwayRoute);
app.use("/api", sendShotStackRoute);
app.use("/api", sendElevenLabsRoute);

// Endpoint /webhook
app.post("/webhook", async (req, res) => {
    try {
        console.log("Data received:", req.body);

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
        console.error("Error in /webhook:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));