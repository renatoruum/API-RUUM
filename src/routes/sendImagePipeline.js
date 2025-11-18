import express from "express";
import {
  createVirtualStaging,
  getRenderStatus,
  STYLES,
  ROOM_TYPES
} from "../connectors/virtualStaging.js";
import {
  enhanceImage,
  waitForTaskCompletion,
  FLUX_MODELS
} from "../connectors/bflFlux.js";
import {
  saveProcessedFluxImage
} from "../connectors/airtable.js";

const router = express.Router();

/**
 * Pipeline completo: Virtual Staging + FLUX Enhancement
 * 1. Aplica virtual staging na imagem
 * 2. Melhora iluminação e qualidade com FLUX
 */
router.post("/pipeline/staging-and-enhance", async (req, res) => {
  try {
    const {
      image_url,
      // Parâmetros Virtual Staging
      room_type = "living",
      style = "modern",
      declutter_mode = "off",
      add_furniture = true,
      // Parâmetros FLUX
      flux_prompt = "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image's light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
      flux_model = FLUX_MODELS.FLUX_KONTEXT_PRO,
      flux_aspect_ratio = null,
      // Controle do pipeline
      wait_for_completion = true,
      skip_staging = false,
      skip_enhancement = false,
      // Parâmetros Airtable (opcionais)
      save_to_airtable = false,
      property_code = null,
      property_url = null,
      client_id = null,
      user_id = null,
      invoice_id = null
    } = req.body;

    // Validações
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    if (skip_staging && skip_enhancement) {
      return res.status(400).json({
        success: false,
        message: "Não é possível pular ambas as etapas do pipeline"
      });
    }

    // Validar room_type
    if (!skip_staging && !Object.values(ROOM_TYPES).includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de ambiente inválido: ${room_type}`,
        available_room_types: Object.values(ROOM_TYPES)
      });
    }

    // Validar style
    if (!skip_staging && !Object.values(STYLES).includes(style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo inválido: ${style}`,
        available_styles: Object.values(STYLES)
      });
    }

    const pipeline_id = `pipeline_${Date.now()}`;
    const startTime = Date.now();

    // Objeto para armazenar resultados intermediários
    const pipelineResults = {
      pipeline_id,
      original_image: image_url,
      steps: [],
      errors: []
    };

    let currentImageUrl = image_url;

    // ETAPA 1: Virtual Staging
    if (!skip_staging) {
      try {
        console.log(`[Pipeline ${pipeline_id}] Iniciando Virtual Staging...`);
        
        const stagingResult = await createVirtualStaging({
          image_url: currentImageUrl,
          room_type,
          style,
          declutter_mode,
          add_furniture,
          wait_for_completion: true
        });

        pipelineResults.steps.push({
          step: 1,
          name: "virtual_staging",
          status: "completed",
          render_id: stagingResult.data.render_id,
          result_url: stagingResult.data.result_image_url,
          room_type,
          style
        });

        currentImageUrl = stagingResult.data.result_image_url;
        console.log(`[Pipeline ${pipeline_id}] Virtual Staging concluído`);

      } catch (error) {
        pipelineResults.steps.push({
          step: 1,
          name: "virtual_staging",
          status: "failed",
          error: error.message
        });
        pipelineResults.errors.push(`Virtual Staging: ${error.message}`);

        // Se falhar no staging, não continua
        return res.status(500).json({
          success: false,
          message: "Erro na etapa de Virtual Staging",
          pipeline_id,
          data: pipelineResults
        });
      }
    } else {
      pipelineResults.steps.push({
        step: 1,
        name: "virtual_staging",
        status: "skipped"
      });
    }

    // ETAPA 2: FLUX Enhancement
    if (!skip_enhancement) {
      try {
        console.log(`[Pipeline ${pipeline_id}] Iniciando FLUX Enhancement...`);
        
        const fluxResult = await enhanceImage({
          image_url: currentImageUrl,
          prompt: flux_prompt,
          model: flux_model,
          aspect_ratio: flux_aspect_ratio
        });

        // Aguardar conclusão se solicitado
        if (wait_for_completion) {
          const finalResult = await waitForTaskCompletion(fluxResult.task_id, 60, 5000);
          
          pipelineResults.steps.push({
            step: 2,
            name: "flux_enhancement",
            status: "completed",
            task_id: fluxResult.task_id,
            result_url: finalResult.data.result?.sample,
            model: flux_model
          });

          currentImageUrl = finalResult.data.result?.sample;
          console.log(`[Pipeline ${pipeline_id}] FLUX Enhancement concluído`);

        } else {
          pipelineResults.steps.push({
            step: 2,
            name: "flux_enhancement",
            status: "pending",
            task_id: fluxResult.task_id,
            status_endpoint: `/api/flux/status/${fluxResult.task_id}`
          });
        }

      } catch (error) {
        pipelineResults.steps.push({
          step: 2,
          name: "flux_enhancement",
          status: "failed",
          error: error.message
        });
        pipelineResults.errors.push(`FLUX Enhancement: ${error.message}`);

        // Se o FLUX falhar, ainda retorna o resultado do staging
        if (!skip_staging) {
          return res.status(207).json({
            success: true,
            message: "Pipeline parcialmente concluído (Virtual Staging OK, FLUX falhou)",
            pipeline_id,
            final_image: pipelineResults.steps[0].result_url,
            data: pipelineResults,
            warning: "A melhoria de iluminação não foi aplicada"
          });
        }
      }
    } else {
      pipelineResults.steps.push({
        step: 2,
        name: "flux_enhancement",
        status: "skipped"
      });
    }

    // Calcular tempo total
    const totalTime = Date.now() - startTime;
    pipelineResults.processing_time_ms = totalTime;
    pipelineResults.processing_time_seconds = (totalTime / 1000).toFixed(2);

    // Resposta final
    const allCompleted = pipelineResults.steps.every(
      step => step.status === "completed" || step.status === "skipped"
    );

    if (allCompleted && wait_for_completion) {
      // ETAPA 3 (OPCIONAL): Salvar no Airtable
      let airtableResult = null;
      
      if (save_to_airtable && currentImageUrl) {
        try {
          console.log(`[Pipeline ${pipeline_id}] Salvando no Airtable...`);
          
          // Extrair dados dos steps
          const stagingStep = pipelineResults.steps.find(s => s.name === "virtual_staging");
          const fluxStep = pipelineResults.steps.find(s => s.name === "flux_enhancement");
          
          airtableResult = await saveProcessedFluxImage({
            // Obrigatório
            output_image_url: currentImageUrl,
            
            // Dados do pipeline
            property_code: property_code,
            property_url: property_url || image_url,
            room_type: room_type,
            style: style,
            
            // Relacionamentos (se fornecidos)
            client_id: client_id,
            user_id: user_id,
            invoice_id: invoice_id,
            
            // URL de entrada (Virtual Staging)
            input_image_url: stagingStep?.result_url || null,
            
            // Metadados do pipeline
            pipeline_id: pipeline_id,
            staging_render_id: stagingStep?.render_id || null,
            flux_task_id: fluxStep?.task_id || null,
            request_log: `Pipeline automático VS+FLUX concluído em ${pipelineResults.processing_time_seconds}s`
          });
          
          if (airtableResult.success) {
            console.log(`[Pipeline ${pipeline_id}] Salvo no Airtable: ${airtableResult.record_id}`);
            pipelineResults.steps.push({
              step: 3,
              name: "airtable_save",
              status: "completed",
              record_id: airtableResult.record_id,
              table: airtableResult.table
            });
          } else {
            console.log(`[Pipeline ${pipeline_id}] Erro ao salvar no Airtable: ${airtableResult.error}`);
            pipelineResults.steps.push({
              step: 3,
              name: "airtable_save",
              status: "failed",
              error: airtableResult.error
            });
            pipelineResults.errors.push(`Airtable: ${airtableResult.error}`);
          }
          
        } catch (airtableError) {
          console.error(`[Pipeline ${pipeline_id}] Exceção ao salvar no Airtable:`, airtableError.message);
          pipelineResults.steps.push({
            step: 3,
            name: "airtable_save",
            status: "failed",
            error: airtableError.message
          });
          pipelineResults.errors.push(`Airtable: ${airtableError.message}`);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: "Pipeline concluído com sucesso",
        pipeline_id,
        original_image: image_url,
        final_image: currentImageUrl,
        data: pipelineResults,
        airtable: airtableResult
      });
    } else if (wait_for_completion) {
      return res.status(500).json({
        success: false,
        message: "Pipeline encontrou erros",
        pipeline_id,
        data: pipelineResults
      });
    } else {
      return res.status(202).json({
        success: true,
        message: "Pipeline iniciado - verificação manual necessária",
        pipeline_id,
        data: pipelineResults
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

/**
 * Rota simplificada: apenas staging sem enhancement
 */
router.post("/pipeline/staging-only", async (req, res) => {
  try {
    const modifiedBody = {
      ...req.body,
      skip_enhancement: true
    };

    // Redireciona para a rota principal
    req.body = modifiedBody;
    return router.handle(
      { ...req, url: "/pipeline/staging-and-enhance", method: "POST" },
      res
    );

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

/**
 * Rota simplificada: apenas enhancement sem staging
 */
router.post("/pipeline/enhance-only", async (req, res) => {
  try {
    const modifiedBody = {
      ...req.body,
      skip_staging: true
    };

    // Redireciona para a rota principal
    req.body = modifiedBody;
    return router.handle(
      { ...req, url: "/pipeline/staging-and-enhance", method: "POST" },
      res
    );

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

/**
 * Rota para obter informações sobre o pipeline
 */
router.get("/pipeline/info", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        endpoints: {
          main_pipeline: "POST /api/pipeline/staging-and-enhance",
          staging_only: "POST /api/pipeline/staging-only",
          enhance_only: "POST /api/pipeline/enhance-only",
          info: "GET /api/pipeline/info"
        },
        steps: [
          {
            step: 1,
            name: "Virtual Staging",
            description: "Adiciona ou remove móveis, aplica estilos decorativos",
            configurable: true,
            skippable: true
          },
          {
            step: 2,
            name: "FLUX Enhancement",
            description: "Melhora iluminação, qualidade e detalhes da imagem",
            configurable: true,
            skippable: true
          },
          {
            step: 3,
            name: "Airtable Save (opcional)",
            description: "Salva imagem processada na tabela Images do Airtable",
            configurable: true,
            optional: true,
            requires: ["save_to_airtable: true", "client_id", "user_id"]
          }
        ],
        features: {
          async_processing: true,
          intermediate_results: true,
          error_recovery: true,
          partial_completion: true
        },
        default_settings: {
          room_type: "living",
          style: "modern",
          flux_model: FLUX_MODELS.FLUX_KONTEXT_PRO,
          wait_for_completion: true,
          save_to_airtable: false
        },
        airtable_parameters: {
          save_to_airtable: "boolean - Ativa salvamento no Airtable",
          property_code: "string - Código do imóvel",
          property_url: "string - URL da propriedade",
          client_id: "string - ID do cliente (formato: recXXXXXXXXXXXXXXX)",
          user_id: "string - ID do usuário (formato: recXXXXXXXXXXXXXXX)",
          invoice_id: "string - ID da fatura (opcional)"
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
