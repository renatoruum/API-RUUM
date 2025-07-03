import express from "express";
import { 
  testConnection, 
  getAvailableOptions, 
  createVirtualStaging, 
  getRenderStatus, 
  createVariation,
  STYLES,
  ROOM_TYPES 
} from "../connectors/virtualStaging.js";

const router = express.Router();

// Rota para testar conexão
router.get("/virtual-staging/test", async (req, res) => {
  try {
    console.log("🔍 Testando conexão Virtual Staging AI...");
    
    const result = await testConnection();
    
    res.status(200).json({
      success: true,
      message: "Conexão com Virtual Staging AI funcionando",
      data: result.data
    });

  } catch (error) {
    console.error("❌ Erro no teste Virtual Staging AI:", error);
    res.status(500).json({
      success: false,
      message: "Erro no teste de conexão",
      error: error.message
    });
  }
});

// Rota para obter estilos e tipos de ambiente disponíveis
router.get("/virtual-staging/options", async (req, res) => {
  try {
    console.log("📋 Buscando opções disponíveis...");
    
    const options = await getAvailableOptions();
    
    res.status(200).json({
      success: true,
      message: "Opções carregadas com sucesso",
      data: {
        api_options: options,
        predefined_styles: STYLES,
        predefined_room_types: ROOM_TYPES
      }
    });

  } catch (error) {
    console.error("❌ Erro ao buscar opções:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao carregar opções",
      error: error.message
    });
  }
});

// Rota principal para criar virtual staging
router.post("/virtual-staging/create", async (req, res) => {
  try {
    const { 
      image_url, 
      room_type = "living", 
      style = "modern", 
      declutter_mode = "off",
      add_furniture = true,
      wait_for_completion = true 
    } = req.body;

    // Validações
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    // Validar room_type se estiver fazendo staging
    if (declutter_mode === "off" || add_furniture) {
      if (!Object.values(ROOM_TYPES).includes(room_type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de ambiente inválido: ${room_type}`,
          available_room_types: Object.values(ROOM_TYPES)
        });
      }
    }

    // Validar style se estiver fazendo staging
    if (declutter_mode === "off" || add_furniture) {
      if (!Object.values(STYLES).includes(style)) {
        return res.status(400).json({
          success: false,
          message: `Estilo inválido: ${style}`,
          available_styles: Object.values(STYLES)
        });
      }
    }

    console.log(`🎨 Processando virtual staging: ${style} para ${room_type}`);

    const result = await createVirtualStaging({
      image_url,
      room_type,
      style,
      declutter_mode,
      add_furniture,
      wait_for_completion
    });

    const responseData = {
      success: true,
      message: "Virtual staging processado com sucesso",
      data: result.data
    };

    // Adicionar informações extras se wait_for_completion = true
    if (wait_for_completion && result.data.result_image_url) {
      responseData.result_image_url = result.data.result_image_url;
      responseData.message = "Virtual staging concluído";
    } else {
      responseData.message = "Virtual staging iniciado - use o render_id para verificar o progresso";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erro no virtual staging:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para verificar status de um render
router.get("/virtual-staging/status/:render_id", async (req, res) => {
  try {
    const { render_id } = req.params;

    if (!render_id) {
      return res.status(400).json({
        success: false,
        message: "ID do render é obrigatório"
      });
    }

    console.log(`🔍 Verificando status do render: ${render_id}`);

    const result = await getRenderStatus(render_id);

    res.status(200).json({
      success: true,
      message: "Status obtido com sucesso",
      data: result.data
    });

  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Render não encontrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para criar variação de um render existente
router.post("/virtual-staging/variation/:render_id", async (req, res) => {
  try {
    const { render_id } = req.params;
    const { style, wait_for_completion = true } = req.body;

    if (!render_id) {
      return res.status(400).json({
        success: false,
        message: "ID do render é obrigatório"
      });
    }

    // Validar style se fornecido
    if (style && !Object.values(STYLES).includes(style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo inválido: ${style}`,
        available_styles: Object.values(STYLES)
      });
    }

    console.log(`🔄 Criando variação para render: ${render_id}`);

    const result = await createVariation(render_id, {
      style,
      wait_for_completion
    });

    const responseData = {
      success: true,
      data: result.data
    };

    if (wait_for_completion && result.data.result_image_url) {
      responseData.message = "Variação concluída";
      responseData.result_image_url = result.data.result_image_url;
    } else {
      responseData.message = "Variação iniciada - use o render_id para verificar o progresso";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erro ao criar variação:", error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Render não encontrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota combinada: ChatGPT + Virtual Staging (Análise de imagem + staging)
router.post("/virtual-staging/analyze-and-stage", async (req, res) => {
  try {
    const { 
      image_url, 
      style = "modern",
      wait_for_completion = true 
    } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    console.log("🔄 Processando: Análise + Virtual Staging");

    // Primeiro, analisar a imagem com ChatGPT para identificar o tipo de ambiente
    const { sendToChatGPT } = await import("../connectors/chatgpt.js");
    
    const analysisResult = await sendToChatGPT({
      image_url,
      processing_type: "ROOM_ANALYSIS",
      custom_prompt: `Analise esta imagem de ambiente e identifique o tipo de cômodo. Responda apenas com uma das opções: living, bed, kitchen, dining, bathroom, home_office, outdoor, kids_room. Se não conseguir identificar claramente, responda "living".`
    });

    if (analysisResult.type !== 'text') {
      throw new Error("Erro na análise da imagem");
    }

    const detected_room_type = analysisResult.result.trim().toLowerCase();
    const final_room_type = Object.values(ROOM_TYPES).includes(detected_room_type) 
      ? detected_room_type 
      : "living";

    console.log(`🎯 Tipo de ambiente detectado: ${final_room_type}`);

    // Segundo, criar o virtual staging
    const stagingResult = await createVirtualStaging({
      image_url,
      room_type: final_room_type,
      style,
      declutter_mode: "auto", // Modo automático para detectar se precisa de decluttering
      add_furniture: true,
      wait_for_completion
    });

    const responseData = {
      success: true,
      detected_room_type: final_room_type,
      style_applied: style,
      data: stagingResult.data
    };

    if (wait_for_completion && stagingResult.data.result_image_url) {
      responseData.message = "Análise e virtual staging concluídos";
      responseData.result_image_url = stagingResult.data.result_image_url;
    } else {
      responseData.message = "Análise e virtual staging iniciados - use o render_id para verificar o progresso";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erro no analyze-and-stage:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

export default router;
