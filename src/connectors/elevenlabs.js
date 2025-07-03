import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Vozes disponíveis (otimizadas para português brasileiro)
const VOICES = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM", // Voz feminina clara e profissional
  ANTONI: "ErXwobaYiN019PkySvjV", // Voz masculina suave e versátil
  BELLA: "EXAVITQu4vr4xnSDxMaL",  // Voz feminina jovem e amigável
  ADAM: "pNInz6obpgDQGcFmaJgB",   // Voz masculina profunda e autoritária
  SARAH: "EXAVITQu4vr4xnSDxMaL",  // Voz feminina elegante
  DANIEL: "onwK4e9ZLuTAKqWW03F9", // Voz masculina confiável
  GRACE: "oWAxZDx7w5VEj9dCyTzz",  // Voz feminina sofisticada
  LIAM: "TX3LPaxmHKxFdv7VOQHJ",   // Voz masculina jovem e moderna
  SOPHIA: "jsCqWAovK2LkecY7zXl4", // Voz feminina calorosa
  MATEO: "XrExE9yKIg1WjnnlVkGX"   // Voz masculina expressiva
};

// Rate limiting para evitar muitas requisições
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições

// Função para Text-to-Speech
export async function textToSpeech({ text, voice = "RACHEL", model = "eleven_multilingual_v2" }) {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não definida");
    }

    if (!text) {
      throw new Error("Texto é obrigatório");
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Aguardando ${waitTime}ms para próxima requisição...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const voiceId = VOICES[voice] || VOICES.RACHEL;
    
    console.log(`🎤 Convertendo texto para áudio com voz: ${voice}`);

    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://elevenlabs.io/",
          "Origin": "https://elevenlabs.io",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br"
        },
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    console.log("✅ Áudio gerado com sucesso");
    
    return {
      audioBuffer: response.data,
      contentType: "audio/mpeg",
      size: response.data.length
    };

  } catch (error) {
    console.error("❌ Erro no Text-to-Speech:", error.response?.data || error.message);
    
    // Log detalhado do erro para diagnóstico
    if (error.response?.data) {
      try {
        const errorData = error.response.data.toString();
        console.error("🔍 Detalhes do erro ElevenLabs:", errorData);
      } catch (e) {
        console.error("🔍 Erro ao processar resposta:", error.response.data);
      }
    }
    
    // Verificar se é erro de atividade suspeita
    if (error.response?.status === 401 && error.response?.data?.toString().includes("detected_unusual_activity")) {
      throw new Error("ElevenLabs detectou atividade suspeita. Tente novamente em alguns minutos ou considere usar um plano pago.");
    }
    
    // Relançar erro com informações mais claras
    const errorMessage = error.response?.status === 401 ? 
      "Erro de autenticação na API do ElevenLabs - Verifique a chave de API" :
      error.message;
    
    throw new Error(errorMessage);
  }
}

// Função para Speech-to-Text
export async function speechToText({ audioBuffer, model = "whisper-1" }) {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não definida");
    }

    if (!audioBuffer) {
      throw new Error("Áudio é obrigatório");
    }

    console.log("🎧 Convertendo áudio para texto...");

    // Criar form data
    const form = new FormData();
    form.append("audio", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg"
    });
    form.append("model", model);

    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/speech-to-text`,
      form,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          ...form.getHeaders()
        }
      }
    );

    console.log("✅ Texto extraído com sucesso");
    
    return {
      text: response.data.text,
      language: response.data.language || "pt",
      confidence: response.data.confidence || null
    };

  } catch (error) {
    console.error("❌ Erro no Speech-to-Text:", error.response?.data || error.message);
    throw error;
  }
}

// Função para listar vozes disponíveis
export async function getAvailableVoices() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não definida");
    }

    const response = await axios.get(
      `${ELEVENLABS_BASE_URL}/voices`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY
        }
      }
    );

    return response.data.voices;

  } catch (error) {
    console.error("❌ Erro ao listar vozes:", error.response?.data || error.message);
    throw error;
  }
}

// Exportar vozes disponíveis
export { VOICES };
