import React, { useState, useEffect } from 'react';
import MyProductions from '../Components/MyProductions';
import ShotstackStatusDisplay from '../Components/ShotstackStatusDisplay';
import useShotstackRender from '../Hooks/useShotstackRender';
import useFirebaseUpload from '../Hooks/useFirebaseUpload';
import { apiCall } from '../Config/Config';
import acabamentoJsons from '../magicmotion/acabamentoJsons';
import styles from './RunwayShotstackAuto.module.css';

//Airtable
import Airtable from 'airtable';

const RunwayShotstackAuto = ({ softrEmail }) => {

  console.log("AGORA - RunwayShotstackAuto - softrEmail recebido:", softrEmail);
  // Estados principais
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedOption, setSelectedOption] = useState(1);
  const [videoType, setVideoType] = useState('a');
  const [assetInputs, setAssetInputs] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false); // Controla se há arquivo uploadado
  const [inputUrl, setInputUrl] = useState('');
  const [inputMethod, setInputMethod] = useState('file');
  const [inputOrientation, setInputOrientation] = useState('horizontal');
  const [outputType, setOutputType] = useState('horizontal');
  const [magicaOrientation, setMagicaOrientation] = useState('horizontal');

  // Estados do Runway
  const [runwayVideo, setRunwayVideo] = useState(null);
  const [runwayLoading, setRunwayLoading] = useState(false);

  // Estados do usuário
  const [clientEmail, setClientEmail] = useState("galia@acasa7.com.br");
  const [userId, setUserId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [baseTable, setBaseTable] = useState("");
  const [clientInfos, setClientInfos] = useState({
    Email: "",
    ClientId: "",
    InvoiceId: "",
    UserId: "",
  });

  // Estados para processamento e resultado
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [processingError, setProcessingError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hooks customizados
  const { renderVideo, result, renderStatus, isLoading } = useShotstackRender();
  const { uploadSingle, uploadMultiple, resetState } = useFirebaseUpload();

  // 🔍 DEBUG: Verificar se o hook foi carregado corretamente
  console.log('🔍 DEBUG - Hook uploadSingle:', {
    exists: !!uploadSingle,
    type: typeof uploadSingle,
    isFunction: typeof uploadSingle === 'function'
  });

  useEffect(() => {
    if (softrEmail) {
      console.log("Softremail mudo para: ", softrEmail);
      setClientEmail(softrEmail);
    }
  }, [softrEmail])

  var emailbase;

  const getClientTable = async (clientid) => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    try {
      const records = await base('Clients')
        .select({
          filterByFormula: `{id} = "${clientid}"`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length > 0) {
        const clientData = records[0].fields;
        setClientName(clientData['name'] || "");

        console.log("🔍 getClientTable - Dados do cliente:", {
          clientData,
          calculationField: clientData.id,
          calculationType: typeof clientData.id,
          isArray: Array.isArray(clientData.id)
        });

        return {
          BaseCRM: clientData.base_CRM || null,
          Calculation: clientData.id || null,
          InvoiceId: Array.isArray(clientData.open_invoice_id)
            ? clientData.open_invoice_id[0] || null
            : clientData.open_invoice_id || null,
          UserId: clientId || null,
        };
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (clientId) {
      console.log("🔍 Obtendo dados do cliente para ClientId:", clientId);
      getClientTable(clientId).then(infos => {
        if (infos) {
          setBaseTable(infos.BaseCRM);

          // Garantir que ClientId seja sempre uma string
          let finalClientId = infos.Calculation;
          if (Array.isArray(infos.Calculation)) {
            finalClientId = infos.Calculation.length > 0 ? infos.Calculation[0] : null;
          }

          console.log("🔍 Definindo ClientId:", {
            original: infos.Calculation,
            isArray: Array.isArray(infos.Calculation),
            final: finalClientId,
            type: typeof finalClientId
          });

          setClientInfos({
            Email: clientEmail,
            ClientId: finalClientId,
            InvoiceId: infos.InvoiceId,
            UserId: userId
          });
        }
      });
    }
  }, [clientId])

  useEffect(() => {
    if (clientInfos) {
      console.log("🔍 clientInfos atualizado:", clientInfos);
    }
  }, [clientInfos])

  // Função para processar vídeo via API FFmpeg
  const processFFmpegVideo = async (beforeUrl, afterUrl) => {
    try {
      setProcessingStep('Iniciando processamento FFmpeg...');
      
      // 1. Chamar endpoint para iniciar processamento
      const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/before-after', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beforeUrl: beforeUrl,
          afterUrl: afterUrl,
          clientName: clientName || 'cliente-ruum',
          duration: 8,
          quality: 'high'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao iniciar processamento: ${response.status}`);
      }

      const { renderId } = await response.json();
      console.log('🎬 Processamento FFmpeg iniciado:', renderId);

      // 2. Fazer polling do status
      const videoUrl = await pollFFmpegStatus(renderId);
      return videoUrl;

    } catch (error) {
      console.error('❌ Erro no processamento FFmpeg:', error);
      throw error;
    }
  };

  // Função para fazer polling do status do processamento FFmpeg
  const pollFFmpegStatus = async (renderId) => {
    const maxAttempts = 90; // 3 minutos máximo
    const pollInterval = 2000; // 2 segundos

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/status/${renderId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao verificar status: ${response.status}`);
        }

        const status = await response.json();
        
        // Atualizar mensagem de progresso
        const progressMessage = {
          'queued': 'Na fila de processamento...',
          'downloading': `Baixando imagens... ${status.progress}%`,
          'processing': `Processando vídeo... ${status.progress}%`,
          'uploading': `Fazendo upload... ${status.progress}%`,
        };
        
        if (progressMessage[status.status]) {
          setProcessingStep(progressMessage[status.status]);
        }

        console.log(`📊 FFmpeg ${status.status} - ${status.progress}%`);

        // Processamento concluído
        if (status.status === 'done' && status.url) {
          console.log('✅ Vídeo FFmpeg pronto:', status.url);
          return status.url;
        }

        // Erro no processamento
        if (status.status === 'failed') {
          throw new Error(status.error || 'Falha no processamento FFmpeg');
        }

        // Aguardar antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.warn('⚠️ Erro no polling, tentando novamente...', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda mais em caso de erro
      }
    }

    throw new Error('Timeout: processamento FFmpeg excedeu o tempo máximo');
  };

  const saveVideoToAirtable = async (videoUrl) => {
    try {

      // ✅ VALIDAÇÃO PRÉVIA DO EMAIL
      const emailToUse = softrEmail

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToUse)) {
        console.error('❌ Email inválido:', emailToUse);
        return null;
      }

      // Mapear tipo de vídeo para formato legível
      const getVideoTypeDescription = (type) => {
        switch (type) {
          case 'a': return 'A - Antes e depois';
          case 'b': return 'B - Câmera mágica';
          case 'c': return 'C - Câmera mágica + Antes e depois';
          case 'd': return 'D - Antes e Depois FFmpeg';
          default: return 'A - Antes e depois';
        }
      };

      // Mapear orientação para formato legível
      const getOrientationDescription = (orientation) => {
        return orientation === 'vertical'
          ? 'Vertical ↕️ (Social - Stories, Reels e WhatsApp)'
          : 'Horizontal ↔️ (Web - Portal de vendas , YouTube)';
      };

      console.log("Client ID:", clientId);

      // ✅ PAYLOAD CORRIGIDO - com validações adicionais
      const payload = {
        videosArray: [{
          codigo: selectedProperty?.clientCode || selectedProperty?.propertyId || '2479',
          propertyUrl: selectedProperty?.propertyUrl || '',
          observacoes: `Vídeo gerado automaticamente via Magic Motion - Tipo: ${getVideoTypeDescription(videoType)}`,
          imgUrl: selectedProperty?.inputImageUrl || assetInputs['antes'] || '',
          outputVideo: videoUrl,
          mm_type: getVideoTypeDescription(videoType),
          vid_orientation: getOrientationDescription(outputType)
        }],
        // ✅ APENAS OS PARÂMETROS NECESSÁRIOS (sem "email" duplicado)
        customEmail: clientEmail,
        customClientId: clientId,
        customInvoiceId: clientInfos.InvoiceId,
        customUserId: clientInfos.UserId
      };

      const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/update-videos-airtable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ruum-api-secure-token-2024'
        },
        body: JSON.stringify(payload)
      });

      // ✅ MELHOR DEBUG para todos os tipos de erro
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });

        // Tentar fazer parse do JSON de erro se possível
        try {
          const errorJson = JSON.parse(errorText);
          console.error('📋 Detalhes do erro JSON:', errorJson);
        } catch (e) {
          console.error('📋 Resposta não é JSON válido:', errorText);
        }

        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();

      return responseData;
    } catch (error) {
      console.error('❌ Erro ao salvar vídeo no Airtable:', error);
      console.error('📋 Stack trace:', error.stack);
      return null;
    }
  };

  // Effect para detectar orientação da imagem uploadada
  useEffect(() => {
    if (uploadedFile && uploadedFile instanceof File) {
      const img = new Image();
      img.onload = () => {
        const orientation = img.width > img.height ? 'horizontal' : 'vertical';

        if (videoType === 'b') {
          setMagicaOrientation(orientation);
        } else {
          setInputOrientation(orientation);
        }

        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(uploadedFile);
    }
  }, [uploadedFile, videoType]);

  // Effect para limpar URL temporária quando muda o método de input
  useEffect(() => {
    if (inputMethod === 'url' && inputUrl) {
      setAssetInputs(prev => ({ ...prev, 'depois': inputUrl }));
    }
  }, [inputUrl, inputMethod]);

  // Handler para seleção de propriedade
  const handlePropertySelected = (property) => {
    // Impedir seleção se há arquivo uploadado
    if (hasUploadedFile) {
      return;
    }

    setSelectedProperty(property);
  };

  // Função para detectar orientação de uma imagem
  const detectImageOrientation = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const orientation = img.width > img.height ? 'horizontal' : 'vertical';
        resolve(orientation);
      };
      img.onerror = () => {
        // Em caso de erro, usar horizontal como padrão
        resolve('horizontal');
      };
      img.src = imageUrl;
    });
  };

  // useEffect para detectar orientação automaticamente quando imagens mudam
  useEffect(() => {
    const detectOrientations = async () => {
      let detectedOrientation = 'horizontal'; // padrão

      // Detectar orientação da imagem "antes" (para tipos 'a', 'c' e 'd')
      if ((videoType === 'a' || videoType === 'c' || videoType === 'd') && assetInputs['antes']) {
        try {
          const orientation = await detectImageOrientation(assetInputs['antes']);
          setInputOrientation(orientation);
          detectedOrientation = orientation;
        } catch (error) {
          console.log('Erro ao detectar orientação da imagem antes:', error);
        }
      }

      // Detectar orientação da imagem "depois" (para tipo 'b')
      if (videoType === 'b' && assetInputs['depois']) {
        try {
          const orientation = await detectImageOrientation(assetInputs['depois']);
          setMagicaOrientation(orientation);
          detectedOrientation = orientation;
        } catch (error) {
          console.log('Erro ao detectar orientação da imagem depois:', error);
        }
      }

      // Para tipo 'a' e 'd', usar orientação da imagem "depois" se disponível
      if ((videoType === 'a' || videoType === 'd') && assetInputs['depois']) {
        try {
          const orientation = await detectImageOrientation(assetInputs['depois']);
          detectedOrientation = orientation;
        } catch (error) {
          console.log('Erro ao detectar orientação da imagem depois:', error);
        }
      }

      // Definir formato do vídeo final automaticamente
      if (detectedOrientation === 'vertical') {
        // Imagem vertical: saída sempre vertical
        setOutputType('vertical');
      } else {
        // Imagem horizontal: manter escolha do usuário ou usar horizontal como padrão
        if (!outputType || outputType === 'vertical') {
          setOutputType('horizontal');
        }
      }
    };

    detectOrientations();
  }, [assetInputs, videoType]);

  // useEffect para preencher campos quando propriedade é selecionada
  useEffect(() => {
    if (selectedProperty) {

      // Preencher campo "antes" com inputImageUrl se disponível
      if (selectedProperty.inputImageUrl) {
        setAssetInputs(prev => ({
          ...prev,
          'antes': selectedProperty.inputImageUrl
        }));
      }

      // Preencher campo "depois" com outputImageUrl se disponível
      if (selectedProperty.outputImageUrl) {
        setAssetInputs(prev => ({
          ...prev,
          'depois': selectedProperty.outputImageUrl
        }));
      }
    }
  }, [selectedProperty]);

  // useEffect para forçar upload de arquivo para tipo 'b' (Câmera Mágica)
  useEffect(() => {
    if (videoType === 'b') {
      setInputMethod('file');
    }
  }, [videoType]);

  // useEffect para atualizar selectedOption baseado no videoType
  useEffect(() => {
    if (videoType === 'a' || videoType === 'd') {
      // Antes e Depois (Shotstack e FFmpeg): templates 1, 2, 3
      setSelectedOption(1); // Será ajustado dinamicamente na buildFinalJson
    } else if (videoType === 'b') {
      // Câmera Mágica: templates 4, 5, 6
      setSelectedOption(4); // Será ajustado dinamicamente na buildFinalJson
    } else if (videoType === 'c') {
      // Ambos: templates 7, 8, 9
      setSelectedOption(7); // Será ajustado dinamicamente na buildFinalJson
    }
  }, [videoType]);

  // useEffect UNIFICADO para monitorar conclusão do vídeo e salvar no Airtable
  useEffect(() => {

    // Condições para considerar o vídeo como finalizado
    const videoFinalizado =
      isProcessing && // Deve estar em processamento
      !isLoading && // Loading deve ter terminado
      (renderStatus === 'done' || result?.url || result?.render?.url); // Status done OU URL disponível

    // Verificar falha
    if (renderStatus === 'failed' && isProcessing) {
      setProcessingError('Falha na renderização do vídeo');
      setProcessingStep('Erro no processamento');
      setIsProcessing(false);
      return;
    }

    // Se vídeo finalizou e ainda não foi salvo
    if (videoFinalizado && !finalVideoUrl) {

      // Determinar URL do vídeo (tentar diferentes localizações)
      let videoUrl = null;
      if (result?.url) {
        videoUrl = result.url;
      } else if (result?.render?.url) {
        videoUrl = result.render.url;
      }

      if (videoUrl) {
        setFinalVideoUrl(videoUrl);
        setProcessingStep('Vídeo gerado com sucesso!');
        setIsProcessing(false);

        // Salvar no Airtable - CHAMADA ÚNICA
        saveVideoToAirtable(videoUrl);
      } else {
        setFinalVideoUrl('video_completed');
        setProcessingStep('Vídeo gerado com sucesso!');
        setIsProcessing(false);
      }
    }
  }, [result, renderStatus, isLoading, isProcessing, finalVideoUrl]);

  // Handler para mudança de asset
  const handleAssetInputChange = (key, value) => {
    setAssetInputs(prev => ({ ...prev, [key]: value }));
  };

  // Handler para upload de arquivo
  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setHasUploadedFile(true); // Marca que há arquivo uploadado

    // Criar URL temporária para preview
    const tempUrl = URL.createObjectURL(file);
    setAssetInputs(prev => ({ ...prev, 'depois': tempUrl }));
  };

  // Função para remover arquivo uploadado
  const handleRemoveUpload = (event) => {
    // Garantir que o evento não se propague
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Limpar a URL temporária do blob para evitar memory leak
    if (assetInputs['depois'] && assetInputs['depois'].includes('blob:')) {
      URL.revokeObjectURL(assetInputs['depois']);
    }

    // Resetar todos os estados relacionados ao upload
    setUploadedFile(null);
    setHasUploadedFile(false);
    setAssetInputs(prev => ({ ...prev, 'depois': '' }));

    // Resetar input de arquivo para permitir re-upload do mesmo arquivo
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
      fileInput.value = '';
    }

  };

  // Monta o JSON final com os assets editáveis preenchidos
  const buildFinalJson = (runwayVideoUrl = null, firebaseImageUrl = null) => {
    const isAntesDepois = [1, 2, 3].includes(selectedOption);
    const isCameraMagica = videoType === 'b';
    const isAmbos = [7, 8, 9].includes(selectedOption);
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

    } else if (isAmbos) {
      // Ambos: 7=H/H, 8=H/V, 9=V/V
      if (inputOrientation === 'horizontal' && outputType === 'horizontal') templateKey = 7;
      else if (inputOrientation === 'horizontal' && outputType === 'vertical') templateKey = 8;
      else if (inputOrientation === 'vertical') templateKey = 9; // Vertical sempre usa V/V
      else templateKey = 7; // Default H/H
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

      // Para "Ambos", usar firebaseImageUrl (URL da imagem original) nos tracks de imagem
      const depoisImageUrl = firebaseImageUrl || assetInputs['depois'];

      // Track 2: Imagem Depois (IMPORTANTE: deve ser IMAGEM, não vídeo)
      if (tracks[2] && tracks[2].clips[0]) {
        tracks[2].clips[0].asset.src = depoisImageUrl;
      }
      // Track 3: Imagem Antes
      if (tracks[3] && tracks[3].clips[0] && assetInputs['antes']) {
        tracks[3].clips[0].asset.src = assetInputs['antes'];
      }
      // Template c-vert-vert (templateKey 9): duplica imagem Depois no track 4
      if (templateKey === 9 && tracks[4] && tracks[4].clips[0]) {
        tracks[4].clips[0].asset.src = depoisImageUrl;
      }
      // Template c-horz-horz (templateKey 7): duplica imagem Depois no track 4 se existir
      if (templateKey === 7 && tracks[4] && tracks[4].clips[0]) {
        tracks[4].clips[0].asset.src = depoisImageUrl;
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

  // Função principal para gerar projeto
  const handleGenerateProject = async () => {
    try {
      // Iniciar processamento
      setIsProcessing(true);
      setProcessingError(null);
      setFinalVideoUrl(null);
      setProcessingStep('Preparando arquivos...');

      let runwayVideoUrl = null;
      let finalInputImageUrl = null;

      // CONTROLE ESPECÍFICO PARA UPLOAD DE ARQUIVO
      // Só fazer upload se for inputMethod === 'file' e houver arquivo
      console.log('🔍 DEBUG - Verificando condições para upload:', {
        videoType,
        inputMethod,
        hasUploadedFile: !!uploadedFile,
        uploadedFileType: uploadedFile ? typeof uploadedFile : 'null',
        uploadedFileIsFile: uploadedFile instanceof File,
        uploadSingleExists: !!uploadSingle,
        uploadSingleType: typeof uploadSingle
      });

      if ((videoType === 'b' || videoType === 'c') && inputMethod === 'file' && uploadedFile) {

        console.log('✅ DEBUG - Entrando no bloco de upload de arquivo');
        setProcessingStep('Fazendo upload da imagem...');

        if (uploadedFile instanceof File) {
          console.log('✅ DEBUG - uploadedFile é uma instância de File');
          // Aguardar upload Firebase e obter URL pública
          // Usar selectedProperty se disponível, senão usar valor padrão
          const clientId = selectedProperty?.propertyId || selectedProperty?.clientCode || 'default_client';

          console.log('⬆️ Iniciando upload para Firebase para ClientId:', clientId);
          console.log('🔍 DEBUG - Detalhes do arquivo:', {
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type,
            clientId
          });
          console.log('🔍 DEBUG - Verificando uploadSingle antes da chamada:', {
            exists: !!uploadSingle,
            type: typeof uploadSingle,
            isFunction: typeof uploadSingle === 'function'
          });

          try {
            if (typeof uploadSingle !== 'function') {
              throw new Error('uploadSingle não é uma função. Tipo: ' + typeof uploadSingle);
            }

            console.log('🚀 DEBUG - Chamando uploadSingle...');
            const uploadResult = await uploadSingle(uploadedFile, clientId);
            console.log('✅ DEBUG - Upload concluído com sucesso:', uploadResult);
            
            // Extrair a URL pública do resultado
            finalInputImageUrl = uploadResult?.data?.publicUrl || uploadResult?.publicUrl;
            console.log('✅ DEBUG - URL pública extraída:', finalInputImageUrl);

            // Atualizar o estado com a URL pública (substitui o arquivo temporário)
            if (videoType === 'b') {
              setAssetInputs(prev => ({ ...prev, 'depois': finalInputImageUrl }));
            } else if (videoType === 'c') {
              // Para tipo 'c', verificar qual campo precisa ser atualizado
              if (!assetInputs['depois'] || assetInputs['depois'] instanceof File) {
                setAssetInputs(prev => ({ ...prev, 'depois': finalInputImageUrl }));
              }
            }

            // Aguardar um momento para o estado ser atualizado
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (uploadError) {
            console.error('❌ Falha no upload Firebase:', uploadError);
            console.error('❌ DEBUG - Stack trace completo:', uploadError.stack);
            console.error('❌ DEBUG - Detalhes do erro:', {
              message: uploadError.message,
              name: uploadError.name,
              uploadSingleType: typeof uploadSingle,
              uploadSingleExists: !!uploadSingle
            });
            throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
          }
        } else {
          console.error('❌ DEBUG - uploadedFile NÃO é uma instância de File:', {
            uploadedFile,
            type: typeof uploadedFile
          });
          throw new Error('Arquivo selecionado não é válido.');
        }
      } else if ((videoType === 'b' || videoType === 'c') && inputMethod === 'url') {
        // Para input via URL, usar diretamente o valor do assetInputs
        finalInputImageUrl = assetInputs['depois'];
      }

      // Validações específicas por tipo após upload
      if (videoType === 'a' || videoType === 'd') {
        // Antes e Depois (Shotstack e FFmpeg): precisa de ambas as imagens
        if (!assetInputs['antes']) throw new Error('Informe a imagem Antes.');
        if (!assetInputs['depois']) throw new Error('Informe a imagem Depois.');
      } else if (videoType === 'b') {
        // Câmera Mágica: precisa apenas da imagem Depois
        if (!finalInputImageUrl && !assetInputs['depois']) {
          throw new Error('Informe a imagem Depois.');
        }
      } else if (videoType === 'c') {
        // Antes e Depois + Câmera Mágica: precisa de ambas as imagens
        if (!assetInputs['antes']) throw new Error('Informe a imagem Antes.');
        if (!finalInputImageUrl && !assetInputs['depois']) {
          throw new Error('Informe a imagem Depois.');
        }
      }

      // Verificar se temos URL pública válida antes de prosseguir
      if ((videoType === 'b' || videoType === 'c') && !finalInputImageUrl && !assetInputs['depois']) {
        throw new Error('URL pública da imagem não foi obtida. Tente fazer upload novamente.');
      }

      // TIPO 'd': Processar com FFmpeg e retornar direto
      if (videoType === 'd') {
        setProcessingStep('Processando vídeo com FFmpeg...');
        
        const ffmpegVideoUrl = await processFFmpegVideo(
          assetInputs['antes'],
          assetInputs['depois']
        );
        
        if (!ffmpegVideoUrl) {
          throw new Error('Falha ao processar vídeo com FFmpeg');
        }
        
        // Definir como vídeo final e salvar no Airtable
        setFinalVideoUrl(ffmpegVideoUrl);
        setProcessingStep('Vídeo gerado com sucesso!');
        setIsProcessing(false);
        
        // Salvar no Airtable
        saveVideoToAirtable(ffmpegVideoUrl);
        
        return; // Finaliza aqui, não precisa do Shotstack
      }

      // Se for Câmera Mágica ou Ambos, primeiro gera vídeo Runway
      if (videoType === 'b' || videoType === 'c') {
        setProcessingStep('Gerando vídeo com IA...');
        setRunwayLoading(true);
        setRunwayVideo(null);

        try {
          // Usar a URL Firebase ou a URL do assetInputs
          const imagemParaRunway = finalInputImageUrl || assetInputs['depois'];

          // Chama Runway com prompt atualizado
          const payload = {
            promptImage: imagemParaRunway,
            promptText: 'POV slow motion forward. Keep the original image unchanged. No new elements, no hidden areas revealed.',
            ratio: '1280:720',
            duration: 10,
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

          if (!normalized || !normalized.output || !normalized.output[0]) {
            throw new Error('Vídeo não retornado do Runway');
          }

          runwayVideoUrl = normalized.output[0];
          setRunwayVideo(normalized);


        } catch (err) {
          console.error('❌ Erro ao gerar vídeo no Runway:', err);
          setRunwayLoading(false);
          alert('Erro ao gerar vídeo no Runway: ' + (err.message || err));
          return;
        } finally {
          setRunwayLoading(false);
        }
      }

      // Monta o JSON final (passando runwayVideoUrl E finalInputImageUrl)
      let finalJson = buildFinalJson(runwayVideoUrl, finalInputImageUrl);

      // Atualizar JSON com URL do Firebase se necessário (somente para tipos A e B)
      if (finalInputImageUrl && videoType === 'b') {

        // Atualizar referências no JSON com a URL pública do Firebase
        if (finalJson.timeline && finalJson.timeline.tracks) {
          finalJson.timeline.tracks.forEach((track, trackIndex) => {
            if (track.clips) {
              track.clips.forEach((clip, clipIndex) => {
                if (clip.asset && (
                  clip.asset.src === 'MAGIC_INPUT' ||
                  (typeof clip.asset.src === 'string' && clip.asset.src.includes('blob:')) ||
                  clip.asset.src === assetInputs['depois']
                )) {
                  clip.asset.src = finalInputImageUrl;
                }
              });
            }
          });
        }
      }


      // Usa o hook para renderizar o vídeo
      setProcessingStep('Renderizando vídeo final (Shotstack)...');
      await renderVideo(finalJson);

      // O resultado será tratado via useEffect do result

    } catch (err) {
      console.error('❌ Erro ao gerar projeto:', err);
      setProcessingError(err.message || 'Erro desconhecido');
      setProcessingStep('Erro no processamento');
      setIsProcessing(false);
    }
  };

  // Função para selecionar orientação de entrada
  const handleInputOrientationClick = (orientation) => {
    setInputOrientation(orientation);
  };

  // Função para selecionar orientação de saída
  const handleOutputOrientationClick = (orientation) => {
    setOutputType(orientation);
  };

  // Função para limpar todos os campos
  const clearForm = () => {
    setAssetInputs({});
    setUploadedFile(null);
    setHasUploadedFile(false); // Reset do estado de upload
    setInputUrl('');
    // Não resetar selectedOption aqui - ele deve ser controlado pelo videoType
    setVideoType('a');
    setInputOrientation('horizontal');
    setOutputType('horizontal');
    setMagicaOrientation('horizontal');
    setInputMethod('file');
    setRunwayVideo(null);
  };

  // Validação de formulário
  const validateForm = () => {
    if (videoType === 'a' || videoType === 'd') {
      return assetInputs['antes'] && assetInputs['depois'];
    } else if (videoType === 'b') {
      return (inputMethod === 'file' && uploadedFile) ||
        (inputMethod === 'url' && inputUrl) ||
        assetInputs['depois'];
    } else if (videoType === 'c') {
      return assetInputs['antes'] &&
        ((inputMethod === 'file' && uploadedFile) ||
          (inputMethod === 'url' && inputUrl) ||
          assetInputs['depois']);
    }
    return false;
  };

  // Handler para mudança no inputUrl
  const handleInputUrlChange = (e) => {
    const url = e.target.value;
    setInputUrl(url);

    // Se estiver usando método URL, atualizar automaticamente o assetInputs
    if (inputMethod === 'url' && url) {
      setAssetInputs(prev => ({ ...prev, 'depois': url }));
    }
  };

  // Handler para mudança de método de input
  const handleInputMethodChange = (method) => {
    setInputMethod(method);

    // Limpar dados do método anterior
    if (method === 'file') {
      setInputUrl('');
      if (assetInputs['depois'] && typeof assetInputs['depois'] === 'string' && assetInputs['depois'].startsWith('http')) {
        setAssetInputs(prev => ({ ...prev, 'depois': '' }));
      }
    } else if (method === 'url') {
      setUploadedFile(null);
      if (assetInputs['depois'] instanceof File) {
        setAssetInputs(prev => ({ ...prev, 'depois': '' }));
      }
    }
  };

  // Handler para mudança de orientação da câmera mágica
  const handleMagicaOrientationClick = (orientation) => {
    setMagicaOrientation(orientation);
  };

  // useEffect para configuração inicial do usuário
  useEffect(() => {
    if (clientEmail) {
      console.log("FIZ AGORA - Iniciando busca de usuário para email:", clientEmail);
      const getUserTable = async (email) => {
        setLoading(true);
        Airtable.configure({
          apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
        });
        const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

        try {
          const records = await base('Users')
            .select({
              filterByFormula: `{Email} = "${email}"`,
              maxRecords: 1,
            })
            .firstPage();


          if (records.length > 0) {
            const userData = records[0].fields;
            return userData;
          } else {
            return null;
          }

        } catch (error) {
          return null;
        }
      }

      emailbase = clientEmail

      console.log("Buscando usuário para email:", emailbase);

      getUserTable(emailbase).then(user => {
        if (user) {
          setUserId(user['Record ID']);
          // Se client é um array (Link to another record), pegar o primeiro ID
          const clientValue = user.client;
          console.log("Client Value: ", clientValue)
          let finalClientId = null;

          if (Array.isArray(clientValue) && clientValue.length > 0) {
            finalClientId = String(clientValue[0]); // Converter para string
          } else if (clientValue) {
            finalClientId = String(clientValue); // Converter qualquer valor para string
          }

          setClientId(finalClientId);
        }
      }).catch(err => {
        console.error('Erro ao buscar usuário:', err);
      });
    }
  }, [clientEmail]);

  // Função para renderizar o conteúdo principal (reutilizado em modal e iframe)
  const renderMainContent = () => {
    return (
      <>
        {/* LOADER DE PROCESSAMENTO */}
        {isProcessing && (
          <div className={styles.processingContainer}>
            <div className={styles.processingSpinner}></div>
            <h2 className={styles.processingTitle}>Processando seu vídeo...</h2>
            <p className={styles.processingStep}>{processingStep}</p>
            <p className={styles.processingNote}>
              Este processo pode levar alguns minutos. Por favor, aguarde.
            </p>
          </div>
        )}

        {/* RESULTADO DO VÍDEO */}
        {!isProcessing && finalVideoUrl && !processingError && (
          <>
            {/* Painel Esquerdo - Sucesso e Ações */}
            <div className={styles.leftPanel}>
              <div className={styles.successContent}>
                <div className={styles.successIcon}>🎉</div>
                <h2 className={styles.successTitle}>Vídeo Pronto!</h2>
                <p className={styles.successSubtitle}>
                  Seu vídeo foi gerado com sucesso e está pronto para uso
                </p>

                <div className={styles.videoActions}>
                  <a
                    href={finalVideoUrl}
                    download
                    className={`${styles.videoActionButton} ${styles.primary}`}
                  >
                    📥 Baixar Vídeo
                  </a>
                  <button
                    className={styles.videoActionButton}
                    onClick={() => {
                      setIsProcessing(false);
                      setFinalVideoUrl(null);
                      setProcessingError(null);
                      setProcessingStep('');
                      // Limpar upload se houver
                      if (hasUploadedFile) {
                        handleRemoveUpload();
                      }
                    }}
                  >
                    🔄 Criar Novo Vídeo
                  </button>
                </div>
              </div>
            </div>

            {/* Painel Direito - Player do Vídeo */}
            <div className={styles.rightPanel}>
              <div className={styles.videoPlayerContainer}>
                <video
                  className={styles.videoPlayer}
                  controls
                  autoPlay
                  muted
                  src={finalVideoUrl}
                >
                  Seu navegador não suporta reprodução de vídeos.
                </video>
                <div className={styles.videoInfo}>
                  <p className={styles.videoUrl}>
                    <span>URL:</span> {finalVideoUrl}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ERRO DE PROCESSAMENTO */}
        {!isProcessing && processingError && (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Erro no Processamento</h2>
            <p className={styles.errorMessage}>{processingError}</p>
            <button
              className={styles.errorButton}
              onClick={() => {
                setIsProcessing(false);
                setFinalVideoUrl(null);
                setProcessingError(null);
                setProcessingStep('');
              }}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        )}

        {/* FORMULÁRIO PRINCIPAL (estado normal) */}
        {!isProcessing && !finalVideoUrl && !processingError && (
          <>
            {/* Painel Esquerdo - Minhas Produções */}
            <div className={styles.leftPanel}>
              <div className={styles.productionsHeader}>
                <h2 className={styles.productionsTitle}>Minhas Produções</h2>
                <p className={styles.productionsSubtitle}>
                  Selecione uma propriedade para usar suas imagens
                </p>
              </div>
              <div className={`${styles.productionsContent} ${hasUploadedFile ? styles.disabled : ''}`}>
                {hasUploadedFile && (
                  <div className={styles.disabledOverlay}>
                    <div className={styles.disabledMessage}>
                      <span className={styles.disabledIcon}>📁</span>
                      <p>Arquivo carregado!</p>
                      <p className={styles.disabledSubtext}>
                        Para usar "Minhas Produções", remova o arquivo uploadado primeiro.
                      </p>
                    </div>
                  </div>
                )}
                <MyProductions
                  softrEmail={clientEmail}
                  onImageSelected={handlePropertySelected}
                  autoLoad={true}
                />
              </div>
            </div>

            {/* Painel Direito - Formulário */}
            <div className={styles.rightPanel}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Configuração do Vídeo</h2>
                <p className={styles.formSubtitle}>
                  Configure o tipo de vídeo e adicione suas imagens
                </p>
              </div>
              <div className={styles.formContent}>
                {/* Status do Shotstack */}
                {result && (
                  <ShotstackStatusDisplay
                    renderData={result}
                    renderStatus={renderStatus}
                  />
                )}

                {/* Seleção do Tipo de Vídeo */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Tipo de Vídeo</h3>
                  <div className={styles.videoTypeGrid}>
                    {/* Primeira linha - 2 botões */}
                    <button
                      className={`${styles.videoTypeButton} ${videoType === 'a' ? styles.active : ''}`}
                      onClick={() => setVideoType('a')}
                      type="button"
                    >
                      <div className={styles.videoTypeGif}>
                        <img
                          src="https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/46f8d723-7519-4276-ab1e-e4a5c0dcff9e.gif"
                          alt="Antes e Depois"
                          className={styles.gifPreview}
                          crossOrigin="anonymous"
                          style={{ animationPlayState: 'paused' }}
                          onMouseEnter={(e) => {
                            e.target.style.animationPlayState = 'running';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.animationPlayState = 'paused';
                          }}
                        />
                      </div>
                      <div className={styles.videoTypeLabel}>Antes e Depois</div>
                    </button>

                    <button
                      className={`${styles.videoTypeButton} ${videoType === 'b' ? styles.active : ''}`}
                      onClick={() => setVideoType('b')}
                      type="button"
                    >
                      <div className={styles.videoTypeGif}>
                        <img
                          src="https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/165f9630-a9c3-41d9-8bb8-e009bbd5b10e.gif"
                          alt="Câmera Mágica"
                          className={styles.gifPreview}
                          crossOrigin="anonymous"
                          style={{ animationPlayState: 'paused' }}
                          onMouseEnter={(e) => {
                            e.target.style.animationPlayState = 'running';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.animationPlayState = 'paused';
                          }}
                        />
                      </div>
                      <div className={styles.videoTypeLabel}>Câmera Mágica</div>
                    </button>

                    {/* Segunda linha - 2 botões */}
                    <button
                      className={`${styles.videoTypeButton} ${videoType === 'd' ? styles.active : ''}`}
                      onClick={() => setVideoType('d')}
                      type="button"
                    >
                      <div className={styles.videoTypeGif}>
                        <img
                          src="https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/46f8d723-7519-4276-ab1e-e4a5c0dcff9e.gif"
                          alt="Antes e Depois FFmpeg"
                          className={styles.gifPreview}
                          crossOrigin="anonymous"
                          style={{ animationPlayState: 'paused' }}
                          onMouseEnter={(e) => {
                            e.target.style.animationPlayState = 'running';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.animationPlayState = 'paused';
                          }}
                        />
                      </div>
                      <div className={styles.videoTypeLabel}>Antes e Depois FFmpeg</div>
                    </button>

                    <button
                      className={`${styles.videoTypeButton} ${videoType === 'c' ? styles.active : ''}`}
                      onClick={() => setVideoType('c')}
                      type="button"
                    >
                      <div className={styles.videoTypeGif}>
                        <img
                          src="https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/9a013933-d6ab-440e-a424-a7de1e49fc43.gif"
                          alt="Ambos"
                          className={styles.gifPreview}
                          crossOrigin="anonymous"
                          style={{ animationPlayState: 'paused' }}
                          onMouseEnter={(e) => {
                            e.target.style.animationPlayState = 'running';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.animationPlayState = 'paused';
                          }}
                        />
                      </div>
                      <div className={styles.videoTypeLabel}>Ambos</div>
                    </button>
                  </div>
                </div>

                {/* Orientação de Saída - Apenas para imagens horizontais */}
                {((inputOrientation === 'horizontal' && (videoType === 'a' || videoType === 'c' || videoType === 'd')) ||
                  (magicaOrientation === 'horizontal' && videoType === 'b')) && (
                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>Formato do Vídeo Final</h3>
                      <p className={styles.sectionDescription}>
                        Como sua imagem é horizontal, você pode escolher o formato de saída:
                      </p>
                      <div className={styles.orientationGroup}>
                        <div className={styles.orientationButtons}>
                          <button
                            className={`${styles.orientationButton} ${outputType === 'horizontal' ? styles.active : ''}`}
                            onClick={() => handleOutputOrientationClick('horizontal')}
                            type="button"
                            style={{ fontWeight: 'bold' }}
                          >
                            🎬 Horizontal (16:9)
                          </button>
                          <button
                            className={`${styles.orientationButton} ${outputType === 'vertical' ? styles.active : ''}`}
                            onClick={() => handleOutputOrientationClick('vertical')}
                            type="button"
                            style={{ fontWeight: 'bold' }}
                          >
                            📱 Vertical (9:16)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Upload de Imagens */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Imagens</h3>

                  {/* Imagem Antes (para tipos 'a', 'c' e 'd' - Antes e Depois, Ambos e FFmpeg) */}
                  {(videoType === 'a' || videoType === 'c' || videoType === 'd') && (
                    <div className={styles.imageUploadGroup}>
                      <label className={styles.imageLabel}>
                        Imagem ANTES:
                        <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.imageUploadContainer}>
                        <div className={styles.imageStatusIndicator}>
                          {assetInputs['antes'] ? (
                            <span className={styles.imageLoaded}>
                              ✅ Imagem carregada da propriedade selecionada
                            </span>
                          ) : (
                            <span className={styles.imageNotLoaded}>
                              📷 Selecione uma propriedade para carregar a imagem
                            </span>
                          )}
                        </div>
                        {assetInputs['antes'] && (
                          <div className={styles.imagePreview}>
                            <img
                              src={assetInputs['antes']}
                              alt="Preview Antes"
                              className={styles.previewImage}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Imagem Depois (para todos os tipos - Antes e Depois + Câmera Mágica + Ambos) */}
                  <div className={styles.imageUploadGroup}>
                    <label className={styles.imageLabel}>
                      Imagem DEPOIS:
                      <span className={styles.required}>*</span>
                    </label>

                    <div className={styles.imageUploadContainer}>
                      {/* Upload por arquivo - Apenas para tipo 'b' */}
                      {videoType === 'b' ? (
                        <div className={styles.fileUploadArea}>
                          {uploadedFile ? (
                            <div className={styles.uploadedFileWrapper}>
                              <div className={styles.uploadedFileContainer}>
                                <div className={styles.uploadedFileInfo}>
                                  <span className={styles.fileName}>✅ {uploadedFile.name}</span>
                                </div>
                              </div>
                              <div className={styles.removeButtonWrapper}>
                                <button
                                  type="button"
                                  className={styles.removeFileButton}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveUpload(e);
                                    return false;
                                  }}
                                  title="Remover arquivo"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                                className={styles.fileInput}
                                id="fileUpload"
                              />
                              <label htmlFor="fileUpload" className={styles.fileUploadLabel}>
                                <span>📁 Clique para selecionar imagem</span>
                              </label>
                            </>
                          )}
                        </div>
                      ) : videoType === 'c' ? (
                        /* Indicador de Status da Imagem - para tipo 'c' (Ambos) */
                        <div className={styles.imageStatusIndicator}>
                          {assetInputs['depois'] ? (
                            <span className={styles.imageLoaded}>
                              ✅ Imagem carregada da propriedade selecionada
                            </span>
                          ) : (
                            <span className={styles.imageNotLoaded}>
                              📷 Selecione uma propriedade para carregar a imagem
                            </span>
                          )}
                        </div>
                      ) : videoType === 'a' || videoType === 'd' ? (
                        /* Indicador de Status para tipo 'a' e 'd' */
                        <div className={styles.imageStatusIndicator}>
                          {assetInputs['depois'] ? (
                            <span className={styles.imageLoaded}>
                              ✅ Imagem carregada da propriedade selecionada
                            </span>
                          ) : (
                            <span className={styles.imageNotLoaded}>
                              📷 Selecione uma propriedade para carregar a imagem
                            </span>
                          )}
                        </div>
                      ) : null}

                      {/* Preview da imagem */}
                      {(assetInputs['depois'] && !assetInputs['depois'].toString().includes('blob:')) && (
                        <div className={styles.imagePreview}>
                          <img
                            src={assetInputs['depois']}
                            alt="Preview Depois"
                            className={styles.previewImage}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aviso para imagens verticais */}
                {((inputOrientation === 'vertical' && (videoType === 'a' || videoType === 'c' || videoType === 'd')) ||
                  (magicaOrientation === 'vertical' && videoType === 'b')) && (
                    <div className={styles.formSection}>
                      <div className={styles.orientationInfo}>
                        <div className={styles.infoIcon}>📱</div>
                        <div className={styles.infoContent}>
                          <h4 className={styles.infoTitle}>Formato Vertical Detectado</h4>
                          <p className={styles.infoText}>
                            Sua imagem é vertical, então o vídeo final será automaticamente no formato vertical (9:16)
                            para melhor qualidade e proporção.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Status do Runway - Só renderiza se houver conteúdo */}
                {(videoType === 'b' || videoType === 'c') && (runwayLoading || (runwayVideo && runwayVideo.output && runwayVideo.output[0])) && (
                  <div className={styles.formSection}>
                    {runwayLoading && (
                      <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Gerando vídeo com IA...</p>
                      </div>
                    )}

                    {runwayVideo && runwayVideo.output && runwayVideo.output[0] && (
                      <div className={styles.videoPreview}>
                        <h4>Vídeo Gerado:</h4>
                        <video
                          src={runwayVideo.output[0]}
                          controls
                          className={styles.previewVideo}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className={styles.actionButtons}>
                  <button
                    className={styles.clearButton}
                    onClick={clearForm}
                    type="button"
                  >
                    🗑️ Limpar Formulário
                  </button>

                  <button
                    className={`${styles.generateButton} ${!validateForm() || isLoading ? styles.disabled : ''}`}
                    onClick={handleGenerateProject}
                    disabled={!validateForm() || isLoading}
                    type="button"
                  >
                    {isLoading ? (
                      <>⏳ Gerando...</>
                    ) : (
                      <>🚀 Gerar Vídeo</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  // Renderização sem modal - ocupando toda a página
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.modalTitle}>
            <span style={{ color: '#68bf6c' }}>RUUM</span> MagicMotion
          </h1>
          <p className={styles.modalSubtitle}>
            Vídeos feitos a partir de imagens para engajar e gerar leads
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className={styles.modalContent}>
        {renderMainContent()}
      </div>
    </div>
  );
};

export default RunwayShotstackAuto;