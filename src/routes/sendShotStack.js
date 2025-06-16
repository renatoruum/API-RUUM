import axios from "axios";
import express from "express";
const router = express.Router();

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || "3USHaD92ZU0NBnAo7crwQpg7xXG4VgziQaPR5DWL";
const SHOTSTACK_RENDER_URL = "https://api.shotstack.io/edit/stage/render";
const SHOTSTACK_STATUS_URL = "https://api.shotstack.io/edit/stage/render/";

router.post("/send-shotstack", async (req, res) => {
  try {
    // 1. Envia o JSON para a API do Shotstack
    const renderResponse = await axios.post(
      SHOTSTACK_RENDER_URL,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SHOTSTACK_API_KEY,
        },
      }
    );

    const renderId = renderResponse.data.response.id;
    if (!renderId) {
      return res.status(500).json({ success: false, message: "No render ID returned from Shotstack" });
    }

    console.log("Render ID recebido do Shotstack:", renderId);

    // 2. Retorna o ID para o cliente
    res.json({ success: true, id: renderId });


  } catch (error) {
    console.error("Error sending to Shotstack:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Error sending to Shotstack", error: error.response?.data || error.message });
  }
});

// Endpoint para consultar status e URL do vídeo renderizado
router.get("/shotstack-status/:id", async (req, res) => {
  console.log(">>> Entrou na rota /shotstack-status/:id");
  try {
    const { id } = req.params;
    console.log("Consultando status do Shotstack para ID:", id);
    console.log("URL final:", SHOTSTACK_STATUS_URL + id);

    const statusResponse = await axios.get(
      SHOTSTACK_STATUS_URL + id,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SHOTSTACK_API_KEY,
        },
        validateStatus: () => true // Permite capturar qualquer status
      }
    );

    // Log para depuração
    console.log("Status HTTP do Shotstack:", statusResponse.status);
    console.log("Resposta do Shotstack:", statusResponse.data);

    if (!statusResponse.data || !statusResponse.data.response) {
      return res.status(502).json({ success: false, message: "Resposta inesperada do Shotstack", raw: statusResponse.data });
    }

    const status = statusResponse.data.response.status;
    const url = statusResponse.data.response.url;

    res.json({ success: true, status, url });
  } catch (error) {
    console.error("Error fetching Shotstack status:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Error fetching Shotstack status", error: error.response?.data || error.message });
  }
});

export default router;