# 🔥 Firebase Firestore API - Banco de Dados NoSQL

> **Endpoint Base:** `/api/firebase`  
> **Métodos:** POST, GET  
> **Tipo:** Síncrono  
> **Tempo de Resposta:** <1 segundo

---

## 📋 Visão Geral

A API do Firebase Firestore fornece acesso a um banco de dados NoSQL em tempo real para armazenar metadados, logs e configurações da plataforma Ruum.

**Uso na plataforma Ruum:**
- Armazenar metadados de processamento (tempos, status, parâmetros)
- Registrar histórico de operações e URLs geradas
- Configurações de clientes e preferências
- Logs de debugging e monitoramento

**Casos de uso:**
- Registrar URLs públicas geradas pelo Firebase Storage
- Armazenar histórico de processamentos
- Logs de operações e erros
- Configurações e preferências

⚠️ **Nota:** Esta API é principalmente para **testes e desenvolvimento**. Para produção, recomendamos usar endpoints específicos como Virtual Staging e Firebase Storage.

⚠️ **CRMs externos:** Não precisam deste endpoint - usam seus próprios bancos de dados.

---

## 🔗 Endpoints Disponíveis

### 1. Adicionar Documento

```
POST /api/firebase/test-add
```

### 2. Listar Documentos

```
GET /api/firebase/test-get/:collection
```

---

## ➕ Adicionar Documento

### Endpoint:

```
POST /api/firebase/test-add
```

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `collection` | string | ✅ | Nome da coleção Firestore |
| `data` | object | ✅ | Dados do documento a ser criado |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/firebase/test-add \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "properties",
    "data": {
      "propertyCode": "IMO-001",
      "address": "Rua Exemplo, 123",
      "status": "available",
      "createdAt": "2026-02-03T10:00:00Z"
    }
  }'
```

### Exemplo com JavaScript:

```javascript
const response = await fetch(
  'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-add',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection: 'properties',
      data: {
        propertyCode: 'IMO-001',
        address: 'Rua Exemplo, 123',
        status: 'available',
        createdAt: new Date().toISOString()
      }
    })
  }
);

const result = await response.json();
console.log('Documento criado com ID:', result.id);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "id": "xQz8K2mP9nRvTcWd5LhY"
}
```

**Campos da resposta:**
- `success`: Indica sucesso da operação
- `id`: ID único gerado automaticamente pelo Firestore

---

## 📋 Listar Documentos

### Endpoint:

```
GET /api/firebase/test-get/:collection
```

### Parâmetros da URL:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `collection` | string | ✅ | Nome da coleção a consultar |

### Exemplo com cURL:

```bash
curl -X GET https://apiruum-562831020087.us-central1.run.app/api/firebase/test-get/properties
```

### Exemplo com JavaScript:

```javascript
const collection = 'properties';
const response = await fetch(
  `https://apiruum-562831020087.us-central1.run.app/api/firebase/test-get/${collection}`
);

const result = await response.json();
console.log('Documentos encontrados:', result.docs.length);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "docs": [
    {
      "id": "xQz8K2mP9nRvTcWd5LhY",
      "propertyCode": "IMO-001",
      "address": "Rua Exemplo, 123",
      "status": "available",
      "createdAt": "2026-02-03T10:00:00Z"
    },
    {
      "id": "aB3cD4eF5gH6iJ7kL8mN",
      "propertyCode": "IMO-002",
      "address": "Av. Principal, 456",
      "status": "sold",
      "createdAt": "2026-02-02T15:30:00Z"
    }
  ]
}
```

**Campos da resposta:**
- `success`: Indica sucesso da operação
- `docs`: Array de documentos, cada um contendo:
  - `id`: ID único do documento
  - Campos personalizados salvos no documento

---

## 📊 Estrutura de Dados

### Coleções Comuns:

| Coleção | Descrição | Campos Típicos |
|---------|-----------|----------------|
| `properties` | Imóveis cadastrados | `propertyCode`, `address`, `status` |
| `processing_logs` | Logs de processamento | `taskId`, `status`, `timestamp`, `duration` |
| `client_configs` | Configurações de clientes | `clientName`, `settings`, `quotas` |
| `image_metadata` | Metadados de imagens | `imageUrl`, `processedAt`, `styleUsed` |

### Exemplo de Documento Completo:

```json
{
  "id": "doc123abc",
  "propertyCode": "IMO-2026-001",
  "clientName": "imoveis-sp",
  "address": "Rua das Flores, 789 - Jardins, São Paulo/SP",
  "type": "apartment",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 120,
  "price": 850000,
  "status": "available",
  "images": [
    "https://storage.googleapis.com/.../img1.jpg",
    "https://storage.googleapis.com/.../img2.jpg"
  ],
  "virtualStagingApplied": true,
  "lastProcessedAt": "2026-02-03T10:00:00Z",
  "createdAt": "2026-01-15T08:30:00Z",
  "updatedAt": "2026-02-03T10:00:00Z"
}
```

---

## ⚠️ Códigos de Erro

### 503 - Firebase Indisponível

**Causa:** Credenciais do Firebase não configuradas ou serviço indisponível

```json
{
  "success": false,
  "error": "Firebase Firestore não está disponível",
  "message": "Credenciais do Firebase não configuradas"
}
```

**Solução:** Entre em contato com o suporte técnico

---

### 500 - Erro Interno

**Causa:** Falha ao adicionar ou consultar documento

```json
{
  "success": false,
  "error": "Permission denied: Missing or insufficient permissions"
}
```

**Possíveis causas:**
1. Nome da coleção inválido
2. Dados mal formatados
3. Limites de quota excedidos
4. Problemas de conectividade

**Solução:**
1. Verifique o nome da coleção
2. Valide a estrutura do objeto `data`
3. Tente novamente em alguns segundos

---

## 💡 Exemplos de Uso

### Exemplo 1: Salvar Log de Processamento

```javascript
async function saveProcessingLog(taskId, status, duration) {
  const logData = {
    taskId: taskId,
    status: status,
    duration: duration,
    timestamp: new Date().toISOString(),
    endpoint: 'imagen-staging/full-pipeline'
  };
  
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-add',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'processing_logs',
          data: logData
        })
      }
    );
    
    const result = await response.json();
    console.log('Log salvo com ID:', result.id);
    
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}
```

### Exemplo 2: Consultar Histórico de Processamento

```javascript
async function getProcessingHistory() {
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-get/processing_logs'
    );
    
    const result = await response.json();
    
    // Filtrar logs das últimas 24h
    const yesterday = new Date(Date.now() - 24*60*60*1000);
    const recentLogs = result.docs.filter(doc => 
      new Date(doc.timestamp) > yesterday
    );
    
    console.log(`Processamentos nas últimas 24h: ${recentLogs.length}`);
    
    return recentLogs;
    
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}
```

### Exemplo 3: Armazenar Metadados de Imagem Processada

```javascript
async function saveImageMetadata(imageUrl, processingData) {
  const metadata = {
    originalImageUrl: processingData.originalImageUrl,
    generatedImageUrl: imageUrl,
    designStyle: processingData.designStyle,
    roomType: processingData.roomType,
    processingTime: processingData.metadata.processingTime,
    timestamp: new Date().toISOString(),
    clientName: 'minha-imobiliaria',
    propertyCode: processingData.propertyCode || null
  };
  
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-add',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'image_metadata',
          data: metadata
        })
      }
    );
    
    return await response.json();
    
  } catch (error) {
    console.error('Erro ao salvar metadata:', error);
    throw error;
  }
}
```

### Exemplo 4: Buscar Configurações de Cliente

```javascript
async function getClientSettings(clientName) {
  try {
    const response = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-get/client_configs'
    );
    
    const result = await response.json();
    
    // Filtrar pela configuração do cliente
    const clientConfig = result.docs.find(doc => 
      doc.clientName === clientName
    );
    
    if (!clientConfig) {
      console.warn(`Configuração não encontrada para ${clientName}`);
      return null;
    }
    
    return clientConfig.settings;
    
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
}
```

---

## 🔄 Integração com Outros Endpoints

### Workflow Completo: Virtual Staging + Firestore

```javascript
async function processAndStore(imageUrl, propertyCode) {
  // 1. Processar Virtual Staging
  const stagingResponse = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl,
        designStyle: 'modern',
        roomType: 'living_room'
      })
    }
  );
  
  const stagingResult = await stagingResponse.json();
  
  // 2. Salvar no Firestore
  const metadata = {
    propertyCode: propertyCode,
    originalImage: imageUrl,
    stagedImage: stagingResult.generatedImageUrl,
    style: 'modern',
    roomType: 'living_room',
    processingTime: stagingResult.metadata.processingTime,
    processedAt: new Date().toISOString()
  };
  
  const firestoreResponse = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/firebase/test-add',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: 'processed_images',
        data: metadata
      })
    }
  );
  
  const firestoreResult = await firestoreResponse.json();
  
  return {
    imageUrl: stagingResult.generatedImageUrl,
    firestoreId: firestoreResult.id
  };
}
```

---

## 📊 Boas Práticas

### ✅ Recomendações:

1. **Nomes de Coleção:** Use snake_case e nomes descritivos (`processing_logs`, `client_configs`)
2. **Timestamps:** Sempre inclua campos de data/hora (`createdAt`, `updatedAt`)
3. **IDs Externos:** Armazene referências (propertyCode, clientName) para relacionamentos
4. **Estrutura Consistente:** Mantenha estrutura de dados consistente em cada coleção
5. **Indexação:** Use campos que você frequentemente consulta

### ❌ Evite:

1. ❌ Armazenar arquivos grandes (use Firebase Storage)
2. ❌ Criar coleções com nomes genéricos (`data`, `test`)
3. ❌ Salvar dados sem timestamp
4. ❌ Documentos muito grandes (>1MB)
5. ❌ Consultas sem limite de resultados

---

## 🔍 Consultas Avançadas (Exemplo)

Embora a API atual seja simples, você pode implementar filtros no seu código:

```javascript
async function getFilteredDocuments(collection, filters) {
  // 1. Buscar todos os documentos
  const response = await fetch(
    `https://apiruum-562831020087.us-central1.run.app/api/firebase/test-get/${collection}`
  );
  
  const result = await response.json();
  
  // 2. Aplicar filtros no cliente
  let filtered = result.docs;
  
  if (filters.propertyCode) {
    filtered = filtered.filter(doc => doc.propertyCode === filters.propertyCode);
  }
  
  if (filters.status) {
    filtered = filtered.filter(doc => doc.status === filters.status);
  }
  
  if (filters.dateFrom) {
    filtered = filtered.filter(doc => 
      new Date(doc.createdAt) >= new Date(filters.dateFrom)
    );
  }
  
  return filtered;
}

// Uso
const available = await getFilteredDocuments('properties', {
  status: 'available',
  dateFrom: '2026-02-01'
});
```

---

## 🆘 Troubleshooting

### Problema: Erro 503 - Firebase Indisponível

**Solução:** Este erro indica que o Firebase não está configurado. Entre em contato com o suporte.

---

### Problema: Documentos não aparecem após criação

**Solução:** Verifique se você está consultando a coleção correta:

```javascript
// Criar documento
await createDocument('properties', {...});

// Consultar mesma coleção
const docs = await getDocuments('properties'); // ✅ Correto
const docs = await getDocuments('property'); // ❌ Errado (nome diferente)
```

---

### Problema: Dados mal formatados na consulta

**Solução:** Sempre valide a estrutura antes de usar:

```javascript
const result = await getDocuments('properties');

if (result.success && Array.isArray(result.docs)) {
  result.docs.forEach(doc => {
    // Validar campos obrigatórios
    if (doc.propertyCode && doc.address) {
      processProperty(doc);
    } else {
      console.warn('Documento incompleto:', doc.id);
    }
  });
}
```

---

## ⚡ Limitações

- ⚠️ A API retorna **todos** os documentos da coleção (sem paginação)
- ⚠️ Não há suporte para ordenação ou filtros avançados na API
- ⚠️ Recomendado apenas para coleções pequenas (<100 documentos)
- ⚠️ Para consultas complexas, implemente filtros no cliente

---

## 📖 Documentação Relacionada

- [FIREBASE_STORAGE.md](./FIREBASE_STORAGE.md) - Upload de arquivos
- [VIRTUAL_STAGING.md](./VIRTUAL_STAGING.md) - Processamento de imagens
- [README.md](./README.md) - Visão geral da API

---

## 🆘 Suporte

- **Email:** renato@ruum.com.br
- **Documentação:** Esta pasta CRM_INTEGRATION
- **Resposta:** 24-48h úteis
