import express from "express";
import { getDataFromAirtable } from "../connectors/airtable.js";
import { sendToChatGPT } from "../llm/chatgpt.js";

const router = express.Router();

router.post("/send-data", async (req, res) => {
  try {
    // Você pode escolher o conector dinamicamente depois
    const data = await getDataFromAirtable();
    res.json({ success: true, data });

    const response = await sendToChatGPT(data);
    res.json({ success: true, response });
    
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
