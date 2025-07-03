import axios from "axios";
import fs from "fs";
import fetch from "node-fetch";
import tmp from "tmp";
import sharp from "sharp";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

// Configurações de processamento para diferentes tipos de operação
const PROCESSING_CONFIGS = {
  VIRTUAL_STAGING: {
    type: 'image_edit',
    model: 'dall-e-2',
    promptTemplate: (params) => 
      `Create virtual staging for this environment with ${params.style} style, in the ${params.room_type} room, maintaining realistic proportions and respecting original architectural elements.`
  },
  ROOM_IDENTIFICATION: {
    type: 'image_analysis',
    model: 'gpt-4o',
    promptTemplate: () => 
      `Analyze this image and identify the type of environment/room. Return only the type of environment (e.g., living room, bedroom, kitchen, bathroom, etc.) in a concise manner.`
  },
  SCRIPT_GENERATION: {
    type: 'image_analysis',
    model: 'gpt-4o',
    promptTemplate: (params) => 
      `Analyze this image of a real estate environment and create a professional and attractive voiceover script for property presentation. The script should highlight the environment's characteristics, its strengths and potential uses. The script must be exactly 9 seconds long when spoken (approximately 25-30 words in Portuguese). Keep it concise, impactful and professional. IMPORTANT: Always start the script by identifying the specific room/environment (e.g., "Veja como essa sala de estar...", "Descubra esse quarto principal...", "Conheça essa cozinha integrada...", "Admire esse banheiro moderno..."). Always mention the specific room type at the beginning. Return only the script text in Portuguese (pt-BR), without additional formatting.`
  }
};

export async function sendToChatGPT({ image_url, processing_type, ...params }) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY não definida");

    // Valida o tipo de processamento
    const config = PROCESSING_CONFIGS[processing_type];
    if (!config) {
      throw new Error(`Tipo de processamento não suportado: ${processing_type}`);
    }

    // Baixa imagem original
    const response = await fetch(image_url);
    if (!response.ok) throw new Error("Erro ao baixar imagem");
    const originalBuffer = await response.buffer();

    // Converte imagem para PNG
    const pngBuffer = await sharp(originalBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    console.log("Tamanho final PNG:", pngBuffer.length / 1024, "KB");

    // Processa baseado no tipo de operação
    if (config.type === 'image_edit') {
      return await processImageEdit(pngBuffer, config, params, openaiKey);
    } else if (config.type === 'image_analysis') {
      return await processImageAnalysis(pngBuffer, config, params, openaiKey);
    } else {
      throw new Error(`Tipo de operação não implementado: ${config.type}`);
    }

  } catch (error) {
    console.error("❌ Erro no processamento ChatGPT:", error.response?.data || error.message);
    throw error;
  }
}

// Função para processar edição de imagem (Virtual Staging)
async function processImageEdit(pngBuffer, config, params, openaiKey) {
  const { width, height } = await sharp(pngBuffer).metadata();

  // Cria imagem branca com mesmas dimensões para máscara
  const maskBuffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png().toBuffer();

  // Arquivos temporários
  const tempImage = tmp.fileSync({ postfix: ".png" });
  const tempMask = tmp.fileSync({ postfix: ".png" });
  fs.writeFileSync(tempImage.name, pngBuffer);
  fs.writeFileSync(tempMask.name, maskBuffer);

  // Monta o FormData
  const form = new FormData();
  form.append("image", fs.createReadStream(tempImage.name), {
    contentType: "image/png",
    filename: "image.png",
  });
  form.append("mask", fs.createReadStream(tempMask.name), {
    contentType: "image/png",
    filename: "mask.png",
  });
  form.append("prompt", config.promptTemplate(params));
  form.append("model", config.model);
  form.append("n", 1);
  form.append("size", "1024x1024");

  // Envia requisição
  const result = await axios.post("https://api.openai.com/v1/images/edits", form, {
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      ...form.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  });

  console.log("✅ Resposta completa da OpenAI (Image Edit):", JSON.stringify(result.data, null, 2));

  if (!result.data || !result.data.data || !result.data.data[0]?.url) {
    throw new Error("❌ Resposta inesperada da OpenAI: não encontrou URL da imagem.");
  }

  // Limpa arquivos temporários
  tempImage.removeCallback();
  tempMask.removeCallback();

  return {
    type: 'image_url',
    result: result.data.data[0].url
  };
}

// Função para processar análise de imagem (Identificação de ambiente e geração de script)
async function processImageAnalysis(pngBuffer, config, params, openaiKey) {
  // Converte imagem para base64
  const base64Image = pngBuffer.toString('base64');

  const payload = {
    model: config.model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: config.promptTemplate(params)
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  };

  const result = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });

  console.log("✅ Resposta completa da OpenAI (Analysis):", JSON.stringify(result.data, null, 2));

  if (!result.data || !result.data.choices || !result.data.choices[0]?.message?.content) {
    throw new Error("❌ Resposta inesperada da OpenAI: não encontrou conteúdo da análise.");
  }

  return {
    type: 'text',
    result: result.data.choices[0].message.content.trim()
  };
}
