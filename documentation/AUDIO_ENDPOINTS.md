# 🎵 Endpoints de Áudio - Documentação

## 📋 Visão Geral

Endpoints para upload e serving de arquivos de áudio para integração com ShotStack.

## 🔧 Endpoints Disponíveis

### 1. Upload de Áudio
```
POST /api/audio/upload
Content-Type: multipart/form-data
```

**Parâmetros:**
- `audio` (file): Arquivo de áudio (MP3, WAV, OGG, AAC)

**Resposta:**
```json
{
  "success": true,
  "message": "Upload de áudio realizado com sucesso",
  "audioId": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://sua-api.com/api/audio/123e4567-e89b-12d3-a456-426614174000",
  "filename": "123e4567-e89b-12d3-a456-426614174000.mp3",
  "size": 2048576,
  "mimetype": "audio/mpeg"
}
```

### 2. Servir Áudio
```
GET /api/audio/:id
```

**Parâmetros:**
- `id` (string): ID do arquivo de áudio

**Resposta:**
- Stream do arquivo de áudio com headers adequados

### 3. Deletar Áudio
```
DELETE /api/audio/:id
```

**Parâmetros:**
- `id` (string): ID do arquivo de áudio

**Resposta:**
```json
{
  "success": true,
  "message": "Arquivo de áudio removido com sucesso",
  "audioId": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "123e4567-e89b-12d3-a456-426614174000.mp3"
}
```

### 4. Listar Áudios
```
GET /api/audio
```

**Resposta:**
```json
{
  "success": true,
  "message": "Lista de arquivos de áudio",
  "count": 2,
  "files": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "123e4567-e89b-12d3-a456-426614174000.mp3",
      "size": 2048576,
      "created": "2024-01-01T00:00:00.000Z",
      "modified": "2024-01-01T00:00:00.000Z",
      "url": "https://sua-api.com/api/audio/123e4567-e89b-12d3-a456-426614174000"
    }
  ]
}
```

## 🔧 Configurações

### Limites
- **Tamanho máximo**: 10MB por arquivo
- **Tipos suportados**: MP3, WAV, OGG, AAC, WebM
- **Retenção**: 24 horas (limpeza automática)

### Storage
- **Diretório**: `uploads/audio/`
- **Nomeação**: UUID + extensão original
- **Permissions**: Leitura pública via endpoint

## 🎯 Fluxo de Integração

### 1. Frontend → Upload
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'audio.mp3');

const response = await fetch('/api/audio/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token'
  },
  body: formData
});

const { url } = await response.json();
```

### 2. ShotStack → Timeline
```javascript
const timeline = {
  tracks: [
    {
      clips: [
        {
          asset: {
            type: 'video',
            src: videoUrl
          },
          start: 0,
          length: 10
        }
      ]
    }
  ],
  soundtrack: {
    src: url, // ← URL do áudio uploadado
    effect: 'fadeIn'
  }
};
```

## 🛡️ Segurança

### Validações
- ✅ Tipo de arquivo (MIME type)
- ✅ Tamanho máximo
- ✅ Extensões permitidas
- ✅ Nomes únicos (UUID)

### Headers de Segurança
- `Cache-Control`: Cache público por 24h
- `Content-Disposition`: Inline para streaming
- `Accept-Ranges`: Suporte a range requests

## 🔄 Limpeza Automática

### Sistema de Limpeza
- **Frequência**: A cada hora
- **Critério**: Arquivos mais antigos que 24h
- **Automático**: Não requer intervenção

### Limpeza Manual
```bash
# Limpar arquivos antigos manualmente
find uploads/audio -name "*.mp3" -mtime +1 -delete
find uploads/audio -name "*.wav" -mtime +1 -delete
```

## 🧪 Testes

### Teste de Upload
```bash
curl -X POST \
  -H "Authorization: Bearer your-token" \
  -F "audio=@test.mp3" \
  https://sua-api.com/api/audio/upload
```

### Teste de Download
```bash
curl -X GET \
  https://sua-api.com/api/audio/123e4567-e89b-12d3-a456-426614174000
```

### Teste de Listagem
```bash
curl -X GET \
  https://sua-api.com/api/audio
```

## 🚨 Troubleshooting

### Erro: "Nenhum arquivo enviado"
- Verificar se o campo `audio` está presente
- Verificar se o Content-Type é `multipart/form-data`

### Erro: "Tipo de arquivo não suportado"
- Verificar se o arquivo é MP3, WAV, OGG, AAC ou WebM
- Verificar se o MIME type está correto

### Erro: "Arquivo muito grande"
- Limite atual: 10MB
- Comprimir arquivo ou dividir em partes

### Erro: "Arquivo não encontrado"
- Verificar se o ID está correto
- Verificar se o arquivo não foi removido pela limpeza automática

## 🔗 Integração com Frontend

### Exemplo Completo
```javascript
// 1. Upload do áudio
async function uploadAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.mp3');
  
  const response = await fetch('/api/audio/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-token'
    },
    body: formData
  });
  
  const data = await response.json();
  return data.url;
}

// 2. Usar URL no ShotStack
async function renderWithAudio(videoUrl, audioBlob) {
  const audioUrl = await uploadAudio(audioBlob);
  
  const timeline = {
    tracks: [{
      clips: [{
        asset: { type: 'video', src: videoUrl },
        start: 0,
        length: 10
      }]
    }],
    soundtrack: {
      src: audioUrl,
      effect: 'fadeIn'
    }
  };
  
  return await renderVideo(timeline);
}
```

## 📊 Monitoramento

### Métricas Importantes
- Número de uploads por dia
- Tamanho total de arquivos
- Taxa de sucesso/falha
- Tempo de resposta

### Logs
- Upload bem-sucedido: `✅ Upload de áudio realizado`
- Arquivo servido: Stream direto (sem log específico)
- Arquivo removido: `🗑️ Arquivo de áudio removido`
- Limpeza automática: `🗑️ Arquivo de áudio antigo removido`
