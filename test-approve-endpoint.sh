#!/bin/bash

# ===================================================================
# 🧪 TESTE DE APROVAÇÃO - SmartBanana → Airtable
# ===================================================================

API_URL="http://localhost:3000/api/imagen-staging/approve"

echo "👍 TESTE DE APROVAÇÃO - SmartBanana"
echo "===================================================="
echo ""

# Teste de aprovação
echo "📤 Enviando aprovação de imagem..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "input_image_url": "https://example.com/input.jpg",
    "output_image_url": "https://storage.googleapis.com/api-ruum.firebasestorage.app/test-output.jpg",
    "room_type": "living_room",
    "design_style": "contemporary_minimalist",
    "layout_description": "Sala de estar com sofá moderno e mesa de centro",
    "quality_score": 8,
    "checks_passed": 5,
    "checks_total": 5,
    "client_email": "stella@fikaimoveis.com.br",
    "client_id": "rec123456",
    "user_id": "recUSER123",
    "invoice_id": "recINV123",
    "client_name": "Stella Fika",
    "base_table": "appXXXXXXXXX",
    "approved_at": "2026-01-30T12:00:00Z"
  }' | python3 -m json.tool

echo ""
echo ""
echo "===================================================="
echo "✅ Teste concluído!"
echo ""
echo "💡 DICAS:"
echo "   - Verifique os logs do servidor"
echo "   - Confirme se o registro foi criado no Airtable"
echo "   - Note que client_id deve ser um ID válido do Airtable"
echo ""
