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

    console.log("🏠 Testando conexão com Virtual Staging AI...");

    const response = await axios.get(
      `${VIRTUAL_STAGING_BASE_URL}/ping`,
      {
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Conexão com Virtual Staging AI estabelecida");
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("❌ Erro na conexão Virtual Staging AI:", error.response?.data || error.message);
    throw error;
  }
}

// Função para obter estilos e tipos de ambiente disponíveis
export async function getAvailableOptions() {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    console.log("📋 Buscando opções disponíveis...");

    const response = await axios.get(
      `${VIRTUAL_STAGING_BASE_URL}/options`,
      {
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Opções carregadas com sucesso");
    
    return response.data;

  } catch (error) {
    console.error("❌ Erro ao buscar opções:", error.response?.data || error.message);
    throw error;
  }
}

// Função principal para criar virtual staging
export async function createVirtualStaging({ 
  image_url, 
  room_type = "living", 
  style = "modern", 
  declutter_mode = "off",
  add_furniture = true,
  wait_for_completion = true 
}) {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    if (!image_url) {
      throw new Error("URL da imagem é obrigatória");
    }

    console.log(`🎨 Criando virtual staging: ${style} para ${room_type}`);

    const requestBody = {
      image_url,
      wait_for_completion
    };

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

    console.log("✅ Virtual staging criado com sucesso");
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("❌ Erro no virtual staging:", error.response?.data || error.message);
    
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

    console.log(`🔍 Verificando status do render: ${render_id}`);

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

    console.log(`📊 Status do render: ${response.data.status}`);
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("❌ Erro ao verificar status:", error.response?.data || error.message);
    throw error;
  }
}

// Função para criar variação de um render existente
export async function createVariation(render_id, { style, wait_for_completion = true }) {
  try {
    if (!VIRTUAL_STAGING_API_KEY) {
      throw new Error("VIRTUAL_STAGING_API_KEY não definida");
    }

    if (!render_id) {
      throw new Error("ID do render é obrigatório");
    }

    console.log(`🔄 Criando variação do render: ${render_id}`);

    const requestBody = {
      wait_for_completion
    };

    if (style) {
      requestBody.style = style;
    }

    const response = await axios.post(
      `${VIRTUAL_STAGING_BASE_URL}/render/create-variation`,
      requestBody,
      {
        params: { render_id },
        headers: {
          "Authorization": `Api-Key ${VIRTUAL_STAGING_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: wait_for_completion ? 180000 : 30000
      }
    );

    console.log("✅ Variação criada com sucesso");
    
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("❌ Erro ao criar variação:", error.response?.data || error.message);
    throw error;
  }
}

export default {
  testConnection,
  getAvailableOptions,
  createVirtualStaging,
  getRenderStatus,
  createVariation,
  STYLES,
  ROOM_TYPES
};
