// 🎵 EXEMPLO DE USO - INTEGRAÇÃO DE ÁUDIO COM SHOTSTACK
// =====================================================

// VERSÃO CORRIGIDA - Usando upload de áudio na API
const SHOTSTACK_ENDPOINTS = {
  RENDER: '/api/shotstack/render',
  STATUS: '/api/shotstack/status/',
  POLL: '/api/shotstack/poll/',
  DIAGNOSE: '/api/shotstack/diagnose',
  TEST_AUTH: '/api/shotstack/test-auth',
  TEST_RENDER: '/api/shotstack/test-render',
  // NOVOS ENDPOINTS DE ÁUDIO
  AUDIO_UPLOAD: '/api/audio/upload',
  AUDIO_GET: '/api/audio/',
  AUDIO_DELETE: '/api/audio/',
  AUDIO_LIST: '/api/audio'
};

// FUNÇÃO CORRIGIDA PARA UPLOAD DE ÁUDIO
export const uploadAudioFile = async (audioBlob) => {
  console.log('📤 Iniciando upload de áudio...');
  
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.mp3');
    
    const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.AUDIO_UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ruum-api-secure-token-2024'
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload falhou: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Upload bem-sucedido:', data);
    
    return data.url;
    
  } catch (error) {
    console.error('❌ Erro no upload de áudio:', error);
    throw error;
  }
};

// FUNÇÃO CORRIGIDA PARA POLLING
export const pollShotstackStatus = async (renderId, maxAttempts = 60, interval = 5000) => {
  console.log(`🔄 Iniciando polling para render ID: ${renderId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📊 Tentativa ${attempt}/${maxAttempts} - Consultando status...`);
      
      const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.STATUS}${renderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ruum-api-secure-token-2024'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Status ${response.status} na tentativa ${attempt}`);
        
        if (response.status === 404) {
          console.error('❌ Endpoint não encontrado. Verifique se o backend está rodando.');
          throw new Error('Endpoint de status não encontrado');
        }
        
        if (attempt === maxAttempts) {
          throw new Error(`Falha após ${maxAttempts} tentativas`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }
      
      const data = await response.json();
      console.log(`📈 Status: ${data.status} - Progress: ${data.progress || 0}%`);
      
      if (data.status === 'done') {
        console.log('✅ Renderização concluída!');
        return {
          success: true,
          status: 'done',
          url: data.url
        };
      }
      
      if (data.status === 'failed') {
        console.error('❌ Renderização falhou');
        throw new Error('Renderização falhou');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt}:`, error);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Timeout: Renderização não foi concluída no tempo esperado');
};

// FUNÇÃO CORRIGIDA PARA ENVIO DO SHOTSTACK
export const sendToShotstack = async (payload) => {
  console.log('📤 Enviando para Shotstack...');
  
  try {
    const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.RENDER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ruum-api-secure-token-2024'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Resposta do Shotstack:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no envio para Shotstack:', error);
    throw error;
  }
};

// FUNÇÃO PRINCIPAL CORRIGIDA - USANDO UPLOAD DE ÁUDIO
export const handleShotstackIntegration = async (videoUrl, audioBlob = null) => {
  try {
    console.log('🚀 Iniciando integração Shotstack...');
    
    // 1. Upload do áudio se fornecido
    let audioUrl = null;
    if (audioBlob) {
      try {
        console.log('📤 Fazendo upload do áudio...');
        audioUrl = await uploadAudioFile(audioBlob);
        console.log('✅ Upload concluído. URL:', audioUrl);
      } catch (error) {
        console.warn('⚠️ Upload de áudio falhou, continuando sem áudio:', error);
      }
    }
    
    // 2. Montar payload do Shotstack
    const payload = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl
                },
                start: 0,
                length: 5 // Ajustar conforme necessário
              }
            ]
          }
        ]
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '16:9'
      }
    };
    
    // 3. Adicionar áudio se disponível
    if (audioUrl) {
      payload.timeline.soundtrack = {
        src: audioUrl,
        effect: 'fadeIn'
      };
      console.log('🎵 Áudio adicionado à timeline');
    }
    
    // 4. Enviar para renderização
    const renderResponse = await sendToShotstack(payload);
    
    if (!renderResponse.success || !renderResponse.id) {
      throw new Error('Não foi possível obter ID de renderização');
    }
    
    console.log('🆔 Render ID obtido:', renderResponse.id);
    
    // 5. Fazer polling do status
    const result = await pollShotstackStatus(renderResponse.id);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro na integração Shotstack:', error);
    throw error;
  }
};

// FUNÇÕES AUXILIARES PARA ÁUDIO

// Função para deletar áudio após uso (opcional)
export const deleteAudioFile = async (audioId) => {
  try {
    console.log(`🗑️ Deletando áudio: ${audioId}`);
    
    const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.AUDIO_DELETE}${audioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ruum-api-secure-token-2024'
      }
    });
    
    if (response.ok) {
      console.log('✅ Áudio deletado com sucesso');
      return true;
    }
    
    console.warn('⚠️ Falha ao deletar áudio');
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao deletar áudio:', error);
    return false;
  }
};

// Função para listar áudios (debug)
export const listAudioFiles = async () => {
  try {
    const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.AUDIO_LIST}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ruum-api-secure-token-2024'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Lista de áudios:', data);
      return data.files;
    }
    
    throw new Error('Falha ao listar áudios');
    
  } catch (error) {
    console.error('❌ Erro ao listar áudios:', error);
    return [];
  }
};

// EXEMPLO DE USO COMPLETO
export const exemploCompletoComAudio = async () => {
  try {
    // 1. Obter blob de áudio do ElevenLabs
    const audioBlob = await gerarAudioElevenLabs("Texto para narração");
    
    // 2. URL do vídeo
    const videoUrl = "https://exemplo.com/video.mp4";
    
    // 3. Processar com ShotStack
    const result = await handleShotstackIntegration(videoUrl, audioBlob);
    
    console.log('🎬 Vídeo final:', result.url);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no exemplo completo:', error);
    throw error;
  }
};

// FUNÇÃO SIMULADA DO ELEVENLABS (exemplo)
async function gerarAudioElevenLabs(texto) {
  // Simulação - substituir pela sua implementação real
  console.log('🎤 Gerando áudio com ElevenLabs...');
  
  // Sua implementação do ElevenLabs aqui
  // return audioBlob;
  
  // Exemplo simulado
  return new Blob(['audio data'], { type: 'audio/mpeg' });
}

export default {
  SHOTSTACK_ENDPOINTS,
  uploadAudioFile,
  pollShotstackStatus,
  sendToShotstack,
  handleShotstackIntegration,
  deleteAudioFile,
  listAudioFiles,
  exemploCompletoComAudio
};
