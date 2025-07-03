
import express from "express";
import { generateWithRunway, imageToVideoWithRunway } from "../connectors/runway.js";

const router = express.Router();

// Rota existente para geração de imagens
router.post("/runway", async (req, res) => {
  try {
    const { prompt, params } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: prompt"
      });
    }

    const response = await generateWithRunway({
      prompt,
      params
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Runway API Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message
    });
  }
});

// Nova rota para geração de vídeo a partir de imagem
router.post("/runway/image-to-video", async (req, res) => {
  try {
    const { promptImage, promptText, ratio, duration, model } = req.body;

    if (!promptImage) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: promptImage"
      });
    }

    const response = await imageToVideoWithRunway({
      promptImage,
      promptText: promptText || "Generate a video",
      ratio,
      duration,
      model
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Runway API Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message
    });
  }
});

export default router;
