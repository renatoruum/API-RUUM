#!/bin/bash

# ===================================================================
# 🧪 EXEMPLOS DE TESTE DE PROMPTS - Virtual Staging
# ===================================================================
# Este script contém exemplos de comandos curl para testar
# os prompts gerados para cada tipo de cômodo
# ===================================================================

API_URL="http://localhost:3000/api/imagen-staging/test-prompts"

echo "🧪 TESTES DE PROMPTS - Virtual Staging System"
echo "================================================"
echo ""

# ===================================================================
# Teste 1: Sala de Estar (Living Room) - Estilo Escandinavo
# ===================================================================
echo "1️⃣  Testando: Living Room - Scandinavian"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "scandinavian",
    "room_type": "living_room"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 2: Quarto (Bedroom) - Estilo Moderno
# ===================================================================
echo "2️⃣  Testando: Bedroom - Modern"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "modern",
    "room_type": "bedroom"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 3: Quarto Infantil (Kids Bedroom) - Estilo Boho
# ===================================================================
echo "3️⃣  Testando: Kids Bedroom - Boho"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "boho",
    "room_type": "kids_bedroom"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 4: Quarto de Bebê (Baby Bedroom) - Estilo Coastal
# ===================================================================
echo "4️⃣  Testando: Baby Bedroom - Coastal"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "coastal",
    "room_type": "baby_bedroom"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 5: Home Office - Estilo Industrial
# ===================================================================
echo "5️⃣  Testando: Home Office - Industrial"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "industrial",
    "room_type": "home_office"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 6: Cozinha (Kitchen) - Estilo Traditional 
# ===================================================================
echo "6️⃣  Testando: Kitchen - Traditional (6 verificações)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "traditional",
    "room_type": "kitchen"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 7: Área Externa (Outdoor) - Estilo Contemporary
# ===================================================================
echo "7️⃣  Testando: Outdoor - Contemporary (7 verificações)"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "contemporary",
    "room_type": "outdoor"
  }' | jq '.'
echo ""
echo ""

# ===================================================================
# Teste 8: Teste de Validação - Room Type Inválido
# ===================================================================
echo "8️⃣  Testando: Validação de room_type inválido"
echo "-------------------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "design_style": "modern",
    "room_type": "garage"
  }' | jq '.'
echo ""
echo ""

echo "✅ Testes concluídos!"
echo "================================================"
echo ""
echo "💡 DICAS:"
echo "   - Verifique o console do servidor para ver os prompts completos"
echo "   - Note que kitchen tem 6 verificações e outdoor tem 7"
echo "   - Os demais cômodos têm 5 verificações padrão"
echo ""
