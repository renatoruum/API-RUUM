// Config.js - Versão para teste local
const API_CONFIG = {
  BASE_URL: "http://localhost:8080", // Mudança aqui para local
  TOKEN: "ruum-api-secure-token-2024"
};

export const apiHeaders = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_CONFIG.TOKEN}`
};

export const apiCall = async (endpoint, options = {}) => {
  console.log('🔄 API Call:', `${API_CONFIG.BASE_URL}${endpoint}`, options); // Log para debug
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    headers: apiHeaders,
    ...options
  });
  
  const data = await response.json();
  console.log('📊 API Response:', data); // Log para debug
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  
  return data;
};

export default API_CONFIG;
