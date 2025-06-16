import { parseImoveisXml } from "../connectors/xmlParser.js";
import { syncImoveisWithAirtable } from "../connectors/airtable.js";
import express from "express";

const router = express.Router();

router.post("/import-xml", express.text({ type: "application/xml" }), async (req, res) => {
  try {
    const imoveis = await parseImoveisXml(req.body);
    await syncImoveisWithAirtable(imoveis);
    res.json({ success: true, count: imoveis.length });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;