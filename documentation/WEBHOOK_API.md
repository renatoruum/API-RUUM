# 🪝 Webhook - API Documentation

## 📋 **Visão Geral**

O endpoint webhook atua como um intermediário para processar dados de imagens recebidos de sistemas externos (como Airtable) e encaminhá-los para o serviço ChatGPT para processamento de virtual staging.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
# Configurações do ChatGPT já devem estar definidas
OPENAI_API_KEY=sua_chave_aqui
```

**Obs**: Este endpoint utiliza internamente a rota `/api/chatgpt`.

## 🛠️ **Endpoint Disponível**

### **Webhook de Processamento**
```http
POST /webhook
```

**Descrição**: Recebe dados de imagem e encaminha para processamento ChatGPT com virtual staging.

**Parâmetros da Requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image_url` | string | ✅ | URL da imagem a ser processada |
| `room_type` | string | ✅ | Tipo do cômodo (ex: "sala de estar", "quarto") |
| `style` | string | ✅ | Estilo do staging (ex: "moderno", "clássico") |

**Exemplo de Requisição:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "room_type": "sala de estar",
  "style": "moderno"
}
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Data processed successfully",
  "chatGPTResponse": {
    "success": true,
    "message": "Processamento ChatGPT concluído com sucesso",
    "processing_type": "VIRTUAL_STAGING",
    "data": {
      "analysis": "Análise da imagem...",
      "suggestions": ["Sugestão 1", "Sugestão 2"],
      "processed_image_url": "https://example.com/processed.jpg"
    }
  }
}
```

## 🔄 **Fluxo de Processamento**

### **Sequência de Operações:**
1. **Recebimento**: Webhook recebe dados da requisição
2. **Validação**: Verifica campos obrigatórios
3. **Encaminhamento**: Faz requisição interna para `/api/chatgpt`
4. **Processamento**: ChatGPT processa a imagem
5. **Resposta**: Retorna resultado combinado

### **Fluxo de Dados:**
```
Sistema Externo → Webhook → ChatGPT API → Processamento → Resposta → Sistema Externo
```

## ⚠️ **Tratamento de Erros**

### **Erro de Campos Obrigatórios (400)**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### **Erro de Processamento ChatGPT (500)**
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "ChatGPT processing failed"
}
```

### **Erro de Comunicação Interna (500)**
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Failed to connect to ChatGPT service"
}
```

## 🔧 **Configuração Interna**

### **URL do ChatGPT:**
O webhook faz uma requisição interna para:
```
https://apiruum-667905204535.us-central1.run.app/api/chatgpt
```

### **Formato da Requisição Interna:**
```json
{
  "image_url": "https://example.com/room.jpg",
  "processing_type": "VIRTUAL_STAGING",
  "room_type": "sala de estar",
  "style": "moderno"
}
```

## 📊 **Monitoramento**

### **Logs Gerados:**
- **Recebimento**: Dados recebidos no webhook
- **Validação**: Resultado da validação de campos
- **Processamento**: Status da requisição para ChatGPT
- **Resposta**: Resultado final enviado

### **Exemplo de Log:**
```
[2024-01-15T10:30:00Z] Webhook: Data received
[2024-01-15T10:30:00Z] Webhook: Validating fields...
[2024-01-15T10:30:00Z] Webhook: Forwarding to ChatGPT...
[2024-01-15T10:30:05Z] Webhook: ChatGPT processing completed
[2024-01-15T10:30:05Z] Webhook: Response sent successfully
```

## 🚀 **Exemplos de Uso**

### **Processamento de Sala de Estar**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/living-room.jpg",
    "room_type": "sala de estar",
    "style": "moderno"
  }'
```

### **Processamento de Quarto**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/bedroom.jpg",
    "room_type": "quarto",
    "style": "clássico"
  }'
```

### **Processamento de Cozinha**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/kitchen.jpg",
    "room_type": "cozinha",
    "style": "minimalista"
  }'
```

## 🔗 **Integração com Airtable**

### **Configuração no Airtable:**
1. Crie uma automação no Airtable
2. Configure o trigger (novo registro, campo alterado, etc.)
3. Adicione ação "Send HTTP Request"
4. Configure a URL do webhook
5. Mapeie os campos necessários

### **Exemplo de Automação Airtable:**
```json
{
  "method": "POST",
  "url": "https://apiruum-667905204535.us-central1.run.app/webhook",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "image_url": "{{Image URL}}",
    "room_type": "{{Room Type}}",
    "style": "{{Style}}"
  }
}
```

## 📝 **Campos Suportados**

### **Tipos de Cômodo:**
- `sala de estar`
- `quarto`
- `cozinha`
- `banheiro`
- `escritório`
- `sala de jantar`
- `varanda`

### **Estilos Disponíveis:**
- `moderno`
- `clássico`
- `minimalista`
- `industrial`
- `escandinavo`
- `rústico`
- `luxuoso`

## 🔒 **Segurança**

- Validação de campos obrigatórios
- Tratamento de erros robusto
- Logs detalhados para auditoria
- Comunicação interna segura

## 🔗 **Recursos Relacionados**

- [ChatGPT Generic API](./CHATGPT_GENERIC_API.md)
- [Virtual Staging API](./VIRTUAL_STAGING_API.md)
- [Airtable Integration Guide](./AIRTABLE_CONNECTOR.md)
