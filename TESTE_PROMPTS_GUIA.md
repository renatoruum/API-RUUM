# 🧪 GUIA DE TESTE DE PROMPTS - Virtual Staging System

## 📋 Visão Geral

Este sistema permite testar os prompts gerados para cada tipo de cômodo **SEM processar imagens de fato**, ideal para:
- ✅ Validar que os prompts estão corretos para cada cômodo
- ✅ Verificar o número de checks dinâmicos (5, 6 ou 7)
- ✅ Testar diferentes estilos de design
- ✅ Debug e desenvolvimento

---

## 🚀 Como Usar

### Opção 1: Via curl (Linha de Comando)

```bash
curl -X POST "http://localhost:3000/api/imagen-staging/test-prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type": "kitchen",
    "design_style": "scandinavian"
  }'
```

### Opção 2: Usar o Script de Exemplos

```bash
# Tornar executável (primeira vez)
chmod +x test-prompts-examples.sh

# Executar todos os testes
./test-prompts-examples.sh
```

---

## 📊 Tipos de Cômodos Disponíveis

| Cômodo | `room_type` | Verificações | Checks Específicos |
|--------|-------------|--------------|-------------------|
| 🛋️ Sala de Estar | `living_room` | 5 | - |
| 🛏️ Quarto | `bedroom` | 5 | - |
| 🧸 Quarto Infantil | `kids_bedroom` | 5 | - |
| 👶 Quarto de Bebê | `baby_bedroom` | 5 | - |
| 💼 Home Office | `home_office` | 5 | - |
| 🍳 Cozinha | `kitchen` | **6** | +counters_plumbing |
| 🌳 Área Externa | `outdoor` | **7** | +water_surfaces, +counters_plumbing |

---

## 🎨 Estilos de Design Disponíveis

- `scandinavian` - Escandinavo (padrão)
- `modern` - Moderno
- `contemporary` - Contemporâneo
- `traditional` - Tradicional
- `industrial` - Industrial
- `coastal` - Costeiro/Praia
- `boho` - Boho/Bohemian

---

## 📝 Estrutura da Resposta

```json
{
  "success": true,
  "message": "Prompts gerados com sucesso (modo teste)",
  "data": {
    "roomType": "kitchen",
    "designStyle": "scandinavian",
    "prompts": {
      "analyzer": "Prompt completo do Agent 1...",
      "generator": "Prompt completo do Agent 2...",
      "verification": [
        {
          "id": 1,
          "name": "walls",
          "prompt": "Prompt de verificação..."
        },
        // ... mais checks
      ]
    },
    "summary": {
      "totalVerificationChecks": 6,
      "roomTypeProcessed": "kitchen",
      "designStyleApplied": "scandinavian"
    }
  },
  "instructions": {
    "message": "Os prompts foram exibidos no console do servidor",
    "tip": "Verifique o terminal onde o servidor está rodando para ver os logs completos"
  }
}
```

---

## 🔍 Onde Ver os Prompts Completos

### Via Console do Servidor
Os prompts completos são exibidos no **terminal onde o servidor está rodando**:

```bash
🧪 TESTE DE PROMPTS - SISTEMA DE VIRTUAL STAGING
================================================================================
📍 Cômodo: kitchen
🎨 Estilo: scandinavian
================================================================================

1️⃣  AGENT 1: LAYOUT_ANALYZER
--------------------------------------------------------------------------------
Role: You are a Senior Architect specialized in interior design...
[PROMPT COMPLETO]

2️⃣  AGENT 2: STAGING_GENERATOR
--------------------------------------------------------------------------------
Task: Produce an output image that is exactly the same...
[PROMPT COMPLETO]

3️⃣  AGENT 3: VERIFICATION_CHECKS
--------------------------------------------------------------------------------
Total de verificações para kitchen: 6

Lista de verificações:
[1/6] walls: ...
[2/6] doors_windows: ...
...
```

### Via Resposta JSON
A resposta da API também contém os prompts completos no campo `data.prompts`.

---

## 🧪 Exemplos de Testes

### Teste 1: Kitchen com 6 Verificações
```bash
curl -s -X POST "http://localhost:3000/api/imagen-staging/test-prompts" \
  -H "Content-Type: application/json" \
  -d '{"room_type":"kitchen","design_style":"scandinavian"}'
```

**Resultado Esperado:** 6 verificações (5 universais + counters_plumbing)

### Teste 2: Outdoor com 7 Verificações
```bash
curl -s -X POST "http://localhost:3000/api/imagen-staging/test-prompts" \
  -H "Content-Type: application/json" \
  -d '{"room_type":"outdoor","design_style":"contemporary"}'
```

**Resultado Esperado:** 7 verificações (5 universais + water_surfaces + counters_plumbing)

### Teste 3: Bedroom com 5 Verificações (Padrão)
```bash
curl -s -X POST "http://localhost:3000/api/imagen-staging/test-prompts" \
  -H "Content-Type: application/json" \
  -d '{"room_type":"bedroom","design_style":"modern"}'
```

**Resultado Esperado:** 5 verificações universais

---

## ✅ Checklist de Validação

Para validar completamente o sistema, teste:

- [ ] ✅ Todos os 7 tipos de cômodos
- [ ] ✅ Kitchen retorna 6 verificações
- [ ] ✅ Outdoor retorna 7 verificações
- [ ] ✅ Demais cômodos retornam 5 verificações
- [ ] ✅ Diferentes estilos de design
- [ ] ✅ Room type inválido retorna erro 400
- [ ] ✅ Prompts aparecem no console do servidor

---

## 🔧 Troubleshooting

### Erro "Cannot POST /api/imagen-staging/test-prompts"
**Solução:** Reinicie o servidor:
```bash
pkill -9 node
cd /Users/renatopalacio/Documents/Ruum/API_Ruum/apiruum
PORT=3000 node src/app.js
```

### Prompts não aparecem no console
**Solução:** Verifique o terminal onde o servidor está rodando, não onde você executou o curl.

### Room type inválido
**Resposta esperada:**
```json
{
  "error": "Invalid room_type",
  "validOptions": ["living_room", "bedroom", "kids_bedroom", "baby_bedroom", "home_office", "kitchen", "outdoor"],
  "received": "garage"
}
```

---

## 📚 Arquivos Relacionados

- **Connector:** `/apiruum/src/connectors/imagenStaging.js`
  - Função: `testPrompts(designStyle, roomType)`
  - Export: Exportada no default export

- **Route:** `/apiruum/src/routes/sendImagenStaging.js`
  - Endpoint: `POST /api/imagen-staging/test-prompts`
  - Body: `{ room_type, design_style }`

- **Script de Exemplos:** `/apiruum/test-prompts-examples.sh`
  - Testa todos os 7 cômodos + validação de erro

---

## 💡 Casos de Uso

1. **Desenvolvimento:** Testar prompts ao adicionar novo tipo de cômodo
2. **Debug:** Verificar se prompts estão sendo gerados corretamente
3. **Documentação:** Gerar exemplos de prompts para documentação
4. **QA:** Validar sistema antes de deploy
5. **Demo:** Mostrar ao cliente como o sistema funciona

---

## 🎯 Próximos Passos

Após validar os prompts:
1. Testar com imagens reais usando `/api/imagen-staging/full-pipeline`
2. Verificar se os prompts geram bons resultados com Gemini AI
3. Ajustar prompts conforme necessário
4. Documentar resultados e edge cases

---

**Desenvolvido por:** RUUM Team  
**Data:** Janeiro 2025  
**Versão:** 1.0.0
