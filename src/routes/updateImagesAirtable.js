import express from "express";
import { upsetImagesInAirtable } from "../connectors/airtable.js";

const router = express.Router();

router.post("/update-images-airtable", async (req, res) => {
  try {
    console.log("Body recebido:", req.body);
    
    // Verifica se recebemos um objeto com imagesArray ou diretamente um array
    const imagesArray = req.body.imagesArray || req.body;
    
    // Passa os parâmetros adicionais para a função
    const { email, clientId, invoiceId, userId } = req.body;
    
    if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
      return res.status(400).json({ success: false, message: "Body must be a non-empty array of images" });
    }

    console.log(`Starting to process ${imagesArray.length} images`);
    const results = await upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId);
    
    // Conta sucessos e erros
    const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`Processing complete: ${successCount} successful, ${errorCount} errors`);
    
    res.json({ 
      success: true, 
      message: `${successCount} images processed successfully, ${errorCount} errors`,
      results,
      summary: {
        total: imagesArray.length,
        successful: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error("Error updating images in Airtable:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

export default router;