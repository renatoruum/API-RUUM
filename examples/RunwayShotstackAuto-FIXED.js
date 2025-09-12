import { useState, useEffect } from 'react';
import { apiCall } from '../Config/Config';
import acabamentoJsons from '../magicmotion/acabamentoJsons';

function RunwayShotstackAuto() {
  // Estados principais
  const [videoType, setVideoType] = useState('a');
  const [assetInputs, setAssetInputs] = useState({});
  const [magicaOrientation, setMagicaOrientation] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectResult, setProjectResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(1);
  const [error, setError] = useState('');
  const [inputOrientation, setInputOrientation] = useState(null); // 'horizontal' | 'vertical' | null
  const [outputType, setOutputType] = useState('horizontal'); // 'horizontal' | 'vertical'
  
  // Estados para monitoramento da renderização
  const [renderStatus, setRenderStatus] = useState(null); // 'queued', 'rendering', 'done', 'failed'
  const [renderProgress, setRenderProgress] = useState(0); // 0-100
  const [renderId, setRenderId] = useState(null);
  const [renderElapsedTime, setRenderElapsedTime] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Detecta orientação da imagem "Depois" para Câmera Mágica e "Antes" para Antes e Depois
  useEffect(() => {
    if (videoType === 'b' && assetInputs['depois']) {
      const img = new window.Image();
      img.onload = function() {
        if (img.naturalWidth > img.naturalHeight) setMagicaOrientation('horizontal');
        else setMagicaOrientation('vertical');
      };
      img.onerror = function() { setMagicaOrientation(null); };
      img.src = assetInputs['depois'];
    } else if (videoType === 'b') {
      setMagicaOrientation(null);
    }
    if ((videoType === 'a' || videoType === 'c') && assetInputs['antes']) {
      const img = new window.Image();
      img.onload = function() {
        const orientation = img.naturalWidth > img.naturalHeight ? 'horizontal' : 'vertical';
        setInputOrientation(orientation);
        // Automaticamente ajusta o outputType baseado na orientação da imagem Antes
        setOutputType(orientation);
        console.log('🖼️ Orientação detectada da imagem Antes:', orientation, '- OutputType ajustado automaticamente');
      };
      img.onerror = function() { 
        setInputOrientation(null);
      };
      img.src = assetInputs['antes'];
    } else if (videoType === 'a' || videoType === 'c') {
      setInputOrientation(null);
    }
  }, [videoType, assetInputs['depois'], assetInputs['antes']]);

  // Define selectedOption baseado no videoType
  useEffect(() => {
    if (videoType === 'a') {
      setSelectedOption(1); // Antes e Depois
    } else if (videoType === 'b') {
      setSelectedOption(4); // Câmera Mágica
    } else if (videoType === 'c') {
      setSelectedOption(7); // Ambos
    }
  }, [videoType]);

  // Imprime o JSON sempre que os assets ou configurações mudarem
  useEffect(() => {
    // Só imprime se houver pelo menos uma imagem definida
    const hasAssets = Object.keys(assetInputs).some(key => assetInputs[key] && assetInputs[key].trim() !== '');
    
    if (hasAssets) {
      try {
        const currentJson = buildFinalJson();
        console.log('🔧 Configurações atuais:', {
          videoType,
          selectedOption,
          inputOrientation,
          outputType,
          magicaOrientation,
          assetInputs
        });
        console.log('📋 JSON gerado com as fotos atuais:', JSON.stringify(currentJson, null, 2));
        
        // Valida o JSON atual
        try {
          validateShotstackJson(currentJson);
          console.log('✅ JSON atual é válido');
        } catch (validationError) {
          console.warn('⚠️ JSON atual tem problemas:', validationError.message);
        }
      } catch (error) {
        console.error('❌ Erro ao gerar JSON de preview:', error.message);
      }
    }
  }, [assetInputs, videoType, selectedOption, inputOrientation, outputType, magicaOrientation]);

  // Utilitário para extrair assets editáveis (ignorando o primeiro clip do primeiro track)
  const getEditableAssetsFromJson = (json) => {
    if (!json?.timeline?.tracks) return [];
    const assets = [];
    json.timeline.tracks.forEach((track, trackIdx) => {
      const clips = trackIdx === 0 ? track.clips.slice(1) : track.clips;
      clips.forEach((clip, clipIdx) => {
        if (clip.asset && (clip.asset.type === 'image' || clip.asset.type === 'video')) {
          assets.push({
            type: clip.asset.type,
            src: clip.asset.src,
            trackIdx,
            clipIdx: trackIdx === 0 ? clipIdx + 1 : clipIdx
          });
        }
      });
    });
    return assets;
  };

  // Atualiza o campo individualmente
  const handleAssetInputChange = (key, value) => {
    setAssetInputs(inputs => ({ ...inputs, [key]: value }));
  };

  // Monta o JSON final com os assets editáveis preenchidos
  const buildFinalJson = (runwayVideoUrl = null) => {
    const isAntesDepois = [1,2,3].includes(selectedOption);
    const isCameraMagica = videoType === 'b';
    const isAmbos = [7,8,9].includes(selectedOption);
    let json;
    // Seleciona o template correto conforme outputType e inputOrientation
    let templateKey = selectedOption;
    if (isCameraMagica) {
      templateKey = getCameraMagicaJsonKey();
    } else if (isAntesDepois) {
      // Antes e Depois: 1=H/H, 2=H/V, 3=V/V
      if (inputOrientation === 'horizontal' && outputType === 'horizontal') templateKey = 1;
      else if (inputOrientation === 'horizontal' && outputType === 'vertical') templateKey = 2;
      else if (inputOrientation === 'vertical') templateKey = 3; // Vertical sempre usa V/V
      else templateKey = 1; // Default H/H
      
      console.log('📐 Template Antes e Depois selecionado:', {
        inputOrientation,
        outputType,
        templateKey,
        meaning: templateKey === 1 ? 'H/H' : templateKey === 2 ? 'H/V' : 'V/V'
      });
    } else if (isAmbos) {
      // Ambos: 7=H/H, 8=H/V, 9=V/V
      if (inputOrientation === 'horizontal' && outputType === 'horizontal') templateKey = 7;
      else if (inputOrientation === 'horizontal' && outputType === 'vertical') templateKey = 8;
      else if (inputOrientation === 'vertical') templateKey = 9; // Vertical sempre usa V/V
      else templateKey = 7; // Default H/H
      
      console.log('📐 Template Ambos selecionado:', {
        inputOrientation,
        outputType,
        templateKey,
        meaning: templateKey === 7 ? 'H/H' : templateKey === 8 ? 'H/V' : 'V/V'
      });
    }
    
    json = JSON.parse(JSON.stringify(acabamentoJsons[templateKey]));
    
    // Preenche os assets conforme o tipo
    if (isCameraMagica) {
      const tracks = json.timeline.tracks;
      if (tracks[1] && tracks[1].clips[0] && runwayVideoUrl) {
        tracks[1].clips[0].asset.src = runwayVideoUrl;
      }
      return json;
    }
    if (isAntesDepois) {
      const tracks = json.timeline.tracks;
      // Track 1: Imagem Depois
      if (tracks[1] && tracks[1].clips[0] && assetInputs['depois']) {
        tracks[1].clips[0].asset.src = assetInputs['depois'];
      }
      // Track 2: Imagem Antes
      if (tracks[2] && tracks[2].clips[0] && assetInputs['antes']) {
        tracks[2].clips[0].asset.src = assetInputs['antes'];
      }
      // Template V/V (templateKey 3): duplica imagem Depois no track 3
      if (templateKey === 3 && tracks[3] && tracks[3].clips[0] && assetInputs['depois']) {
        tracks[3].clips[0].asset.src = assetInputs['depois'];
      }
      // Template H/H (templateKey 1): duplica imagem Depois no track 3
      if (templateKey === 1 && tracks[3] && tracks[3].clips[0] && assetInputs['depois']) {
        tracks[3].clips[0].asset.src = assetInputs['depois'];
      }
      return json;
    }
    if (isAmbos) {
      const tracks = json.timeline.tracks;
      // Track 1: Vídeo do Runway (Câmera Mágica)
      if (tracks[1] && tracks[1].clips[0] && runwayVideoUrl) {
        tracks[1].clips[0].asset.src = runwayVideoUrl;
      }
      // Track 2: Imagem Depois
      if (tracks[2] && tracks[2].clips[0] && assetInputs['depois']) {
        tracks[2].clips[0].asset.src = assetInputs['depois'];
      }
      // Track 3: Imagem Antes
      if (tracks[3] && tracks[3].clips[0] && assetInputs['antes']) {
        tracks[3].clips[0].asset.src = assetInputs['antes'];
      }
      // Template c-vert-vert (templateKey 9): duplica imagem Depois no track 4
      if (templateKey === 9 && tracks[4] && tracks[4].clips[0] && assetInputs['depois']) {
        tracks[4].clips[0].asset.src = assetInputs['depois'];
      }
      // Template c-horz-horz (templateKey 7): duplica imagem Depois no track 4 se existir
      if (templateKey === 7 && tracks[4] && tracks[4].clips[0] && assetInputs['depois']) {
        tracks[4].clips[0].asset.src = assetInputs['depois'];
      }
      return json;
    }
    
    // Fluxo genérico
    json.timeline.tracks.forEach((track, trackIdx) => {
      track.clips.forEach((clip, clipIdx) => {
        const key = `${trackIdx}-${clipIdx}`;
        if (assetInputs[key] && clip.asset && (clip.asset.type === 'image' || clip.asset.type === 'video')) {
          clip.asset.src = assetInputs[key];
        }
      });
    });
    
    return json;
  };

  // Helper para mapear orientação/saída para o template correto de Câmera Mágica
  function getCameraMagicaJsonKey() {
    if (magicaOrientation === 'vertical') return 6; // b-vert-vert
    // horizontal
    if (outputType === 'vertical') return 5; // b-horz-vert
    return 4; // b-horz-horz
  }

  // Função para monitorar o status da renderização
  const monitorRenderStatus = async (renderIdToMonitor) => {
    console.log('🔍 Iniciando monitoramento da renderização:', renderIdToMonitor);
    setRenderId(renderIdToMonitor);
    setRenderStatus('queued');
    setRenderProgress(10);
    
    const startTime = Date.now();
    
    const checkStatus = async () => {
      try {
        const statusResult = await apiCall(`/api/shotstack/status/${renderIdToMonitor}`);
        console.log('📊 Status atual:', statusResult);
        
        let statusData = statusResult;
        if (statusResult.success && statusResult.data) {
          statusData = statusResult.data;
        }
        
        const currentStatus = statusData.status;
        setRenderStatus(currentStatus);
        
        // Atualiza tempo decorrido
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRenderElapsedTime(elapsed);
        
        // Atualiza progresso baseado no status
        switch (currentStatus) {
          case 'queued':
            setRenderProgress(20);
            break;
          case 'rendering':
            // Progresso simulado baseado no tempo (máximo 90% até completar)
            const baseProgress = 30;
            const timeProgress = Math.min(60, elapsed * 2); // 2% por segundo, máximo 60%
            setRenderProgress(baseProgress + timeProgress);
            break;
          case 'done':
            setRenderProgress(100);
            setProjectResult({ 
              url: statusData.url, 
              ...statusData,
              renderTime: statusData.renderTime 
            });
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            setProjectLoading(false);
            console.log('✅ Renderização concluída:', statusData.url);
            return;
          case 'failed':
            setRenderProgress(0);
            setError('Erro na renderização: ' + (statusData.error || 'Falha desconhecida'));
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            setProjectLoading(false);
            return;
        }
        
      } catch (err) {
        console.error('❌ Erro ao verificar status:', err);
        setError('Erro ao verificar status da renderização: ' + err.message);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setProjectLoading(false);
      }
    };
    
    // Primeira verificação imediata
    await checkStatus();
    
    // Configura polling a cada 5 segundos
    if (renderStatus !== 'done' && renderStatus !== 'failed') {
      const interval = setInterval(checkStatus, 5000);
      setPollingInterval(interval);
    }
  };

  // Limpa o polling quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Função para resetar o estado da renderização
  const resetRenderState = () => {
    setRenderStatus(null);
    setRenderProgress(0);
    setRenderId(null);
    setRenderElapsedTime(0);
    setProjectResult(null);
    setError('');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Valida o JSON antes de enviar para o Shotstack
  const validateShotstackJson = (json) => {
    if (!json || !json.timeline || !json.timeline.tracks) {
      throw new Error('JSON inválido: timeline.tracks é obrigatório');
    }
    
    // Verifica se há pelo menos uma track
    if (!Array.isArray(json.timeline.tracks) || json.timeline.tracks.length === 0) {
      throw new Error('JSON inválido: deve conter pelo menos uma track');
    }
    
    // Valida cada track
    json.timeline.tracks.forEach((track, trackIndex) => {
      if (!track.clips || !Array.isArray(track.clips) || track.clips.length === 0) {
        throw new Error(`JSON inválido: track ${trackIndex} deve conter pelo menos um clip`);
      }
      
      // Valida cada clip
      track.clips.forEach((clip, clipIndex) => {
        if (!clip.asset || !clip.asset.type || !clip.asset.src) {
          throw new Error(`JSON inválido: track ${trackIndex}, clip ${clipIndex} deve ter asset válido`);
        }
        
        // Verifica se as URLs são válidas (não vazias, não "aho", etc.)
        if (typeof clip.asset.src !== 'string' || 
            clip.asset.src.trim() === '' || 
            clip.asset.src === 'aho' ||
            (!clip.asset.src.startsWith('http') && clip.asset.type === 'image')) {
          throw new Error(`JSON inválido: track ${trackIndex}, clip ${clipIndex} tem URL inválida: "${clip.asset.src}"`);
        }
      });
    });
    
    // Valida output conforme documentação da API
    if (!json.output) {
      console.warn('⚠️ Output não especificado, será usado default');
    } else {
      if (!json.output.format) {
        throw new Error('JSON inválido: output.format é obrigatório quando output está presente');
      }
      
      // Valida se size está corretamente estruturado se presente
      if (json.output.size) {
        if (!json.output.size.width || !json.output.size.height) {
          throw new Error('JSON inválido: output.size deve conter width e height');
        }
      }
    }
    
    console.log('✅ JSON validado com sucesso');
    return true;
  };

  const handleGenerateProject = async () => {
    setProjectLoading(true);
    setProjectResult(null);
    setError('');
    setRenderStatus(null);
    setRenderProgress(0);
    setRenderId(null);
    setRenderElapsedTime(0);
    
    // Limpa polling anterior se existir
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    let shotstackPayload = null; // Declarar fora do try/catch
    
    try {
      let runwayVideoUrl = null;
      // Se for Câmera Mágica ou Ambos, primeiro gera vídeo Runway
      if (videoType === 'b' || videoType === 'c') {
        if (!assetInputs['depois']) throw new Error('Informe a imagem Depois.');
        // Chama Runway
        const payload = {
          promptImage: assetInputs['depois'],
          promptText: 'POV slowmo forward',
          ratio: '1280:720',
          duration: 5,
          model: 'gen4_turbo',
          withHuman: false
        };
        const data = await apiCall('/api/runway/image-to-video', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        let payloadData = data;
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          payloadData = data.data;
        }
        let normalized;
        if (!payloadData) {
          normalized = null;
        } else if (Array.isArray(payloadData.output) && payloadData.output.length > 0) {
          normalized = payloadData;
        } else if (typeof payloadData.output === 'string') {
          normalized = { ...payloadData, output: [payloadData.output] };
        } else if (payloadData.url) {
          normalized = { ...payloadData, output: [payloadData.url] };
        } else if (payloadData.data && typeof payloadData.data === 'string') {
          normalized = { ...payloadData, output: [payloadData.data] };
        } else {
          normalized = null;
        }
        if (!normalized || !normalized.output || !normalized.output[0]) throw new Error('Vídeo não retornado do Runway');
        runwayVideoUrl = normalized.output[0];
      }
      
      // Monta o JSON final
      let finalJson = buildFinalJson(runwayVideoUrl);
      
      // Se for Câmera Mágica ou Ambos, injeta o vídeo do Runway no JSON
      if ((videoType === 'b' || videoType === 'c') && runwayVideoUrl) {
        // Para Câmera Mágica: segundo track, primeiro clip
        if (finalJson.timeline.tracks[1] && finalJson.timeline.tracks[1].clips[0]) {
          finalJson.timeline.tracks[1].clips[0].asset.src = runwayVideoUrl;
          console.log('🎬 Vídeo Runway injetado pós-geração:', runwayVideoUrl);
        }
      }
      
      console.log('🎯 JSON FINAL enviado ao Shotstack:', JSON.stringify(finalJson, null, 2));
      
      // Valida o JSON antes de enviar conforme documentação da API
      try {
        validateShotstackJson(finalJson);
      } catch (validationError) {
        console.error('❌ Erro de validação do JSON:', validationError.message);
        throw new Error('JSON inválido: ' + validationError.message);
      }
      
      // Chama o backend do Shotstack - envia o JSON completo conforme documentação
      shotstackPayload = finalJson;
      
      // Garante que o output está presente e com formato correto conforme documentação
      if (!shotstackPayload.output) {
        shotstackPayload.output = {
          format: 'mp4',
          size: {
            width: 1920,
            height: 1080
          }
        };
      }
      
      const shotstackResult = await apiCall('/api/shotstack/render', {
        method: 'POST',
        body: JSON.stringify(shotstackPayload)
      });
      
      console.log('✅ Resultado do Shotstack:', shotstackResult);
      
      // Trata resposta conforme documentação da API
      let finalResult = shotstackResult;
      if (shotstackResult.success && shotstackResult.data) {
        // Se a API retornou com estrutura {success: true, data: {...}}
        finalResult = shotstackResult.data;
        
        // Se o status for 'done', o vídeo está pronto imediatamente
        if (finalResult.status === 'done' && finalResult.url) {
          setRenderProgress(100);
          setProjectResult({ url: finalResult.url, ...finalResult });
          setProjectLoading(false);
        } else if (finalResult.status === 'queued' || finalResult.status === 'rendering') {
          // Para renderização assíncrona, inicia monitoramento
          const renderIdToMonitor = finalResult.id || finalResult.renderId;
          if (renderIdToMonitor) {
            console.log('🎬 Iniciando monitoramento para render ID:', renderIdToMonitor);
            await monitorRenderStatus(renderIdToMonitor);
          } else {
            setError('ID da renderização não retornado pela API');
            setProjectLoading(false);
          }
        }
      } else if (shotstackResult.url) {
        // Fallback para formato antigo com URL direta
        setRenderProgress(100);
        setProjectResult(shotstackResult);
        setProjectLoading(false);
      } else {
        // Se não conseguiu identificar o formato, tenta extrair renderId
        const renderIdToMonitor = shotstackResult.id || shotstackResult.renderId;
        if (renderIdToMonitor) {
          console.log('🎬 Tentando monitoramento para render ID (fallback):', renderIdToMonitor);
          await monitorRenderStatus(renderIdToMonitor);
        } else {
          setProjectResult(shotstackResult);
          setProjectLoading(false);
        }
      }
    } catch (err) {
      console.error('❌ Erro completo:', err);
      console.error('❌ Stack trace:', err.stack);
      if (shotstackPayload) {
        console.error('❌ Payload que causou erro:', shotstackPayload);
      }
      setError('Erro ao gerar projeto: ' + (err.message || err));
      
      // Limpa estados de renderização em caso de erro
      setRenderStatus('failed');
      setRenderProgress(0);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setProjectLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      {/* Seletor de tipo de vídeo */}
      <div className="card mb-4">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">Tipo de Vídeo</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center">
            <button
              className={`btn btn-sm ${videoType === 'a' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVideoType('a')}
            >
              Antes e Depois
            </button>
            <button
              className={`btn btn-sm ${videoType === 'b' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVideoType('b')}
            >
              Câmera Mágica
            </button>
            <button
              className={`btn btn-sm ${videoType === 'c' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setVideoType('c')}
            >
              Antes e Depois + Câmera Mágica
            </button>
          </div>
        </div>
      </div>
      <h2>Automação Runway + Shotstack</h2>

      {/* Form dinâmico para assets editáveis do acabamento */}
      <div className="card mb-4">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">Preencha as mídias para o acabamento</h5>
        </div>
        <div className="card-body">
          {(() => {
            // Antes e Depois + Câmera Mágica: mostrar campos de antes e depois, mas nunca mostrar campo Antes se for Câmera Mágica
            if ([7,8,9].includes(selectedOption) && videoType === 'c') {
              return <>
                {videoType !== 'b' && (
                  <div key="antes" className="mb-3">
                    <label className="form-label">Antes - Cômodo vazio:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={assetInputs['antes'] || ''}
                      onChange={e => handleAssetInputChange('antes', e.target.value)}
                      placeholder="URL da imagem Antes"
                    />
                    {assetInputs['antes'] && (
                      <img src={assetInputs['antes']} alt="Antes" style={{maxWidth: 200, marginTop: 8}} />
                    )}
                  </div>
                )}
                <div key="depois" className="mb-3">
                  <label className="form-label">Depois - Cômodo decorado:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assetInputs['depois'] || ''}
                    onChange={e => handleAssetInputChange('depois', e.target.value)}
                    placeholder="URL da imagem Depois"
                  />
                  {assetInputs['depois'] && (
                    <img src={assetInputs['depois']} alt="Depois" style={{maxWidth: 200, marginTop: 8}} />
                  )}
                </div>
                {magicaOrientation === 'horizontal' && (
                  <div className="d-flex gap-2 align-items-center mt-3">
                    <span>Selecione o tipo de saída:</span>
                    <button
                      className={`btn btn-sm ${outputType === 'horizontal' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOutputType('horizontal')}
                    >
                      Horizontal
                    </button>
                    <button
                      className={`btn btn-sm ${outputType === 'vertical' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOutputType('vertical')}
                    >
                      Vertical
                    </button>
                    <span className="ms-3 text-muted">(Detectado: Horizontal)</span>
                  </div>
                )}
                {magicaOrientation === 'vertical' && (
                  <div className="mt-3 text-muted">Saída: Vertical (automático)</div>
                )}
              </>;
            }
            // Câmera Mágica (videoType === 'b') sempre mostra campo "Depois" para selectedOption 4, 5 ou 6
            if ([4,5,6].includes(selectedOption) && videoType === 'b') {
              return <>
                <div key="depois" className="mb-3">
                  <label className="form-label">Depois - Cômodo decorado:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assetInputs['depois'] || ''}
                    onChange={e => handleAssetInputChange('depois', e.target.value)}
                    placeholder="URL da imagem Depois"
                  />
                  {assetInputs['depois'] && (
                    <img src={assetInputs['depois']} alt="Depois" style={{maxWidth: 200, marginTop: 8}} />
                  )}
                </div>
                {magicaOrientation === 'horizontal' && (
                  <div className="d-flex gap-2 align-items-center mt-3">
                    <span>Selecione o tipo de saída:</span>
                    <button
                      className={`btn btn-sm ${outputType === 'horizontal' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOutputType('horizontal')}
                    >
                      Horizontal
                    </button>
                    <button
                      className={`btn btn-sm ${outputType === 'vertical' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOutputType('vertical')}
                    >
                      Vertical
                    </button>
                    <span className="ms-3 text-muted">(Detectado: Horizontal)</span>
                  </div>
                )}
                {magicaOrientation === 'vertical' && (
                  <div className="mt-3 text-muted">Saída: Vertical (automático)</div>
                )}
              </>;
            }
            // Antes e Depois puro
            if ([1,2,3].includes(selectedOption)) {
              return <>
                {videoType !== 'b' && (
                  <div key="antes" className="mb-3">
                    <label className="form-label">Antes - Cômodo vazio:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={assetInputs['antes'] || ''}
                      onChange={e => handleAssetInputChange('antes', e.target.value)}
                      placeholder="URL da imagem Antes"
                    />
                    {assetInputs['antes'] && (
                      <img src={assetInputs['antes']} alt="Antes" style={{maxWidth: 200, marginTop: 8}} />
                    )}
                  </div>
                )}
                <div key="depois" className="mb-3">
                  <label className="form-label">Depois - Cômodo decorado:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assetInputs['depois'] || ''}
                    onChange={e => handleAssetInputChange('depois', e.target.value)}
                    placeholder="URL da imagem Depois"
                  />
                  {assetInputs['depois'] && (
                    <img src={assetInputs['depois']} alt="Depois" style={{maxWidth: 200, marginTop: 8}} />
                  )}
                </div>
                {/* Botões de seleção de saída só aparecem se horizontal */}
                {inputOrientation === 'horizontal' && (
                  <div className="d-flex gap-2 align-items-center mt-3">
                    <span>Selecione o tipo de saída:</span>
                    <button
                      className={`btn btn-sm ${outputType === 'horizontal' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setOutputType('horizontal');
                        setSelectedOption(1); // H/H
                      }}
                    >
                      Horizontal
                    </button>
                    <button
                      className={`btn btn-sm ${outputType === 'vertical' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        setOutputType('vertical');
                        setSelectedOption(2); // H/V
                      }}
                    >
                      Vertical
                    </button>
                    <span className="ms-3 text-muted">(Detectado: Horizontal)</span>
                  </div>
                )}
                {inputOrientation === 'vertical' && (
                  <div className="mt-3 text-muted">Saída: Vertical (automático)</div>
                )}
              </>;
            }
            // Para outros modelos, manter fluxo antigo
            const images = getEditableAssetsFromJson(acabamentoJsons[selectedOption]).filter(asset => asset.type === 'image');
            if (images.length === 0) return <div>Nenhuma imagem editável neste template.</div>;
            let reordered = images;
            if (images.length >= 2) {
              reordered = [images[1], images[0], ...images.slice(2)];
            }
            return reordered.map((asset, idx) => {
              let label = `Imagem ${idx + 1}`;
              if (idx === 0) label = 'Antes - Cômodo vazio';
              if (idx === 1) label = 'Depois - Cômodo Decorado';
              // Nunca renderizar campo Antes para Câmera Mágica
              if (videoType === 'b' && (label === 'Antes - Cômodo vazio' || idx === 0)) return null;
              return (
                <div key={asset.trackIdx + '-' + asset.clipIdx} className="mb-3">
                  <label className="form-label">
                    {label}:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={assetInputs[`${asset.trackIdx}-${asset.clipIdx}`] || ''}
                    onChange={e => handleAssetInputChange(`${asset.trackIdx}-${asset.clipIdx}`, e.target.value)}
                    placeholder="URL da imagem"
                  />
                  {assetInputs[`${asset.trackIdx}-${asset.clipIdx}`] && (
                    <img src={assetInputs[`${asset.trackIdx}-${asset.clipIdx}`]} alt="" style={{maxWidth: 200, marginTop: 8}} />
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Gerar Projeto</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-primary"
              onClick={handleGenerateProject}
              disabled={projectLoading}
            >
              {projectLoading ? '⏳ Processando...' : 'Gerar Projeto'}
            </button>
            
            {projectLoading && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setProjectLoading(false);
                  resetRenderState();
                }}
              >
                ⏹️ Cancelar
              </button>
            )}
            
            {projectResult && !projectLoading && (
              <button
                className="btn btn-outline-info btn-sm"
                onClick={resetRenderState}
              >
                🔄 Nova Renderização
              </button>
            )}
          </div>
          
          {/* Indicador de progresso da renderização */}
          {projectLoading && renderStatus && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Status da Renderização</span>
                <span className="text-muted">
                  {renderElapsedTime > 0 && `${Math.floor(renderElapsedTime / 60)}:${(renderElapsedTime % 60).toString().padStart(2, '0')}`}
                </span>
              </div>
              
              <div className="progress mb-3" style={{height: '25px'}}>
                <div 
                  className={`progress-bar progress-bar-striped progress-bar-animated ${
                    renderStatus === 'failed' ? 'bg-danger' : 
                    renderStatus === 'done' ? 'bg-success' : 'bg-primary'
                  }`}
                  role="progressbar" 
                  style={{width: `${renderProgress}%`}}
                  aria-valuenow={renderProgress} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  {renderProgress}%
                </div>
              </div>
              
              <div className="d-flex justify-content-between align-items-center">
                <span className="badge bg-secondary">
                  {renderStatus === 'queued' && '🕐 Na fila'}
                  {renderStatus === 'rendering' && '🎬 Renderizando'}
                  {renderStatus === 'done' && '✅ Concluído'}
                  {renderStatus === 'failed' && '❌ Falhou'}
                </span>
                {renderId && (
                  <small className="text-muted">ID: {renderId}</small>
                )}
              </div>
              
              {/* Logs de monitoramento durante renderização */}
              {renderElapsedTime > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    📊 Monitoramento ativo | 
                    ⏱️ {Math.floor(renderElapsedTime / 60)}:{(renderElapsedTime % 60).toString().padStart(2, '0')} | 
                    🔄 Verificando a cada 5s
                  </small>
                </div>
              )}
            </div>
          )}
          
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          
          {projectResult && (
            <div className="mt-3">
              {projectResult.url ? (
                <>
                  <div className="alert alert-success">
                    <h6 className="mb-2">🎉 Vídeo renderizado com sucesso!</h6>
                    <a 
                      href={projectResult.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-success btn-sm me-2"
                    >
                      🔗 Abrir Link do Vídeo
                    </a>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigator.clipboard.writeText(projectResult.url)}
                    >
                      📋 Copiar Link
                    </button>
                  </div>
                  
                  <label className="form-label fw-bold">Pré-visualização:</label>
                  <video controls className="w-100" style={{borderRadius: 8}}>
                    <source src={projectResult.url} type="video/mp4" />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                  
                  <div className="mt-2 row">
                    {projectResult.duration && (
                      <div className="col-sm-6">
                        <small className="text-muted">⏱️ Duração: {projectResult.duration}s</small>
                      </div>
                    )}
                    {projectResult.renderTime && (
                      <div className="col-sm-6">
                        <small className="text-muted">🚀 Tempo de renderização: {(projectResult.renderTime / 1000).toFixed(2)}s</small>
                      </div>
                    )}
                  </div>
                </>
              ) : projectResult.message ? (
                <div className="alert alert-info">
                  <strong>Status:</strong> {projectResult.message}
                </div>
              ) : (
                <div className="alert alert-warning">
                  <strong>Resultado:</strong> {JSON.stringify(projectResult, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RunwayShotstackAuto;
