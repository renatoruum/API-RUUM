/**
 * Exemplos de uso da API Imagen Staging no Frontend
 * 
 * Demonstra como chamar os endpoints do frontend/React
 */

// ============================================
// EXEMPLO 1: Pipeline Completo (Recomendado)
// ============================================

async function generateVirtualStaging(imageUrl, clientName = 'default', designStyle = 'contemporary_minimalist') {
  try {
    console.log('🚀 Iniciando virtual staging...');
    console.log('🎨 Estilo:', designStyle);

    const response = await fetch('https://apiruum-667905204535.us-central1.run.app/api/imagen-staging/full-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        aspect_ratio: '16:9',
        upload_to_firebase: true,
        client_name: clientName,
        design_style: designStyle,
        negative_prompt: 'distorted furniture, unrealistic shadows, obstructed doors, blocked windows'
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerar staging');
    }

    // Verificar se passou na verificação
    if (result.data.verification.passed) {
      console.log('✅ Virtual staging OK!');
      return {
        success: true,
        imageUrl: result.data.firebase_url,
        layoutDescription: result.data.layout_description,
        processingTime: result.data.metadata.processingTime
      };
    } else {
      console.warn('⚠️ Virtual staging com avisos');
      console.warn('Problemas detectados:', result.data.verification.checks);
      
      return {
        success: true,
        warning: true,
        imageUrl: result.data.firebase_url,
        issues: result.data.verification.checks,
        layoutDescription: result.data.layout_description
      };
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Uso:
// const result = await generateVirtualStaging(
//   'https://example.com/empty-room.jpg',
//   'meu-cliente'
// );


// ============================================
// EXEMPLO 2: React Component Completo
// ============================================

import React, { useState } from 'react';

function VirtualStagingGenerator() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [designStyle, setDesignStyle] = useState('contemporary_minimalist');

  const availableStyles = [
    { key: 'contemporary_minimalist', name: 'Contemporary Minimalist (Padrão)' },
    { key: 'modern', name: 'Modern' },
    { key: 'scandinavian', name: 'Scandinavian' },
    { key: 'industrial', name: 'Industrial' },
    { key: 'bohemian', name: 'Bohemian' },
    { key: 'luxury', name: 'Luxury' },
    { key: 'coastal', name: 'Coastal' },
    { key: 'midcentury', name: 'Mid-Century Modern' }
  ];

  const handleGenerate = async () => {
    if (!imageUrl) {
      setError('Por favor, insira uma URL de imagem');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://apiruum-667905204535.us-central1.run.app/api/imagen-staging/full-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: imageUrl,
          aspect_ratio: '16:9',
          upload_to_firebase: true,
          client_name: 'react-app',
          design_style: designStyle
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Erro desconhecido');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="virtual-staging-generator">
      <h2>Virtual Staging com Imagen 3</h2>
      
      <div className="input-group">
        <input
          type="text"
          placeholder="URL da imagem do cômodo vazio"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
        />
        
        <select 
          value={designStyle} 
          onChange={(e) => setDesignStyle(e.target.value)}
          disabled={loading}
        >
          {availableStyles.map(style => (
            <option key={style.key} value={style.key}>
              {style.name}
            </option>
          ))}
        </select>
        
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Processando...' : 'Gerar Staging'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processando (pode levar 30-50 segundos)...</p>
          <p>⏳ Agentes trabalhando: Análise → Geração → Verificação</p>
        </div>
      )}

      {error && (
        <div className="error">
          ❌ Erro: {error}
        </div>
      )}

      {result && (
        <div className="result">
          <h3>Resultado</h3>
          
          {/* Status da verificação */}
          {result.verification.passed ? (
            <div className="success">
              ✅ Verificação passou - Imagem de alta qualidade!
            </div>
          ) : (
            <div className="warning">
              ⚠️ Avisos detectados na verificação:
              <ul>
                {Object.entries(result.verification.checks).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Imagem gerada */}
          <div className="images">
            <div className="image-container">
              <h4>Original</h4>
              <img src={imageUrl} alt="Original" />
            </div>
            <div className="image-container">
              <h4>Virtual Staging</h4>
              <img src={result.firebase_url} alt="Staging" />
            </div>
          </div>

          {/* Metadados */}
          <div className="metadata">
            <p><strong>Tempo de processamento:</strong> {result.metadata.processingTime}</p>
            <p><strong>URL Firebase:</strong> <a href={result.firebase_url} target="_blank">{result.firebase_url}</a></p>
          </div>

          {/* Descrição do layout */}
          <details>
            <summary>Ver descrição do layout</summary>
            <pre>{result.layout_description}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default VirtualStagingGenerator;


// ============================================
// EXEMPLO 3: Workflow Customizado (Agentes Separados)
// ============================================

async function customWorkflow(imageUrl) {
  const API_BASE = 'https://apiruum-667905204535.us-central1.run.app/api/imagen-staging';

  // PASSO 1: Analisar layout
  console.log('🔍 Analisando layout...');
  const layoutResponse = await fetch(`${API_BASE}/analyze-layout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl })
  });
  const layoutData = await layoutResponse.json();
  let layoutDescription = layoutData.data.layoutDescription;

  // PASSO 1.5: Customizar o layout antes de gerar
  console.log('✏️ Customizando layout...');
  layoutDescription += "\n\nAdditional requirements:\n- Add tropical plants in corners\n- Include artwork on main wall\n- Use light wood furniture";

  // PASSO 2: Gerar imagem customizada
  console.log('🎨 Gerando imagem...');
  const generateResponse = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      layout_description: layoutDescription,
      aspect_ratio: '16:9',
      negative_prompt: 'dark colors, heavy furniture, cluttered space'
    })
  });
  const generatedData = await generateResponse.json();

  // PASSO 3: Verificar qualidade
  console.log('✅ Verificando qualidade...');
  const verifyResponse = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_image_url: imageUrl,
      generated_image_base64: generatedData.data.image_base64
    })
  });
  const verifyData = await verifyResponse.json();

  return {
    imageBase64: generatedData.data.image_base64,
    mimeType: generatedData.data.mime_type,
    verificationPassed: verifyData.data.passed,
    verificationChecks: verifyData.data.checks
  };
}


// ============================================
// EXEMPLO 4: Upload de arquivo local
// ============================================

async function stagingFromFileUpload(fileInput) {
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Selecione uma imagem');
    return;
  }

  // Primeiro, fazer upload da imagem para obter URL
  const formData = new FormData();
  formData.append('image', file);
  formData.append('clientName', 'my-client');

  const uploadResponse = await fetch('https://apiruum-667905204535.us-central1.run.app/api/firebase/upload/single', {
    method: 'POST',
    body: formData
  });

  const uploadData = await uploadResponse.json();
  
  if (!uploadData.success) {
    throw new Error('Erro no upload');
  }

  const imageUrl = uploadData.data.url;

  // Agora usar essa URL para gerar staging
  return await generateVirtualStaging(imageUrl, 'my-client');
}


// ============================================
// EXEMPLO 5: Batch Processing (múltiplas imagens)
// ============================================

async function batchVirtualStaging(imageUrls, clientName) {
  console.log(`📦 Processando ${imageUrls.length} imagens...`);
  
  const results = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    console.log(`\n[${i + 1}/${imageUrls.length}] Processando: ${imageUrl}`);
    
    try {
      const result = await generateVirtualStaging(imageUrl, clientName);
      results.push({
        original: imageUrl,
        success: result.success,
        staged: result.imageUrl,
        warning: result.warning || false
      });
      
      // Pequeno delay entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Erro na imagem ${i + 1}:`, error);
      results.push({
        original: imageUrl,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('\n✅ Batch completo!');
  console.log(`Sucesso: ${results.filter(r => r.success).length}/${results.length}`);
  
  return results;
}

// Uso:
// const urls = [
//   'https://example.com/room1.jpg',
//   'https://example.com/room2.jpg',
//   'https://example.com/room3.jpg'
// ];
// const results = await batchVirtualStaging(urls, 'meu-cliente');


// ============================================
// EXEMPLO 6: Polling com feedback visual
// ============================================

async function stagingWithProgress(imageUrl, onProgress) {
  const stages = [
    { name: 'Analisando layout', progress: 33 },
    { name: 'Gerando imagem', progress: 66 },
    { name: 'Verificando qualidade', progress: 90 },
    { name: 'Finalizando', progress: 100 }
  ];

  let currentStage = 0;

  // Simula progresso (já que a API não tem streaming)
  const progressInterval = setInterval(() => {
    if (currentStage < stages.length - 1) {
      currentStage++;
      onProgress(stages[currentStage]);
    }
  }, 15000); // Atualiza a cada 15s

  try {
    const result = await generateVirtualStaging(imageUrl);
    clearInterval(progressInterval);
    onProgress({ name: 'Concluído', progress: 100 });
    return result;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

// Uso:
// await stagingWithProgress('https://example.com/room.jpg', (stage) => {
//   console.log(`${stage.name}: ${stage.progress}%`);
//   // Atualizar UI com progresso
// });


// ============================================
// EXEMPLO 7: Listar estilos disponíveis dinamicamente
// ============================================

async function loadAvailableStyles() {
  const response = await fetch('https://apiruum-667905204535.us-central1.run.app/api/imagen-staging/models');
  const data = await response.json();
  
  if (data.success) {
    const styles = Object.values(data.data.design_styles);
    console.log('Estilos disponíveis:', styles);
    
    // Retorna array formatado para usar em select
    return styles.map(style => ({
      value: style.key,
      label: style.name,
      description: style.description
    }));
  }
  
  return [];
}

// Uso em React:
function StyleSelector({ onStyleSelect, selectedStyle }) {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableStyles().then(availableStyles => {
      setStyles(availableStyles);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando estilos...</div>;

  return (
    <div className="style-selector">
      <h3>Escolha o Estilo de Design</h3>
      <div className="styles-grid">
        {styles.map(style => (
          <div 
            key={style.value}
            className={`style-card ${selectedStyle === style.value ? 'selected' : ''}`}
            onClick={() => onStyleSelect(style.value)}
          >
            <h4>{style.label}</h4>
            <p>{style.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================
// ESTILOS CSS RECOMENDADOS
// ============================================

const styles = `
.virtual-staging-generator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-group input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.input-group button {
  padding: 10px 20px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  background: #f5f5f5;
  border-radius: 8px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success {
  padding: 15px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.warning {
  padding: 15px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error {
  padding: 15px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.image-container img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.metadata {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

details {
  margin-top: 20px;
}

details pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}

.style-selector {
  margin: 20px 0;
}

.styles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.style-card {
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.style-card:hover {
  border-color: #0066cc;
  box-shadow: 0 2px 8px rgba(0,102,204,0.2);
}

.style-card.selected {
  border-color: #0066cc;
  background: #e3f2fd;
}

.style-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.style-card p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
`;

export {
  generateVirtualStaging,
  customWorkflow,
  stagingFromFileUpload,
  batchVirtualStaging,
  stagingWithProgress,
  VirtualStagingGenerator,
  loadAvailableStyles,
  StyleSelector
};
