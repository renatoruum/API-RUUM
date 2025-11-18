import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BFL_API_KEY = process.env.BFL_API_KEY;
const BFL_BASE_URL = "https://api.bfl.ml";

// Modelos disponíveis da BFL
export const FLUX_MODELS = {
  FLUX_KONTEXT_PRO: "flux-kontext-pro", // Para EDITAR imagens existentes
  FLUX_PRO_11: "flux-pro-1.1",
  FLUX_PRO: "flux-pro",
  FLUX_PRO_11_ULTRA: "flux-pro-1.1-ultra",
  FLUX_DEV: "flux-dev",
  FLUX_PRO_11_ULTRA_RAW: "flux-pro-1.1-ultra-raw"
};

// Aspect ratios suportados
export const ASPECT_RATIOS = {
  SQUARE: "1:1",
  PORTRAIT: "9:16",
  LANDSCAPE: "16:9",
  WIDE: "21:9",
  TALL: "9:21"
};

/**
 * Função para testar conexão com a API BFL
 */
export async function testConnection() {
  try {
    if (!BFL_API_KEY) {
      throw new Error("BFL_API_KEY não definida");
    }

    // Teste simples verificando se a API Key é válida
    // Como não há endpoint /ping, faremos uma requisição mínima
    const response = await axios.get(
      `${BFL_BASE_URL}/v1/get_result`,
      {
        params: { id: "test" },
        headers: {
          "x-key": BFL_API_KEY
        },
        validateStatus: function (status) {
          // Aceita 200-299, 400 e 404 como válidos para o teste
          return (status >= 200 && status < 300) || status === 400 || status === 404;
        }
      }
    );

    return {
      success: true,
      message: "API Key válida",
      authenticated: response.status !== 401 && response.status !== 403
    };

  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("API Key inválida ou sem permissões");
    }
    throw error;
  }
}

/**
 * Função principal para melhorar iluminação de imagens usando FLUX Kontext
 * Usa o endpoint flux-kontext-pro (específico para edição de imagens)
 */
export async function enhanceImage({
  image_url,
  prompt = "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image's light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
  model = FLUX_MODELS.FLUX_KONTEXT_PRO,
  aspect_ratio = null,
  prompt_upsampling = false,
  safety_tolerance = 2,
  seed = null,
  output_format = "jpeg"
}) {
  try {
    if (!BFL_API_KEY) {
      throw new Error("BFL_API_KEY não definida");
    }

    if (!image_url) {
      throw new Error("URL da imagem é obrigatória");
    }

    // Para FLUX Kontext (image editing), usamos input_image
    const requestBody = {
      prompt,
      input_image: image_url, // IMPORTANTE: input_image para edição
      prompt_upsampling,
      safety_tolerance,
      output_format
    };

    // Adicionar aspect_ratio se fornecido (opcional, por padrão mantém o da imagem original)
    if (aspect_ratio) {
      requestBody.aspect_ratio = aspect_ratio;
    }

    // Adicionar seed se fornecido
    if (seed !== null) {
      requestBody.seed = seed;
    }

    // Endpoint correto para edição de imagens
    const endpoint = "/v1/flux-kontext-pro";

    const response = await axios.post(
      `${BFL_BASE_URL}${endpoint}`,
      requestBody,
      {
        headers: {
          "x-key": BFL_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data,
      task_id: response.data.id
    };

  } catch (error) {
    if (error.response?.status === 402) {
      throw new Error("Créditos insuficientes na conta BFL");
    } else if (error.response?.status === 400) {
      throw new Error(`Parâmetros inválidos: ${error.response.data.message || "Verifique os dados enviados"}`);
    } else if (error.response?.status === 401) {
      throw new Error("Chave de API inválida ou não fornecida");
    }
    
    throw error;
  }
}

/**
 * Função para gerar imagem do zero com FLUX (text-to-image)
 */
export async function generateImage({
  prompt,
  model = FLUX_MODELS.FLUX_PRO_11,
  width = 1024,
  height = 768,
  prompt_upsampling = false,
  safety_tolerance = 2,
  seed = null,
  output_format = "jpeg"
}) {
  try {
    if (!BFL_API_KEY) {
      throw new Error("BFL_API_KEY não definida");
    }

    if (!prompt) {
      throw new Error("Prompt é obrigatório");
    }

    const requestBody = {
      prompt,
      width,
      height,
      prompt_upsampling,
      safety_tolerance,
      output_format
    };

    if (seed !== null) {
      requestBody.seed = seed;
    }

    const endpoint = model === FLUX_MODELS.FLUX_PRO_11_ULTRA 
      ? "/v1/flux-pro-1.1-ultra" 
      : `/v1/${model}`;

    const response = await axios.post(
      `${BFL_BASE_URL}${endpoint}`,
      requestBody,
      {
        headers: {
          "x-key": BFL_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data,
      task_id: response.data.id
    };

  } catch (error) {
    if (error.response?.status === 402) {
      throw new Error("Créditos insuficientes na conta BFL");
    } else if (error.response?.status === 400) {
      throw new Error(`Parâmetros inválidos: ${error.response.data.message || "Verifique os dados enviados"}`);
    } else if (error.response?.status === 401) {
      throw new Error("Chave de API inválida ou não fornecida");
    }
    
    throw error;
  }
}

/**
 * Função para verificar status e obter resultado de uma task
 */
export async function getTaskResult(task_id) {
  try {
    if (!BFL_API_KEY) {
      throw new Error("BFL_API_KEY não definida");
    }

    if (!task_id) {
      throw new Error("ID da task é obrigatório");
    }

    const response = await axios.get(
      `${BFL_BASE_URL}/v1/get_result`,
      {
        params: { id: task_id },
        headers: {
          "x-key": BFL_API_KEY
        }
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Task não encontrada");
    } else if (error.response?.status === 400) {
      throw new Error("ID de task inválido");
    }
    throw error;
  }
}

/**
 * Função auxiliar para aguardar conclusão de uma task (polling)
 */
export async function waitForTaskCompletion(task_id, maxAttempts = 60, intervalMs = 5000) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await getTaskResult(task_id);
      
      // Status possíveis: "Pending", "Request Moderated", "Content Moderated", "Ready"
      if (result.data.status === "Ready") {
        return {
          success: true,
          data: result.data
        };
      } else if (result.data.status === "Request Moderated" || result.data.status === "Content Moderated") {
        throw new Error(`Requisição moderada: ${result.data.status}`);
      }

      // Se ainda está pendente, aguarda e tenta novamente
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;

    } catch (error) {
      if (error.message.includes("Task não encontrada") && attempts < 3) {
        // Às vezes a task demora para aparecer no sistema, retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Timeout: Task não foi concluída no tempo esperado");
}

export default {
  testConnection,
  enhanceImage,
  generateImage,
  getTaskResult,
  waitForTaskCompletion,
  FLUX_MODELS,
  ASPECT_RATIOS
};
