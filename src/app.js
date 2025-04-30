import dotenv from "dotenv";
dotenv.config();

import express from "express";
import chatgptRoute from "./routes/sendChatGpt.js";
import fetch from "node-fetch"; 

const app = express();
app.use(express.json());

// Rota para o ChatGPT
app.use("/api", chatgptRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
        const chatGPTResponse = await fetch("http://localhost:3000/api/chatgpt", {
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