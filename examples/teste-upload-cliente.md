# 🔥 **Teste das Rotas Firebase Storage com Organização por Cliente**

## 📋 **Rotas Disponíveis:**

### **1. Upload de Uma Única Imagem**
```bash
curl -X POST "http://localhost:8080/api/firebase/upload-image" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -F "image=@sua-imagem.jpg" \
  -F "clientName=Cliente_Teste"
```

### **2. Upload de Múltiplas Imagens**
```bash
curl -X POST "http://localhost:8080/api/firebase/upload-multiple-images" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -F "images=@imagem1.jpg" \
  -F "images=@imagem2.jpg" \
  -F "images=@imagem3.jpg" \
  -F "clientName=Cliente_Teste"
```

---

## 🗂️ **Estrutura no Firebase Storage:**

```
📁 api-ruum.firebasestorage.app/
└── 📁 clients/
    ├── 📁 cliente_teste/
    │   └── 📁 images/
    │       ├── 🖼️ 1696347123456_imagem1.jpg
    │       ├── 🖼️ 1696347123789_imagem2.jpg
    │       └── 🖼️ 1696347124012_imagem3.jpg
    ├── 📁 kaaza_imobiliaria/
    │   └── 📁 images/
    │       └── 🖼️ 1696347200123_casa_luxo.jpg
    └── 📁 outro_cliente/
        └── 📁 images/
            └── 🖼️ 1696347300456_apartamento.jpg
```

---

## ✅ **Resposta de Sucesso (Upload Único):**

```json
{
  "success": true,
  "message": "Upload realizado com sucesso",
  "data": {
    "publicUrl": "https://firebasestorage.googleapis.com/v0/b/api-ruum.appspot.com/o/clients%2Fcliente_teste%2Fimages%2F1696347123456_imagem.jpg?alt=media&token=xyz",
    "fileName": "imagem.jpg",
    "fileSize": 256789,
    "mimeType": "image/jpeg",
    "clientName": "Cliente_Teste",
    "uploadedAt": "2025-10-03T19:45:23.456Z"
  }
}
```

## ✅ **Resposta de Sucesso (Upload Múltiplo):**

```json
{
  "success": true,
  "message": "Upload concluído: 3 sucessos, 0 erros",
  "data": {
    "totalFiles": 3,
    "successCount": 3,
    "errorCount": 0,
    "clientName": "Cliente_Teste",
    "uploadedAt": "2025-10-03T19:45:23.456Z",
    "results": [
      {
        "success": true,
        "url": "https://firebasestorage.googleapis.com/...",
        "originalName": "imagem1.jpg",
        "clientName": "Cliente_Teste",
        "index": 0
      }
    ],
    "successUrls": [
      "https://firebasestorage.googleapis.com/v0/b/api-ruum.appspot.com/o/clients%2Fcliente_teste%2Fimages%2F1696347123456_imagem1.jpg?alt=media&token=xyz",
      "https://firebasestorage.googleapis.com/v0/b/api-ruum.appspot.com/o/clients%2Fcliente_teste%2Fimages%2F1696347123789_imagem2.jpg?alt=media&token=abc",
      "https://firebasestorage.googleapis.com/v0/b/api-ruum.appspot.com/o/clients%2Fcliente_teste%2Fimages%2F1696347124012_imagem3.jpg?alt=media&token=def"
    ]
  }
}
```

---

## ❌ **Erros Comuns:**

### **1. Nome do cliente faltando:**
```json
{
  "success": false,
  "message": "Nome do cliente (clientName) é obrigatório"
}
```

### **2. Arquivo não enviado:**
```json
{
  "success": false,
  "message": "É necessário enviar um arquivo no campo 'image'"
}
```

### **3. Arquivo muito grande:**
```json
{
  "success": false,
  "message": "Arquivo muito grande. Tamanho máximo: 10MB"
}
```

---

## 🧪 **Para testar localmente:**

1. **Certifique-se de que o servidor está rodando:**
   ```bash
   npm start
   ```

2. **Teste com uma imagem local:**
   ```bash
   curl -X POST "http://localhost:8080/api/firebase/upload-image" \
     -H "Authorization: Bearer ruum-api-secure-token-2024" \
     -F "image=@images/kaazaa_KZ6125.jpg" \
     -F "clientName=Kaaza_Imobiliaria"
   ```

3. **Ou execute o teste automatizado:**
   ```bash
   node test-firebase-airtable.js
   ```

---

## 📱 **Integração Frontend:**

```javascript
// Exemplo de uso no frontend
const formData = new FormData();
formData.append('image', file); // file do input
formData.append('clientName', 'Nome_do_Cliente');

const response = await fetch('/api/firebase/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ruum-api-secure-token-2024'
  },
  body: formData
});

const result = await response.json();
console.log('URL da imagem:', result.data.publicUrl);
```