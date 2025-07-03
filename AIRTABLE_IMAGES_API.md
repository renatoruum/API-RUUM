# 🗄️ Airtable Images Update - API Documentation

## 📋 **Visão Geral**

A API de atualização de imagens do Airtable permite fazer o upload e sincronização em lote de imagens para a base de dados Airtable. Suporta criação e atualização de registros com informações de clientes, faturas e metadados.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
AIRTABLE_API_KEY=sua_chave_aqui
AIRTABLE_BASE_ID=seu_base_id_aqui
```

**Obs**: Requer conta válida no Airtable com acesso à base de dados configurada.

## 🛠️ **Endpoint Disponível**

### **Atualização em Lote de Imagens**
```http
POST /api/update-images-airtable
```

**Descrição**: Atualiza ou cria registros de imagens na tabela "Images" do Airtable em lote.

**Parâmetros da Requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `imagesArray` | array | ✅ | Array de objetos com dados das imagens |
| `email` | string | ❌ | Email do cliente |
| `clientId` | string | ❌ | ID do cliente |
| `invoiceId` | string | ❌ | ID da fatura |
| `userId` | string | ❌ | ID do usuário |

**Estrutura do Objeto de Imagem:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `url` | string | ✅ | URL da imagem |
| `name` | string | ✅ | Nome/título da imagem |
| `description` | string | ❌ | Descrição da imagem |
| `property_id` | string | ❌ | ID da propriedade |
| `room_type` | string | ❌ | Tipo do cômodo |
| `processing_type` | string | ❌ | Tipo de processamento aplicado |

**Exemplo de Requisição:**
```json
{
  "email": "cliente@example.com",
  "clientId": "client_123",
  "invoiceId": "invoice_456",
  "userId": "user_789",
  "imagesArray": [
    {
      "url": "https://example.com/image1.jpg",
      "name": "Sala de Estar - Antes",
      "description": "Imagem original da sala de estar",
      "property_id": "prop_001",
      "room_type": "living_room",
      "processing_type": "original"
    },
    {
      "url": "https://example.com/image1_staged.jpg",
      "name": "Sala de Estar - Virtual Staging",
      "description": "Versão com staging virtual aplicado",
      "property_id": "prop_001",
      "room_type": "living_room",
      "processing_type": "virtual_staging"
    }
  ]
}
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Batch processing complete",
  "summary": {
    "total": 2,
    "successful": 2,
    "errors": 0
  },
  "results": [
    {
      "status": "created",
      "id": "rec123abc",
      "url": "https://example.com/image1.jpg",
      "name": "Sala de Estar - Antes"
    },
    {
      "status": "updated",
      "id": "rec456def",
      "url": "https://example.com/image1_staged.jpg",
      "name": "Sala de Estar - Virtual Staging"
    }
  ]
}
```

## 📊 **Status dos Resultados**

Cada imagem processada pode ter um dos seguintes status:

- **created**: Novo registro criado no Airtable
- **updated**: Registro existente atualizado
- **error**: Erro durante o processamento

## ⚠️ **Tratamento de Erros**

### **Erro de Validação (400)**
```json
{
  "success": false,
  "message": "Body must be a non-empty array of images"
}
```

### **Erro de Processamento (500)**
```json
{
  "success": false,
  "message": "Error processing images",
  "error": "Detalhes do erro..."
}
```

### **Resposta com Erros Parciais (200)**
```json
{
  "success": true,
  "message": "Batch processing complete",
  "summary": {
    "total": 3,
    "successful": 2,
    "errors": 1
  },
  "results": [
    {
      "status": "created",
      "id": "rec123abc",
      "url": "https://example.com/image1.jpg"
    },
    {
      "status": "error",
      "url": "https://example.com/image2.jpg",
      "error": "Invalid image format"
    },
    {
      "status": "updated",
      "id": "rec456def",
      "url": "https://example.com/image3.jpg"
    }
  ]
}
```

## 🔧 **Funcionalidades do Conector**

### **upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId)**
Atualiza ou insere imagens na tabela "Images" do Airtable.

**Parâmetros:**
- `imagesArray` (array): Array de objetos com dados das imagens
- `email` (string): Email do cliente (opcional)
- `clientId` (string): ID do cliente (opcional)
- `invoiceId` (string): ID da fatura (opcional)
- `userId` (string): ID do usuário (opcional)

**Retorna:** Promise\<Array> com resultados do processamento

### **Lógica de Upsert**
O sistema verifica se já existe um registro com a mesma URL:
- Se existe: atualiza o registro
- Se não existe: cria novo registro

## 📝 **Campos Suportados no Airtable**

| Campo Airtable | Tipo | Descrição |
|----------------|------|-----------|
| `URL` | URL | URL da imagem |
| `Name` | Text | Nome/título da imagem |
| `Description` | Long Text | Descrição da imagem |
| `Email` | Email | Email do cliente |
| `Client ID` | Text | ID do cliente |
| `Invoice ID` | Text | ID da fatura |
| `User ID` | Text | ID do usuário |
| `Property ID` | Text | ID da propriedade |
| `Room Type` | Text | Tipo do cômodo |
| `Processing Type` | Text | Tipo de processamento |
| `Created At` | Date | Data de criação |
| `Updated At` | Date | Data de atualização |

## 🚀 **Exemplos de Uso**

### **Upload de Imagens de Propriedade**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/update-images-airtable \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "clientId": "client_123",
    "invoiceId": "invoice_456",
    "imagesArray": [
      {
        "url": "https://example.com/kitchen.jpg",
        "name": "Cozinha Moderna",
        "description": "Cozinha com acabamento em granito",
        "property_id": "prop_001",
        "room_type": "kitchen",
        "processing_type": "original"
      }
    ]
  }'
```

### **Atualização de Imagens Processadas**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/update-images-airtable \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_789",
    "imagesArray": [
      {
        "url": "https://example.com/bedroom_staged.jpg",
        "name": "Quarto - Virtual Staging",
        "description": "Quarto com móveis virtuais adicionados",
        "room_type": "bedroom",
        "processing_type": "virtual_staging"
      }
    ]
  }'
```

## 📊 **Monitoramento**

O sistema fornece logs detalhados do processamento:
- Número total de imagens recebidas
- Número de sucessos e erros
- Detalhes de cada operação realizada
- Tempo de processamento

## 🔗 **Recursos Relacionados**

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Airtable Base Schema](https://airtable.com/developers/web/guides/table-schema)
- [Rate Limits](https://airtable.com/developers/web/api/rate-limits)
