import express from "express";
import { upsetVideosInAirtable } from "../connectors/airtable.js";

const router = express.Router();

router.post("/update-videos-airtable", async (req, res) => {
  try {
    console.log("🎬 [ROTA] /update-videos-airtable - Iniciando processamento");
    console.log("📦 [ROTA] Body recebido completo:", JSON.stringify(req.body, null, 2));
    
    // ✅ CORREÇÃO: Extrair os parâmetros corretos do req.body
    const { 
        videosArray, 
        customEmail,     // ← CORRETO
        customClientId,  // ← CORRETO
        customInvoiceId, // ← CORRETO
        customUserId,    // ← CORRETO
        email            // ← Parâmetro duplicado (ignorar se customEmail existir)
    } = req.body;

    // ✅ Usar customEmail como prioridade, fallback para email
    const finalEmail = customEmail || email;

    console.log("📋 [ROTA] Parâmetros extraídos:");
    console.log("  - videosArray:", videosArray ? videosArray.length : 0, "items");
    console.log("  - customEmail:", customEmail);
    console.log("  - email (duplicado):", email);
    console.log("  - finalEmail (usado):", finalEmail);
    console.log("  - customClientId:", customClientId);
    console.log("  - customInvoiceId:", customInvoiceId);
    console.log("  - customUserId:", customUserId);

    // ✅ VALIDAÇÃO: Verificar se os parâmetros obrigatórios estão presentes
    if (!videosArray || !Array.isArray(videosArray) || videosArray.length === 0) {
      console.error("❌ [ROTA] videosArray inválido");
      return res.status(400).json({
        success: false,
        message: 'videosArray é obrigatório e deve ser um array não vazio',
        error: 'INVALID_VIDEOS_ARRAY'
      });
    }

    if (!finalEmail || !finalEmail.trim()) {
      console.error("❌ [ROTA] Email não fornecido");
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório (customEmail ou email)',
        error: 'MISSING_EMAIL'
      });
    }

    console.log("🎬 [ROTA] Chamando upsetVideosInAirtable...");
    console.log("📋 [ROTA] Parâmetros finais que serão passados:");
    console.log("  - videosArray:", videosArray.length, "items");
    console.log("  - customEmail:", finalEmail);
    console.log("  - customClientId:", customClientId || 'undefined');
    console.log("  - customInvoiceId:", customInvoiceId || 'undefined');
    console.log("  - customUserId:", customUserId || 'undefined');

    // ✅ Chamada corrigida com parâmetros corretos
    const results = await upsetVideosInAirtable(
      videosArray,
      finalEmail,      // ← Email processado corretamente
      customClientId,  // ← Vai ser usado na função
      customInvoiceId, // ← Vai ser usado na função
      customUserId     // ← Vai ser usado na função
    );
    
    // Conta sucessos e erros
    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    console.log("✅ [ROTA] Processamento concluído:", { 
      successCount, 
      errorCount, 
      skippedCount, 
      total: results.length 
    });

    const hasErrors = errorCount > 0;
    
    res.status(hasErrors ? 207 : 200).json({ 
      success: !hasErrors, 
      message: hasErrors 
        ? `${successCount} videos processed successfully, ${errorCount} errors, ${skippedCount} skipped`
        : `All ${successCount} videos processed successfully`,
      results,
      summary: {
        total: videosArray.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount
      }
    });
    
  } catch (error) {
    console.log("❌ [ROTA] Erro interno:", error.message);
    console.log("🔍 [ROTA] Stack trace:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

export default router;
