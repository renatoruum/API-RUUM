# 👁️ XML Watcher - API Documentation

## 📋 **Visão Geral**

O XML Watcher é um serviço de monitoramento que permite acompanhar URLs de XML em tempo real, fazendo importações automáticas periódicas de dados de imóveis. Ideal para manter sincronizados os dados de sistemas externos.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
AIRTABLE_API_KEY=sua_chave_aqui
AIRTABLE_BASE_ID=seu_base_id_aqui
```

**Obs**: Requer acesso à URL do XML e conta válida no Airtable.

## 🛠️ **Endpoints Disponíveis**

### **1. Iniciar Monitoramento**
```http
POST /api/start-xmlwatcher
```

**Descrição**: Inicia o monitoramento de uma URL XML com importação automática em intervalos definidos.

**Parâmetros da Requisição:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `xmlUrl` | string | ✅ | URL do arquivo XML a ser monitorado |
| `intervalMinutes` | number | ❌ | Intervalo em minutos entre verificações (padrão: 5) |

**Exemplo de Requisição:**
```json
{
  "xmlUrl": "https://example.com/imoveis.xml",
  "intervalMinutes": 10
}
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "message": "XML Watcher iniciado com sucesso",
  "config": {
    "xmlUrl": "https://example.com/imoveis.xml",
    "intervalMinutes": 10,
    "nextExecution": "2024-01-15T10:40:00Z"
  }
}
```

### **2. Parar Monitoramento**
```http
POST /api/stop-xmlwatcher
```

**Descrição**: Para o monitoramento ativo do XML.

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "message": "XML Watcher parado com sucesso"
}
```

### **3. Status do Monitoramento**
```http
GET /api/xmlwatcher-status
```

**Descrição**: Retorna o status atual do monitoramento.

**Exemplo de Resposta - Ativo:**
```json
{
  "success": true,
  "status": "active",
  "config": {
    "xmlUrl": "https://example.com/imoveis.xml",
    "intervalMinutes": 10,
    "lastExecution": "2024-01-15T10:30:00Z",
    "nextExecution": "2024-01-15T10:40:00Z",
    "executionCount": 5,
    "lastResult": {
      "success": true,
      "count": 25,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Exemplo de Resposta - Inativo:**
```json
{
  "success": true,
  "status": "inactive",
  "message": "Nenhum monitoramento ativo"
}
```

## 🔄 **Processo de Monitoramento**

### **Ciclo de Execução:**
1. **Busca**: Faz download do XML da URL configurada
2. **Validação**: Verifica se o conteúdo é um XML válido
3. **Parsing**: Parseia o XML usando o connector xmlParser
4. **Sincronização**: Sincroniza dados com o Airtable
5. **Log**: Registra resultado da operação
6. **Agendamento**: Programa próxima execução

### **Fluxo de Dados:**
```
URL XML → Download → Parse → Normalização → Airtable → Log → Próxima Execução
```

## ⚠️ **Tratamento de Erros**

### **Erro de URL Obrigatória (400)**
```json
{
  "success": false,
  "message": "xmlUrl is required"
}
```

### **Erro de Download (500)**
```json
{
  "success": false,
  "message": "Erro ao baixar XML",
  "error": "Failed to fetch XML: Connection timeout"
}
```

### **Erro de Parsing (500)**
```json
{
  "success": false,
  "message": "Erro ao processar XML",
  "error": "Invalid XML structure"
}
```

### **Erro de Sincronização (500)**
```json
{
  "success": false,
  "message": "Erro na sincronização",
  "error": "Airtable API error: Rate limit exceeded"
}
```

## 📊 **Monitoramento e Logs**

### **Informações Logadas:**
- **Início**: Timestamp do início da execução
- **XML**: Primeiros 6000 caracteres do XML baixado
- **Parsing**: Número de imóveis encontrados
- **Sincronização**: Resultado da operação no Airtable
- **Erros**: Detalhes de qualquer erro encontrado
- **Duração**: Tempo total da execução

### **Exemplo de Log:**
```
[2024-01-15T10:30:00Z] XML Watcher: Iniciando busca...
[2024-01-15T10:30:01Z] XML baixado com sucesso (125KB)
[2024-01-15T10:30:02Z] XML início: <?xml version="1.0"?>...
[2024-01-15T10:30:03Z] Parsing concluído: 25 imóveis encontrados
[2024-01-15T10:30:05Z] Sincronização concluída: 25 imóveis processados
[2024-01-15T10:30:05Z] Próxima execução: 2024-01-15T10:40:00Z
```

## 🔧 **Configurações Avançadas**

### **Intervalos Recomendados:**
- **Desenvolvimento**: 1-2 minutos
- **Produção**: 5-15 minutos
- **Grandes volumes**: 30-60 minutos

### **Considerações de Performance:**
- XMLs grandes podem demorar mais para processar
- Intervalos muito pequenos podem causar sobrecarga
- Monitorar uso de recursos do servidor

## 🚀 **Exemplos de Uso**

### **Iniciar Monitoramento Básico**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/start-xmlwatcher \
  -H "Content-Type: application/json" \
  -d '{
    "xmlUrl": "https://imobiliaria.com/feed.xml",
    "intervalMinutes": 15
  }'
```

### **Monitoramento com Intervalo Personalizado**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/start-xmlwatcher \
  -H "Content-Type: application/json" \
  -d '{
    "xmlUrl": "https://crm.imobiliaria.com/export/imoveis.xml",
    "intervalMinutes": 30
  }'
```

### **Verificar Status**
```bash
curl -X GET https://apiruum-667905204535.us-central1.run.app/api/xmlwatcher-status
```

### **Parar Monitoramento**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/stop-xmlwatcher
```

## 📝 **Boas Práticas**

1. **URL Estável**: Use URLs que não mudam frequentemente
2. **Intervalos Apropriados**: Não exagere na frequência
3. **Monitoramento**: Acompanhe os logs regularmente
4. **Backup**: Mantenha backup dos dados importantes
5. **Testes**: Teste com URLs pequenas primeiro

## 🔗 **Recursos Relacionados**

- [XML Import API](./XML_IMPORT_API.md)
- [XML Parser Connector](./XML_PARSER_CONNECTOR.md)
- [Airtable Sync Documentation](./AIRTABLE_CONNECTOR.md)

## ⚙️ **Limitações**

- Apenas um monitoramento ativo por vez
- Dependente da disponibilidade da URL externa
- Sujeito aos limites de rate da API do Airtable
- Requer servidor sempre ativo para funcionar
