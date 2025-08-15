import express from "express";
import { upsetImagesInAirtable, updateImageSuggestionsFields, transferApprovedSuggestionToImages } from "../connectors/airtable.js";

const router = express.Router();

router.post("/update-images-airtable", async (req, res) => {
  try {
    
    // Verifica se recebemos um objeto com imagesArray ou diretamente um array
    const imagesArray = req.body.imagesArray || req.body;
    
    // Passa os parâmetros adicionais para a função
    const { email, clientId, invoiceId, userId, table, originalSuggestionIds, processMode, source   } = req.body;
    
    if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
      return res.status(400).json({ success: false, message: "Body must be a non-empty array of images" });
    }

    const results = await upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId, table, [], processMode, source);
    
    // Conta sucessos e erros
    const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
    const errorCount = results.filter(r => r.status === 'error').length;

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
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

// Nova rota para atualizar status de sugestões
router.post("/update-suggestion-fields", async (req, res) => {
  try {
    
    const { suggestionIds, status } = req.body;
    
    
    // Validação básica
    if (!suggestionIds || !Array.isArray(suggestionIds)) {
      return res.status(400).json({ 
        success: false, 
        message: "suggestionIds must be an array of suggestion IDs" 
      });
    }
    
    if (suggestionIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "suggestionIds array cannot be empty" 
      });
    }
    
    // Chamar a função
    const result = await updateImageSuggestionsFields(suggestionIds, status);
    
    
    // Logs detalhados se houver erros
    if (result.errors > 0) {
      result.details
        .filter(d => d.status === 'error')
    }
    
    // Resposta de sucesso
    res.json({ 
      success: true, 
      message: `${result.updated} suggestions updated successfully, ${result.errors} errors`,
      data: {
        updated: result.updated,
        errors: result.errors,
        total: suggestionIds.length,
        details: result.details
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

// Rota específica para Rota 3: Transfer approved suggestions to individual images
router.post("/transfer-approved-suggestion", async (req, res) => {
  try {
    
    // Extrair dados do request
    const { 
      suggestionData, 
      customEmail, 
      customClientId, 
      customInvoiceId, 
      customUserId 
    } = req.body;
    
    // Validação básica
    if (!suggestionData) {
      return res.status(400).json({
        success: false,
        message: "suggestionData é obrigatório"
      });
    }

    if (!suggestionData.inputImages || !Array.isArray(suggestionData.inputImages) || suggestionData.inputImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "suggestionData.inputImages deve ser um array não vazio"
      });
    }


    // Chamar a função específica para Rota 3
    const result = await transferApprovedSuggestionToImages(
      suggestionData, 
      customEmail, 
      customClientId, 
      customInvoiceId, 
      customUserId
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Transfer aprovado: ${result.created} registros criados`,
        data: {
          created: result.created,
          errors: result.errors,
          total: suggestionData.inputImages.length,
          details: result.details
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        data: {
          created: result.created || 0,
          errors: result.errors || [],
          total: suggestionData.inputImages.length,
          details: result.details || []
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

export default router;
