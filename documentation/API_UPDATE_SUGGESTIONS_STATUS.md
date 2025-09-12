# API Route: Update Suggestions Status

## 📍 **Endpoint**
```
POST /api/update-suggestions-status
```

## 📋 **Descrição**
Atualiza o status de registros na tabela "Image suggestions" do Airtable.

## 📥 **Request Body**
```json
{
  "suggestionIds": ["rec123", "rec456", "rec789"],
  "status": "Approved"
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `suggestionIds` | `Array<string>` | ✅ | Array com IDs dos registros de sugestões |
| `status` | `string` | ❌ | Novo status (padrão: "Approved") |

### Status Válidos
- `"Approved"` (padrão)
- `"Rejected"`
- `"In Review"`
- `"Pending"`
- Qualquer outro valor válido no Airtable

## 📤 **Response**

### Sucesso (200)
```json
{
  "success": true,
  "message": "2 suggestions updated successfully, 1 errors",
  "data": {
    "updated": 2,
    "errors": 1,
    "total": 3,
    "details": [
      {
        "id": "rec123",
        "status": "success",
        "message": "Status atualizado para Approved"
      },
      {
        "id": "rec456", 
        "status": "success",
        "message": "Status atualizado para Approved"
      },
      {
        "id": "rec789",
        "status": "error",
        "message": "Could not find what you are looking for"
      }
    ]
  }
}
```

### Erro de Validação (400)
```json
{
  "success": false,
  "message": "suggestionIds must be an array of suggestion IDs"
}
```

### Erro do Servidor (500)
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Detailed error message"
}
```

## 🚀 **Exemplos de Uso**

### cURL
```bash
# Aprovar sugestões
curl -X POST http://localhost:8080/api/update-suggestions-status \
  -H "Content-Type: application/json" \
  -d '{
    "suggestionIds": ["rec123", "rec456"],
    "status": "Approved"
  }'

# Rejeitar sugestão
curl -X POST http://localhost:8080/api/update-suggestions-status \
  -H "Content-Type: application/json" \
  -d '{
    "suggestionIds": ["rec789"],
    "status": "Rejected"
  }'
```

### JavaScript/Fetch
```javascript
// Aprovar múltiplas sugestões
const response = await fetch('/api/update-suggestions-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suggestionIds: ['rec123', 'rec456', 'rec789'],
    status: 'Approved'
  })
});

const result = await response.json();
console.log(`${result.data.updated} sugestões aprovadas`);
```

### Axios
```javascript
import axios from 'axios';

try {
  const response = await axios.post('/api/update-suggestions-status', {
    suggestionIds: ['rec123', 'rec456'],
    status: 'In Review'
  });
  
  console.log('Sucesso:', response.data.message);
} catch (error) {
  console.error('Erro:', error.response.data.message);
}
```

## 📊 **Logs Produzidos**

```
📝 Received request to update suggestions status
📊 Parameters: 3 suggestion IDs, status: "Approved"
🚀 Updating status for 3 suggestions...
🔄 Iniciando atualização de status para 3 sugestões
📝 Atualizando 3 sugestões para status 'Approved'
✅ Sugestão rec123 marcada como Approved
✅ Sugestão rec456 marcada como Approved
❌ Erro ao atualizar sugestão rec789: Could not find what you are looking for
🎯 Atualização concluída: 2 sucessos, 1 erros
✅ Update complete: 2 successful, 1 errors
❌ Errors details:
  - rec789: Could not find what you are looking for
```

## 🛡️ **Validações**

1. **suggestionIds obrigatório**: Deve ser um array
2. **Array não vazio**: Deve conter pelo menos um ID
3. **status opcional**: Usa "Approved" como padrão
4. **IDs inválidos**: Tratados individualmente, não interrompem o processo

## 🔗 **Relacionamento com outras rotas**

Esta rota complementa `/api/update-images-airtable`:
- `/update-images-airtable`: Cria registros na tabela Images
- `/update-suggestions-status`: Atualiza status na tabela Image suggestions

## ⚙️ **Configuração**

Utiliza as mesmas variáveis de ambiente:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`

Tabela: `"Image suggestions"`
Campo: `"Suggestion Status"`
