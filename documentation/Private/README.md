# 🔒 API Ruum - Documentação Privada

> **Versão:** 1.0  
> **Data:** Fevereiro 2026  
> **Público:** Uso Interno - Plataforma Ruum

---

## 📋 Visão Geral

Esta documentação contém funcionalidades **exclusivas da plataforma Ruum** e **não estão disponíveis para integrações externas** (CRMs/Portais).

Estas funcionalidades utilizam Airtable como banco de dados e fazem parte do workflow interno da Ruum para gerenciar clientes, sugestões de imagens e sincronização de dados.

---

## 📚 Índice da Documentação

### 📊 Gerenciamento de Dados
- [**AIRTABLE_APPROVAL.md**](./AIRTABLE_APPROVAL.md) - Sistema de aprovação de imagens processadas
- [**IMAGE_SUGGESTIONS.md**](./IMAGE_SUGGESTIONS.md) - Workflow de curadoria (Time Ruum → Cliente)
- [**FIREBASE_STORAGE.md**](./FIREBASE_STORAGE.md) - Upload de imagens e geração de URLs públicas
- [**FIREBASE_FIRESTORE.md**](./FIREBASE_FIRESTORE.md) - Banco NoSQL para metadados e logs

### � Processamento Serverless
- [**FFMPEG_SERVERLESS.md**](./FFMPEG_SERVERLESS.md) - API FFmpeg (Before/After + Merge de vídeos)

### �🏢 Integração CRM/XML
- [**XML_CRM_INTEGRATION.md**](./XML_CRM_INTEGRATION.md) - Importação automática de imóveis via XML
### 🏗️ Arquitetura e Planejamento
- [**BATCH_PROCESSING_ARCHITECTURE.md**](./BATCH_PROCESSING_ARCHITECTURE.md) - Sistema de processamento em lote (Cloud Tasks)
- [**IMPLEMENTATION_PLAN.md**](./IMPLEMENTATION_PLAN.md) - Plano de implementação detalhado (4 semanas)
---

## 🔐 Restrições de Acesso

⚠️ **IMPORTANTE:** Estas funcionalidades:

- ❌ **NÃO são oferecidas** para CRMs/Portais externos
- ❌ **NÃO devem ser documentadas** publicamente
- ✅ **São exclusivas** para a plataforma Ruum
- ✅ **Usam Airtable** como banco de dados principal

---

## 📖 Documentação Pública

Para documentação de integrações externas (CRMs/Portais), consulte:

📂 **[../Public/README.md](../Public/README.md)**

---

## 🆘 Suporte Interno

- **Email:** renato@ruum.com.br
- **Slack:** #dev-api-ruum
