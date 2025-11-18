import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const VIRTUAL_STAGING_API_KEY = process.env.VIRTUAL_STAGING_API_KEY;
const VIRTUAL_STAGING_BASE_URL = "https://api.virtualstagingai.app/v1";

// Estilos disponíveis
export const STYLES = {
  MODERN: "modern",
  SCANDINAVIAN: "scandinavian",
  INDUSTRIAL: "industrial",
  MIDCENTURY: "midcentury",
  LUXURY: "luxury",
  FARMHOUSE: "farmhouse",
  COASTAL: "coastal",
  STANDARD: "standard"
};

// Tipos de ambientes disponíveis
export const ROOM_TYPES = {
  LIVING: "living",
  BEDROOM: "bed",
  KITCHEN: "kitchen",
  DINING: "dining",
  BATHROOM: "bathroom",
  HOME_OFFICE: "home_office",
  OUTDOOR: "outdoor",
  KIDS_ROOM: "kids_room"
};

// Função para testar conexão
export async function testConnection() {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    // Teste fazendo uma requisição GET para verificar autenticação
    // Sem render_id retornará 400, mas confirma que a API key é válida
    const response = await axios.get(
      `${VIRTUAL_STAGING_BASE_URL}/render`,
      {
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        },
        validateStatus: function (status) {
          // Aceita 200-299 e 400 como válidos (400 significa que a auth funcionou)
          return (status >= 200 && status < 300) || status === 400;
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

// Função principal para criar virtual staging
export async function createVirtualStaging(
  {
    image_url,
    room_type = "living",
    style = "modern",
    declutter_mode = "off",
    add_furniture = true,
    wait_for_completion = true,
    seed = null,
    enhance_prompt = false
  }) {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    if (!image_url) {
      throw new Error("URL da imagem é obrigatória");
    }

    const requestBody = {
      image_url,
      wait_for_completion
    };

    // Adicionar seed se fornecido (para resultados reproduzíveis)
    if (seed !== null) {
      requestBody.seed = seed;
    }

    // Adicionar enhance_prompt se solicitado
    if (enhance_prompt) {
      requestBody.enhance_prompt = true;
    }

    // Adicionar parâmetros baseados no modo
    if (declutter_mode === "off") {
      // Apenas staging (adicionar móveis)
      requestBody.room_type = room_type;
      requestBody.style = style;
      requestBody.declutter_mode = "off";
    } else if (declutter_mode === "on" && !add_furniture) {
      // Apenas decluttering (remover móveis)
      requestBody.declutter_mode = "on";
      requestBody.add_furniture = false;
    } else {
      // Decluttering + staging (remover e adicionar móveis)
      requestBody.room_type = room_type;
      requestBody.style = style;
      requestBody.declutter_mode = declutter_mode;
      requestBody.add_furniture = add_furniture;
    }

    const response = await axios.post(
      `${VIRTUAL_STAGING_BASE_URL}/render/create`,
      requestBody,
      {
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: wait_for_completion ? 180000 : 30000 // 3 min se wait, senão 30s
      }
    );


    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    // Tratamento de erros específicos
    if (error.response?.status === 403) {
      throw new Error("Limite de renders atingido ou plano sem acesso à API");
    } else if (error.response?.status === 400) {
      throw new Error(`Parâmetros inválidos: ${error.response.data.message || "Verifique os dados enviados"}`);
    } else if (error.response?.status === 401) {
      throw new Error("Chave de API inválida ou não fornecida");
    }

    throw error;
  }
}

// Função para verificar status de um render
export async function getRenderStatus(render_id) {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    if (!render_id) {
      throw new Error("ID do render é obrigatório");
    }

    const response = await axios.get(
      `${VIRTUAL_STAGING_BASE_URL}/render`,
      {
        params: { render_id },
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Render não encontrado");
    }
    throw error;
  }
}

export default {
  testConnection,
  createVirtualStaging,
  getRenderStatus,
  STYLES,
  ROOM_TYPES
};
