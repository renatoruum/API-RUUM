import { upsetImagesInAirtable } from "../connectors/airtable.js";
import express from "express";

const router = express.Router();

router.post("/update-images-airtable", async (req, res) => {
  try {
    
     console.log("Body recebido:", req.body);
    
    // Verifica se recebemos um objeto com imagesArray ou diretamente um array
    const imagesArray = req.body.imagesArray || req.body;
    
    // Passa os parâmetros adicionais para a função
    const { email, clientId, invoiceId, userId } = req.body;
    
    if (!imagesArray || !Array.isArray(imagesArray) || imagesArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Body must contain a non-empty imagesArray" 
      });
    }

    // Passar todos os parâmetros para a função
    await upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId);
    
    res.json({ 
      success: true, 
      message: "Images updated/created in Airtable" 
    });
  } catch (error) {
    console.error("Error updating images in Airtable:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

export default router;