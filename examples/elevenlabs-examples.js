// Exemplos de uso das rotas ElevenLabs

// 1. TEXT-TO-SPEECH
// Converte texto para áudio
const textToSpeech = async (text, voice = "RACHEL") => {
  try {
    const response = await fetch('http://localhost:3000/api/elevenlabs/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice: voice, // RACHEL, ANTONI, BELLA, ADAM, SARAH, DANIEL, GRACE, LIAM, SOPHIA, MATEO
        model: "eleven_multilingual_v2"
      })
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Reproduzir áudio
      const audio = new Audio(audioUrl);
      audio.play();
      
      return audioUrl;
    } else {
      throw new Error('Erro na conversão');
    }
  } catch (error) {
    console.error('Erro TTS:', error);
    throw error;
  }
};

// 2. SPEECH-TO-TEXT
// Converte áudio para texto
const speechToText = async (audioFile) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('model', 'whisper-1');

    const response = await fetch('http://localhost:3000/api/elevenlabs/speech-to-text', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Texto extraído:', data.data.text);
      return data.data.text;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Erro STT:', error);
    throw error;
  }
};

// 3. LISTAR VOZES DISPONÍVEIS
const getVoices = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/elevenlabs/voices');
    const data = await response.json();
    
    if (data.success) {
      console.log('Vozes pré-definidas:', data.data.predefined_voices);
      console.log('Todas as vozes:', data.data.all_voices);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Erro ao listar vozes:', error);
    throw error;
  }
};

// 4. SCRIPT-TO-AUDIO (ChatGPT + ElevenLabs)
// Gera script de uma imagem e converte para áudio
const scriptToAudio = async (imageUrl, voice = "RACHEL") => {
  try {
    const response = await fetch('http://localhost:3000/api/elevenlabs/script-to-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        voice: voice,
        model: "eleven_multilingual_v2"
      })
    });

    if (response.ok) {
      // Extrair o script do header
      const scriptBase64 = response.headers.get('X-Script-Text');
      const script = scriptBase64 ? atob(scriptBase64) : '';
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        script: script,
        audioUrl: audioUrl
      };
    } else {
      throw new Error('Erro na conversão');
    }
  } catch (error) {
    console.error('Erro Script-to-Audio:', error);
    throw error;
  }
};

// EXEMPLO DE USO EM REACT
/*
import React, { useState } from 'react';

const ElevenLabsDemo = () => {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTextToSpeech = async () => {
    setLoading(true);
    try {
      const url = await textToSpeech(text, 'RACHEL');
      setAudioUrl(url);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScriptToAudio = async () => {
    setLoading(true);
    try {
      const result = await scriptToAudio('https://example.com/image.jpg', 'RACHEL');
      setScript(result.script);
      setAudioUrl(result.audioUrl);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>ElevenLabs Demo</h2>
      
      <div>
        <h3>Text-to-Speech</h3>
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite o texto aqui..."
        />
        <button onClick={handleTextToSpeech} disabled={loading}>
          Converter para Áudio
        </button>
      </div>

      <div>
        <h3>Script-to-Audio</h3>
        <button onClick={handleScriptToAudio} disabled={loading}>
          Gerar Script + Áudio
        </button>
        {script && <p><strong>Script:</strong> {script}</p>}
      </div>

      {audioUrl && (
        <div>
          <h3>Áudio Gerado</h3>
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
};

export default ElevenLabsDemo;
*/
