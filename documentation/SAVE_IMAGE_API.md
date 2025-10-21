# API - Save Image Documentation

## 📖 Visão Geral

A API `/save-image` permite salvar uma única imagem no Airtable e retornar a URL pública. Aceita tanto upload de arquivos quanto URLs de imagens.

## 🔗 Endpoint

```
POST /api/save-image
```

## 📋 Parâmetros

### Opção 1: Upload de Arquivo (FormData)
- **`image`** (file, obrigatório): Arquivo de imagem
- **`clientId`** (string, obrigatório): ID do cliente no Airtable (ex: "recCLIENT123456789")
- **`tableName`** (string, obrigatório): Nome da tabela do Airtable (ex: "Images")

### Opção 2: URL da Imagem (JSON)
- **`imageUrl`** (string, obrigatório): URL da imagem
- **`clientId`** (string, obrigatório): ID do cliente no Airtable
- **`tableName`** (string, obrigatório): Nome da tabela do Airtable

## 📏 Limitações

- **Tamanho máximo**: 10MB por arquivo
- **Tipos aceitos**: Apenas imagens (`image/*`)
- **Máximo de arquivos**: 1 arquivo por request

## 🚀 Exemplos de Uso

### 1. Upload de Arquivo com JavaScript Vanilla

```html
<!DOCTYPE html>
<html>
<head>
    <title>Upload de Imagem - Ruum API</title>
</head>
<body>
    <form id="uploadForm">
        <input type="file" id="imageInput" accept="image/*" required>
        <input type="text" id="clientId" placeholder="Client ID" value="recCLIENT123456789" required>
        <input type="text" id="tableName" placeholder="Nome da Tabela" value="Images" required>
        <button type="submit">Enviar Imagem</button>
    </form>

    <div id="result"></div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('imageInput');
            const clientId = document.getElementById('clientId').value;
            const tableName = document.getElementById('tableName').value;
            const resultDiv = document.getElementById('result');
            
            if (!fileInput.files[0]) {
                alert('Selecione uma imagem');
                return;
            }
            
            // Criar FormData
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('clientId', clientId);
            formData.append('tableName', tableName);
            
            try {
                resultDiv.innerHTML = '<p>Enviando...</p>';
                
                const response = await fetch('/api/save-image', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ruum-api-secure-token-2024'
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `
                        <h3>✅ Sucesso!</h3>
                        <p><strong>Record ID:</strong> ${data.data.recordId}</p>
                        <p><strong>URL Pública:</strong> <a href="${data.data.publicUrl}" target="_blank">${data.data.publicUrl}</a></p>
                        <p><strong>Nome do Arquivo:</strong> ${data.data.fileName}</p>
                        <p><strong>Tamanho:</strong> ${Math.round(data.data.fileSize / 1024)} KB</p>
                        <p><strong>Tipo:</strong> ${data.data.mimeType}</p>
                        <img src="${data.data.publicUrl}" style="max-width: 300px; margin-top: 10px;">
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <h3>❌ Erro!</h3>
                        <p>${data.message}</p>
                        <p><strong>Detalhes:</strong> ${data.error}</p>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <h3>❌ Erro de Rede!</h3>
                    <p>${error.message}</p>
                `;
            }
        });
    </script>
</body>
</html>
```

### 2. Upload com React

```jsx
import React, { useState } from 'react';

const ImageUploader = () => {
    const [file, setFile] = useState(null);
    const [clientId, setClientId] = useState('recCLIENT123456789');
    const [tableName, setTableName] = useState('Images');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            alert('Selecione uma imagem');
            return;
        }

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('clientId', clientId);
        formData.append('tableName', tableName);

        try {
            const response = await fetch('/api/save-image', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ruum-api-secure-token-2024'
                },
                body: formData
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                message: 'Erro de rede',
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Upload de Imagem - Ruum API</h2>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Selecionar Imagem:</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                </div>
                
                <div>
                    <label>Client ID:</label>
                    <input 
                        type="text" 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label>Nome da Tabela:</label>
                    <input 
                        type="text" 
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Imagem'}
                </button>
            </form>

            {result && (
                <div style={{ marginTop: '20px' }}>
                    {result.success ? (
                        <div>
                            <h3>✅ Sucesso!</h3>
                            <p><strong>Record ID:</strong> {result.data.recordId}</p>
                            <p><strong>URL Pública:</strong> 
                                <a href={result.data.publicUrl} target="_blank" rel="noopener noreferrer">
                                    {result.data.publicUrl}
                                </a>
                            </p>
                            <p><strong>Nome do Arquivo:</strong> {result.data.fileName}</p>
                            <p><strong>Tamanho:</strong> {Math.round(result.data.fileSize / 1024)} KB</p>
                            <img 
                                src={result.data.publicUrl} 
                                alt="Uploaded" 
                                style={{ maxWidth: '300px', marginTop: '10px' }}
                            />
                        </div>
                    ) : (
                        <div>
                            <h3>❌ Erro!</h3>
                            <p>{result.message}</p>
                            {result.error && <p><strong>Detalhes:</strong> {result.error}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
```

### 3. Upload com Vue.js

```vue
<template>
  <div>
    <h2>Upload de Imagem - Ruum API</h2>
    
    <form @submit.prevent="handleSubmit">
      <div>
        <label>Selecionar Imagem:</label>
        <input 
          type="file" 
          accept="image/*"
          @change="handleFileChange"
          required
        />
      </div>
      
      <div>
        <label>Client ID:</label>
        <input 
          v-model="clientId" 
          type="text" 
          required
        />
      </div>
      
      <div>
        <label>Nome da Tabela:</label>
        <input 
          v-model="tableName" 
          type="text" 
          required
        />
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar Imagem' }}
      </button>
    </form>

    <div v-if="result" class="result">
      <div v-if="result.success">
        <h3>✅ Sucesso!</h3>
        <p><strong>Record ID:</strong> {{ result.data.recordId }}</p>
        <p><strong>URL Pública:</strong> 
          <a :href="result.data.publicUrl" target="_blank">
            {{ result.data.publicUrl }}
          </a>
        </p>
        <p><strong>Nome do Arquivo:</strong> {{ result.data.fileName }}</p>
        <p><strong>Tamanho:</strong> {{ Math.round(result.data.fileSize / 1024) }} KB</p>
        <img 
          :src="result.data.publicUrl" 
          alt="Uploaded" 
          style="max-width: 300px; margin-top: 10px;"
        />
      </div>
      
      <div v-else>
        <h3>❌ Erro!</h3>
        <p>{{ result.message }}</p>
        <p v-if="result.error"><strong>Detalhes:</strong> {{ result.error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageUploader',
  data() {
    return {
      file: null,
      clientId: 'recCLIENT123456789',
      tableName: 'Images',
      result: null,
      loading: false
    }
  },
  methods: {
    handleFileChange(event) {
      this.file = event.target.files[0];
    },
    
    async handleSubmit() {
      if (!this.file) {
        alert('Selecione uma imagem');
        return;
      }

      this.loading = true;
      this.result = null;

      const formData = new FormData();
      formData.append('image', this.file);
      formData.append('clientId', this.clientId);
      formData.append('tableName', this.tableName);

      try {
        const response = await fetch('/api/save-image', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ruum-api-secure-token-2024'
          },
          body: formData
        });

        this.result = await response.json();
      } catch (error) {
        this.result = {
          success: false,
          message: 'Erro de rede',
          error: error.message
        };
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

### 4. Envio de URL (sem upload de arquivo)

```javascript
// Exemplo com URL de imagem
const saveImageFromUrl = async () => {
    try {
        const response = await fetch('/api/save-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ruum-api-secure-token-2024'
            },
            body: JSON.stringify({
                imageUrl: 'https://example.com/image.jpg',
                clientId: 'recCLIENT123456789',
                tableName: 'Images'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('URL pública:', data.data.publicUrl);
        } else {
            console.error('Erro:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
    }
};
```

### 5. Exemplo com Axios

```javascript
import axios from 'axios';

// Upload de arquivo
const uploadImageWithAxios = async (file, clientId, tableName) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('clientId', clientId);
    formData.append('tableName', tableName);
    
    try {
        const response = await axios.post('/api/save-image', formData, {
            headers: {
                'Authorization': 'Bearer ruum-api-secure-token-2024',
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            // Erro da API
            throw new Error(error.response.data.message || 'Erro na API');
        } else {
            // Erro de rede
            throw new Error('Erro de conexão');
        }
    }
};

// URL de imagem
const saveImageUrlWithAxios = async (imageUrl, clientId, tableName) => {
    try {
        const response = await axios.post('/api/save-image', {
            imageUrl,
            clientId,
            tableName
        }, {
            headers: {
                'Authorization': 'Bearer ruum-api-secure-token-2024'
            }
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erro na API');
        } else {
            throw new Error('Erro de conexão');
        }
    }
};
```

## 📤 Response

### Sucesso (200)
```json
{
  "success": true,
  "message": "Imagem salva com sucesso",
  "data": {
    "recordId": "recABC123XYZ789",
    "publicUrl": "https://dl.airtable.com/.attachments/abc123.../image.jpg",
    "originalUrl": "image.jpg",
    "fileName": "my-image.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "tableName": "Images",
    "clientId": "recCLIENT123456789"
  }
}
```

### Erro (400/500)
```json
{
  "success": false,
  "message": "Arquivo muito grande. Tamanho máximo: 10MB",
  "error": "File too large"
}
```

## ⚠️ Tratamento de Erros

### Erros Comuns

1. **Arquivo muito grande**
   - Status: `400`
   - Message: "Arquivo muito grande. Tamanho máximo: 10MB"

2. **Tipo de arquivo inválido**
   - Status: `400`
   - Message: "Apenas arquivos de imagem são aceitos"

3. **Client ID inválido**
   - Status: `400`
   - Message: "Client ID inválido. Deve ser um ID do Airtable válido"

4. **Campos obrigatórios**
   - Status: `400`
   - Message: "clientId é obrigatório" / "tableName é obrigatório"

### Exemplo de Tratamento
```javascript
try {
    const result = await uploadImage(file, clientId, tableName);
    
    if (result.success) {
        // Sucesso - usar result.data.publicUrl
        console.log('URL pública:', result.data.publicUrl);
    } else {
        // Erro da API
        console.error('Erro:', result.message);
    }
} catch (error) {
    // Erro de rede ou outro
    console.error('Erro fatal:', error.message);
}
```

## 🔗 Rota Relacionada

Para múltiplas imagens, use a rota `/api/save-multiple-images` - veja a documentação específica.

## 📞 Suporte

Para dúvidas ou problemas, consulte os logs da API ou entre em contato com a equipe de desenvolvimento.