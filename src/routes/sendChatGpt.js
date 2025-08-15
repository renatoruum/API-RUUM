import express from "express";
import { sendToChatGPT } from "../connectors/chatgpt.js";

const router = express.Router();

// Tipos de processamento suportados
const SUPPORTED_PROCESSING_TYPES = [
  'VIRTUAL_STAGING',
  'ROOM_IDENTIFICATION', 
  'SCRIPT_GENERATION'
];

router.post("/chatgpt", async (req, res) => {
  try {
    const { image_url, processing_type, ...additionalParams } = req.body;

    // Validações básicas
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url",
      });
    }

    if (!processing_type) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: processing_type",
        supported_types: SUPPORTED_PROCESSING_TYPES
      });
    }

    if (!SUPPORTED_PROCESSING_TYPES.includes(processing_type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de processamento não suportado: ${processing_type}`,
        supported_types: SUPPORTED_PROCESSING_TYPES
      });
    }

    // Validações específicas por tipo
    const validationError = validateProcessingTypeParams(processing_type, additionalParams);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Chama o conector ChatGPT
    const chatGPTResponse = await sendToChatGPT({ 
      image_url, 
      processing_type, 
      ...additionalParams 
    });

    res.status(200).json({
      success: true,
      message: "Processamento ChatGPT concluído com sucesso",
      processing_type,
      data: chatGPTResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Função para validar parâmetros específicos de cada tipo de processamento
function validateProcessingTypeParams(processing_type, params) {
  switch (processing_type) {
    case 'VIRTUAL_STAGING':
      if (!params.room_type) {
        return "Campo obrigatório para VIRTUAL_STAGING: room_type";
      }
      if (!params.style) {
        return "Campo obrigatório para VIRTUAL_STAGING: style";
      }
      break;
    
    case 'ROOM_IDENTIFICATION':
      // Não requer parâmetros adicionais
      break;
    
    case 'SCRIPT_GENERATION':
      // Não requer parâmetros adicionais obrigatórios
      break;
    
    default:
      return `Tipo de processamento não reconhecido: ${processing_type}`;
  }
  
  return null; // Sem erro
}

export default router;