# Documentação: Salvar Imagem Processada pelo FLUX no Airtable

## Visão Geral

A função `saveProcessedFluxImage` foi criada para salvar imagens já processadas pelo pipeline **Virtual Staging + FLUX Kontext** diretamente na tabela **Images** do Airtable, com a imagem final salva como **arquivo (attachment)** no campo `output_img`.

## Localização

**Arquivo**: `/src/connectors/airtable.js`

**Função**: `saveProcessedFluxImage(processedImageData)`

---

## Características Principais

### ✅ O que a função faz:

1. **Salva a imagem processada** pelo FLUX Kontext como attachment no campo `output_img`
2. **Salva a imagem de entrada** (Virtual Staging) como attachment no campo `input_img` (opcional)
3. **Inclui os mesmos campos** usados em `syncImoveisWithAirtable`:
   - `property_code` - Código do imóvel
   - `property_URL` - URL da propriedade
   - `room_type` - Tipo de ambiente
   - `client` - Relacionamento com cliente
   - `user` - Relacionamento com usuário
   - `invoice` - Relacionamento com fatura (opcional)
   - `style` - Relacionamento com estilo (busca automática por nome)
4. **Define workflow específico**: `"VS+FLUX"` para identificar imagens processadas pelo pipeline
5. **Define status**: `"Processado"` para indicar que a imagem já foi tratada
6. **Registra metadados** do processamento no campo `request_log`

---

## Parâmetros

### Objeto `processedImageData`

```javascript
{
  // 🔴 OBRIGATÓRIO
  output_image_url: string,        // URL da imagem processada pelo FLUX (será salva em output_img)
  
  // 🟢 RECOMENDADOS
  property_code: string,            // Código do imóvel
  client_id: string,                // ID do cliente (formato: rec...)
  user_id: string,                  // ID do usuário (formato: rec...)
  
  // 🟡 OPCIONAIS
  input_image_url: string,          // URL da imagem do Virtual Staging (será salva em input_img)
  property_url: string,             // URL da propriedade no site
  room_type: string,                // Tipo de ambiente (living, bedroom, kitchen, bathroom, etc.)
  style: string,                    // Nome do estilo (será buscado na tabela Styles)
  workflow: string,                 // Workflow personalizado (padrão: "VS+FLUX")
  invoice_id: string,               // ID da fatura (formato: rec...)
  request_log: string,              // Observações/log do processamento
  
  // 📊 METADADOS DO PIPELINE (incluídos automaticamente no request_log)
  pipeline_id: string,              // ID do pipeline executado
  staging_render_id: string,        // Render ID do Virtual Staging
  flux_task_id: string              // Task ID do FLUX
}
```

---

## Campos da Tabela Images

### Campos Principais:

| Campo | Tipo | Descrição | Origem |
|-------|------|-----------|--------|
| `output_img` | Attachment | **Imagem processada pelo FLUX** (arquivo) | `output_image_url` |
| `input_img` | Attachment | Imagem de entrada do Virtual Staging (arquivo) | `input_image_url` |
| `property_code` | Single line text | Código do imóvel | `property_code` |
| `property_URL` | URL | Link da propriedade | `property_url` |
| `room_type` | Single select | Tipo de ambiente | `room_type` |
| `workflow` | Single select | Tipo de workflow (padrão: "VS+FLUX") | `workflow` |
| `status` | Single select | Status do processamento (padrão: "Processado") | - |
| `request_log` | Long text | Log e observações do processamento | `request_log` + metadados |

### Relacionamentos (Link to another record):

| Campo | Tabela Relacionada | Obrigatório | Origem |
|-------|-------------------|-------------|--------|
| `client` | Clients | ✅ Recomendado | `client_id` |
| `user` | Users | ✅ Recomendado | `user_id` |
| `invoice` | Invoices | ❌ Opcional | `invoice_id` |
| `style` | Styles | ❌ Opcional | `style` (busca por nome) |

---

## Exemplo de Uso

### Uso Básico (Mínimo):

```javascript
import { saveProcessedFluxImage } from "./connectors/airtable.js";

const result = await saveProcessedFluxImage({
  output_image_url: "https://bfldeliverysc.blob.core.windows.net/results/.../sample.jpeg",
  property_code: "ABC123",
  client_id: "recXXXXXXXXXXXXXXX",
  user_id: "recYYYYYYYYYYYYYYY"
});

console.log(result);
// {
//   success: true,
//   record_id: "recZZZZZZZZZZZZZZZ",
//   table: "Images",
//   message: "Imagem processada salva com sucesso no Airtable"
// }
```

### Uso Completo (com todos os campos):

```javascript
const result = await saveProcessedFluxImage({
  // Obrigatório
  output_image_url: "https://bfldeliverysc.blob.core.windows.net/results/.../sample.jpeg",
  
  // Recomendado
  property_code: "Lorena_23",
  client_id: "recXXXXXXXXXXXXXXX",
  user_id: "recYYYYYYYYYYYYYYY",
  
  // Opcional
  input_image_url: "https://storage.googleapis.com/furniture-ai.appspot.com/.../output_1.jpg",
  property_url: "https://firebasestorage.googleapis.com/.../Lorena_23.jpg",
  room_type: "kitchen",
  style: "modern",
  workflow: "VS+FLUX",
  invoice_id: "recWWWWWWWWWWWWWWW",
  request_log: "Processamento automático via pipeline",
  
  // Metadados do pipeline
  pipeline_id: "pipeline_1763064276268",
  staging_render_id: "mR2PhxHXEDXEiJKfJv1O",
  flux_task_id: "629c0fc7-cd25-41d7-b90a-4209d6d0d608"
});
```

### Integração com Pipeline:

```javascript
// No final do pipeline staging-and-enhance
router.post("/pipeline/staging-and-enhance", async (req, res) => {
  // ... código do pipeline ...
  
  // Após sucesso do pipeline
  if (allCompleted && wait_for_completion) {
    
    // Salvar no Airtable
    const airtableResult = await saveProcessedFluxImage({
      output_image_url: currentImageUrl, // Imagem final do FLUX
      input_image_url: pipelineResults.steps[0]?.result_url, // Imagem do VS
      property_code: req.body.property_code,
      property_url: image_url, // URL original
      room_type: room_type,
      style: style,
      client_id: req.body.client_id,
      user_id: req.body.user_id,
      invoice_id: req.body.invoice_id,
      pipeline_id: pipeline_id,
      staging_render_id: pipelineResults.steps[0]?.render_id,
      flux_task_id: pipelineResults.steps[1]?.task_id
    });
    
    return res.status(200).json({
      success: true,
      message: "Pipeline concluído com sucesso",
      pipeline_id,
      original_image: image_url,
      final_image: currentImageUrl,
      data: pipelineResults,
      airtable: airtableResult // Resultado do salvamento no Airtable
    });
  }
});
```

---

## Retorno da Função

### ✅ Sucesso:

```javascript
{
  success: true,
  record_id: "recABC123XYZ456",
  table: "Images",
  message: "Imagem processada salva com sucesso no Airtable"
}
```

### ❌ Erro:

```javascript
{
  success: false,
  error: "Campo obrigatório ausente: output_image_url",
  message: "Erro ao salvar imagem processada no Airtable"
}
```

---

## Diferenças com Outras Funções

### vs. `upsetImagesInAirtable`

| Característica | `saveProcessedFluxImage` | `upsetImagesInAirtable` |
|----------------|--------------------------|------------------------|
| **Propósito** | Salvar imagem **já processada** | Salvar imagem **para processamento** |
| **Campo principal** | `output_img` (resultado) | `input_img` (entrada) |
| **Workflow** | `"VS+FLUX"` (fixo) | Variável |
| **Status** | `"Processado"` (fixo) | Variável |
| **Uso** | Após pipeline completo | Antes do processamento |
| **Quantidade** | 1 registro por chamada | N registros por array |

### vs. `transferApprovedSuggestionToImages`

| Característica | `saveProcessedFluxImage` | `transferApprovedSuggestionToImages` |
|----------------|--------------------------|-----------------------------------|
| **Origem** | Pipeline automático | Sugestões aprovadas manualmente |
| **Campo principal** | `output_img` (FLUX) | `input_img` (sugestão) |
| **Metadados** | IDs do pipeline | Dados da sugestão |

---

## Validações

### ✅ Validações Implementadas:

1. **Campo obrigatório**: `output_image_url` deve estar presente
2. **URLs válidas**: Verifica se URLs são válidas antes de criar attachments
3. **Relacionamentos**: Valida formato dos IDs (deve começar com `rec`)
4. **Busca de estilo**: Busca automática na tabela Styles se fornecido como string

### ⚠️ Tratamento de Erros:

- Captura e registra erros detalhados no console
- Retorna objeto com `success: false` e `error` message
- Não interrompe a execução do pipeline se falhar

---

## Logs e Debugging

A função gera logs detalhados:

```
💾 [saveProcessedFluxImage] Iniciando salvamento de imagem processada pelo FLUX...
📥 [saveProcessedFluxImage] Preparando attachment da imagem processada...
  - output_img (FLUX): https://bfldeliverysc.blob.core.windows.net/...
  - input_img (VS): https://storage.googleapis.com/furniture-ai...
  - property_URL: https://firebasestorage.googleapis.com/...
  - room_type: kitchen
🔗 [saveProcessedFluxImage] Adicionando relacionamentos...
  - client: recXXXXXXXXXXXXXXX
  - user: recYYYYYYYYYYYYYYY
  - invoice: recWWWWWWWWWWWWWWW
🎨 [saveProcessedFluxImage] Processando estilo: modern
  - style encontrado, ID: recSTYLE123456
📋 [saveProcessedFluxImage] Campos que serão enviados: ["property_code", "workflow", ...]
🔍 [saveProcessedFluxImage] Resumo:
  - Total de campos: 12
  - output_img presente: true
  - input_img presente: true
  - Relacionamentos: client=true, user=true, invoice=true
💾 [saveProcessedFluxImage] Criando registro na tabela Images...
✅ [saveProcessedFluxImage] Registro criado com sucesso: recZZZZZZZZZZZZZZZ
```

---

## Próximos Passos

1. ✅ **Função criada** no conector do Airtable
2. ⏭️ **Integrar no pipeline** `sendImagePipeline.js`
3. ⏭️ **Testar** com imagens reais
4. ⏭️ **Adicionar parâmetro opcional** na rota do pipeline: `save_to_airtable: boolean`

---

## Notas Importantes

⚠️ **Attachments no Airtable**: A função envia URLs como attachments. O Airtable automaticamente faz o download e armazena o arquivo.

⚠️ **URLs temporárias do FLUX**: As URLs do Azure Blob Storage (FLUX) expiram. O Airtable salva o arquivo permanentemente.

⚠️ **Relacionamentos**: Certifique-se de que os IDs fornecidos (`client_id`, `user_id`, `invoice_id`) existem nas respectivas tabelas.

⚠️ **Estilo**: Se fornecido como string, a função busca automaticamente o ID na tabela Styles. Se não encontrado, o campo style não será preenchido.

---

## Autor

Criado em: 14 de novembro de 2025  
Versão: 1.0  
Contexto: Pipeline Virtual Staging + FLUX Kontext para processamento de imagens imobiliárias
