import express from "express";
import fetch from "node-fetch";
import { parseImoveisXml } from "../connectors/xmlParser.js";
import { syncImoveisWithAirtable } from "../connectors/airtable.js";

const router = express.Router();

let observerInterval = null;

router.post("/start-xmlwatcher", async (req, res) => {
  const { xmlUrl, intervalMinutes = 5 } = req.body;
  if (!xmlUrl) {
    return res.status(400).json({ success: false, message: "xmlUrl is required" });
  }

  if (observerInterval) {
    clearInterval(observerInterval);
  }

  // Função para buscar e importar o XML
  const fetchAndImport = async () => {
  try {
    const response = await fetch(xmlUrl);
    if (!response.ok) throw new Error("Failed to fetch XML");
    const xmlString = await response.text();
    const imoveis = await parseImoveisXml(xmlString);
    
    // Correção: passar o array inteiro em vez de cada imóvel individualmente
    await syncImoveisWithAirtable(imoveis);
    
  } catch (error) {
  }
};

  // Executa imediatamente e depois a cada X minutos
  await fetchAndImport();
  observerInterval = setInterval(fetchAndImport, 24 * 60 * 60 * 1000);

  res.json({ success: true, message: `Observador iniciado para ${xmlUrl} a cada ${intervalMinutes} minutos.` });
});

router.post("/stop-xmlwatcher", (req, res) => {
  if (observerInterval) {
    clearInterval(observerInterval);
    observerInterval = null;
    res.json({ success: true, message: "Observador parado." });
  } else {
    res.json({ success: false, message: "Nenhum observador em execução." });
  }
});

export default router;