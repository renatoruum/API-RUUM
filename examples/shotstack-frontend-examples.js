// Exemplo de uso da API ShotStack Enhanced
// Este arquivo demonstra como usar a API no frontend

// 1. Função para criar um slideshow simples
const createSimpleSlideshow = async (images) => {
  try {
    const response = await fetch('/api/shotstack/slideshow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: images,
        duration: 3,
        transition: 'fade',
        waitForCompletion: true,
        output: {
          format: 'mp4',
          resolution: 'hd'
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Slideshow criado com sucesso!');
      return result.url;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao criar slideshow:', error);
    throw error;
  }
};

// 2. Função para criar vídeo de showcase de propriedade
const createPropertyShowcase = async (propertyData) => {
  try {
    const response = await fetch('/api/shotstack/template/property-showcase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          images: propertyData.images,
          title: propertyData.title,
          description: propertyData.description,
          duration: 4
        },
        output: {
          format: 'mp4',
          resolution: 'hd',
          aspectRatio: '16:9'
        },
        waitForCompletion: false // Modo assíncrono
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Acompanhar o progresso da renderização
      const videoUrl = await pollRenderStatus(result.id);
      return videoUrl;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao criar showcase:', error);
    throw error;
  }
};

// 3. Função para acompanhar o status da renderização
const pollRenderStatus = async (renderId, onProgress = null) => {
  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/shotstack/status/${renderId}`);
      const result = await response.json();
      
      if (result.success) {
        const status = result.data.status;
        
        // Callback para acompanhar progresso
        if (onProgress) {
          onProgress(status, result.data);
        }
        
        switch (status) {
          case 'done':
            return result.data.url;
          case 'failed':
            throw new Error(result.data.error || 'Renderização falhou');
          case 'queued':
          case 'fetching':
          case 'rendering':
          case 'saving':
            // Aguardar 5 segundos e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await checkStatus();
          default:
            throw new Error(`Status desconhecido: ${status}`);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  };
  
  return await checkStatus();
};

// 4. Função para criar timeline personalizada
const createCustomTimeline = async (timelineConfig) => {
  try {
    const response = await fetch('/api/shotstack/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeline: timelineConfig.timeline,
        output: timelineConfig.output || {
          format: 'mp4',
          resolution: 'hd'
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return result.id; // Retorna ID para acompanhamento
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao criar timeline:', error);
    throw error;
  }
};

// 5. Função para renderização síncrona (aguarda conclusão)
const renderVideoSync = async (timeline, output = {}) => {
  try {
    const response = await fetch('/api/shotstack/render-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeline: timeline,
        output: output,
        timeout: 300000 // 5 minutos
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return result.url;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro na renderização síncrona:', error);
    throw error;
  }
};

// 6. Exemplos de uso prático

// Exemplo 1: Slideshow para imóvel
const exemploSlideshow = async () => {
  const images = [
    'https://example.com/sala.jpg',
    'https://example.com/quarto.jpg',
    'https://example.com/cozinha.jpg',
    'https://example.com/banheiro.jpg'
  ];

  try {
    const videoUrl = await createSimpleSlideshow(images);
    console.log('Slideshow criado:', videoUrl);
    
    // Usar o vídeo no frontend
    const videoElement = document.getElementById('video-player');
    if (videoElement) {
      videoElement.src = videoUrl;
    }
  } catch (error) {
    console.error('Falha ao criar slideshow:', error);
  }
};

// Exemplo 2: Showcase de propriedade
const exemploPropertyShowcase = async () => {
  const propertyData = {
    images: [
      'https://example.com/fachada.jpg',
      'https://example.com/sala.jpg',
      'https://example.com/quarto.jpg',
      'https://example.com/cozinha.jpg'
    ],
    title: 'Apartamento Moderno',
    description: 'Vista para o mar, 3 quartos, 2 banheiros'
  };

  try {
    const videoUrl = await createPropertyShowcase(propertyData);
    console.log('Showcase criado:', videoUrl);
    
    // Mostrar vídeo no frontend
    displayVideo(videoUrl);
  } catch (error) {
    console.error('Falha ao criar showcase:', error);
  }
};

// Exemplo 3: Timeline personalizada
const exemploTimelinePersonalizada = async () => {
  const timeline = {
    tracks: [
      {
        clips: [
          {
            asset: {
              type: 'image',
              src: 'https://example.com/background.jpg'
            },
            start: 0,
            length: 5,
            effect: 'zoomIn'
          }
        ]
      },
      {
        clips: [
          {
            asset: {
              type: 'title',
              text: 'Casa dos Sonhos',
              style: 'future',
              color: '#ffffff',
              size: 'large'
            },
            start: 1,
            length: 3,
            position: 'center'
          }
        ]
      }
    ]
  };

  try {
    const renderId = await createCustomTimeline({ timeline });
    console.log('Renderização iniciada:', renderId);
    
    // Acompanhar progresso
    const videoUrl = await pollRenderStatus(renderId, (status, data) => {
      console.log(`Status: ${status}`);
      updateProgressBar(status);
    });
    
    console.log('Vídeo pronto:', videoUrl);
    displayVideo(videoUrl);
  } catch (error) {
    console.error('Falha na renderização:', error);
  }
};

// Exemplo 4: Vídeo promocional
const exemploVideoPromocional = async () => {
  try {
    const response = await fetch('/api/shotstack/template/promotional-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          images: [
            'https://example.com/exterior.jpg',
            'https://example.com/interior.jpg',
            'https://example.com/vista.jpg'
          ],
          title: 'Imóvel Premium',
          subtitle: 'Entre em contato: (11) 99999-9999',
          soundtrack: 'https://example.com/music.mp3',
          duration: 5
        },
        output: {
          format: 'mp4',
          resolution: 'hd',
          aspectRatio: '16:9'
        },
        waitForCompletion: true
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Vídeo promocional criado:', result.url);
      displayVideo(result.url);
    }
  } catch (error) {
    console.error('Erro ao criar vídeo promocional:', error);
  }
};

// Funções auxiliares para UI
const displayVideo = (videoUrl) => {
  const videoContainer = document.getElementById('video-container');
  if (videoContainer) {
    videoContainer.innerHTML = `
      <video controls width="100%" height="400">
        <source src="${videoUrl}" type="video/mp4">
        Seu navegador não suporta o elemento de vídeo.
      </video>
    `;
  }
};

const updateProgressBar = (status) => {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  const statusMap = {
    'queued': { width: '20%', text: 'Na fila...' },
    'fetching': { width: '40%', text: 'Baixando assets...' },
    'rendering': { width: '70%', text: 'Renderizando...' },
    'saving': { width: '90%', text: 'Salvando...' },
    'done': { width: '100%', text: 'Concluído!' }
  };
  
  const statusInfo = statusMap[status] || { width: '0%', text: 'Iniciando...' };
  
  if (progressBar) {
    progressBar.style.width = statusInfo.width;
  }
  
  if (progressText) {
    progressText.textContent = statusInfo.text;
  }
};

// Exportar funções para uso
export {
  createSimpleSlideshow,
  createPropertyShowcase,
  pollRenderStatus,
  createCustomTimeline,
  renderVideoSync,
  exemploSlideshow,
  exemploPropertyShowcase,
  exemploTimelinePersonalizada,
  exemploVideoPromocional
};
