import express from "express";
import multer from "multer";
import Airtable from "airtable";
import {
  testConnection,
  analyzeLayoutAgent,
  generateStagingAgent,
  verifyQualityAgent,
  fullStagingPipeline,
  testPrompts,
  MODELS,
  ASPECT_RATIOS,
  DESIGN_STYLES,
  DEFAULT_STYLE
} from "../connectors/imagenStaging.js";
import { uploadToFirebase } from "../connectors/firebaseStorage.js";
import { upsetImagesInAirtable } from "../connectors/airtable.js";

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
      design_style = DEFAULT_STYLE,
      room_type = "living_room"
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

    // Validar room_type
    const validRoomTypes = [
      'living_room',
      'bedroom',
      'kids_bedroom',
      'baby_bedroom',
      'home_office',
      'kitchen',
      'outdoor'
    ];
    if (!validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de cômodo inválido: ${room_type}`,
        available_room_types: validRoomTypes
      });
    }

    console.log("🚀 Iniciando pipeline completo de Virtual Staging");
    console.log("🖼️ Imagem:", image_url);
    console.log("🎨 Estilo:", design_style);
    console.log("🏠 Cômodo:", room_type);

    // Executa o pipeline completo (SEM aspect_ratio - usa proporção original)
    const result = await fullStagingPipeline(image_url, {
      numberOfImages: number_of_images,
      negativePrompt: negative_prompt,
      safetyFilterLevel: safety_filter_level,
      designStyle: design_style,
      roomType: room_type
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
      client_name = "imagen-staging",
      room_type = "living_room"
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

    // Validar room_type
    const validRoomTypes = [
      'living_room',
      'bedroom',
      'kids_bedroom',
      'baby_bedroom',
      'home_office',
      'kitchen',
      'outdoor'
    ];
    if (!validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de cômodo inválido: ${room_type}`,
        available_room_types: validRoomTypes
      });
    }

    console.log("🚀 Iniciando pipeline completo de Virtual Staging (Upload)");
    console.log("📁 Arquivo:", req.file.originalname, `(${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log("🎨 Estilo:", design_style);
    console.log("🏠 Cômodo:", room_type);

    // Executa o pipeline completo com buffer de imagem
    const result = await fullStagingPipeline(req.file.buffer, {
      numberOfImages: 1,
      safetyFilterLevel: "block_low_and_above",
      designStyle: design_style,
      roomType: room_type,
      isBuffer: true // Flag para indicar que é buffer
    });

    let firebaseUrl = null;
    let originalFirebaseUrl = null;

    // Upload para Firebase (se solicitado)
    if (upload_to_firebase === 'true') {
      try {
        const timestamp = Date.now();

        // Upload da imagem ORIGINAL
        if (req.file.buffer) {
          console.log("☁️ Fazendo upload da imagem ORIGINAL para Firebase...");
          const originalFileName = `${timestamp}_original-${req.file.originalname}`;
          
          originalFirebaseUrl = await uploadToFirebase(
            req.file.buffer,
            originalFileName,
            req.file.mimetype,
            client_name
          );
          console.log("✅ Upload da imagem original concluído");
        }

        // Upload da imagem PROCESSADA
        if (result.staging.imageBuffer) {
          console.log("☁️ Fazendo upload da imagem PROCESSADA para Firebase...");
          const fileName = `${timestamp}_staging-${timestamp}.jpg`;

          firebaseUrl = await uploadToFirebase(
            result.staging.imageBuffer,
            fileName,
            result.staging.mimeType || 'image/jpeg',
            client_name
          );
          console.log("✅ Upload da imagem processada concluído");
        }

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
        original_firebase_url: originalFirebaseUrl,
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

// ===================================================================
// 🏥 HEALTH CHECK: Verificar se a rota de aprovação está funcionando
// ===================================================================
router.get('/imagen-staging/approve/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rota de aprovação está funcionando',
    timestamp: new Date().toISOString()
  });
});

// ===================================================================
// 👍 ROTA DE APROVAÇÃO: Salvar Imagem Aprovada no Airtable
// ===================================================================
router.post('/imagen-staging/approve', async (req, res) => {
  try {
    console.log("👍 [POST /approve] Rota acessada!");
    console.log("👍 [POST /approve] Body recebido:", JSON.stringify(req.body, null, 2));
    console.log("👍 [POST /approve] Iniciando aprovação de imagem...");
    
    const {
      input_image_url,
      output_image_url,
      property_code,
      room_type,
      design_style,
      layout_description,
      quality_score,
      checks_passed,
      checks_total,
      client_email,
      client_id,
      user_id,
      invoice_id,
      client_name,
      base_table,
      approved_at
    } = req.body;

    // Validações
    if (!output_image_url) {
      return res.status(400).json({
        success: false,
        error: 'output_image_url é obrigatório'
      });
    }

    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: 'client_id é obrigatório'
      });
    }

    console.log("📋 Dados recebidos:", {
      client_id,
      user_id,
      invoice_id,
      room_type,
      design_style,
      quality_score
    });

    // Mapeamento de room_type (inglês → português para Airtable)
    const roomTypeMap = {
      'living_room': 'Sala de estar + jantar',
      'kitchen': 'Cozinha',
      'bedroom': 'Quarto',
      'kids_bedroom': 'Quarto infantil',
      'baby_bedroom': 'Quarto infantil',
      'outdoor': 'Área externa',
      'home_office': 'Home Office'
    };

    const roomTypePt = roomTypeMap[room_type] || room_type;

    // Configurar Airtable
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY
    });
    const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

    // Preparar dados para Airtable (campos exatos da tabela Images)
    // ETAPA 1: Criar registro SEM campo 'status' (evitar conflito com automação)
    const recordData = {
      client: [client_id],
      invoice: invoice_id ? [invoice_id] : [],
      workflow: 'SmartBanana',
      input_img: input_image_url ? [{ url: input_image_url }] : [],
      output_img: [{ url: output_image_url }],
      style: [],
      room_type: roomTypePt,
      property_code: property_code || '',
      user: user_id ? [user_id] : []
    };

    console.log("📤 Criando registro direto no Airtable (sem status inicial):", recordData);

    // Criar registro diretamente via API do Airtable
    const createdRecords = await base('Images').create([
      { fields: recordData }
    ]);

    if (createdRecords && createdRecords.length > 0) {
      const record = createdRecords[0];
      console.log(`✅ [POST /approve] Registro criado no Airtable: ${record.id}`);
      
      // ETAPA 2: Aguardar 5 segundos para automação do Airtable executar
      console.log("⏳ Aguardando 5s para automação do Airtable...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // ETAPA 3: Atualizar campo 'status' (sobrescreve automação)
      console.log("🔄 Atualizando status para 'Imagem aprovada'...");
      await base('Images').update(record.id, {
        status: 'Imagem aprovada'
      });
      console.log(`✅ [POST /approve] Status atualizado com sucesso!`);
      
      res.json({
        success: true,
        message: 'Imagem aprovada e salva com sucesso',
        airtable_record_id: record.id,
        data: {
          room_type,
          design_style,
          quality_score,
          client_name: client_name || client_email,
          input_img: input_image_url,
          output_img: output_image_url
        }
      });
    } else {
      throw new Error('Falha ao criar registro no Airtable');
    }

  } catch (error) {
    console.error("❌ [POST /approve] Erro:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao salvar aprovação'
    });
  }
});

// ===================================================================
// 🧪 ROTA DE TESTE: Visualizar Prompts sem Processar Imagem
// ===================================================================
router.post('/imagen-staging/test-prompts', async (req, res) => {
  try {
    const { design_style = 'scandinavian', room_type = 'living_room' } = req.body;

    // Validar room_type
    const validRoomTypes = [
      'living_room', 'bedroom', 'kids_bedroom', 'baby_bedroom',
      'home_office', 'kitchen', 'outdoor'
    ];

    if (!validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        error: 'Invalid room_type',
        validOptions: validRoomTypes,
        received: room_type
      });
    }

    console.log(`\n🧪 Testando prompts para: ${room_type} | Estilo: ${design_style}`);

    // Executar teste
    const testResult = testPrompts(design_style, room_type);

    // Retornar resultado estruturado
    res.json({
      success: true,
      message: 'Prompts gerados com sucesso (modo teste)',
      data: testResult,
      instructions: {
        message: 'Os prompts foram exibidos no console do servidor',
        tip: 'Verifique o terminal onde o servidor está rodando para ver os logs completos'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao testar prompts:', error);
    res.status(500).json({
      error: 'Erro ao gerar prompts de teste',
      details: error.message
    });
  }
});

export default router;
