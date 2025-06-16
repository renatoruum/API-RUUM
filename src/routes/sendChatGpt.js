import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chatgpt", async (req, res) => {
  try {
    const { image_url, room_type, style } = req.body;

    if (!image_url || !room_type || !style) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: image_url, room_type, style"
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${room_type} image and suggest ${style} style improvements. Provide specific recommendations for furniture, colors, and decor.`
            },
            {
              type: "image_url",
              image_url: {
                url: image_url
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    res.json({
      success: true,
      data: response.choices[0].message.content
    });

  } catch (error) {
    console.error("ChatGPT API Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message
    });
  }
});

export default router;