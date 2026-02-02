# 🔐 Autenticação e Segurança

> Guia completo de autenticação para integração segura com a API Ruum

---

## 📋 Visão Geral

A API Ruum utiliza **API Keys** para autenticação. Cada requisição deve incluir sua chave de API no header `Authorization`.

---

## 🔑 Obtendo sua API Key

1. **Contato com a equipe Ruum** via email: integracoes@ruum.com.br
2. **Receba sua API Key** no formato: `ruum_live_abc123xyz...`
3. **Armazene com segurança** (nunca compartilhe ou comite no Git)

### Tipos de API Key

| Tipo | Prefixo | Ambiente | Uso |
|------|---------|----------|-----|
| **Produção** | `ruum_live_` | Production | Uso real, cobrado |
| **Teste** | `ruum_test_` | Staging | Desenvolvimento, testes |

---

## 📨 Como Autenticar

### Header Obrigatório

Todas as requisições devem incluir:

```http
Authorization: Bearer YOUR_API_KEY
```

### Exemplos por Linguagem

#### cURL

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline \
  -H "Authorization: Bearer ruum_live_abc123xyz..." \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}'
```

#### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = process.env.RUUM_API_KEY; // NÃO hardcode a chave!

const response = await axios.post(
  'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline',
  { imageUrl: 'https://example.com/image.jpg' },
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

#### Python

```python
import requests
import os

API_KEY = os.getenv('RUUM_API_KEY')  # NÃO hardcode a chave!

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline',
    json={'imageUrl': 'https://example.com/image.jpg'},
    headers=headers
)
```

#### PHP

```php
<?php
$apiKey = getenv('RUUM_API_KEY'); // NÃO hardcode a chave!

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/full-pipeline');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'imageUrl' => 'https://example.com/image.jpg'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
?>
```

---

## 🔒 Melhores Práticas de Segurança

### ✅ Faça Isso:

1. **Use variáveis de ambiente** para armazenar a API Key
   ```bash
   export RUUM_API_KEY="ruum_live_abc123..."
   ```

2. **Adicione ao .gitignore** arquivos com credenciais
   ```gitignore
   .env
   .env.local
   config/secrets.json
   ```

3. **Use secrets managers** em produção:
   - AWS Secrets Manager
   - Google Secret Manager
   - Azure Key Vault
   - HashiCorp Vault

4. **Rotacione chaves periodicamente** (a cada 90 dias)

5. **Use HTTPS sempre** (nunca HTTP)

6. **Limite acesso** por IP quando possível

### ❌ Nunca Faça Isso:

1. ❌ **Hardcode** a API Key no código
   ```javascript
   // NUNCA faça isso!
   const API_KEY = "ruum_live_abc123...";
   ```

2. ❌ **Commite** chaves no Git
   ```bash
   # Verifique antes de commitar
   git diff | grep -i "ruum_live"
   ```

3. ❌ **Compartilhe** chaves via email/Slack sem criptografia

4. ❌ **Use chaves de produção** em desenvolvimento

5. ❌ **Exponha** chaves no frontend (JavaScript do navegador)

---

## 🛡️ Validação de API Key

### Endpoint de Teste

Para validar se sua API Key está funcionando:

```bash
curl -X GET https://apiruum-562831020087.us-central1.run.app/api/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "message": "API is healthy",
  "auth": {
    "valid": true,
    "type": "production",
    "quota": {
      "used": 142,
      "limit": 10000,
      "remaining": 9858
    }
  }
}
```

### Resposta de Erro (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

---

## 🚨 Códigos de Erro de Autenticação

| Código HTTP | Erro | Causa | Solução |
|-------------|------|-------|---------|
| **401** | `MISSING_API_KEY` | Header Authorization ausente | Adicione o header |
| **401** | `INVALID_API_KEY` | Chave inválida ou malformada | Verifique a chave |
| **401** | `EXPIRED_API_KEY` | Chave expirada | Solicite nova chave |
| **401** | `REVOKED_API_KEY` | Chave revogada por segurança | Contate suporte |
| **403** | `FORBIDDEN` | IP não autorizado | Verifique whitelist de IPs |

---

## 📊 Monitoramento de Uso

### Verificar Quota Atual

```bash
curl -X GET https://apiruum-562831020087.us-central1.run.app/api/usage \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Resposta

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "startDate": "2026-02-01",
    "endDate": "2026-02-28",
    "quota": {
      "total": 10000,
      "used": 1234,
      "remaining": 8766,
      "percentUsed": 12.34
    },
    "breakdown": {
      "virtualStaging": 450,
      "videoBeforeAfter": 320,
      "magicMotion": 234,
      "magicDrop": 230
    },
    "alerts": []
  }
}
```

### Alertas de Quota

Quando você atingir determinados limites:

```json
{
  "alerts": [
    {
      "level": "warning",
      "message": "Você usou 80% da sua quota mensal",
      "action": "Considere aumentar seu plano"
    }
  ]
}
```

---

## 🔐 IP Whitelisting (Opcional)

Para segurança adicional, você pode solicitar restrição por IP:

### 1. Solicite Ativação

Email para: integracoes@ruum.com.br com:
- Sua API Key
- Lista de IPs autorizados (IPv4/IPv6)

### 2. Formato

```json
{
  "allowedIPs": [
    "203.0.113.0/24",
    "198.51.100.50",
    "2001:db8::/32"
  ]
}
```

### 3. Teste

```bash
# De um IP autorizado
curl https://apiruum.../api/health -H "Authorization: Bearer KEY"
# ✅ 200 OK

# De um IP NÃO autorizado
curl https://apiruum.../api/health -H "Authorization: Bearer KEY"
# ❌ 403 Forbidden
```

---

## 🔄 Rotação de API Keys

### Quando Rotacionar:

- ✅ A cada 90 dias (recomendado)
- ✅ Suspeita de comprometimento
- ✅ Funcionário com acesso saiu da empresa
- ✅ Auditoria de segurança

### Processo:

1. **Solicite nova chave** (integracoes@ruum.com.br)
2. **Receba a nova chave** e armazene com segurança
3. **Implemente a nova chave** em staging
4. **Teste completamente** em ambiente de teste
5. **Deploy em produção** com a nova chave
6. **Solicite revogação** da chave antiga
7. **Confirme** que a chave antiga foi revogada

### Rotação Zero-Downtime:

```javascript
// Suporta duas chaves simultaneamente durante migração
const API_KEYS = [
  process.env.RUUM_API_KEY_NEW,  // Nova (primária)
  process.env.RUUM_API_KEY_OLD   // Antiga (fallback)
];

async function makeRequest(url, data) {
  for (const key of API_KEYS) {
    try {
      return await axios.post(url, data, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        continue; // Tenta próxima chave
      }
      throw error;
    }
  }
  throw new Error('Todas as API keys falharam');
}
```

---

## 🔍 Debugging de Autenticação

### Problema: 401 Unauthorized

**Checklist de debug:**

```bash
# 1. Verifique se a chave está definida
echo $RUUM_API_KEY

# 2. Verifique o formato
echo $RUUM_API_KEY | grep -E '^ruum_(live|test)_[a-zA-Z0-9]+'

# 3. Teste com curl verbose
curl -v -X GET https://apiruum.../api/health \
  -H "Authorization: Bearer $RUUM_API_KEY"

# 4. Verifique espaços extras
echo -n $RUUM_API_KEY | wc -c  # Deve ter tamanho esperado
```

### Logs de Debugging

```javascript
// Adicione logs (CUIDADO: não logue a chave completa em prod!)
const apiKey = process.env.RUUM_API_KEY;

console.log('API Key presente:', !!apiKey);
console.log('API Key length:', apiKey?.length);
console.log('API Key prefix:', apiKey?.substring(0, 10) + '...');

// Em desenvolvimento apenas:
if (process.env.NODE_ENV === 'development') {
  console.log('Headers:', {
    'Authorization': `Bearer ${apiKey.substring(0, 20)}...`
  });
}
```

---

## 📚 Referências Relacionadas

- [Quick Start Guide](./QUICKSTART.md) - Exemplos práticos de autenticação
- [Error Codes](./ERROR_CODES.md) - Todos os códigos de erro
- [Rate Limits](./RATE_LIMITS.md) - Limites de uso e quotas

---

## 🆘 Suporte

**Problemas com autenticação?**
- 📧 Email: integracoes@ruum.com.br
- 💬 Slack: #api-suporte (canal do parceiro)
- 📞 Emergências: +55 (11) 9xxxx-xxxx (somente para clientes enterprise)

---

**Última atualização:** Fevereiro 2026
