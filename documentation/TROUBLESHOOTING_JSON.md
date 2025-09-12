# Guia de Troubleshooting - Erro JSON Parse

## 🔍 **Problema Identificado**
O erro `SyntaxError: Expected ':' after property name in JSON at position 168` indica que:
- Algum endpoint está recebendo XML mas tentando fazer parse como JSON
- O content-type pode estar incorreto na requisição

## 🛠️ **Soluções Implementadas**

### 1. **Middleware de Debug Melhorado**
- ✅ Logs detalhados de todas as requisições
- ✅ Detecção automática de XML sendo enviado para endpoints JSON
- ✅ Tratamento de erro específico com contexto

### 2. **Novo Endpoint Específico para Gaia**
```
POST /api/gaia-webhook
```
- ✅ Aceita qualquer tipo de conteúdo (XML, JSON, raw)
- ✅ Detecta automaticamente o formato
- ✅ Processa XML diretamente
- ✅ Suporte a JSON com URLs de XML

### 3. **Tratamento de Erro Global**
- ✅ Captura erros de JSON parse
- ✅ Fornece informações detalhadas sobre o erro
- ✅ Retorna respostas HTTP apropriadas

## 🚀 **Como Testar**

### Teste 1: Endpoint Específico do Gaia
```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/gaia-webhook \
  -H "Content-Type: application/xml" \
  -d "$(curl -s 'https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d')"
```

### Teste 2: Endpoint com JSON contendo URL
```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/gaia-webhook \
  -H "Content-Type: application/json" \
  -d '{"xmlUrl": "https://imob.valuegaia.com.br/integra/midia.ashx?midia=GaiaWebServiceImovel&p=oJuOgoDTmQBwVg0R9GOqeWkllDM7TsuEos5BGp00ZaIzDgkrK%2b2Ej6I0bXtmtelKWfDS%2f0m2ePc%3d"}'
```

## 📊 **Monitoramento**

### Logs Disponíveis
1. **Request Info**: Método, URL, headers
2. **Body Preview**: Primeiros 200 caracteres do body
3. **Error Context**: Posição exata do erro JSON
4. **Content Detection**: XML vs JSON automático

### Verificar Logs
```bash
gcloud logs read "projects/api-ruum-project/logs/apiruum" --limit=50 --format="table(timestamp,textPayload)"
```

## 🔧 **Endpoints Disponíveis**

| Endpoint | Tipo | Descrição |
|----------|------|-----------|
| `/api/import-xml` | XML | Importação direta de XML |
| `/api/gaia-webhook` | ANY | Endpoint inteligente para Gaia |
| `/webhook` | JSON | Webhook genérico |
| `/api/start-xmlwatcher` | JSON | Observador de XML por URL |

## 🎯 **Próximos Passos**

1. **Identificar a Origem**: Use os logs para ver qual endpoint está recebendo o erro
2. **Verificar Content-Type**: Confirmar se o header está correto
3. **Testar Endpoint Específico**: Usar `/api/gaia-webhook` se for conteúdo do Gaia
4. **Verificar Integração**: Se for webhook externo, ajustar o content-type

## 📞 **Debug em Tempo Real**

Para debug em tempo real, os logs agora mostram:
- ✅ URL da requisição
- ✅ Headers completos
- ✅ Preview do body
- ✅ Tipo de conteúdo detectado
- ✅ Contexto do erro com posição exata

## ⚡ **Solução Rápida**

Se o erro persistir, substitua o endpoint atual por:
```
https://apiruum-2cpzkgiiia-uc.a.run.app/api/gaia-webhook
```

Este endpoint aceita qualquer formato e faz a detecção automática!
