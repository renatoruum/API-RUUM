import express from "express";
import fetch from "node-fetch";
import { parseImoveisXml } from "../connectors/xmlParser.js";
import { upsertImovelInAirtable } from "../connectors/airtable.js";

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
      for (const imovel of imoveis) {
        await upsertImovelInAirtable(imovel);
      }
      console.log(`[Observer] Importação concluída: ${imoveis.length} imóveis`);
    } catch (error) {
      console.error("[Observer] Erro ao importar XML:", error.message);
    }
  };

  // Executa imediatamente e depois a cada X minutos
  await fetchAndImport();
  observerInterval = setInterval(fetchAndImport, intervalMinutes * 60 * 1000);

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