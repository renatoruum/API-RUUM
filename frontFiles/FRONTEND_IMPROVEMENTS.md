# 🔧 Melhorias Sugeridas para o Front-end

## ❌ Problema Identificado

O erro `Cannot find ffmpeg` ocorreu porque:
1. ✅ O Dockerfile **não estava instalando o FFmpeg** (JÁ CORRIGIDO)
2. ⚠️ O tratamento de erro no front-end pode ser melhorado

---

## 📝 Melhorias Recomendadas no `RunwayShotstackAuto.js`

### **1. Melhorar tratamento de erro no `pollFFmpegStatus`**

#### ❌ Código Atual (Linha ~196-240):
```javascript
const pollFFmpegStatus = async (renderId) => {
  const maxAttempts = 90;
  const pollInterval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/status/${renderId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const status = await response.json();
      
      // ... resto do código
      
    } catch (error) {
      console.warn('⚠️ Erro no polling, tentando novamente...', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Timeout: processamento FFmpeg excedeu o tempo máximo');
};
```

#### ✅ Código Melhorado:
```javascript
const pollFFmpegStatus = async (renderId) => {
  const maxAttempts = 90; // 3 minutos
  const pollInterval = 2000; // 2 segundos
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/status/${renderId}`
      );
      
      // ✅ Verificar se a resposta é OK antes de fazer parse
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      // ✅ Parse seguro do JSON
      let status;
      try {
        status = await response.json();
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        throw new Error('Resposta inválida do servidor');
      }

      // ✅ Resetar contador de erros consecutivos
      consecutiveErrors = 0;
      
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
        const errorMsg = status.error || 'Falha no processamento FFmpeg';
        console.error('❌ Processamento falhou:', errorMsg);
        throw new Error(errorMsg);
      }

      // Aguardar antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      consecutiveErrors++;
      
      console.warn(`⚠️ Erro no polling (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);
      
      // ✅ Se muitos erros consecutivos, parar
      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error(
          `Falha após ${maxConsecutiveErrors} tentativas: ${error.message}`
        );
      }
      
      // Aguardar mais tempo em caso de erro
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('Timeout: processamento FFmpeg excedeu 3 minutos');
};
```

---

### **2. Melhorar tratamento de erro no `processFFmpegVideo`**

#### ✅ Código Melhorado:
```javascript
const processFFmpegVideo = async (beforeUrl, afterUrl) => {
  try {
    setProcessingStep('Iniciando processamento FFmpeg...');
    
    console.log('🎬 Enviando requisição FFmpeg:', {
      beforeUrl,
      afterUrl,
      clientName: clientName || 'cliente-ruum'
    });
    
    // 1. Chamar endpoint para iniciar processamento
    const response = await fetch(
      'https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/before-after',
      {
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
      }
    );

    // ✅ Verificar resposta antes de fazer parse
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao iniciar processamento:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    // ✅ Parse seguro do JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError);
      throw new Error('Resposta inválida do servidor ao iniciar processamento');
    }

    // ✅ Validar se recebeu renderId
    if (!data.renderId) {
      console.error('❌ Resposta sem renderId:', data);
      throw new Error('Servidor não retornou ID de renderização');
    }

    console.log('🎬 Processamento FFmpeg iniciado:', data.renderId);

    // 2. Fazer polling do status
    const videoUrl = await pollFFmpegStatus(data.renderId);
    return videoUrl;

  } catch (error) {
    console.error('❌ Erro no processamento FFmpeg:', error);
    setProcessingError(error.message);
    throw error;
  }
};
```

---

### **3. Adicionar Timeout Global**

```javascript
// No topo do componente, adicionar função helper
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Requisição excedeu o tempo limite');
    }
    throw error;
  }
};

// Usar no lugar de fetch:
const response = await fetchWithTimeout(
  'https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/before-after',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... })
  },
  30000 // 30 segundos timeout
);
```

---

### **4. Adicionar Indicador Visual de Erro**

No JSX, adicionar exibição do erro:

```javascript
{processingError && (
  <div className={styles.errorContainer}>
    <span className={styles.errorIcon}>⚠️</span>
    <div className={styles.errorMessage}>
      <strong>Erro no processamento:</strong>
      <p>{processingError}</p>
    </div>
    <button 
      onClick={() => setProcessingError(null)}
      className={styles.dismissButton}
    >
      Fechar
    </button>
  </div>
)}
```

---

## 🚀 Deploy Corrigido

### **Passos para Resolver o Problema Atual:**

1. ✅ **Dockerfile atualizado** (FFmpeg instalado)
   ```dockerfile
   RUN apk add --no-cache ffmpeg
   ```

2. ✅ **Commit realizado**

3. 🔄 **Fazer novo deploy:**
   ```bash
   ./deploy.sh
   ```

4. ✅ **Testar após deploy:**
   ```bash
   curl https://apiruum-2cpzkgiiia-uc.a.run.app/api/ffmpeg/before-after \
     -H "Content-Type: application/json" \
     -d '{
       "beforeUrl": "https://picsum.photos/1280/720?random=1",
       "afterUrl": "https://picsum.photos/1280/720?random=2",
       "clientName": "teste-producao"
     }'
   ```

---

## 📊 Verificar Logs do Cloud Run

Após o deploy, você pode verificar se o FFmpeg foi instalado corretamente:

```bash
gcloud run services logs read apiruum --region=us-central1 --limit=50
```

Procure por:
```
✅ Máscara encontrada: /app/assets/masks/before_after_mask.mp4
📦 Tamanho da máscara: 0.09 MB
✅ FFmpeg Service inicializado
```

---

## 🎯 Resumo

### **Problema:**
- ❌ FFmpeg não estava instalado no container Docker
- ❌ Tratamento de erro no front-end não mostrava mensagem clara

### **Solução:**
- ✅ Instalado FFmpeg no Dockerfile: `RUN apk add --no-cache ffmpeg`
- ✅ Melhorias sugeridas para tratamento de erro no front-end

### **Próximos Passos:**
1. Fazer deploy com `./deploy.sh`
2. Testar endpoint em produção
3. Aplicar melhorias sugeridas no front-end (opcional, mas recomendado)
