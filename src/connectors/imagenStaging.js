import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log("🔑 GEMINI_API_KEY presente:", !!GEMINI_API_KEY);
console.log("🔑 GEMINI_API_KEY length:", GEMINI_API_KEY?.length || 0);

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY não definida - Imagen Staging não funcionará");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Modelos disponíveis
export const MODELS = {
  // Nano Banana - suporta edição de imagens (image-to-image)
  GEMINI_IMAGE_FLASH: "gemini-2.5-flash-image", // Rápido e eficiente para edição
  GEMINI_IMAGE_PRO: "gemini-3-pro-image-preview", // Alta qualidade, até 4K
  // Modelos de texto
  GEMINI_FLASH: "gemini-2.0-flash-exp",
  GEMINI_PRO: "gemini-1.5-pro-latest"
};

// Aspect ratios suportados
export const ASPECT_RATIOS = {
  SQUARE: "1:1",
  PORTRAIT: "9:16",
  LANDSCAPE: "16:9",
  PORTRAIT_4_3: "3:4",
  LANDSCAPE_4_3: "4:3"
};

// Estilos de design disponíveis
export const DESIGN_STYLES = {
  CONTEMPORARY_MINIMALIST: {
    key: "contemporary_minimalist",
    name: "Contemporary Minimalist",
    description: "Effortless elegance with a neutral, soft palette, clean-lined furniture with organic shapes, and varied textures such as polished wood, light fabrics, and sophisticated leather, complemented by discreet abstract art and a few plants. Balcony furniture uses weather-appropriate materials, blending tropical ease with cosmopolitan sophistication and abundant vegetation."
  },
  MODERN: {
    key: "modern",
    name: "Modern",
    description: "Sleek, contemporary design with bold geometric shapes, monochromatic color schemes with accent colors, mix of materials like glass, metal, and leather. Focus on functionality and clean lines with statement pieces."
  },
  SCANDINAVIAN: {
    key: "scandinavian",
    name: "Scandinavian",
    description: "Light, airy spaces with natural wood tones, white and pastel colors, simple functional furniture with clean lines, cozy textiles, and minimal decoration. Emphasis on natural light and hygge comfort."
  },
  INDUSTRIAL: {
    key: "industrial",
    name: "Industrial",
    description: "Raw, exposed materials like brick and concrete, metal fixtures, reclaimed wood furniture, neutral color palette with dark accents, vintage-inspired lighting, and utilitarian design elements."
  },
  BOHEMIAN: {
    key: "bohemian",
    name: "Bohemian",
    description: "Eclectic mix of patterns and textures, vibrant colors, natural materials, layered textiles, plants, vintage and global-inspired pieces, creating a relaxed, artistic atmosphere."
  },
  LUXURY: {
    key: "luxury",
    name: "Luxury",
    description: "High-end materials like marble, velvet, and brass, rich color palette with jewel tones, elegant furniture with sophisticated details, statement lighting, and refined decorative elements."
  },
  COASTAL: {
    key: "coastal",
    name: "Coastal",
    description: "Light, breezy aesthetic with white and blue tones, natural materials like rattan and linen, nautical accents, weathered wood, and elements that evoke seaside living."
  },
  MIDCENTURY: {
    key: "midcentury",
    name: "Mid-Century Modern",
    description: "Iconic 1950s-60s design with organic curves, tapered legs, warm wood tones, bold geometric patterns, accent colors like orange and teal, and functional minimalist approach."
  }
};

// Estilo padrão
export const DEFAULT_STYLE = DESIGN_STYLES.CONTEMPORARY_MINIMALIST.key;

// Funções para gerar prompts dos agentes com estilo customizável
const AGENT_PROMPTS = {
  LAYOUT_ANALYZER: (designStyle = DEFAULT_STYLE) => {
    const styleInfo = Object.values(DESIGN_STYLES).find(s => s.key === designStyle) || DESIGN_STYLES.CONTEMPORARY_MINIMALIST;
    
    return `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the space in the Input Image composed by distinct furniture islands.

Observe the Input Image and determine which distinct functional areas are visible (e.g., living/dining room, tv rack/mount area, balcony, extended living/dining balcony, integrated kitchen), estimating their size.

Segment these distinct functional areas into use clusters where furniture islands will be added, ensuring that all visible space in the Input Image is accounted for and maintaining cohesion while at the same time separation between distinct functional areas.

Describe a cohesive furniture layout for each island within an overall composition that does not obstruct pathways, circulation, or views, and does not leave large unused areas. Dimension each island and its respective furniture pieces according to the available area, making efficient use of the floor space while leaving sufficient breathing room for circulation. Consider accessories and finishing touches to create a complete, coherent, and cohesive layout.

DESIGN STYLE TO ADOPT: ${styleInfo.name}
Style Description: ${styleInfo.description}

Provide a detailed description of the furniture layout for this space following this design style.`;
  },

  STAGING_GENERATOR: (layoutDescription, designStyle = DEFAULT_STYLE) => {
    const styleInfo = Object.values(DESIGN_STYLES).find(s => s.key === designStyle) || DESIGN_STYLES.CONTEMPORARY_MINIMALIST;
    
    return `Task: Apply the described layout and furniture to the image.

Do not obstruct circulation spaces, doors, entrances, sliding doors, windows, or views.

Maintain a cohesive spatial relationship between the furniture islands, keeping the boundaries between the established distinct functional areas clear of furniture.

DESIGN STYLE TO ADOPT: ${styleInfo.name}
Style Description: ${styleInfo.description}

The most important instruction to follow rigorously: Do not change anything else in the image besides adding the furniture and finishes.

FURNITURE LAYOUT TO APPLY:
${layoutDescription}`;
  },

  VERIFICATION_CHECKS: [
    {
      name: "walls",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. Map the walls and their lengths in both images. Are there alterations in the length of the corresponding walls between the images? Respond only: \"Walls: same/different\" + justification if \"different\"."
    },
    {
      name: "doors_windows",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. Map the doors and windows and their positions in both images. Are there alterations in door or window position between the images? Respond only: \"Doors/windows placement: same/different\" + justification if \"different\"."
    },
    {
      name: "peripheral_access",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. Map access pathways to adjacent areas not visible in the real photo. Are they still accessible in the AI render? Respond only: \"Peripheral access: same/different\" + justification if \"different\"."
    },
    {
      name: "shape",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. Map the visible floorplan shape in the real photo. Is it the same shape in the AI render? Respond only: \"Shape: same/different\" + justification if \"different\"."
    },
    {
      name: "obstructions",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. Map the doors, entrances, portals, storage units and circulation pathways in the real photo. Is access through any of them hindered totally or partially by the added furniture in the staged render? Respond only: \"Obstructions: Clear/hindered\" + justification if \"obstructed\"."
    },
    {
      name: "camera",
      prompt: "These two input images are a real photo and an AI-generated virtual staging of the same room. The furniture should be added on top of the real image without changing the camera characteristics. Analyze both images and determine whether the virtual camera of the AI render has the same camera position, angle, focal length/zoom, vanishing points, and horizon alignment as the real photo. Respond only: \"Camera: same/different\" + justification if \"different\"."
    }
  ]
};

/**
 * Teste de conexão com a API do Gemini
 */
export async function testConnection() {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    // Teste simples com um modelo de texto
    const model = genAI.getGenerativeModel({ model: MODELS.GEMINI_FLASH });
    const result = await model.generateContent("Test connection");
    
    return {
      success: true,
      message: "API Key válida",
      authenticated: true,
      test_response: result.response.text()
    };

  } catch (error) {
    if (error.message?.includes("API key")) {
      throw new Error("API Key inválida ou sem permissões");
    }
    throw error;
  }
}

/**
 * Baixa uma imagem de URL e converte para base64
 */
async function downloadImageAsBase64(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';

    return {
      mimeType,
      data: base64
    };
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

/**
 * Agente 1: Analisa a imagem e descreve o layout de móveis
 */
export async function analyzeLayoutAgent(imageUrl, designStyle = DEFAULT_STYLE) {
  try {
    console.log("🏗️ AGENTE 1: Analisando layout da imagem...");
    console.log(`🎨 Estilo: ${designStyle}`);

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado");
    }

    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_FLASH 
    });

    // Download da imagem
    const imageData = await downloadImageAsBase64(imageUrl);

    const imagePart = {
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    };

    const result = await model.generateContent([
      AGENT_PROMPTS.LAYOUT_ANALYZER(designStyle),
      imagePart
    ]);

    const layoutDescription = result.response.text();

    console.log("✅ AGENTE 1: Layout analisado");
    console.log("📋 Descrição do layout:", layoutDescription.substring(0, 200) + "...");

    return {
      success: true,
      layoutDescription,
      originalImageBase64: imageData.data,
      originalImageMimeType: imageData.mimeType,
      designStyle,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ AGENTE 1 - Erro:", error.message);
    throw new Error(`Agente de Layout falhou: ${error.message}`);
  }
}

/**
 * Agente 2: Gera a imagem de virtual staging usando Gemini Nano Banana (image editing)
 */
export async function generateStagingAgent(layoutDescription, originalImageBase64, options = {}) {
  try {
    console.log("🎨 AGENTE 2: Gerando virtual staging com Gemini Nano Banana...");

    const {
      aspectRatio = ASPECT_RATIOS.LANDSCAPE,
      numberOfImages = 1,
      safetyFilterLevel = "block_low_and_above",
      designStyle = DEFAULT_STYLE
    } = options;

    console.log(`🎨 Estilo: ${designStyle}`);
    console.log(`📐 Aspect Ratio: ${aspectRatio}`);

    const fullPrompt = AGENT_PROMPTS.STAGING_GENERATOR(layoutDescription, designStyle);

    console.log("📝 Prompt para Gemini Image:", fullPrompt.substring(0, 150) + "...");

    // Usar Gemini SDK para edição de imagens (image-to-image)
    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado - verifique GEMINI_API_KEY");
    }

    // Usar gemini-2.5-flash-image (Nano Banana) para edição de imagens
    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_IMAGE_FLASH,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
      }
    });

    // Preparar a imagem em formato base64 com prefixo inline_data
    const inputImage = {
      inlineData: {
        data: originalImageBase64,
        mimeType: "image/jpeg" // ou "image/png" dependendo da imagem
      }
    };

    // Gerar conteúdo com texto + imagem
    const result = await model.generateContent([fullPrompt, inputImage]);
    const response = await result.response;

    // Extrair a imagem gerada
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Nenhuma imagem foi gerada pelo Gemini");
    }

    const candidate = response.candidates[0];
    const parts = candidate.content?.parts || [];
    
    // Procurar pela parte que contém a imagem
    const outputImagePart = parts.find(part => part.inlineData?.mimeType?.startsWith('image/'));
    
    if (!outputImagePart || !outputImagePart.inlineData) {
      throw new Error("Nenhuma imagem encontrada na resposta do Gemini");
    }

    const imageBase64 = outputImagePart.inlineData.data;
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const mimeType = outputImagePart.inlineData.mimeType || 'image/png';

    console.log("✅ AGENTE 2: Imagem de staging gerada");
    console.log(`📊 Tamanho: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📝 Tipo MIME: ${mimeType}`);

    return {
      success: true,
      imageBuffer,
      imageBase64,
      mimeType,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ AGENTE 2 - Erro:", error.message);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error("📊 Status:", error.response.status);
      console.error("📋 Resposta da API:", JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(`Agente de Geração falhou: ${error.message}`);
  }
}

/**
 * Agente 3: Verifica a qualidade da imagem gerada
 */
export async function verifyQualityAgent(originalImageUrl, generatedImageBase64) {
  try {
    console.log("🔍 AGENTE 3: Verificando qualidade da imagem gerada (3 checks críticos)...");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado");
    }

    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_FLASH 
    });

    // Download da imagem original
    const originalImageData = await downloadImageAsBase64(originalImageUrl);

    const originalImagePart = {
      inlineData: {
        data: originalImageData.data,
        mimeType: originalImageData.mimeType
      }
    };

    const generatedImagePart = {
      inlineData: {
        data: generatedImageBase64,
        mimeType: 'image/jpeg'
      }
    };

    // ✅ APENAS 2 VERIFICAÇÕES CRÍTICAS (reduzido de 6 para 2 para economizar quota)
    const criticalChecks = AGENT_PROMPTS.VERIFICATION_CHECKS.filter(check => 
      ['walls', 'obstructions'].includes(check.name)
    );

    const verificationResults = {};

    // Helper para executar check com retry em caso de erro 429
    const executeCheckWithRetry = async (check, maxRetries = 2) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`   🔎 Verificando: ${check.name} (tentativa ${attempt}/${maxRetries})...`);

          const result = await model.generateContent([
            check.prompt,
            originalImagePart,
            generatedImagePart
          ]);

          const checkResult = result.response.text();
          console.log(`   ✅ ${check.name}: ${checkResult.substring(0, 80)}...`);
          return checkResult;

        } catch (error) {
          const is429Error = error.message.includes('429') || 
                            error.message.includes('Too Many Requests') || 
                            error.message.includes('quota');
          
          // Se for erro 429 (quota excedida) e não for a última tentativa
          if (is429Error && attempt < maxRetries) {
            const waitTime = 60; // 60 segundos para quota resetar
            console.warn(`   ⚠️ ${check.name} - Quota excedida. Aguardando ${waitTime}s antes de retry ${attempt + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            continue;
          }
          
          // Se for última tentativa ou erro diferente de 429, propaga o erro
          throw error;
        }
      }
    };

    // Executa cada verificação com retry automático
    for (const check of criticalChecks) {
      verificationResults[check.name] = await executeCheckWithRetry(check);
    }

    // Analisa os resultados para determinar se passou
    const passed = analyzeVerificationResults(verificationResults);

    console.log(passed ? "✅ AGENTE 3: Verificação PASSOU (3/3 checks)" : "⚠️ AGENTE 3: Verificação FALHOU");

    return {
      success: true,
      passed,
      checks: verificationResults,
      timestamp: new Date().toISOString(),
      totalChecks: criticalChecks.length,
      checkTypes: ['walls', 'obstructions', 'camera']
    };

  } catch (error) {
    console.error("❌ AGENTE 3 - Erro:", error.message);
    throw new Error(`Agente de Verificação falhou: ${error.message}`);
  }
}

/**
 * Analisa os resultados das verificações
 */
function analyzeVerificationResults(results) {
  const issues = [];

  // Verifica paredes
  if (results.walls && results.walls.toLowerCase().includes("different")) {
    issues.push("Alteração nas paredes detectada");
  }

  // Verifica portas/janelas
  if (results.doors_windows && results.doors_windows.toLowerCase().includes("different")) {
    issues.push("Alteração em portas/janelas detectada");
  }

  // Verifica acesso periférico
  if (results.peripheral_access && results.peripheral_access.toLowerCase().includes("different")) {
    issues.push("Alteração no acesso periférico detectada");
  }

  // Verifica forma
  if (results.shape && results.shape.toLowerCase().includes("different")) {
    issues.push("Alteração na forma do ambiente detectada");
  }

  // Verifica obstruções
  if (results.obstructions && results.obstructions.toLowerCase().includes("hindered")) {
    issues.push("Obstruções de circulação detectadas");
  }

  // Verifica câmera
  if (results.camera && results.camera.toLowerCase().includes("different")) {
    issues.push("Alteração nas características da câmera detectada");
  }

  if (issues.length > 0) {
    console.log("⚠️ Issues encontrados:", issues);
    return false;
  }

  return true;
}

/**
 * Pipeline completo: Executa os 3 agentes em sequência
 */
export async function fullStagingPipeline(imageUrl, options = {}) {
  try {
    const { designStyle = DEFAULT_STYLE, ...otherOptions } = options;
    
    console.log("🚀 Iniciando pipeline completo de Virtual Staging");
    console.log("🖼️ Imagem original:", imageUrl);
    console.log("🎨 Estilo de design:", designStyle);

    const startTime = Date.now();

    // AGENTE 1: Análise de Layout
    const layoutResult = await analyzeLayoutAgent(imageUrl, designStyle);

    // AGENTE 2: Geração da Imagem (com image prompting)
    const stagingResult = await generateStagingAgent(
      layoutResult.layoutDescription,
      layoutResult.originalImageBase64,
      { ...otherOptions, designStyle }
    );

    // AGENTE 3: Verificação de Qualidade (com retry em caso de falha completa)
    let verificationResult;
    let verificationAttempt = 0;
    const maxVerificationAttempts = 2;
    
    while (verificationAttempt < maxVerificationAttempts) {
      try {
        verificationResult = await verifyQualityAgent(
          imageUrl,
          stagingResult.imageBase64
        );
        break; // Sucesso - sai do loop
      } catch (error) {
        verificationAttempt++;
        const isQuotaError = error.message.includes('429') || 
                           error.message.includes('quota') || 
                           error.message.includes('Too Many Requests');
        
        if (isQuotaError && verificationAttempt < maxVerificationAttempts) {
          console.warn(`⚠️ Agente 3 falhou completamente. Tentativa ${verificationAttempt + 1}/${maxVerificationAttempts} em 60s...`);
          await new Promise(resolve => setTimeout(resolve, 60000)); // 60 segundos
        } else {
          throw error; // Re-lança o erro se não for quota ou última tentativa
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Pipeline completo em ${totalTime}s`);

    return {
      success: true,
      layout: {
        description: layoutResult.layoutDescription
      },
      staging: {
        imageBuffer: stagingResult.imageBuffer,
        imageBase64: stagingResult.imageBase64,
        mimeType: stagingResult.mimeType
      },
      verification: {
        passed: verificationResult.passed,
        checks: verificationResult.checks
      },
      metadata: {
        originalImageUrl: imageUrl,
        processingTime: `${totalTime}s`,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Pipeline falhou:", error.message);
    throw error;
  }
}

export default {
  testConnection,
  analyzeLayoutAgent,
  generateStagingAgent,
  verifyQualityAgent,
  fullStagingPipeline,
  MODELS,
  ASPECT_RATIOS
};
