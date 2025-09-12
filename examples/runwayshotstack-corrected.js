// RunwayShotstackAuto.js - Correções para as chamadas da API Shotstack
// Substitua a função monitorRenderStatus e parte do handleGenerateProject

// Função corrigida para monitorar o status da renderização
const monitorRenderStatus = async (renderIdToMonitor) => {
  console.log('🔍 Iniciando monitoramento da renderização:', renderIdToMonitor);
  setRenderId(renderIdToMonitor);
  setRenderStatus('queued');
  setRenderProgress(10);
  
  const startTime = Date.now();
  
  const checkStatus = async () => {
    try {
      // ✅ CORREÇÃO: Chamada direta sem estrutura aninhada
      const statusResult = await apiCall(`/api/shotstack/status/${renderIdToMonitor}`);
      console.log('📊 Status completo recebido:', statusResult);
      
      // ✅ CORREÇÃO: Acesso direto aos dados da resposta
      if (!statusResult.success) {
        throw new Error(statusResult.message || 'Erro ao verificar status');
      }
      
      const statusData = statusResult.data;
      const currentStatus = statusData.status;
      
      setRenderStatus(currentStatus);
      
      // Atualiza tempo decorrido
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setRenderElapsedTime(elapsed);
      
      // Atualiza progresso baseado no status
      switch (currentStatus) {
        case 'queued':
          setRenderProgress(20);
          console.log('⏳ Na fila...');
          break;
        case 'rendering':
          // Progresso simulado baseado no tempo (máximo 90% até completar)
          const baseProgress = 30;
          const timeProgress = Math.min(60, elapsed * 2); // 2% por segundo, máximo 60%
          setRenderProgress(baseProgress + timeProgress);
          console.log('🎬 Renderizando...', `${baseProgress + timeProgress}%`);
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
          console.error('❌ Renderização falhou:', statusData.error);
          return;
        default:
          console.warn('⚠️ Status desconhecido:', currentStatus);
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

// Parte corrigida do handleGenerateProject (substitua a partir da chamada do Shotstack)
// ... código anterior permanece igual até a chamada do Shotstack ...

try {
  // ... código do Runway permanece igual ...
  
  // ✅ CORREÇÃO: Chamada do Shotstack com tratamento adequado
  console.log('🎯 JSON FINAL enviado ao Shotstack:', JSON.stringify(finalJson, null, 2));
  
  // Valida o JSON antes de enviar
  try {
    validateShotstackJson(finalJson);
  } catch (validationError) {
    console.error('❌ Erro de validação do JSON:', validationError.message);
    throw new Error('JSON inválido: ' + validationError.message);
  }
  
  // ✅ CORREÇÃO: Chamada simplificada da API
  const shotstackResult = await apiCall('/api/shotstack/render', {
    method: 'POST',
    body: JSON.stringify(finalJson)
  });
  
  console.log('✅ Resultado do Shotstack:', shotstackResult);
  
  // ✅ CORREÇÃO: Tratamento consistente da resposta
  if (!shotstackResult.success) {
    throw new Error(shotstackResult.message || 'Erro na chamada da API');
  }
  
  const responseData = shotstackResult.data;
  
  // ✅ CORREÇÃO: Verifica se o vídeo está pronto imediatamente ou precisa de monitoramento
  if (responseData.status === 'done' && responseData.url) {
    // Vídeo pronto imediatamente (raro, mas possível)
    setRenderProgress(100);
    setProjectResult({ 
      url: responseData.url, 
      ...responseData 
    });
    setProjectLoading(false);
    console.log('🎉 Vídeo pronto imediatamente:', responseData.url);
  } else {
    // ✅ CORREÇÃO: Usa o ID correto para monitoramento
    const renderIdToMonitor = responseData.id || responseData.renderId;
    
    if (!renderIdToMonitor) {
      throw new Error('ID da renderização não retornado pela API');
    }
    
    console.log('🎬 Iniciando monitoramento para render ID:', renderIdToMonitor);
    await monitorRenderStatus(renderIdToMonitor);
  }
  
} catch (err) {
  console.error('❌ Erro completo:', err);
  console.error('❌ Stack trace:', err.stack);
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
