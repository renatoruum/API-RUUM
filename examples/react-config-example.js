// Config.js - Implementação da função apiCall para o frontend React
// Coloque este código no seu arquivo Config.js no frontend

const API_BASE_URL = 'http://localhost:8080'; // Ajuste conforme necessário
const AUTH_TOKEN = 'ruum-api-secure-token-2024';

/**
 * Função para fazer chamadas à API com autenticação automática
 * @param {string} endpoint - Endpoint da API (ex: '/api/shotstack/render')
 * @param {object} options - Opções do fetch (method, body, etc.)
 * @returns {Promise<object>} - Resposta da API
 */
export const apiCall = async (endpoint, options = {}) => {
  try {
    // Headers padrão
    const defaultHeaders = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Combina headers padrão com headers customizados
    const headers = {
      ...defaultHeaders,
      ...options.headers
    };

    // Configuração padrão do fetch
    const fetchOptions = {
      method: 'GET',
      ...options,
      headers
    };

    // Faz a requisição
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Retorna os dados JSON
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Erro na API Call:', error);
    throw error;
  }
};

// Exemplo de uso:
// const result = await apiCall('/api/shotstack/render', {
//   method: 'POST',
//   body: JSON.stringify(timelineData)
// });

export default apiCall;
