import express from "express";
import multer from "multer";
import {
  testConnection,
  analyzeLayoutAgent,
  generateStagingAgent,
  verifyQualityAgent,
  fullStagingPipeline,
  MODELS,
  ASPECT_RATIOS,
  DESIGN_STYLES,
  DEFAULT_STYLE
} from "../connectors/imagenStaging.js";
import { uploadToFirebase } from "../connectors/firebaseStorage.js";

const router = express.Router();

// Configurar multer para aceitar uploads de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
    cb(null, true);
  }
});

/**
 * POST /imagen-staging
 * Rota simplificada para compatibilidade - redireciona para full-pipeline
 */
router.post("/imagen-staging", async (req, res) => {
  try {
    const {
      imageUrl,
      designStyle = DEFAULT_STYLE,
      roomType,
      options = {}
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: imageUrl"
      });
    }

    console.log("🚀 Requisição simplificada - redirecionando para pipeline completo");

    // Monta os parâmetros para o pipeline completo
    const pipelineParams = {
      image_url: imageUrl,
      design_style: designStyle,
      aspect_ratio: options.aspectRatio || "16:9",
      number_of_images: options.numberOfImages || 1,
      safety_filter_level: options.safetyFilterLevel || "block_low_and_above",
      upload_to_firebase: options.uploadToFirebase !== false,
      client_name: options.clientName || "imagen-staging"
    };

    // Executa o pipeline completo
    const result = await fullStagingPipeline(pipelineParams.image_url, {
      aspectRatio: pipelineParams.aspect_ratio,
      numberOfImages: pipelineParams.number_of_images,
      safetyFilterLevel: pipelineParams.safety_filter_level,
      designStyle: pipelineParams.design_style
    });

    let firebaseUrl = null;

    // Upload para Firebase
    if (pipelineParams.upload_to_firebase && result.staging.imageBuffer) {
      try {
        console.log("☁️ Fazendo upload para Firebase...");

        const timestamp = Date.now();
        const fileName = `staging-${timestamp}.jpg`;

        const uploadResult = await uploadToFirebase(
          result.staging.imageBuffer,
          fileName,
          result.staging.mimeType || 'image/jpeg',
          pipelineParams.client_name
        );

        firebaseUrl = uploadResult;
        console.log("✅ Upload para Firebase concluído");

      } catch (uploadError) {
        console.error("⚠️ Erro no upload para Firebase:", uploadError.message);
      }
    }

    // Resposta
    res.status(200).json({
      success: true,
      message: result.verification.passed
        ? "Virtual staging concluído com sucesso"
        : "Virtual staging concluído com avisos",
      data: {
        layoutDescription: result.layout.description,
        verification: {
          passed: result.verification.passed,
          checks: result.verification.checks
        },
        imageBase64: result.staging.imageBase64,
        mimeType: result.staging.mimeType,
        firebaseUrl: firebaseUrl,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error("❌ Erro na rota simplificada:", error);
    res.status(500).json({
      success: false,
      message: "Erro no processamento",
      error: error.message
    });
  }
});

/**
 * GET /imagen-staging/test
 * Testa conexão com a API Gemini
 */
router.get("/imagen-staging/test", async (req, res) => {
  try {
    const result = await testConnection();

    res.status(200).json({
      success: true,
      message: "Conexão com Gemini AI funcionando",
      data: result
    });

  } catch (error) {
    console.error("❌ Erro no teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro no teste de conexão",
      error: error.message
    });
  }
});

/**
 * POST /imagen-staging/analyze-layout
 * Executa apenas o Agente 1: Análise de Layout
 */
router.post("/imagen-staging/analyze-layout", async (req, res) => {
  try {
    const { image_url, design_style = DEFAULT_STYLE } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    // Validar design_style
    const validStyles = Object.values(DESIGN_STYLES).map(s => s.key);
    if (!validStyles.includes(design_style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo de design inválido: ${design_style}`,
        available_styles: DESIGN_STYLES
      });
    }

    console.log("📊 Analisando layout da imagem:", image_url);
    console.log("🎨 Estilo:", design_style);

    const result = await analyzeLayoutAgent(image_url, design_style);

    res.status(200).json({
      success: true,
      message: "Layout analisado com sucesso",
      data: result
    });

  } catch (error) {
    console.error("❌ Erro na análise de layout:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao analisar layout",
      error: error.message
    });
  }
});

/**
 * POST /imagen-staging/generate
 * Executa apenas o Agente 2: Geração de Imagem
 * Requer uma descrição de layout (do Agente 1)
 */
router.post("/imagen-staging/generate", async (req, res) => {
  try {
    const {
      layout_description,
      aspect_ratio = "16:9",
      negative_prompt,
      number_of_images = 1,
      safety_filter_level = "block_low_and_above",
      design_style = DEFAULT_STYLE
    } = req.body;

    if (!layout_description) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: layout_description"
      });
    }

    // Validar aspect ratio
    if (!Object.values(ASPECT_RATIOS).includes(aspect_ratio)) {
      return res.status(400).json({
        success: false,
        message: `Aspect ratio inválido: ${aspect_ratio}`,
        available_ratios: Object.values(ASPECT_RATIOS)
      });
    }

    // Validar design_style
    const validStyles = Object.values(DESIGN_STYLES).map(s => s.key);
    if (!validStyles.includes(design_style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo de design inválido: ${design_style}`,
        available_styles: DESIGN_STYLES
      });
    }

    console.log("🎨 Gerando imagem de staging...");
    console.log("🎨 Estilo:", design_style);

    const result = await generateStagingAgent(layout_description, {
      aspectRatio: aspect_ratio,
      numberOfImages: number_of_images,
      negativePrompt: negative_prompt,
      safetyFilterLevel: safety_filter_level,
      designStyle: design_style
    });

    // Retorna a imagem em base64
    res.status(200).json({
      success: true,
      message: "Imagem gerada com sucesso",
      data: {
        image_base64: result.imageBase64,
        mime_type: result.mimeType,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    console.error("❌ Erro na geração:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar imagem",
      error: error.message
    });
  }
});

/**
 * POST /imagen-staging/verify
 * Executa apenas o Agente 3: Verificação de Qualidade
 * Requer a imagem original e a imagem gerada
 */
router.post("/imagen-staging/verify", async (req, res) => {
  try {
    const {
      original_image_url,
      generated_image_base64
    } = req.body;

    if (!original_image_url || !generated_image_base64) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: original_image_url, generated_image_base64"
      });
    }

    console.log("🔍 Verificando qualidade da imagem gerada...");

    const result = await verifyQualityAgent(
      original_image_url,
      generated_image_base64
    );

    res.status(200).json({
      success: true,
      message: result.passed ? "Verificação passou" : "Verificação falhou",
      data: result
    });

  } catch (error) {
    console.error("❌ Erro na verificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar imagem",
      error: error.message
    });
  }
});

/**
 * POST /imagen-staging/full-pipeline
 * Executa o pipeline completo: Análise + Geração + Verificação
 * Com upload automático para Firebase
 * NOTA: aspect_ratio foi removido - sempre usa proporção original
 */
router.post("/imagen-staging/full-pipeline", async (req, res) => {
  try {
    const {
      image_url,
      negative_prompt,
      number_of_images = 1,
      safety_filter_level = "block_low_and_above",
      upload_to_firebase = true,
      client_name = "imagen-staging",
      design_style = DEFAULT_STYLE
    } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }

    // Validar design_style
    const validStyles = Object.values(DESIGN_STYLES).map(s => s.key);
    if (!validStyles.includes(design_style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo de design inválido: ${design_style}`,
        available_styles: DESIGN_STYLES
      });
    }

    console.log("🚀 Iniciando pipeline completo de Virtual Staging");
    console.log("🖼️ Imagem:", image_url);
    console.log("🎨 Estilo:", design_style);

    // Executa o pipeline completo (SEM aspect_ratio - usa proporção original)
    const result = await fullStagingPipeline(image_url, {
      numberOfImages: number_of_images,
      negativePrompt: negative_prompt,
      safetyFilterLevel: safety_filter_level,
      designStyle: design_style
    });

    let firebaseUrl = null;

    // Upload para Firebase (se solicitado)
    if (upload_to_firebase && result.staging.imageBuffer) {
      try {
        console.log("☁️ Fazendo upload para Firebase...");

        const timestamp = Date.now();
        const fileName = `staging-${timestamp}.jpg`;

        const uploadResult = await uploadToFirebase(
          result.staging.imageBuffer,
          fileName,
          result.staging.mimeType || 'image/jpeg',
          client_name
        );

        firebaseUrl = uploadResult;
        console.log("✅ Upload para Firebase concluído");

      } catch (uploadError) {
        console.error("⚠️ Erro no upload para Firebase:", uploadError.message);
        // Continua mesmo com erro no upload
      }
    }

    // Prepara resposta
    const responseData = {
      success: true,
      message: result.verification.passed
        ? "Virtual staging concluído com sucesso - Verificação PASSOU"
        : "Virtual staging concluído com AVISOS - Verificação identificou possíveis problemas",
      data: {
        layout_description: result.layout.description,
        verification: {
          passed: result.verification.passed,
          checks: result.verification.checks,
          score: result.verification.score,
          attempts: result.verification.attempts,
          warnings: result.verification.warnings,
          bestAttempt: result.verification.bestAttempt
        },
        image_base64: result.staging.imageBase64,
        mime_type: result.staging.mimeType,
        firebase_url: firebaseUrl,
        metadata: result.metadata
      }
    };

    // Se a verificação falhou, retorna status 200 mas com warning
    if (!result.verification.passed) {
      responseData.warning = "A imagem gerada pode ter problemas de qualidade";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erro no pipeline:", error);
    res.status(500).json({
      success: false,
      message: "Erro no pipeline de staging",
      error: error.message
    });
  }
});

/**
 * POST /imagen-staging/full-pipeline-upload
 * Pipeline completo com upload de arquivo
 * Aceita FormData com arquivo de imagem
 */
router.post("/imagen-staging/full-pipeline-upload", upload.single('image'), async (req, res) => {
  try {
    const {
      design_style = DEFAULT_STYLE,
      upload_to_firebase = 'true',
      client_name = "imagen-staging"
    } = req.body;

    // Validar arquivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: arquivo de imagem"
      });
    }

    // Validar design_style
    const validStyles = Object.values(DESIGN_STYLES).map(s => s.key);
    if (!validStyles.includes(design_style)) {
      return res.status(400).json({
        success: false,
        message: `Estilo de design inválido: ${design_style}`,
        available_styles: DESIGN_STYLES
      });
    }

    console.log("🚀 Iniciando pipeline completo de Virtual Staging (Upload)");
    console.log("📁 Arquivo:", req.file.originalname, `(${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log("🎨 Estilo:", design_style);

    // Executa o pipeline completo com buffer de imagem
    const result = await fullStagingPipeline(req.file.buffer, {
      numberOfImages: 1,
      safetyFilterLevel: "block_low_and_above",
      designStyle: design_style,
      isBuffer: true // Flag para indicar que é buffer
    });

    let firebaseUrl = null;

    // Upload para Firebase (se solicitado)
    if (upload_to_firebase === 'true' && result.staging.imageBuffer) {
      try {
        console.log("☁️ Fazendo upload para Firebase...");

        const timestamp = Date.now();
        const fileName = `staging-${timestamp}.jpg`;

        const uploadResult = await uploadToFirebase(
          result.staging.imageBuffer,
          fileName,
          result.staging.mimeType || 'image/jpeg',
          client_name
        );

        firebaseUrl = uploadResult;
        console.log("✅ Upload para Firebase concluído");

      } catch (uploadError) {
        console.error("⚠️ Erro no upload para Firebase:", uploadError.message);
      }
    }

    // Prepara resposta
    const responseData = {
      success: true,
      message: result.verification.passed
        ? "Virtual staging concluído com sucesso - Verificação PASSOU"
        : "Virtual staging concluído com AVISOS - Verificação identificou possíveis problemas",
      data: {
        layout_description: result.layout.description,
        verification: {
          passed: result.verification.passed,
          checks: result.verification.checks,
          score: result.verification.score,
          attempts: result.verification.attempts,
          warnings: result.verification.warnings,
          bestAttempt: result.verification.bestAttempt
        },
        image_base64: result.staging.imageBase64,
        mime_type: result.staging.mimeType,
        firebase_url: firebaseUrl,
        metadata: result.metadata
      }
    };

    if (!result.verification.passed) {
      responseData.warning = "A imagem gerada pode ter problemas de qualidade";
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Erro no pipeline:", error);
    res.status(500).json({
      success: false,
      message: "Erro no pipeline de staging",
      error: error.message
    });
  }
});

/**
 * GET /imagen-staging/models
 * Lista modelos, estilos e configurações disponíveis
 */
router.get("/imagen-staging/models", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      models: MODELS,
      aspect_ratios: ASPECT_RATIOS,
      design_styles: DESIGN_STYLES,
      default_style: DEFAULT_STYLE,
      agents: {
        agent_1: "Layout Analyzer - Analisa e descreve o layout de móveis",
        agent_2: "Staging Generator - Gera a imagem de virtual staging",
        agent_3: "Quality Verifier - Verifica se não houve alucinações"
      }
    }
  });
});

export default router;
