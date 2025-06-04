import express from "express";
import { parseImoveisXml } from "../connectors/xmlParser.js";
import { upsetImovelInAirtable } from "../connectors/airtable.js";

const router = express.Router();

router.post("/import-xml", express.text({ type: "application/xml" }), async (req, res) => {
  try {
    const imoveis = await parseImoveisXml(req.body);
    for (const imovel of imoveis) {
      await upsetImovelInAirtable(imovel); 
    }
    res.json({ success: true, count: imoveis.length });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;