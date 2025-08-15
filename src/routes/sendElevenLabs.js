import express from "express";
import multer from "multer";
import { textToSpeech, speechToText, getAvailableVoices, VOICES } from "../connectors/elevenlabs.js";

const router = express.Router();

// Configurar multer para upload de arquivos de áudio
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limite
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos de áudio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de áudio são aceitos'), false);
    }
  }
});

// Rota para Text-to-Speech
router.post("/elevenlabs/text-to-speech", async (req, res) => {
  try {
    const { text, voice, model } = req.body;

    // Validações
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: text"
      });
    }

    if (voice && !VOICES[voice]) {
      return res.status(400).json({
        success: false,
        message: `Voz não encontrada: ${voice}`,
        available_voices: Object.keys(VOICES)
      });
    }


    const result = await textToSpeech({ text, voice, model });

    // Retornar o áudio como resposta
    res.set({
      'Content-Type': result.contentType,
      'Content-Length': result.size,
      'Content-Disposition': 'attachment; filename="audio.mp3"'
    });

    res.send(Buffer.from(result.audioBuffer));

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para Speech-to-Text
router.post("/elevenlabs/speech-to-text", upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Arquivo de áudio é obrigatório"
      });
    }

    const { model } = req.body;


    const result = await speechToText({ 
      audioBuffer: req.file.buffer, 
      model 
    });

    res.status(200).json({
      success: true,
      message: "Áudio processado com sucesso",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota para testar conexão com ElevenLabs
router.get("/elevenlabs/test", async (req, res) => {
  try {
    
    // Verificar se a chave está configurada
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "ELEVENLABS_API_KEY não configurada"
      });
    }
    
    
    // Testar com um texto simples
    const testResult = await textToSpeech({ 
      text: "Teste de conexão", 
      voice: "RACHEL" 
    });
    
    res.status(200).json({
      success: true,
      message: "Conexão com ElevenLabs funcionando",
      data: {
        audioSize: testResult.size,
        contentType: testResult.contentType
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro no teste de conexão",
      error: error.message
    });
  }
});

// Rota para listar vozes disponíveis
router.get("/elevenlabs/voices", async (req, res) => {
  try {
    const voices = await getAvailableVoices();
    
    res.status(200).json({
      success: true,
      message: "Vozes listadas com sucesso",
      data: {
        predefined_voices: VOICES,
        all_voices: voices
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// Rota combinada: ChatGPT + ElevenLabs (Script para áudio)
router.post("/elevenlabs/script-to-audio", async (req, res) => {
  try {
    const { image_url, voice, model } = req.body;

    // Validações
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: image_url"
      });
    }


    // Primeiro, gerar o script usando ChatGPT
    const { sendToChatGPT } = await import("../connectors/chatgpt.js");
    
    const scriptResult = await sendToChatGPT({
      image_url,
      processing_type: "SCRIPT_GENERATION"
    });

    if (scriptResult.type !== 'text') {
      throw new Error("Erro ao gerar script");
    }

    const scriptText = scriptResult.result;

    // Segundo, converter o script para áudio
    const audioResult = await textToSpeech({ 
      text: scriptText, 
      voice, 
      model 
    });

    // Retornar o áudio com informações do script
    res.set({
      'Content-Type': audioResult.contentType,
      'Content-Length': audioResult.size,
      'Content-Disposition': 'attachment; filename="script-audio.mp3"',
      'X-Script-Text': Buffer.from(scriptText).toString('base64')
    });

    res.send(Buffer.from(audioResult.audioBuffer));

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

export default router;
