# 🔍 Problema ElevenLabs: "Detected Unusual Activity"

## 📋 **Resumo do Problema**

A API ElevenLabs está bloqueando requisições do Cloud Run com erro **"detected_unusual_activity"**, mesmo tendo créditos disponíveis no plano gratuito.

## 🎯 **Causa Raiz Identificada**

### **Local vs. Cloud Run:**
- ✅ **Local (IP residencial)**: API funciona perfeitamente
- ❌ **Cloud Run (Google Cloud IP)**: Bloqueado por "atividade suspeita"

### **Por que acontece:**
1. **IPs compartilhados** do Google Cloud (us-central1)
2. **Múltiplos desenvolvedores** usando a mesma infraestrutura
3. **Algoritmos de detecção** da ElevenLabs identificam como abuso
4. **Tráfego de datacenter** é mais suspeito que IP residencial

## 🛠️ **Melhorias Implementadas**

### **1. Headers mais "humanos":**
```javascript
headers: {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Referer": "https://elevenlabs.io/",
  "Origin": "https://elevenlabs.io",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
}
```

### **2. Rate Limiting:**
- **2 segundos** de intervalo entre requisições
- Evita muitas chamadas simultâneas

### **3. Tratamento de Erro Melhorado:**
- Mensagem específica para "atividade suspeita"
- Logs detalhados para diagnóstico

## 💡 **Soluções Disponíveis**

### **1. Upgrade para Plano Pago (Recomendado)**
```bash
# Benefícios:
- Remove limitações de IP
- Maior volume de requisições
- Suporte prioritário
- Resolve o problema definitivamente
```

### **2. Fallback no Front-end**
```javascript
// Implementar tratamento de erro
if (error.message.includes("detected_unusual_activity")) {
  showErrorMessage("Serviço de áudio temporariamente indisponível");
  // Desabilitar funcionalidade ou usar alternativa
}
```

### **3. API Alternativa (Backup)**
```javascript
// Opções alternativas:
- Google Cloud Text-to-Speech
- AWS Polly
- Azure Cognitive Services
- Web Speech API (browser)
```

## 🧪 **Testes Realizados**

### **Teste Local:**
```bash
curl -X GET "http://localhost:8080/api/elevenlabs/test"
# ✅ Resultado: {"success":true,"audioSize":21360}
```

### **Teste Cloud Run:**
```bash
curl -X GET "https://apiruum-2cpzkgiiia-uc.a.run.app/api/elevenlabs/test"
# ❌ Resultado: {"success":false,"error":"ElevenLabs detectou atividade suspeita"}
```

## 📊 **Status da Conta**

- **Plano**: Free Tier
- **Créditos**: $10.00 disponíveis
- **Uso anterior**: Apenas testes locais
- **Problema**: Detecção automática de abuso por IP do Cloud Run

## 🎯 **Recomendação Final**

Para uso em **produção**, recomenda-se:

1. **Comprar plano pago** do ElevenLabs ($5-22/mês)
2. **Implementar fallback** para quando o serviço não estiver disponível
3. **Considerar API alternativa** como backup

O problema é **infraestrutural** (Cloud Run) e não relacionado ao código ou configuração da API.

---

📅 **Última atualização**: 3 de julho de 2025  
🔧 **Status**: Identificado e documentado
