import express from "express";
import {
  testConnection,
  enhanceImage,
  generateImage,
  getTaskResult,
  waitForTaskCompletion,
  FLUX_MODELS,
  ASPECT_RATIOS
} from "../connectors/bflFlux.js";

const router = express.Router();

// Rota para testar conexão com BFL API
router.get("/flux/test", async (req, res) => {
  try {
    const result = await testConnection();
    
    res.status(200).json({
      success: true,
      message: "Conexão com BFL API funcionando",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro no teste de conexão",
      error: error.message
    });
  }
});

// Rota para melhorar iluminação de imagem (image enhancement)
router.post("/flux/enhance", async (req, res) => {
  try {
    const {
      image_url,
      prompt = "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image's light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
      model = FLUX_MODELS.FLUX_KONTEXT_PRO,
      aspect_ratio = null,
      prompt_upsampling = false,
      safety_tolerance = 2,
      seed = null,
      output_format = "jpeg",
      wait_for_completion = false
    } = req.body;

    // Validações
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    // Validar modelo
    if (!Object.values(FLUX_MODELS).includes(model)) {
      return res.status(400).json({
        success: false,
        message: `Modelo inválido: ${model}`,
        available_models: Object.values(FLUX_MODELS)
      });
    }

    // Iniciar processamento
    const result = await enhanceImage({
      image_url,
      prompt,
      model,
      aspect_ratio,
      prompt_upsampling,
      safety_tolerance,
      seed,
      output_format
    });

    // Se wait_for_completion = true, aguarda o resultado
    if (wait_for_completion) {
      try {
        const finalResult = await waitForTaskCompletion(result.task_id);
        
        return res.status(200).json({
          success: true,
          message: "Imagem processada com sucesso",
          task_id: result.task_id,
          status: "Ready",
          result_url: finalResult.data.result?.sample,
          data: finalResult.data
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erro ao aguardar conclusão",
          task_id: result.task_id,
          error: error.message,
          suggestion: "Use o endpoint /flux/status/:task_id para verificar o status manualmente"
        });
      }
    }

    // Retorna task_id para polling manual
    res.status(202).json({
      success: true,
      message: "Processamento iniciado - use o task_id para verificar o progresso",
      task_id: result.task_id,
      status: "Pending",
      status_endpoint: `/api/flux/status/${result.task_id}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para gerar imagem do zero (text-to-image)
router.post("/flux/generate", async (req, res) => {
  try {
    const {
      prompt,
      model = FLUX_MODELS.FLUX_PRO_11,
      width = 1024,
      height = 768,
      prompt_upsampling = false,
      safety_tolerance = 2,
      seed = null,
      output_format = "jpeg",
      wait_for_completion = false
    } = req.body;

    // Validações
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: prompt"
      });
    }

    // Validar modelo
    if (!Object.values(FLUX_MODELS).includes(model)) {
      return res.status(400).json({
        success: false,
        message: `Modelo inválido: ${model}`,
        available_models: Object.values(FLUX_MODELS)
      });
    }

    // Iniciar geração
    const result = await generateImage({
      prompt,
      model,
      width,
      height,
      prompt_upsampling,
      safety_tolerance,
      seed,
      output_format
    });

    // Se wait_for_completion = true, aguarda o resultado
    if (wait_for_completion) {
      try {
        const finalResult = await waitForTaskCompletion(result.task_id);
        
        return res.status(200).json({
          success: true,
          message: "Imagem gerada com sucesso",
          task_id: result.task_id,
          status: "Ready",
          result_url: finalResult.data.result?.sample,
          data: finalResult.data
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Erro ao aguardar conclusão",
          task_id: result.task_id,
          error: error.message,
          suggestion: "Use o endpoint /flux/status/:task_id para verificar o status manualmente"
        });
      }
    }

    // Retorna task_id para polling manual
    res.status(202).json({
      success: true,
      message: "Geração iniciada - use o task_id para verificar o progresso",
      task_id: result.task_id,
      status: "Pending",
      status_endpoint: `/api/flux/status/${result.task_id}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para verificar status de uma task
router.get("/flux/status/:task_id", async (req, res) => {
  try {
    const { task_id } = req.params;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "ID da task é obrigatório"
      });
    }

    const result = await getTaskResult(task_id);

    const responseData = {
      success: true,
      message: "Status obtido com sucesso",
      task_id: task_id,
      status: result.data.status,
      data: result.data
    };

    // Adicionar URL da imagem se estiver pronta
    if (result.data.status === "Ready" && result.data.result?.sample) {
      responseData.result_url = result.data.result.sample;
      responseData.message = "Processamento concluído";
    } else if (result.data.status === "Pending") {
      responseData.message = "Processamento em andamento";
    } else if (result.data.status.includes("Moderated")) {
      responseData.message = "Conteúdo foi moderado";
    }

    res.status(200).json(responseData);

  } catch (error) {
    if (error.message.includes("Task não encontrada")) {
      return res.status(404).json({
        success: false,
        message: "Task não encontrada"
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para listar modelos e configurações disponíveis
router.get("/flux/info", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        models: FLUX_MODELS,
        aspect_ratios: ASPECT_RATIOS,
        supported_formats: ["jpeg", "png"],
        default_settings: {
          model: FLUX_MODELS.FLUX_PRO_11,
          width: 1024,
          height: 768,
          prompt_upsampling: false,
          safety_tolerance: 2,
          output_format: "jpeg"
        },
        endpoints: {
          test: "GET /api/flux/test",
          enhance: "POST /api/flux/enhance",
          generate: "POST /api/flux/generate",
          status: "GET /api/flux/status/:task_id",
          info: "GET /api/flux/info"
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

export default router;
