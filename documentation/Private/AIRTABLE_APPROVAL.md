# 📊 Airtable Integration API - Sistema de Aprovação

> **Endpoint Base:** `/api/imagen-staging`  
> **Métodos:** POST  
> **Tipo:** Síncrono  
> **Tempo de Resposta:** 1-3 segundos

---

## 📋 Visão Geral

A API de integração com Airtable permite salvar e gerenciar imagens processadas em um banco de dados estruturado. O sistema suporta aprovação e reprovação de imagens processdas, transferindo automaticamente para as tabelas corretas.

**Casos de uso:**
- Aprovar imagens de Virtual Staging
- Registrar feedback e motivos de reprovação
- Organizar galeria de imagens por imóvel
- Rastrear histórico de processamento

⚠️ **Nota:** Esta API é para **aprovação manual** de imagens. Para processamento direto sem aprovação, use os endpoints de Virtual Staging ou Video.

---

## 🔗 Endpoints Disponíveis

### 1. Health Check

```
GET /api/imagen-staging/approve/health
```

### 2. Aprovar Imagem

```
POST /api/imagen-staging/approve
```

### 3. Reprovar Imagem

```
POST /api/imagen-staging/disapprove
```

---

## ✅ Aprovar Imagem

### Endpoint:

```
POST /api/imagen-staging/approve
```

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `output_image_url` | string | ✅ | URL da imagem processada |
| `client_id` | string | ✅ | ID do cliente no Airtable (formato: `recXXXXXXXXXXXXXXX`) |
| `input_image_url` | string | ❌ | URL da imagem original |
| `property_code` | string | ❌ | Código do imóvel |
| `room_type` | string | ❌ | Tipo de cômodo (`living_room`, `bedroom`, etc.) |
| `design_style` | string | ❌ | Estilo de design usado |
| `layout_description` | string | ❌ | Descrição do layout |
| `quality_score` | number | ❌ | Score de qualidade (0-100) |
| `checks_passed` | number | ❌ | Quantidade de checks aprovados |
| `checks_total` | number | ❌ | Total de checks executados |
| `client_email` | string | ❌ | Email do cliente |
| `user_id` | string | ❌ | ID do usuário |
| `invoice_id` | string | ❌ | ID da fatura |
| `client_name` | string | ❌ | Nome do cliente |
| `base_table` | string | ❌ | Nome da tabela base |
| `approved_at` | string | ❌ | Timestamp da aprovação (ISO 8601) |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve \
  -H "Content-Type: application/json" \
  -d '{
    "output_image_url": "https://storage.googleapis.com/.../staged_room.jpg",
    "input_image_url": "https://example.com/empty-room.jpg",
    "client_id": "recABC123DEF456GHI",
    "property_code": "IMO-2026-001",
    "room_type": "living_room",
    "design_style": "modern",
    "quality_score": 95,
    "checks_passed": 5,
    "checks_total": 5,
    "approved_at": "2026-02-03T10:30:00Z"
  }'
```

### Exemplo com JavaScript:

```javascript
async function approveImage(imageData) {
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_image_url: imageData.generatedImageUrl,
        input_image_url: imageData.originalImageUrl,
        client_id: 'recABC123DEF456GHI',
        property_code: 'IMO-2026-001',
        room_type: 'living_room',
        design_style: 'modern',
        quality_score: imageData.qualityScore,
        checks_passed: imageData.checks.passed,
        checks_total: imageData.checks.total,
        approved_at: new Date().toISOString()
      })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Imagem aprovada!');
    console.log('ID no Airtable:', result.record_id);
  }
  
  return result;
}
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Imagem aprovada e salva com sucesso no Airtable",
  "record_id": "recXYZ789ABC123DEF",
  "table": "Images",
  "data": {
    "output_img_url": "https://storage.googleapis.com/.../staged_room.jpg",
    "input_img_url": "https://example.com/empty-room.jpg",
    "property_code": "IMO-2026-001",
    "room_type": "Sala de estar + jantar",
    "design_style": "modern",
    "quality_score": 95,
    "checks_summary": "5/5 checks aprovados",
    "approved_at": "2026-02-03T10:30:00Z"
  }
}
```

**Campos da resposta:**
- `success`: Indica se a operação foi bem-sucedida
- `message`: Mensagem descritiva do resultado
- `record_id`: ID único do registro criado no Airtable
- `table`: Nome da tabela onde foi salvo ("Images")
- `data`: Dados salvos no Airtable

### Mapeamento de room_type:

A API converte automaticamente os códigos de cômodos para português:

| Código (EN) | Airtable (PT) |
|-------------|---------------|
| `living_room` | Sala de estar + jantar |
| `bedroom` | Quarto |
| `kids_bedroom` | Quarto infantil |
| `baby_bedroom` | Quarto infantil |
| `kitchen` | Cozinha |
| `home_office` | Home Office |
| `outdoor` | Área externa |

---

## ❌ Reprovar Imagem

### Endpoint:

```
POST /api/imagen-staging/disapprove
```

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `output_image_url` | string | ✅ | URL da imagem processada |
| `client_id` | string | ✅ | ID do cliente no Airtable |
| `rejection_reason` | string | ✅ | Motivo da reprovação |
| `input_image_url` | string | ❌ | URL da imagem original |
| `property_code` | string | ❌ | Código do imóvel |
| `room_type` | string | ❌ | Tipo de cômodo |
| `design_style` | string | ❌ | Estilo de design usado |
| `quality_score` | number | ❌ | Score de qualidade |
| `checks_passed` | number | ❌ | Checks aprovados |
| `checks_total` | number | ❌ | Total de checks |
| `rejected_at` | string | ❌ | Timestamp da reprovação (ISO 8601) |

### Motivos comuns de reprovação:

| Código | Descrição |
|--------|-----------|
| `quality_low` | Qualidade da imagem muito baixa |
| `furniture_inappropriate` | Móveis inadequados para o cômodo |
| `style_mismatch` | Estilo não corresponde ao solicitado |
| `architecture_damaged` | Estrutura arquitetônica danificada |
| `lighting_issues` | Problemas de iluminação |
| `unrealistic` | Resultado não realista |
| `client_preference` | Preferência do cliente |
| `other` | Outro motivo (especificar no campo) |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/disapprove \
  -H "Content-Type: application/json" \
  -d '{
    "output_image_url": "https://storage.googleapis.com/.../staged_room.jpg",
    "client_id": "recABC123DEF456GHI",
    "rejection_reason": "Móveis não adequados para o perfil do imóvel",
    "property_code": "IMO-2026-001",
    "room_type": "living_room",
    "quality_score": 75,
    "rejected_at": "2026-02-03T10:35:00Z"
  }'
```

### Exemplo com JavaScript:

```javascript
async function rejectImage(imageData, reason) {
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/disapprove',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_image_url: imageData.generatedImageUrl,
        input_image_url: imageData.originalImageUrl,
        client_id: 'recABC123DEF456GHI',
        property_code: imageData.propertyCode,
        room_type: imageData.roomType,
        rejection_reason: reason,
        quality_score: imageData.qualityScore,
        checks_passed: imageData.checks.passed,
        checks_total: imageData.checks.total,
        rejected_at: new Date().toISOString()
      })
    }
  );
  
  return await response.json();
}

// Uso
await rejectImage(imageData, 'Móveis não adequados para o perfil do imóvel');
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Imagem reprovada e salva com sucesso no Airtable",
  "record_id": "recXYZ789ABC123DEF",
  "table": "Images",
  "data": {
    "output_img_url": "https://storage.googleapis.com/.../staged_room.jpg",
    "property_code": "IMO-2026-001",
    "rejection_reason": "Móveis não adequados para o perfil do imóvel",
    "quality_score": 75,
    "rejected_at": "2026-02-03T10:35:00Z"
  }
}
```

---

## 🏥 Health Check

### Endpoint:

```
GET /api/imagen-staging/approve/health
```

### Exemplo com cURL:

```bash
curl -X GET https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve/health
```

### Resposta (200):

```json
{
  "status": "ok",
  "message": "Rota de aprovação está funcionando",
  "timestamp": "2026-02-03T10:00:00.000Z"
}
```

**Uso:** Verificar se a API de aprovação está disponível

---

## ⚠️ Códigos de Erro

### 400 - Campos Obrigatórios Ausentes

**Causa:** `output_image_url` ou `client_id` não fornecidos

```json
{
  "success": false,
  "error": "output_image_url é obrigatório"
}
```

**Solução:** Sempre inclua `output_image_url` e `client_id` nas requisições

---

### 400 - Rejection Reason Missing

**Causa:** Campo `rejection_reason` não fornecido na reprovação

```json
{
  "success": false,
  "error": "rejection_reason é obrigatório para reprovação"
}
```

**Solução:** Sempre forneça um motivo ao reprovar uma imagem

---

### 404 - Record Not Found

**Causa:** `client_id` inválido ou registro não existe no Airtable

```json
{
  "success": false,
  "error": "Record not found in Airtable",
  "details": "Invalid client_id: recXXXXXXXXXXXXXXX"
}
```

**Solução:** 
1. Verifique se o `client_id` está no formato correto (`recXXXXXXXXXXXXXXX`)
2. Confirme que o registro existe no Airtable
3. Entre em contato com suporte se necessário

---

### 500 - Airtable Connection Error

**Causa:** Falha na conexão com Airtable ou credenciais inválidas

```json
{
  "success": false,
  "error": "Failed to connect to Airtable",
  "message": "Internal server error"
}
```

**Solução:** Entre em contato com o suporte técnico

---

## 💡 Exemplos de Uso Completos

### Exemplo 1: Workflow Completo (Virtual Staging + Aprovação)

```javascript
async function processAndApprove(imageUrl, propertyCode) {
  // PASSO 1: Processar Virtual Staging
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
  
  if (!stagingResult.success) {
    throw new Error('Virtual Staging falhou');
  }
  
  // PASSO 2: Exibir para usuário e aguardar aprovação
  const userApproved = await showForApproval(stagingResult.generatedImageUrl);
  
  if (userApproved) {
    // PASSO 3: Aprovar e salvar no Airtable
    const approveResponse = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_image_url: stagingResult.generatedImageUrl,
          input_image_url: imageUrl,
          client_id: 'recABC123DEF456GHI',
          property_code: propertyCode,
          room_type: 'living_room',
          design_style: 'modern',
          quality_score: stagingResult.qualityScore,
          checks_passed: stagingResult.checks?.passed,
          checks_total: stagingResult.checks?.total,
          approved_at: new Date().toISOString()
        })
      }
    );
    
    const approveResult = await approveResponse.json();
    
    return {
      approved: true,
      imageUrl: stagingResult.generatedImageUrl,
      airtableId: approveResult.record_id
    };
  } else {
    return {
      approved: false,
      imageUrl: stagingResult.generatedImageUrl
    };
  }
}
```

### Exemplo 2: Sistema de Aprovação com Feedback

```javascript
async function approvalSystem(imageData) {
  const feedback = await getUserFeedback(imageData.generatedImageUrl);
  
  if (feedback.approved) {
    // Aprovar imagem
    return await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_image_url: imageData.generatedImageUrl,
          client_id: imageData.clientId,
          property_code: imageData.propertyCode,
          room_type: imageData.roomType,
          quality_score: feedback.rating,
          approved_at: new Date().toISOString()
        })
      }
    );
  } else {
    // Reprovar com motivo
    return await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/disapprove',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_image_url: imageData.generatedImageUrl,
          client_id: imageData.clientId,
          property_code: imageData.propertyCode,
          rejection_reason: feedback.reason,
          quality_score: feedback.rating,
          rejected_at: new Date().toISOString()
        })
      }
    );
  }
}
```

### Exemplo 3: Batch Approval (Múltiplas Imagens)

```javascript
async function batchApprove(imagesData, clientId) {
  const results = {
    approved: [],
    rejected: [],
    errors: []
  };
  
  for (const imageData of imagesData) {
    try {
      const response = await fetch(
        'https://apiruum-562831020087.us-central1.run.app/api/imagen-staging/approve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            output_image_url: imageData.url,
            client_id: clientId,
            property_code: imageData.propertyCode,
            room_type: imageData.roomType,
            design_style: imageData.style,
            approved_at: new Date().toISOString()
          })
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        results.approved.push({
          url: imageData.url,
          airtableId: result.record_id
        });
      } else {
        results.errors.push({
          url: imageData.url,
          error: result.error
        });
      }
      
      // Delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.errors.push({
        url: imageData.url,
        error: error.message
      });
    }
  }
  
  return results;
}
```

---

## 📊 Estrutura do Airtable

### Tabela: Images

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `property_code` | Text | Código do imóvel |
| `input_img` | Attachment | URL da imagem original |
| `output_img` | Attachment | URL da imagem processada |
| `room_type` | Single Select | Tipo de cômodo (português) |
| `design_style` | Text | Estilo de design aplicado |
| `quality_score` | Number | Score de qualidade (0-100) |
| `checks_summary` | Text | Resumo dos checks (ex: "5/5 checks aprovados") |
| `request_log` | Long Text | Descrição do layout ou observações |
| `rejection_reason` | Long Text | Motivo da reprovação (se aplicável) |
| `client` | Linked Record | Relacionamento com tabela de Clientes |
| `user` | Linked Record | Relacionamento com tabela de Usuários |
| `invoice` | Linked Record | Relacionamento com tabela de Faturas |
| `approved_at` | Date | Data/hora da aprovação |
| `rejected_at` | Date | Data/hora da reprovação |

---

## 🔐 Segurança

- **Client ID Validation:** Sempre valide o formato do `client_id` (deve começar com `rec`)
- **URL Validation:** Certifique-se que URLs são públicas e acessíveis
- **Audit Trail:** Todas as aprovações/reprovações são registradas com timestamp

---

## 📊 Boas Práticas

### ✅ Recomendações:

1. **Sempre inclua `property_code`** para rastreabilidade
2. **Use `quality_score`** para filtrar imagens de baixa qualidade
3. **Forneça `rejection_reason` descritivo** ao reprovar
4. **Armazene `record_id`** retornado para futuras referências
5. **Implemente retry** para falhas temporárias

### ❌ Evite:

1. ❌ Aprovar sem validar a qualidade da imagem
2. ❌ Reprovar sem motivo específico
3. ❌ Usar `client_id` hardcoded (busque dinamicamente)
4. ❌ Ignorar erros de validação
5. ❌ Fazer múltiplas aprovações simultâneas sem controle

---

## 🆘 Troubleshooting

### Problema: Erro "client_id é obrigatório"

**Solução:** O campo `client_id` deve ser um ID válido do Airtable no formato `recXXXXXXXXXXXXXXX`

```javascript
// ✅ Correto
client_id: "recABC123DEF456GHI"

// ❌ Errado
client_id: "minha-imobiliaria"
client_id: ""
client_id: null
```

---

### Problema: Imagem aprovada mas não aparece no Airtable

**Causas possíveis:**
1. `client_id` inválido ou de registro inexistente
2. Permissões insuficientes no Airtable
3. Tabela "Images" não existe na base

**Solução:**
1. Verifique o `record_id` retornado
2. Confirme que a tabela existe
3. Entre em contato com suporte

---

## 📖 Documentação Relacionada

- [VIRTUAL_STAGING.md](./VIRTUAL_STAGING.md) - Processamento de Virtual Staging
- [FIREBASE_STORAGE.md](./FIREBASE_STORAGE.md) - Upload de imagens
- [README.md](./README.md) - Visão geral da API

---

## 🆘 Suporte

- **Email:** renato@ruum.com.br
- **Documentação:** Esta pasta CRM_INTEGRATION
- **Resposta:** 24-48h úteis
