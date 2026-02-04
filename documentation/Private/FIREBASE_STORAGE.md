# 📦 Firebase Storage API - Upload de Imagens

> **Endpoint Base:** `/api`  
> **Métodos:** POST  
> **Tipo:** Síncrono  
> **Tempo de Resposta:** 2-5 segundos

---

## 📋 Visão Geral

A API de Firebase Storage permite upload de imagens para armazenamento em nuvem, **gerando URLs públicas permanentes** que serão utilizadas como input para processamento (Virtual Staging, vídeos, etc).

**Uso na plataforma Ruum:**
1. Cliente da plataforma faz upload de imagens via frontend
2. API salva no Firebase Storage e retorna URL pública
3. URL pública é usada como input para Virtual Staging/Vídeos
4. Resultado também é salvo e nova URL pública é gerada

**Casos de uso:**
- Gerar URLs públicas de imagens de clientes
- Preparar input para processamento de IA
- Armazenamento permanente de resultados processados
- Galeria de imagens da plataforma

⚠️ **Nota:** CRMs externos não precisam deste endpoint - eles já têm suas próprias URLs hospedadas.

---

## 🔗 Endpoints Disponíveis

### 1. Upload Único

```
POST /api/upload-image
```

### 2. Upload Múltiplo

```
POST /api/upload-multiple-images
```

---

## 📤 Upload Único

### Endpoint:

```
POST /api/upload-image
```

### Requisição (multipart/form-data):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image` | File | ✅ | Arquivo de imagem (JPG, PNG, WebP) |
| `clientName` | string | ✅ | Nome do cliente/pasta de destino |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/upload-image \
  -F "image=@/caminho/para/imagem.jpg" \
  -F "clientName=minha-imobiliaria"
```

### Exemplo com JavaScript (FormData):

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('clientName', 'minha-imobiliaria');

const response = await fetch(
  'https://apiruum-562831020087.us-central1.run.app/api/upload-image',
  {
    method: 'POST',
    body: formData
  }
);

const result = await response.json();
console.log('URL pública:', result.data.publicUrl);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Upload realizado com sucesso",
  "data": {
    "publicUrl": "https://storage.googleapis.com/bucket-name/minha-imobiliaria/imagem_123456.jpg",
    "fileName": "imagem.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "clientName": "minha-imobiliaria",
    "uploadedAt": "2026-02-03T10:30:00.000Z"
  }
}
```

### Estrutura de Pastas:

As imagens são organizadas automaticamente:

```
bucket-name/
└── {clientName}/
    └── {fileName}_{timestamp}.{ext}
```

**Exemplo:**
```
minha-imobiliaria/casa-praia_1738583400000.jpg
```

---

## 📤 Upload Múltiplo

### Endpoint:

```
POST /api/upload-multiple-images
```

### Requisição (multipart/form-data):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `images` | File[] | ✅ | Array de arquivos (máx. 10) |
| `clientName` | string | ✅ | Nome do cliente/pasta de destino |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/upload-multiple-images \
  -F "images=@/path/img1.jpg" \
  -F "images=@/path/img2.jpg" \
  -F "images=@/path/img3.jpg" \
  -F "clientName=minha-imobiliaria"
```

### Exemplo com JavaScript:

```javascript
const formData = new FormData();
const files = document.getElementById('fileInput').files;

// Adicionar múltiplos arquivos
for (let i = 0; i < files.length; i++) {
  formData.append('images', files[i]);
}
formData.append('clientName', 'minha-imobiliaria');

const response = await fetch(
  'https://apiruum-562831020087.us-central1.run.app/api/upload-multiple-images',
  {
    method: 'POST',
    body: formData
  }
);

const result = await response.json();
console.log('URLs:', result.data.publicUrls);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "3 arquivos enviados com sucesso",
  "data": {
    "totalProcessed": 3,
    "successCount": 3,
    "errorCount": 0,
    "results": [
      {
        "success": true,
        "fileName": "img1.jpg",
        "url": "https://storage.googleapis.com/.../img1_123.jpg"
      },
      {
        "success": true,
        "fileName": "img2.jpg",
        "url": "https://storage.googleapis.com/.../img2_456.jpg"
      },
      {
        "success": true,
        "fileName": "img3.jpg",
        "url": "https://storage.googleapis.com/.../img3_789.jpg"
      }
    ],
    "publicUrls": [
      "https://storage.googleapis.com/.../img1_123.jpg",
      "https://storage.googleapis.com/.../img2_456.jpg",
      "https://storage.googleapis.com/.../img3_789.jpg"
    ]
  }
}
```

### Resposta Parcial (alguns uploads falharam):

```json
{
  "success": false,
  "message": "2 de 3 arquivos enviados com sucesso",
  "data": {
    "totalProcessed": 3,
    "successCount": 2,
    "errorCount": 1,
    "results": [
      {
        "success": true,
        "fileName": "img1.jpg",
        "url": "https://storage.googleapis.com/.../img1_123.jpg"
      },
      {
        "success": false,
        "fileName": "img2.jpg",
        "error": "File size exceeds limit"
      },
      {
        "success": true,
        "fileName": "img3.jpg",
        "url": "https://storage.googleapis.com/.../img3_789.jpg"
      }
    ],
    "publicUrls": [
      "https://storage.googleapis.com/.../img1_123.jpg",
      "https://storage.googleapis.com/.../img3_789.jpg"
    ]
  }
}
```

---

## ⚙️ Limites e Restrições

| Limite | Valor | Descrição |
|--------|-------|-----------|
| **Tamanho máximo por arquivo** | 15MB | Arquivos maiores serão rejeitados |
| **Número máximo de arquivos** | 10 | Por requisição (upload múltiplo) |
| **Formatos aceitos** | JPG, PNG, WebP, GIF | Apenas imagens |
| **Tempo de upload** | ~2-5s | Por arquivo (depende do tamanho) |

---

## ⚠️ Códigos de Erro

### 400 - NO_FILE / NO_FILES

**Causa:** Nenhum arquivo foi enviado

```json
{
  "success": false,
  "message": "Nenhum arquivo de imagem foi enviado",
  "error": "NO_FILE"
}
```

**Solução:** Certifique-se de enviar o campo `image` (upload único) ou `images` (upload múltiplo) com arquivos válidos

---

### 400 - NO_CLIENT_NAME

**Causa:** Campo `clientName` não foi fornecido

```json
{
  "success": false,
  "message": "Nome do cliente é obrigatório",
  "error": "NO_CLIENT_NAME"
}
```

**Solução:** Sempre inclua o campo `clientName` no formulário

---

### 413 - LIMIT_FILE_SIZE

**Causa:** Arquivo excede 15MB

```json
{
  "success": false,
  "message": "Arquivo muito grande. Máximo permitido: 15MB",
  "error": "LIMIT_FILE_SIZE"
}
```

**Solução:** Reduza o tamanho do arquivo ou comprima a imagem antes do upload

---

### 413 - LIMIT_FILE_COUNT

**Causa:** Mais de 10 arquivos enviados de uma vez

```json
{
  "success": false,
  "message": "Muitos arquivos. Máximo permitido: 10 arquivos",
  "error": "LIMIT_FILE_COUNT"
}
```

**Solução:** Divida o upload em múltiplas requisições ou envie no máximo 10 arquivos

---

### 400 - MULTER_ERROR

**Causa:** Formato de arquivo inválido (não é imagem)

```json
{
  "success": false,
  "message": "Apenas arquivos de imagem são aceitos",
  "error": "MULTER_ERROR"
}
```

**Solução:** Envie apenas arquivos JPG, PNG, WebP ou GIF

---

### 500 - Erro Interno

**Causa:** Falha no servidor ou Firebase Storage indisponível

```json
{
  "success": false,
  "message": "Erro interno do servidor durante upload",
  "error": "Internal server error"
}
```

**Solução:** 
1. Tente novamente em alguns segundos
2. Verifique se o arquivo não está corrompido
3. Se persistir, entre em contato com suporte

---

## 💡 Exemplos de Uso Completos

### Exemplo 1: Upload de Foto de Imóvel

```javascript
async function uploadPropertyPhoto(file, propertyCode) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('clientName', 'imoveis-sp');
  
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/upload-image',
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) throw new Error('Upload falhou');
    
    const result = await response.json();
    
    // Salvar URL no banco de dados
    await savePhotoToDatabase({
      propertyCode: propertyCode,
      photoUrl: result.data.publicUrl,
      uploadedAt: result.data.uploadedAt
    });
    
    return result.data.publicUrl;
    
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}
```

### Exemplo 2: Upload de Galeria de Imóvel

```javascript
async function uploadPropertyGallery(files, propertyCode) {
  const formData = new FormData();
  
  // Adicionar todos os arquivos
  files.forEach(file => {
    formData.append('images', file);
  });
  
  formData.append('clientName', 'imoveis-sp');
  
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/upload-multiple-images',
      {
        method: 'POST',
        body: formData
      }
    );
    
    const result = await response.json();
    
    if (result.data.errorCount > 0) {
      console.warn(`${result.data.errorCount} arquivos falharam`);
      // Processar apenas os sucessos
    }
    
    // Retornar apenas URLs bem-sucedidas
    return result.data.publicUrls;
    
  } catch (error) {
    console.error('Erro no upload múltiplo:', error);
    throw error;
  }
}
```

### Exemplo 3: Upload com Progress Bar (React)

```javascript
import { useState } from 'react';

function ImageUploader() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('clientName', 'minha-imobiliaria');
    
    try {
      const xhr = new XMLHttpRequest();
      
      // Monitorar progresso do upload
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });
      
      // Aguardar conclusão
      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = () => reject(new Error('Upload falhou'));
        
        xhr.open('POST', 'https://apiruum-562831020087.us-central1.run.app/api/upload-image');
        xhr.send(formData);
      });
      
      console.log('✅ Upload concluído:', result.data.publicUrl);
      return result.data.publicUrl;
      
    } catch (error) {
      console.error('❌ Erro:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <progress value={progress} max="100" />}
    </div>
  );
}
```

---

## 🔐 Segurança

- **URLs Públicas:** As URLs retornadas são públicas e permanentes
- **Organização por Cliente:** Arquivos são separados por pasta (`clientName`)
- **Validação de Tipo:** Apenas imagens são aceitas
- **Limite de Tamanho:** Proteção contra uploads excessivos

---

## 📊 Boas Práticas

### ✅ Recomendações:

1. **Compressão:** Comprima imagens antes do upload para economizar banda
2. **Nomeação:** Use `clientName` descritivo e consistente
3. **Validação:** Valide tipo e tamanho do arquivo no frontend
4. **Retry:** Implemente retry em caso de falha temporária
5. **Armazenamento:** Salve as URLs retornadas no seu banco de dados

### ❌ Evite:

1. ❌ Enviar arquivos não-imagem
2. ❌ Arquivos maiores que 15MB
3. ❌ Mais de 10 arquivos por vez
4. ❌ Usar `clientName` vazio ou genérico
5. ❌ Fazer upload sem salvar as URLs retornadas

---

## 🆘 Troubleshooting

### Problema: Upload falha com erro 413

**Causa:** Arquivo muito grande  
**Solução:** 
```javascript
// Comprimir imagem antes do upload
function compressImage(file, maxSizeMB = 10) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nova dimensão mantendo aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 4096;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height *= maxDimension / width;
            width = maxDimension;
          } else {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

### Problema: Upload múltiplo retorna alguns sucessos e alguns erros

**Solução:** Processar apenas os sucessos e retentar os erros individualmente

```javascript
async function uploadWithRetry(files, clientName) {
  const results = await uploadMultiple(files, clientName);
  
  // Filtrar falhas
  const failed = results.data.results.filter(r => !r.success);
  
  if (failed.length > 0) {
    console.log(`Retentando ${failed.length} arquivos...`);
    // Implementar lógica de retry individual
  }
  
  return results.data.publicUrls;
}
```

---

## 📖 Documentação Relacionada

- [VIRTUAL_STAGING.md](./VIRTUAL_STAGING.md) - Upload de imagens para Virtual Staging
- [VIDEO_BEFORE_AFTER.md](./VIDEO_BEFORE_AFTER.md) - URLs de imagens para vídeos
- [README.md](./README.md) - Visão geral da API

---

## 🆘 Suporte

- **Email:** renato@ruum.com.br
- **Documentação:** Esta pasta CRM_INTEGRATION
- **Resposta:** 24-48h úteis
