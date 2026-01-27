#!/bin/bash
echo "=== Teste Virtual Staging ==="
IMAGE_URL="https://v5.airtableusercontent.com/v3/u/49/49/1769112000000/HsK9tObyOGaNbu88TRd5bA/d7JKo9i47eCNg8XRE2wsJixZFbDmsYeAZHx7TPStsvLTOwiyM75jqCBpVJUyoTqfNgG_AbhqkfB2Fcfy2F8SjbE88vtBgGYVmfoaWD_pGpHNhSB3H9LhruQ3pcZY9OEFiEi-hQjuBkkXaFVPYXTP_Ka3myjploaXlOYMfelFEKg/j4wfNmEskA3uL4i5CP3hAsQTXFZ5VmAWB0Ii6KfPebE"
curl -X POST "https://apiruum-816106262562.us-central1.run.app/imagen-staging" \
  -H "Content-Type: application/json" \
  -d "{\"imageUrl\": \"$IMAGE_URL\", \"designStyle\": \"modern\", \"options\": {\"aspectRatio\": \"16:9\", \"numberOfImages\": 1, \"uploadToFirebase\": true}}" \
  -w "\n\nTempo total: %{time_total}s\n" | tee /tmp/staging-result.json | jq '.'

echo ""
echo "=== Resumo ==="
echo -n "Firebase URL: "
cat /tmp/staging-result.json | jq -r '.data.firebaseUrl // "NULL"'
echo -n "Passou verificacao: "
cat /tmp/staging-result.json | jq -r '.data.verification.passed // "UNKNOWN"'
echo -n "Checks realizados: "
cat /tmp/staging-result.json | jq -r '.data.verification.checks | keys | length'
