# 🗄️ Airtable Connector - Documentation

## 📋 **Visão Geral**

O conector Airtable fornece funcionalidades para sincronizar dados entre a aplicação e uma base do Airtable. Suporta operações CRUD completas para imóveis e imagens, incluindo upsert inteligente e sincronização em lote.

## 🔑 **Configuração**

### **Variáveis de Ambiente Obrigatórias:**
```bash
AIRTABLE_API_KEY=sua_chave_aqui
AIRTABLE_BASE_ID=seu_base_id_aqui
AIRTABLE_TABLE_NAME=nome_da_tabela_principal
```

### **Inicialização:**
```javascript
import { 
  getDataFromAirtable, 
  upsetImagesInAirtable, 
  syncImoveisWithAirtable 
} from "../connectors/airtable.js";
```

## 🛠️ **Funções Disponíveis**

### **1. getDataFromAirtable()**
Busca todos os registros da tabela principal do Airtable.

**Sintaxe:**
```javascript
const data = await getDataFromAirtable();
```

**Retorna:**
```javascript
[
  {
    id: "recXXXXXXXXXXXXXX",
    fields: {
      "Nome": "Apartamento Moderno",
      "Preco": 850000,
      "Cidade": "São Paulo",
      // ... outros campos
    }
  }
]
```

### **2. upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId)**
Atualiza ou insere imagens na tabela "Images" do Airtable.

**Parâmetros:**
- `imagesArray` (Array): Lista de objetos com dados das imagens
- `email` (string, opcional): Email do cliente
- `clientId` (string, opcional): ID do cliente
- `invoiceId` (string, opcional): ID da fatura
- `userId` (string, opcional): ID do usuário

**Sintaxe:**
```javascript
const results = await upsetImagesInAirtable(
  [
    {
      url: "https://example.com/image1.jpg",
      name: "Sala de Estar",
      description: "Imagem da sala principal",
      property_id: "prop_001",
      room_type: "living_room",
      processing_type: "original"
    }
  ],
  "cliente@example.com",
  "client_123",
  "invoice_456",
  "user_789"
);
```

**Retorna:**
```javascript
[
  {
    status: "created", // ou "updated" ou "error"
    id: "recXXXXXXXXXXXXXX",
    url: "https://example.com/image1.jpg",
    name: "Sala de Estar",
    error: null // ou mensagem de erro
  }
]
```

### **3. syncImoveisWithAirtable(imoveis)**
Sincroniza uma lista de imóveis com a tabela principal do Airtable.

**Parâmetros:**
- `imoveis` (Array): Lista de objetos com dados dos imóveis

**Sintaxe:**
```javascript
await syncImoveisWithAirtable([
  {
    codigo: "123456",
    titulo: "Apartamento Moderno",
    categoria: "Apartamento",
    cidade: "São Paulo",
    valor: "850000",
    area: "85",
    quartos: "2",
    banheiros: "2",
    vagas: "1",
    descricao: "Apartamento com vista para o parque",
    fotos: [
      {
        url: "https://example.com/foto1.jpg",
        destaque: true
      }
    ]
  }
]);
```

**Processo:**
1. Verifica se imóvel já existe (por código)
2. Se existe: atualiza registro
3. Se não existe: cria novo registro
4. Processa fotos associadas

## 📊 **Estrutura de Dados**

### **Tabela Principal (Imóveis):**
```javascript
{
  "Codigo": "123456",
  "Titulo": "Apartamento Moderno",
  "Categoria": "Apartamento",
  "Cidade": "São Paulo",
  "Bairro": "Vila Madalena",
  "Endereco": "Rua das Flores, 123",
  "Valor": "850000",
  "Area": "85",
  "Quartos": "2",
  "Banheiros": "2",
  "Vagas": "1",
  "Descricao": "Apartamento com vista para o parque",
  "Fotos": [
    {
      "url": "https://example.com/foto1.jpg"
    }
  ]
}
```

### **Tabela Images:**
```javascript
{
  "URL": "https://example.com/image1.jpg",
  "Name": "Sala de Estar - Staged",
  "Description": "Imagem com staging virtual",
  "Email": "cliente@example.com",
  "Client ID": "client_123",
  "Invoice ID": "invoice_456",
  "User ID": "user_789",
  "Property ID": "prop_001",
  "Room Type": "living_room",
  "Processing Type": "virtual_staging",
  "Created At": "2024-01-15T10:30:00Z",
  "Updated At": "2024-01-15T10:30:00Z"
}
```

## 🔄 **Lógica de Upsert**

### **Para Imóveis:**
1. Busca por código existente
2. Se encontrado: atualiza campos
3. Se não encontrado: cria novo registro

### **Para Imagens:**
1. Busca por URL existente
2. Se encontrado: atualiza metadados
3. Se não encontrado: cria novo registro

## ⚠️ **Tratamento de Erros**

### **Erros Comuns:**
- **API Key inválida**: Verificar variável de ambiente
- **Base ID inválido**: Verificar configuração da base
- **Rate limit**: Aguardar antes de nova tentativa
- **Campos obrigatórios**: Validar dados antes do envio

### **Exemplo de Erro:**
```javascript
{
  status: "error",
  url: "https://example.com/image1.jpg",
  error: "INVALID_REQUEST_BODY: Invalid field name 'InvalidField'"
}
```

## 🔧 **Funções Internas**

### **upsertImovelInAirtable(imovel)**
Cria ou atualiza um imóvel individual.

### **Processo de Sincronização:**
1. Normaliza dados do imóvel
2. Verifica existência por código
3. Prepara dados para Airtable
4. Executa operação (create/update)
5. Processa fotos associadas

## 📝 **Mapeamento de Campos**

### **Imóveis XML → Airtable:**
```javascript
const fieldMapping = {
  codigo: "Codigo",
  titulo: "Titulo",
  categoria: "Categoria",
  cidade: "Cidade",
  bairro: "Bairro",
  endereco: "Endereco",
  valor: "Valor",
  area: "Area",
  quartos: "Quartos",
  banheiros: "Banheiros",
  vagas: "Vagas",
  descricao: "Descricao"
};
```

### **Imagens → Airtable:**
```javascript
const imageFields = {
  url: "URL",
  name: "Name",
  description: "Description",
  email: "Email",
  clientId: "Client ID",
  invoiceId: "Invoice ID",
  userId: "User ID",
  property_id: "Property ID",
  room_type: "Room Type",
  processing_type: "Processing Type"
};
```

## 🚀 **Exemplos de Uso**

### **Buscar Dados:**
```javascript
try {
  const data = await getDataFromAirtable();
  console.log(`Encontrados ${data.length} registros`);
  
  data.forEach(record => {
    console.log(`ID: ${record.id}`);
    console.log(`Título: ${record.fields.Titulo}`);
  });
} catch (error) {
  console.error("Erro ao buscar dados:", error);
}
```

### **Sincronizar Imóveis:**
```javascript
const imoveis = [
  {
    codigo: "123456",
    titulo: "Casa Moderna",
    categoria: "Casa",
    cidade: "São Paulo",
    valor: "750000",
    area: "120",
    quartos: "3",
    banheiros: "2",
    vagas: "2"
  }
];

try {
  await syncImoveisWithAirtable(imoveis);
  console.log("Sincronização concluída");
} catch (error) {
  console.error("Erro na sincronização:", error);
}
```

### **Atualizar Imagens:**
```javascript
const imagens = [
  {
    url: "https://example.com/sala.jpg",
    name: "Sala de Estar",
    description: "Sala principal da casa",
    room_type: "living_room",
    processing_type: "original"
  }
];

try {
  const results = await upsetImagesInAirtable(
    imagens,
    "cliente@example.com",
    "client_123"
  );
  
  results.forEach(result => {
    console.log(`${result.status}: ${result.name}`);
  });
} catch (error) {
  console.error("Erro ao atualizar imagens:", error);
}
```

## 📊 **Monitoramento**

### **Logs Importantes:**
- Número de registros processados
- Status de cada operação (created/updated/error)
- Tempo de processamento
- Erros de validação ou API

### **Métricas:**
- Taxa de sucesso das operações
- Tempo médio de resposta
- Frequência de erros por tipo

## 🔗 **Recursos Relacionados**

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [XML Parser Connector](./XML_PARSER_CONNECTOR.md)
- [Rate Limits Guide](https://airtable.com/developers/web/api/rate-limits)

## ⚙️ **Limitações**

- **Rate Limits**: 5 requisições por segundo
- **Batch Size**: Máximo 10 registros por operação
- **Field Limits**: Máximo 100 campos por tabela
- **Attachment Size**: Máximo 20MB por arquivo
