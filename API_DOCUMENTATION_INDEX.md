# 📚 API Ruum - Complete Documentation Index

## 📋 **Visão Geral**

A API Ruum é uma solução completa para processamento de imagens e dados imobiliários, oferecendo integração com diversas ferramentas de IA e sistemas de gerenciamento de dados.

## 🚀 **Endpoints Disponíveis**

### **🤖 Processamento de IA**
- **[ChatGPT Generic API](./CHATGPT_GENERIC_API.md)** - Processamento genérico de imagens com IA
  - `POST /api/chatgpt` - Virtual staging, identificação de ambiente, geração de scripts
  
- **[Virtual Staging AI](./VIRTUAL_STAGING_API.md)** - Staging virtual de imóveis
  - `GET /api/virtual-staging/test` - Teste de conexão
  - `GET /api/virtual-staging/options` - Opções disponíveis
  - `POST /api/virtual-staging/process` - Processar imagem
  
- **[ElevenLabs API](./ELEVENLABS_ISSUE.md)** - Geração de áudio/voz
  - `POST /api/elevenlabs` - Síntese de voz
  
- **[Runway ML API](./RUNWAY_API.md)** - Geração de imagens e vídeos
  - `POST /api/runway` - Gerar imagem
  - `POST /api/runway/image-to-video` - Converter imagem para vídeo

### **🎬 Edição de Vídeo**
- **[ShotStack API](./SHOTSTACK_API.md)** - Renderização de vídeos
  - `POST /api/send-shotstack` - Renderizar vídeo
  - `GET /api/shotstack-status/:id` - Status da renderização

### **🗄️ Gerenciamento de Dados**
- **[Airtable Images API](./AIRTABLE_IMAGES_API.md)** - Atualização de imagens
  - `POST /api/update-images-airtable` - Atualizar imagens em lote
  
- **[XML Import API](./XML_IMPORT_API.md)** - Importação de dados XML
  - `POST /api/import-xml` - Importar imóveis do XML
  
- **[XML Watcher API](./XML_WATCHER_API.md)** - Monitoramento de XML
  - `POST /api/start-xmlwatcher` - Iniciar monitoramento
  - `POST /api/stop-xmlwatcher` - Parar monitoramento
  - `GET /api/xmlwatcher-status` - Status do monitoramento

### **🪝 Webhooks**
- **[Webhook API](./WEBHOOK_API.md)** - Endpoint de webhook
  - `POST /webhook` - Processar dados externos

## 🔧 **Connectors Disponíveis**

### **🤖 Conectores de IA**
- **[ChatGPT Connector](./src/connectors/chatgpt.js)** - Integração com OpenAI
- **[Virtual Staging Connector](./src/connectors/virtualStaging.js)** - Virtual Staging AI
- **[ElevenLabs Connector](./src/connectors/elevenlabs.js)** - Síntese de voz
- **[Runway Connector](./RUNWAY_CONNECTOR.md)** - Runway ML SDK

### **🗄️ Conectores de Dados**
- **[Airtable Connector](./AIRTABLE_CONNECTOR.md)** - Operações CRUD no Airtable
- **[XML Parser Connector](./XML_PARSER_CONNECTOR.md)** - Parsing de XML imobiliário

## 📊 **Arquitetura da API**

### **Estrutura de Pastas:**
```
src/
├── app.js                 # Aplicação principal Express
├── routes/               # Rotas da API
│   ├── sendChatGpt.js    # Rota ChatGPT
│   ├── sendRunway.js     # Rota Runway
│   ├── sendShotStack.js  # Rota ShotStack
│   ├── sendElevenLabs.js # Rota ElevenLabs
│   ├── sendVirtualStaging.js # Rota Virtual Staging
│   ├── updateImagesAirtable.js # Rota Airtable Images
│   ├── importXml.js      # Rota Import XML
│   └── xmlWatcher.js     # Rota XML Watcher
├── connectors/           # Conectores externos
│   ├── chatgpt.js        # Conector ChatGPT
│   ├── runway.js         # Conector Runway
│   ├── elevenlabs.js     # Conector ElevenLabs
│   ├── virtualStaging.js # Conector Virtual Staging
│   ├── airtable.js       # Conector Airtable
│   └── xmlParser.js      # Conector XML Parser
└── scripts/              # Scripts auxiliares
    └── gerarimageimob.js # Geração de imagens
```

## 🔑 **Variáveis de Ambiente**

### **Configuração Completa:**
```bash
# OpenAI/ChatGPT
OPENAI_API_KEY=sua_chave_openai

# Runway ML
RUNWAYML_API_SECRET=sua_chave_runway

# ShotStack
SHOTSTACK_API_KEY=sua_chave_shotstack

# ElevenLabs
ELEVENLABS_API_KEY=sua_chave_elevenlabs

# Virtual Staging AI
VIRTUAL_STAGING_API_KEY=sua_chave_virtualstaging

# Airtable
AIRTABLE_API_KEY=sua_chave_airtable
AIRTABLE_BASE_ID=seu_base_id
AIRTABLE_TABLE_NAME=nome_da_tabela

# Aplicação
PORT=8080
```

## 🚀 **Como Usar**

### **1. Instalação:**
```bash
npm install
```

### **2. Configuração:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas chaves
```

### **3. Execução:**
```bash
npm start
```

### **4. Deploy:**
```bash
# Consulte DEPLOY.md para instruções de deploy
```

## 📱 **Exemplos de Uso**

### **Processamento de Imagem:**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/chatgpt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/room.jpg",
    "processing_type": "VIRTUAL_STAGING",
    "room_type": "sala de estar",
    "style": "moderno"
  }'
```

### **Geração de Vídeo:**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/send-shotstack \
  -H "Content-Type: application/json" \
  -d '{
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "image",
                "src": "https://example.com/property.jpg"
              },
              "start": 0,
              "length": 5
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "resolution": "hd"
    }
  }'
```

### **Importação de Dados:**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/import-xml \
  -H "Content-Type: application/xml" \
  -d @imoveis.xml
```

## 🔄 **Fluxos de Trabalho**

### **1. Processamento de Imagem Completo:**
```
Imagem → ChatGPT → Virtual Staging → Airtable → Webhook
```

### **2. Geração de Conteúdo:**
```
Prompt → Runway → Geração → ShotStack → Vídeo Final
```

### **3. Sincronização de Dados:**
```
XML → Parser → Normalização → Airtable → Webhook
```

## 📊 **Monitoramento**

### **Logs Disponíveis:**
- Requisições e respostas de API
- Erros e exceções
- Tempo de processamento
- Status de tarefas em background

### **Métricas Importantes:**
- Taxa de sucesso por endpoint
- Tempo médio de resposta
- Uso de recursos (créditos de IA)
- Frequência de erros

## 🛠️ **Desenvolvimento**

### **Adicionando Nova Rota:**
1. Criar arquivo em `src/routes/`
2. Implementar lógica de negócio
3. Adicionar rota em `src/app.js`
4. Criar documentação correspondente

### **Adicionando Novo Conector:**
1. Criar arquivo em `src/connectors/`
2. Implementar funções necessárias
3. Adicionar tratamento de erros
4. Documentar API externa

## 📋 **Checklist de Documentação**

### **Rotas Documentadas:**
- ✅ ChatGPT Generic API
- ✅ Virtual Staging AI
- ✅ ElevenLabs API
- ✅ Runway ML API
- ✅ ShotStack API
- ✅ Airtable Images API
- ✅ XML Import API
- ✅ XML Watcher API
- ✅ Webhook API

### **Conectores Documentados:**
- ✅ Airtable Connector
- ✅ XML Parser Connector
- ✅ Runway Connector
- ✅ ChatGPT Connector (inline)
- ✅ Virtual Staging Connector (inline)
- ✅ ElevenLabs Connector (inline)

## 🔗 **Recursos Úteis**

- **[Guia de Deploy](./DEPLOY.md)** - Instruções de deployment
- **[Guia de Migração](./MIGRATION_GUIDE.md)** - Migração entre versões
- **[Exemplos de XML](./xml/)** - Exemplos de arquivos XML
- **[Mocks](./mocks/)** - Dados de teste

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Consulte a documentação específica da API
2. Verifique os logs de erro
3. Teste com dados de exemplo
4. Verifique configuração de variáveis de ambiente

## 🆕 **Versão Atual**

- **API Version**: 1.0.0
- **Última Atualização**: 3 de julho de 2025
- **Compatibilidade**: Node.js 18+, Express 4.x
