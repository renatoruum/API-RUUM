import express from "express";
import { sendToChatGPT } from "../llm/chatgpt.js";

const router = express.Router();

router.post("/chatgpt", async (req, res) => {
  try {
    const { image_url, room_type, style } = req.body;

    if (!image_url || !room_type || !style) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: image_url, room_type, or style",
      });
    }

    // Call the ChatGPT function
    const chatGPTResponse = await sendToChatGPT({ image_url, room_type, style });

    res.status(200).json({
      success: true,
      message: "ChatGPT processed successfully",
      data: chatGPTResponse,
    });
  } catch (error) {
    console.error("Error in ChatGPT route:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;