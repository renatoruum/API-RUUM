# 🔥 Firebase Upload Routes - Estrutura Organizada

## 📁 Estrutura Atual

```
src/
├── connectors/
│   └── firebaseStorage.js     ✅ CONNECTOR - Apenas funções (uploadToFirebase, uploadMultiple)
├── routes/
│   ├── firebaseUpload.js      ✅ ROTAS PRINCIPAIS - Use estas! (/firebase/upload-image)
│   └── firebaseStorage.js     ⚠️  DEPRECATED - Rotas antigas (pode ser removido depois)
└── app.js                     ✅ Registra: /api/firebase + firebaseUpload
```

## 🎯 Endpoints Disponíveis

### ✅ PRINCIPAIS (Usar no Frontend):
- **POST** `/api/firebase/upload-image` - Upload único
- **POST** `/api/firebase/upload-multiple-images` - Upload múltiplo

### ⚠️ DEPRECATED (Evitar):
- **POST** `/api/upload-image` - Rota antiga
- **POST** `/api/upload-multiple-images` - Rota antiga

## 📋 Parâmetros

### Upload Único:
```javascript
FormData:
- image: File (campo obrigatório)
- clientName: String (cliente obrigatório)

Headers:
- Authorization: Bearer ruum-api-secure-token-2024
```

### Upload Múltiplo:
```javascript
FormData:
- images: File[] (campo obrigatório, máx 10 arquivos)
- clientName: String (cliente obrigatório)

Headers:
- Authorization: Bearer ruum-api-secure-token-2024
```

## 🔧 Configuração

- **Limite:** 15MB por arquivo
- **Tipos:** Apenas imagens (image/*)
- **Organização:** `clients/{clientName}/images/`
- **Logs:** Completos para debug

## 🚀 Frontend Example

```javascript
const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/firebase/upload-image', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ruum-api-secure-token-2024'
    },
    body: formData // FormData com 'image' e 'clientName'
});
```

## 📊 Resposta

```json
{
    "success": true,
    "message": "Upload realizado com sucesso",
    "data": {
        "publicUrl": "https://firebasestorage.googleapis.com/...",
        "fileName": "image.jpg",
        "fileSize": 1234567,
        "mimeType": "image/jpeg",
        "clientName": "ClientName",
        "uploadedAt": "2025-10-08T13:49:54.078Z"
    }
}
```