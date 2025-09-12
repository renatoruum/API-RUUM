# Função updateImageSuggestionsStatus

## 📋 **Descrição**
Função dedicada para atualizar o status de registros na tabela "Image suggestions" do Airtable.

## 🎯 **Propósito**
Esta função foi extraída da `upsetImagesInAirtable` para permitir atualizações independentes do status das sugestões, facilitando manutenção e reutilização.

## 📝 **Assinatura**
```javascript
async function updateImageSuggestionsStatus(suggestionIds, status = "Approved")
```

## 📥 **Parâmetros**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `suggestionIds` | `Array<string>` | - | Array com IDs dos registros de sugestões |
| `status` | `string` | `"Approved"` | Novo status a ser aplicado |

## 📤 **Retorno**
```javascript
{
  updated: number,    // Número de registros atualizados com sucesso
  errors: number,     // Número de erros ocorridos
  details: Array<{    // Detalhes de cada operação
    id: string,
    status: 'success' | 'error',
    message: string
  }>
}
```

## 🚀 **Exemplos de Uso**

### Uso Básico
```javascript
import { updateImageSuggestionsStatus } from './src/connectors/airtable.js';

// Aprovar sugestões
const result = await updateImageSuggestionsStatus(['rec123', 'rec456']);
console.log(`${result.updated} sugestões aprovadas`);
```

### Com Status Customizado
```javascript
// Rejeitar sugestões
const result = await updateImageSuggestionsStatus(
  ['rec789', 'rec101'], 
  'Rejected'
);
```

### Com Validação de Resultado
```javascript
const suggestionIds = ['rec123', 'rec456', 'rec789'];
const result = await updateImageSuggestionsStatus(suggestionIds, 'In Review');

if (result.errors > 0) {
  console.error(`${result.errors} erros encontrados:`);
  result.details
    .filter(d => d.status === 'error')
    .forEach(error => console.error(`- ${error.id}: ${error.message}`));
}

console.log(`✅ ${result.updated}/${suggestionIds.length} sugestões atualizadas`);
```

## 🛡️ **Tratamento de Erros**

- **Array vazio/null**: Retorna resultado zerado sem erro
- **IDs inválidos**: Registra erro individual, continua processamento
- **Problemas de conexão**: Propaga erro da API do Airtable

## 🔗 **Integração com upsetImagesInAirtable**

A função `upsetImagesInAirtable` agora usa esta função internamente:

```javascript
// Dentro de upsetImagesInAirtable
if (originalSuggestionIds && originalSuggestionIds.length > 0) {
  const updateResult = await updateImageSuggestionsStatus(originalSuggestionIds, "Approved");
  console.log(`Resultado: ${updateResult.updated} sucessos, ${updateResult.errors} erros`);
}
```

## 📊 **Logs Produzidos**

```
🔄 Iniciando atualização de status para 3 sugestões
📝 Atualizando 3 sugestões para status 'Approved'
✅ Sugestão rec123 marcada como Approved
✅ Sugestão rec456 marcada como Approved
❌ Erro ao atualizar sugestão rec789: Could not find what you are looking for
🎯 Atualização concluída: 2 sucessos, 1 erros
```

## ⚙️ **Configuração**

A função utiliza as mesmas variáveis de ambiente da aplicação:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`

Tabela utilizada: `"Image suggestions"`
Campo atualizado: `"Suggestion Status"`
