import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from "axios";
import sharp from "sharp";
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
  GEMINI_FLASH: "gemini-2.0-flash-exp",  // Para análise e verificação
  GEMINI_PRO: "gemini-1.5-pro-latest",
  GEMINI_3_PRO_IMAGE: "gemini-3-pro-image-preview"  // Para virtual staging com inpainting
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
  LAYOUT_ANALYZER: (designStyle = DEFAULT_STYLE, roomType = 'living_room') => {
    const styleInfo = Object.values(DESIGN_STYLES).find(s => s.key === designStyle) || DESIGN_STYLES.CONTEMPORARY_MINIMALIST;
    
    // Prompts específicos por tipo de cômodo
    const ROOM_LAYOUT_PROMPTS = {
      living_room: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the space in the Input Image

1. Observe the Input Image and determine which distinct functional areas are visible (e.g., living/dining room, tv rack/mount area, balcony, extended living/dining balcony, integrated kitchen), estimating their size. If the overall environment is small, consider it a single multiuse area.
2. Describe a furniture layout for the space by segmenting the functional areas into distinct furniture islands, ensuring efficient use of the floor area while maintaining clear circulation paths and avoiding large unused spaces. For each island, define its dimensions and establish layout that respects clearance from built-in elements, doors, and portals and maintains an overall cohesive composition. Add a tv area coherent with the overall layout if possible.`,

      bedroom: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the bedroom space in the Input Image

1. Observe the Input Image and determine which structural and built-in elements are visible (e.g., doors, windows, built-in storage).
2. Assess where furniture cannot be added in order to ensure proper clearance for structural and built-in elements visible in the original photo.
3. Describe a cohesive bedroom furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation. Give preference to existing structures to determine furniture placement without obstructions.`,

      kids_bedroom: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the children's bedroom space in the Input Image

1. Observe the Input Image and determine which structural and built-in elements are visible (e.g., doors, windows, built-in storage).
2. Assess where furniture cannot be added in order to ensure proper clearance for structural and built-in elements visible in the original photo.
3. Describe a cohesive children's bedroom furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation. Give preference to existing structures to determine furniture placement without obstructions.`,

      baby_bedroom: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the baby's bedroom space in the Input Image

1. Observe the Input Image and determine which structural and built-in elements are visible (e.g., doors, windows, built-in storage).
2. Assess where furniture cannot be added in order to ensure proper clearance for structural and built-in elements visible in the original photo.
3. Describe a cohesive baby's bedroom furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation. Give preference to existing structures to determine furniture placement without obstructions.`,

      home_office: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the home office space in the Input Image

1. Observe the Input Image and determine which structural and built-in elements are visible (e.g., doors, windows, built-in storage).
2. Assess where furniture cannot be added in order to ensure proper clearance for structural and built-in elements visible in the original photo.
3. Describe a cohesive home office furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation. Give preference to existing structures to determine furniture placement without obstructions.`,

      kitchen: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the kitchen space in the Input Image, by composing a functional layout that integrates existing elements.

1. Observe the Input Image and determine which structural elements are visible (e.g., doors, windows, plumbing fixtures, sinks, counters and cabinets).
2. Assess where furniture cannot be added in order to ensure proper clearance for structural and built-in elements visible in the original photo and for circulation.
3. Describe a cohesive kitchen furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation. Give preference to existing structures to determine furniture placement without obstructions and ensure current plumbing fixtures are incorporated in the place they already exist.
4. Identify furniture styles and materials that would elegantly complement the existing architecture in the input image.`,

      outdoor: `Role: You are a Senior Architect specialized in interior design. Your job is to create a cohesive furnishing layout for the outdoor space in the Input Image, by composing a functional layout that integrates existing elements.

1. Observe the Input Image and assess visible covered/uncovered and hardscape/softscape zones as well as structural elements (e.g., doors, windows, built-in grill, counter, plumbing fixtures) and estimate the size of these zones.
2. Determine which distinct functional areas are visible (e.g., garden, patio, swimming pool, barbecue/grill station, outdoor dining area, lounge deck, walking path, plumbing fixtures).
3. Segment these distinct functional areas into use clusters where furniture islands will be added, ensuring that all visible space in the Input Image is accounted for and maintaining cohesion while at the same time separation between distinct functional areas.
4. Describe a cohesive outdoor furniture layout and overall composition that does not obstruct pathways, circulation, or views. Choose furniture to compose a layout according to the available space, making efficient use of the floor area while leaving sufficient breathing room for circulation and without overcrowding softscape. Give preference to existing structures to determine furniture placement without obstructions. Note that small spaces may consist of only one usable area.`
    };

    // Seleciona o prompt correto baseado no roomType
    const basePrompt = ROOM_LAYOUT_PROMPTS[roomType] || ROOM_LAYOUT_PROMPTS.living_room;
    
    // Adiciona o estilo ao final do prompt
    return `${basePrompt}

Adopt a ${styleInfo.name.toLowerCase()} style—${styleInfo.description}`;
  },

  STAGING_GENERATOR: (designStyle = DEFAULT_STYLE, roomType = 'living_room') => {
    const styleInfo = Object.values(DESIGN_STYLES).find(s => s.key === designStyle) || DESIGN_STYLES.CONTEMPORARY_MINIMALIST;
    
    // Relação espacial por grupo de cômodos
    const SPATIAL_RELATION_PROMPTS = {
      furniture_islands: "Maintain a cohesive spatial relationship between the furniture islands, keeping the boundaries between the established distinct functional areas clear of furniture.",
      furniture_pieces: "Maintain a cohesive spatial relationship between the furniture pieces, keeping functional clearance between added furniture and the structural elements/built-in storage in the input image."
    };
    
    // Finalização específica por cômodo
    const ROOM_FINISHING_PROMPTS = {
      living_room: "Enrich the space with accessories and finishing touches, such as discreet decorative elements, subtle lighting, potted plant, artwork, to create a complete, coherent setting.",
      bedroom: "Enrich the space with accessories and finishing touches, such as discreet decorative elements, subtle lighting, potted plant, artwork, mat and shelves, to create a complete, pleasant setting.",
      kids_bedroom: "Enrich the space with accessories and finishing touches—such as cheerful decorative elements, child-safe lighting, stuffed animals, wall art, colorful bins, and shelves—to create a complete, coherent, cohesive, and child-friendly setting.",
      baby_bedroom: "Enrich the space with accessories and finishing touches—such as soothing decorative elements, warm ambient lighting, stuffed animals, wall art, mobiles, storage bins, and shelves—to create a complete, coherent, cohesive, and baby-friendly setting.",
      home_office: "Enrich the space with accessories and finishing touches—such as discreet decorative elements, task lighting, artwork, potted plants, organizational trays, and shelves—to create a complete, coherent, cohesive, and productive home office setting.",
      kitchen: "Enrich the space with accessories and finishing touches, such as discreet decorative elements, subtle lighting, potted plants, appliances, cookware to create a complete, coherent setting.",
      outdoor: "Enrich the space with subtle outdoor art and lush, well‑manicured, abundant greenery."
    };
    
    // Determina qual relação espacial usar
    const spatialRelation = ['living_room', 'outdoor'].includes(roomType) 
      ? SPATIAL_RELATION_PROMPTS.furniture_islands 
      : SPATIAL_RELATION_PROMPTS.furniture_pieces;
    
    // Seleciona finalização correta
    const finishing = ROOM_FINISHING_PROMPTS[roomType] || ROOM_FINISHING_PROMPTS.living_room;
    
    return `Task: Produce an output image that is exactly the same as the input image, but with the described furniture layout added, without changing anything else in the input image
- Do not obstruct circulation spaces, doors, entrances, sliding doors, windows, built-in elements or views

${spatialRelation}

${finishing}

Adopt a ${styleInfo.name.toLowerCase()} style—${styleInfo.description}

The most important instruction to follow rigorously: Do not change anything else in the image besides adding the furniture and finishes`;
  },

  VERIFICATION_CHECKS: (roomType = 'living_room') => {
    // Checks universais para todos os cômodos
    const universalChecks = [
      {
        id: 1,
        name: "walls",
        prompt: `These two images are a real photo and an AI-generated virtual staging of the same room. Map the walls and their lengths in both images. Are there alterations in the length of the corresponding walls between two the images? Respond only: "Walls: same/different" + justification if "different".`
      },
      {
        id: 2,
        name: "doors_windows",
        prompt: `These two images are a real photo and an AI-generated virtual staging of the same room. Map the doors and windows and their positions in both images. Are there alterations in door or window position between the images? Respond only: "Doors/windows placement: same/different" + justification if "different".`
      },
      {
        id: 3,
        name: "shape",
        prompt: `These two images are a real photo and an AI-generated virtual staging of the same room. Map the visible floorplan shape in the real photo. Is it the same shape in the AI render? Respond only: "Shape: same/different" + justification if "different".`
      },
      {
        id: 4,
        name: "obstructions",
        prompt: `These two images are a real photo and an AI-generated virtual staging of the same room. Map the doors, entrances, portals, storage units and circulation pathways in the real photo. Is access through any of them hindered totally or partially (less than 60cm clearance) by the added furniture in the staged render? Respond only: "Obstructions: Clear/hindered" + justification if "obstructed"`
      },
      {
        id: 5,
        name: "camera",
        prompt: `These two images are a real photo and an AI-generated virtual staging of the same room. The furniture should be added on top of the real image without changing the camera characteristics. Analyze both images and determine whether the virtual camera of the AI render has the same camera position, angle, focal length/zoom, vanishing points, and horizon alignment as the real photo. Respond only: "Camera: same/different" + justification if "different"`
      }
    ];

    // Checks específicos por tipo de cômodo
    const specificChecks = {
      outdoor: [
        {
          id: 6,
          name: "water_surfaces",
          prompt: `These two images are a real photo and an AI-generated virtual staging of the same space. Locate any added water surface/pool. Analyze both images and determine if there is furniture that intersects the water (unless it is specific in-pool furniture). Respond only: "Water surfaces: Ok/Intersected" + justification if "Intersected"`
        },
        {
          id: 7,
          name: "counters_plumbing",
          prompt: `These two images are a real photo and an AI-generated virtual staging of the same space. Analyze both images and determine whether the counters and plumbing fixtures visible in the original image also exist in the staged image in the same locations. Respond only: "Counters and plumbing: consistent/different" + justification if "different"`
        }
      ],
      kitchen: [
        {
          id: 6,
          name: "counters_plumbing",
          prompt: `These two images are a real photo and an AI-generated virtual staging of the same space. Analyze both images and determine whether the counters and plumbing fixtures visible in the original image also exist in the staged image in the same locations. Respond only: "Counters and plumbing: consistent/different" + justification if "different"`
        }
      ]
    };

    // Retorna checks universais + específicos do cômodo (se houver)
    return [
      ...universalChecks,
      ...(specificChecks[roomType] || [])
    ];
  }
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
 * Gera uma máscara PNG automática para inpainting
 * Centro: branco (área editável)
 * Bordas: preto (preservar estrutura)
 */
async function generateCenterMask(imageBuffer) {
  try {
    console.log("🎭 Gerando máscara automática para inpainting...");
    
    // Obter dimensões da imagem original
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    
    console.log(`📐 Dimensões da imagem: ${width}x${height}`);
    
    // Calcular área da máscara (70% centro = branco, 30% bordas = preto)
    const marginX = Math.floor(width * 0.15);  // 15% de cada lado = 30% total
    const marginY = Math.floor(height * 0.15);
    
    const maskWidth = width - (2 * marginX);
    const maskHeight = height - (2 * marginY);
    
    console.log(`🎭 Área editável (branco): ${maskWidth}x${maskHeight}`);
    console.log(`🛡️ Bordas preservadas (preto): ${marginX}px horizontal, ${marginY}px vertical`);
    
    // Criar máscara: fundo preto com retângulo branco no centro
    const mask = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 0, b: 0 } // Preto (preservar)
      }
    })
    .composite([{
      input: await sharp({
        create: {
          width: maskWidth,
          height: maskHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 } // Branco (editar)
        }
      }).png().toBuffer(),
      top: marginY,
      left: marginX
    }])
    .png()
    .toBuffer();
    
    const maskBase64 = mask.toString('base64');
    console.log("✅ Máscara gerada com sucesso!");
    
    return {
      mimeType: 'image/png',
      data: maskBase64
    };
    
  } catch (error) {
    console.error("❌ Erro ao gerar máscara:", error.message);
    throw new Error(`Falha ao gerar máscara: ${error.message}`);
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
 * Agentes 1+2 Combinados: Analisa layout e gera staging em uma única sessão de chat
 * Usa Gemini 3 Pro Image Preview com máscara para preservar estrutura arquitetônica
 * Suporta prompt incremental baseado em falhas anteriores
 * @param {string|Buffer} imageInput - URL da imagem ou Buffer do arquivo
 * @param {Object} options - Opções de configuração
 */
export async function analyzeLayoutAndGenerateStaging(imageInput, options = {}) {
  try {
    const {
      designStyle = DEFAULT_STYLE,
      roomType = 'living_room',
      numberOfImages = 1,
      previousFailures = [],  // Histórico de falhas para prompt incremental
      isBuffer = false  // Flag para indicar se imageInput é um Buffer
    } = options;

    console.log("🚀 AGENTES 1+2 COMBINADOS: Iniciando pipeline com chat session...");
    console.log(`🎨 Estilo: ${designStyle}`);
    console.log(`🏠 Cômodo: ${roomType}`);
    console.log(`📥 Tipo de input: ${isBuffer ? 'Buffer (Upload)' : 'URL'}`);
    
    if (previousFailures.length > 0) {
      console.log(`📝 Aplicando correções de ${previousFailures.length} falhas anteriores...`);
    }

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado");
    }

    // 1. Obter dados da imagem (URL ou Buffer)
    let imageData;
    let imageBuffer;

    if (isBuffer) {
      console.log("📥 Convertendo buffer para base64...");
      imageBuffer = imageInput;
      
      // Detectar mime type do buffer
      const metadata = await sharp(imageBuffer).metadata();
      const mimeType = metadata.format === 'jpeg' ? 'image/jpeg' : 
                      metadata.format === 'png' ? 'image/png' :
                      metadata.format === 'webp' ? 'image/webp' : 'image/jpeg';
      
      imageData = {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      };
    } else {
      console.log("📥 Baixando imagem de URL...");
      imageData = await downloadImageAsBase64(imageInput);
      imageBuffer = Buffer.from(imageData.data, 'base64');
    }

    // 2. Gerar máscara automática
    const maskData = await generateCenterMask(imageBuffer);

    // 3. Preparar partes para o modelo
    const imagePart = {
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    };

    const maskPart = {
      inlineData: {
        data: maskData.data,
        mimeType: maskData.mimeType
      }
    };

    // 4. Iniciar modelo Gemini 3 Pro Image Preview
    console.log("🤖 Inicializando Gemini 3 Pro Image Preview...");
    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_3_PRO_IMAGE,
      generationConfig: {
        temperature: 0.4,  // Baixa temperatura para mais fidelidade
        topK: 32,
        topP: 0.9
      }
    });

    // 5. Criar sessão de chat para preservar contexto
    const chat = model.startChat({
      history: []
    });

    // 6. TURNO 1: Análise de layout (com prompt incremental se houver falhas)
    console.log("🏗️ TURNO 1: Enviando imagem para análise de layout...");
    
    const layoutPrompt = buildIncrementalPrompt(
      AGENT_PROMPTS.LAYOUT_ANALYZER(designStyle, roomType),
      previousFailures
    );
    
    const analysisResult = await chat.sendMessage([
      layoutPrompt,
      imagePart,
      maskPart
    ]);

    const layoutDescription = analysisResult.response.text();
    console.log("✅ TURNO 1: Layout analisado!");
    console.log("📋 Layout:", layoutDescription.substring(0, 200) + "...");

    // 7. TURNO 2: Geração de staging (Gemini já tem a imagem em memória!)
    console.log("🎨 TURNO 2: Aplicando mobília (modelo lembra da imagem)...");
    
    const stagingPrompt = buildIncrementalPrompt(
      AGENT_PROMPTS.STAGING_GENERATOR(designStyle, roomType),
      previousFailures
    );
    
    const stagingResult = await chat.sendMessage([
      stagingPrompt
    ]);

    const response = await stagingResult.response;
    
    // 8. Extrair imagem gerada
    console.log("📤 Extraindo imagem gerada...");
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Nenhuma imagem gerada pelo modelo");
    }

    const candidate = response.candidates[0];
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error("Resposta do modelo não contém parts");
    }

    const outputImagePart = candidate.content.parts.find(part => part.inlineData);
    
    if (!outputImagePart || !outputImagePart.inlineData || !outputImagePart.inlineData.data) {
      throw new Error("Imagem não encontrada na resposta do modelo");
    }

    const outputImageBase64 = outputImagePart.inlineData.data;
    const outputMimeType = outputImagePart.inlineData.mimeType || 'image/png';
    const outputImageBuffer = Buffer.from(outputImageBase64, 'base64');

    console.log("✅ AGENTES 1+2: Pipeline completo!");
    console.log(`📊 Tamanho da imagem: ${outputImageBuffer.length} bytes`);
    console.log(`🎨 MIME type: ${outputMimeType}`);

    return {
      success: true,
      imageBuffer: outputImageBuffer,
      imageBase64: outputImageBase64,
      mimeType: outputMimeType,
      layoutDescription,
      originalImageBase64: imageData.data,
      originalImageMimeType: imageData.mimeType,
      designStyle,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ AGENTES 1+2 - Erro:", error.message);
    if (error.response) {
      console.error("❌ Response data:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Pipeline de staging falhou: ${error.message}`);
  }
}

/**
 * DEPRECATED: Usar analyzeLayoutAndGenerateStaging() ao invés
 * Agente 1: Analisa a imagem e descreve o layout de móveis
 */
export async function analyzeLayoutAgent(imageUrl, designStyle = DEFAULT_STYLE, roomType = 'living_room') {
  console.warn("⚠️ analyzeLayoutAgent() está deprecated. Use analyzeLayoutAndGenerateStaging()");
  try {
    console.log("🏗️ AGENTE 1 (LEGACY): Analisando layout da imagem...");
    console.log(`🎨 Estilo: ${designStyle}`);
    console.log(`🏠 Cômodo: ${roomType}`);

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado");
    }

    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_3_PRO_IMAGE 
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
      AGENT_PROMPTS.LAYOUT_ANALYZER(designStyle, roomType),
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
 * DEPRECATED: Usar analyzeLayoutAndGenerateStaging() ao invés
 * Agente 2: Gera a imagem de virtual staging
 */
export async function generateStagingAgent(layoutDescription, originalImageBase64, options = {}) {
  console.warn("⚠️ generateStagingAgent() está deprecated. Use analyzeLayoutAndGenerateStaging()");
  
  // Fallback: retornar erro instruindo usar a nova função
  throw new Error("generateStagingAgent() foi substituído por analyzeLayoutAndGenerateStaging(). Use a função combinada para melhores resultados.");
}

/**
 * Parse de resposta de verificação com justificativa
 * Formato esperado:
 * Status: same/different/Clear/hindered
 * Reason: [justificativa ou N/A]
 */
function parseVerificationResponse(responseText) {
  try {
    const lines = responseText.trim().split('\n');
    
    // Primeira linha: status
    const statusLine = lines[0] || '';
    const statusMatch = statusLine.match(/:\s*(.+)/);
    const status = statusMatch ? statusMatch[1].trim() : 'unknown';
    
    // Segunda linha: justificativa
    const reasonLine = lines[1] || '';
    const reasonMatch = reasonLine.match(/:\s*(.+)/);
    const reason = reasonMatch ? reasonMatch[1].trim() : 'N/A';
    
    // Determina se passou
    const passed = ['same', 'Clear'].includes(status);
    
    return {
      status,
      reason,
      passed,
      rawResponse: responseText
    };
  } catch (error) {
    console.error("❌ Erro ao parsear resposta:", error.message);
    return {
      status: 'error',
      reason: `Parse error: ${error.message}`,
      passed: false,
      rawResponse: responseText
    };
  }
}

/**
 * Agente 3: Verifica a qualidade da imagem gerada
 * Executa 5 perguntas sequenciais com justificativa condicional
 */
/**
 * Agente 3: Verifica qualidade com checks sequenciais (dinâmicos por roomType)
 * @param {string} originalImageInput - URL ou base64 da imagem original
 * @param {string} generatedImageBase64 - Base64 da imagem gerada
 * @param {boolean} isOriginalBase64 - Se true, originalImageInput é base64, senão é URL
 * @param {string} roomType - Tipo de cômodo (living_room, outdoor, kitchen, etc)
 */
export async function verifyQualityAgent(originalImageInput, generatedImageBase64, isOriginalBase64 = false, roomType = 'living_room') {
  try {
    console.log("🔍 AGENTE 3: Verificando qualidade com checks sequenciais...");
    console.log(`🏠 Cômodo: ${roomType}`);

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não definida");
    }

    if (!genAI) {
      throw new Error("GoogleGenerativeAI não inicializado");
    }

    const model = genAI.getGenerativeModel({ 
      model: MODELS.GEMINI_3_PRO_IMAGE 
    });

    // Obter dados da imagem original (URL ou base64)
    let originalImageData;
    
    if (isOriginalBase64) {
      console.log("📥 Imagem original já em base64");
      originalImageData = {
        data: originalImageInput,
        mimeType: 'image/jpeg'  // Assume JPEG, pode ser ajustado se necessário
      };
    } else {
      console.log("📥 Baixando imagem original de URL...");
      originalImageData = await downloadImageAsBase64(originalImageInput);
    }

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

    const checks = AGENT_PROMPTS.VERIFICATION_CHECKS(roomType);
    const verificationResults = [];
    let lastPassedCheck = 0;
    let allPassed = true;
    
    const totalChecks = checks.length;
    console.log(`📋 Total de checks para ${roomType}: ${totalChecks}`);

    // Executa cada verificação sequencialmente
    for (const check of checks) {
      console.log(`   🔎 Check ${check.id}/${totalChecks}: ${check.name}...`);
      
      try {
        const result = await model.generateContent([
          check.prompt,
          originalImagePart,
          generatedImagePart
        ]);

        const responseText = result.response.text();
        const parsed = parseVerificationResponse(responseText);
        
        console.log(`   📝 ${check.name}: ${parsed.status} (${parsed.reason.substring(0, 50)}...)`);
        
        verificationResults.push({
          checkId: check.id,
          checkName: check.name,
          status: parsed.status,
          reason: parsed.reason,
          passed: parsed.passed,
          rawResponse: parsed.rawResponse
        });

        if (parsed.passed) {
          lastPassedCheck = check.id;
        } else {
          // Falhou - interrompe a sequência
          console.log(`   ❌ Check ${check.id} FALHOU: ${parsed.status} - ${parsed.reason}`);
          allPassed = false;
          break;
        }
        
        console.log(`   ✅ Check ${check.id} PASSOU`);
        
      } catch (error) {
        console.error(`   ❌ Erro no check ${check.name}:`, error.message);
        verificationResults.push({
          checkId: check.id,
          checkName: check.name,
          status: 'error',
          reason: error.message,
          passed: false,
          rawResponse: `Error: ${error.message}`
        });
        allPassed = false;
        break;
      }
    }

    const passedCount = verificationResults.filter(r => r.passed).length;

    console.log(allPassed 
      ? `✅ AGENTE 3: Verificação PASSOU (${passedCount}/${totalChecks} checks)` 
      : `⚠️ AGENTE 3: Verificação FALHOU (${passedCount}/${totalChecks} checks)`
    );

    return {
      success: true,
      passed: allPassed,
      checks: verificationResults,
      score: {
        passed: passedCount,
        total: totalChecks,
        lastPassedCheck: lastPassedCheck
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ AGENTE 3 - Erro:", error.message);
    throw new Error(`Agente de Verificação falhou: ${error.message}`);
  }
}

/**
 * Constrói prompt incremental baseado em falhas anteriores
 */
function buildIncrementalPrompt(basePrompt, previousFailures) {
  if (!previousFailures || previousFailures.length === 0) {
    return basePrompt;
  }

  const corrections = previousFailures.map(failure => {
    return `- Attempt ${failure.attemptNumber}: Check "${failure.checkName}" failed because: ${failure.reason}`;
  }).join('\n');

  return `${basePrompt}

CRITICAL CORRECTIONS based on previous generation attempts:
${corrections}

Ensure these specific issues are avoided in this generation.`;
}

/**
 * Pipeline completo com regeneração inteligente (máximo 3 tentativas)
 * - Executa Agentes 1+2 combinados para gerar staging
 * - Executa Agente 3 para verificar qualidade (5 checks sequenciais)
 * - Se falhar, regenera com prompt incremental (aprende com erros)
 * - Retorna melhor tentativa (que chegou mais longe nos checks)
 */
/**
 * Pipeline Completo: Agentes 1+2+3 com regeneração inteligente
 * Tenta até 3 vezes, usando prompt incremental baseado em falhas anteriores
 * Retorna sempre a melhor tentativa, mesmo se nenhuma passar em todos os checks
 * @param {string|Buffer} imageInput - URL da imagem ou Buffer do arquivo
 */
export async function fullStagingPipeline(imageInput, options = {}) {
  try {
    const { designStyle = DEFAULT_STYLE, roomType = 'living_room', isBuffer = false, ...otherOptions } = options;
    
    console.log("🚀 Iniciando pipeline completo de Virtual Staging com regeneração inteligente");
    console.log("🖼️ Tipo de input:", isBuffer ? "Buffer (Upload)" : "URL");
    console.log("🎨 Estilo de design:", designStyle);
    console.log("🏠 Tipo de cômodo:", roomType);
    console.log("🔄 Máximo de tentativas: 3");

    const startTime = Date.now();
    const MAX_ATTEMPTS = 3;
    const attempts = [];
    let bestAttempt = null;
    let bestScore = -1;
    let previousFailures = [];

    // Loop de tentativas (máximo 3)
    for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 TENTATIVA ${attemptNumber}/${MAX_ATTEMPTS}`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        // AGENTES 1+2: Gera staging (com prompt incremental se houver falhas anteriores)
        console.log("🔗 Executando Agentes 1+2 combinados...");
        
        // Constrói prompt incremental baseado em falhas anteriores
        const incrementalOptions = {
          designStyle,
          roomType,
          previousFailures: previousFailures,  // Passa histórico de falhas
          isBuffer,  // Indica se é buffer ou URL
          ...otherOptions
        };

        const stagingResult = await analyzeLayoutAndGenerateStaging(imageInput, incrementalOptions);

        // AGENTE 3: Verifica qualidade (5 checks sequenciais)
        console.log("🔍 Executando Agente 3 (verificação de qualidade)...");
        
        // Para verificação, sempre precisa usar base64 (tanto de URL quanto Buffer)
        const originalImageBase64 = isBuffer ? 
          Buffer.from(imageInput).toString('base64') : 
          stagingResult.originalImageBase64;
        
        const verificationResult = await verifyQualityAgent(
          originalImageBase64,
          stagingResult.imageBase64,
          true,  // Flag indicando que primeiro parâmetro é base64
          roomType  // Tipo de cômodo para checks específicos
        );

        // Armazena resultado desta tentativa
        const attemptResult = {
          attemptNumber,
          stagingResult,
          verificationResult,
          score: verificationResult.score.passed,
          lastPassedCheck: verificationResult.score.lastPassedCheck,
          passed: verificationResult.passed,
          timestamp: new Date().toISOString()
        };

        attempts.push(attemptResult);

        // Atualiza melhor tentativa se esta for melhor
        if (attemptResult.score > bestScore) {
          bestScore = attemptResult.score;
          bestAttempt = attemptResult;
          const totalChecks = verificationResult.score.total;
          console.log(`   ⭐ Nova melhor tentativa: ${bestScore}/${totalChecks} checks passados`);
        }

        // Se passou em TODOS os checks, sucesso total!
        if (verificationResult.passed) {
          console.log(`\n${'='.repeat(60)}`);
          console.log(`✅ SUCESSO na tentativa ${attemptNumber}! Todos os checks passaram.`);
          console.log(`${'='.repeat(60)}\n`);
          break;
        }

        // Se não passou, coleta justificativas das falhas para próxima tentativa
        console.log(`\n⚠️ Tentativa ${attemptNumber} falhou nos checks de qualidade.`);
        const totalChecks = verificationResult.score.total;
        console.log(`📊 Score: ${attemptResult.score}/${totalChecks} checks passados`);
        
        const failedChecks = verificationResult.checks.filter(c => !c.passed);
        
        if (attemptNumber < MAX_ATTEMPTS) {
          console.log(`\n📝 Coletando feedback das falhas para próxima tentativa...`);
          
          failedChecks.forEach(failedCheck => {
            previousFailures.push({
              attemptNumber,
              checkId: failedCheck.checkId,
              checkName: failedCheck.checkName,
              status: failedCheck.status,
              reason: failedCheck.reason
            });
            
            console.log(`   ❌ Check "${failedCheck.checkName}": ${failedCheck.reason}`);
          });
          
          console.log(`\n🔄 Preparando regeneração com prompt incremental...`);
        }

      } catch (error) {
        console.error(`❌ Erro na tentativa ${attemptNumber}:`, error.message);
        
        // Armazena tentativa com erro
        attempts.push({
          attemptNumber,
          error: error.message,
          score: 0,
          lastPassedCheck: 0,
          passed: false,
          timestamp: new Date().toISOString()
        });

        // Se for última tentativa, re-lança o erro
        if (attemptNumber === MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Se chegou aqui, usa a melhor tentativa (mesmo que não tenha passado 100%)
    if (!bestAttempt) {
      throw new Error("Nenhuma tentativa bem-sucedida. Pipeline falhou completamente.");
    }

    const allChecksPassed = bestAttempt.passed;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 RESULTADO FINAL DO PIPELINE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏱️  Tempo total: ${totalTime}s`);
    console.log(`🎯 Tentativas realizadas: ${attempts.length}/${MAX_ATTEMPTS}`);
    console.log(`⭐ Melhor tentativa: #${bestAttempt.attemptNumber}`);
    console.log(`✓  Checks passados: ${bestScore}/5`);
    console.log(`${allChecksPassed ? '✅ Status: APROVADO' : '⚠️  Status: APROVADO COM RESSALVAS'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Logging estruturado (preparado para RAG futuro)
    const structuredLog = {
      pipelineId: `staging-${Date.now()}`,
      imageSource: isBuffer ? 'file_upload' : 'url',
      designStyle: designStyle,
      attempts: attempts.map(att => ({
        attemptNumber: att.attemptNumber,
        score: att.score || 0,
        lastPassedCheck: att.lastPassedCheck || 0,
        passed: att.passed,
        checks: att.verificationResult?.checks || [],
        error: att.error,
        timestamp: att.timestamp
      })),
      bestAttempt: {
        attemptNumber: bestAttempt.attemptNumber,
        score: bestScore,
        allChecksPassed: allChecksPassed
      },
      totalTime: totalTime,
      timestamp: new Date().toISOString()
    };

    // Log estruturado no backend (JSON para facilitar parsing futuro)
    console.log('\n📋 STRUCTURED LOG (para RAG futuro):');
    console.log(JSON.stringify(structuredLog, null, 2));

    // Calcular total de checks baseado no roomType
    const totalChecksForRoom = AGENT_PROMPTS.VERIFICATION_CHECKS(roomType).length;
    
    return {
      success: true,
      layout: {
        description: bestAttempt.stagingResult.layoutDescription
      },
      staging: {
        imageBuffer: bestAttempt.stagingResult.imageBuffer,
        imageBase64: bestAttempt.stagingResult.imageBase64,
        mimeType: bestAttempt.stagingResult.mimeType
      },
      verification: {
        passed: allChecksPassed,
        score: {
          passed: bestScore,
          total: totalChecksForRoom,
          percentage: Math.round((bestScore / totalChecksForRoom) * 100)
        },
        checks: bestAttempt.verificationResult.checks,
        bestAttempt: bestAttempt.attemptNumber,
        totalAttempts: attempts.length,
        warning: allChecksPassed ? null : `Imagem aprovada com ressalvas. ${bestScore}/${totalChecksForRoom} checks passaram.`
      },
      metadata: {
        originalImageSource: isBuffer ? 'file_upload' : imageInput,
        processingTime: `${totalTime}s`,
        timestamp: new Date().toISOString(),
        roomType: roomType,
        structuredLog: structuredLog  // Incluído para análise posterior
      }
    };

  } catch (error) {
    console.error("❌ Pipeline falhou completamente:", error.message);
    throw error;
  }
}

// ===================================================================
// 🧪 TEST PROMPTS FUNCTION (Para validação)
// ===================================================================

/**
 * Função para testar e visualizar os prompts gerados para cada cômodo
 * SEM executar o processamento real da imagem
 * @param {string} designStyle - Estilo de design (ex: 'scandinavian', 'modern')
 * @param {string} roomType - Tipo de cômodo (ex: 'living_room', 'kitchen')
 * @returns {Object} Objeto contendo os 3 prompts gerados
 */
export function testPrompts(designStyle = 'scandinavian', roomType = 'living_room') {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTE DE PROMPTS - SISTEMA DE VIRTUAL STAGING');
  console.log('='.repeat(80));
  console.log(`📍 Cômodo: ${roomType}`);
  console.log(`🎨 Estilo: ${designStyle}`);
  console.log('='.repeat(80) + '\n');

  // 1️⃣ AGENT 1: LAYOUT_ANALYZER
  const analyzerPrompt = AGENT_PROMPTS.LAYOUT_ANALYZER(designStyle, roomType);
  console.log('1️⃣  AGENT 1: LAYOUT_ANALYZER');
  console.log('-'.repeat(80));
  console.log(analyzerPrompt);
  console.log('\n');

  // 2️⃣ AGENT 2: STAGING_GENERATOR
  const generatorPrompt = AGENT_PROMPTS.STAGING_GENERATOR(designStyle, roomType);
  console.log('2️⃣  AGENT 2: STAGING_GENERATOR');
  console.log('-'.repeat(80));
  console.log(generatorPrompt);
  console.log('\n');

  // 3️⃣ AGENT 3: VERIFICATION_CHECKS
  const verificationChecks = AGENT_PROMPTS.VERIFICATION_CHECKS(roomType);
  console.log('3️⃣  AGENT 3: VERIFICATION_CHECKS');
  console.log('-'.repeat(80));
  console.log(`Total de verificações para ${roomType}: ${verificationChecks.length}`);
  console.log('\nLista de verificações:');
  verificationChecks.forEach((check, index) => {
    console.log(`\n[${index + 1}/${verificationChecks.length}] ${check.name}:`);
    console.log(`   Descrição: ${check.description}`);
    console.log(`   Tipo: ${check.type}`);
  });
  console.log('\n');

  console.log('='.repeat(80));
  console.log('✅ TESTE CONCLUÍDO');
  console.log('='.repeat(80) + '\n');

  return {
    roomType,
    designStyle,
    prompts: {
      analyzer: analyzerPrompt,
      generator: generatorPrompt,
      verification: verificationChecks
    },
    summary: {
      totalVerificationChecks: verificationChecks.length,
      roomTypeProcessed: roomType,
      designStyleApplied: designStyle
    }
  };
}

export default {
  testConnection,
  analyzeLayoutAgent,  // DEPRECATED: usar analyzeLayoutAndGenerateStaging
  generateStagingAgent,  // DEPRECATED: usar analyzeLayoutAndGenerateStaging
  analyzeLayoutAndGenerateStaging,  // NOVO: Agentes 1+2 combinados
  verifyQualityAgent,
  fullStagingPipeline,
  testPrompts,
  MODELS,
  ASPECT_RATIOS,
  DESIGN_STYLES
};
