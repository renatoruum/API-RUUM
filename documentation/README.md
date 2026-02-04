# 📚 Documentação API Ruum

> **Organização da Documentação**

---

## 📂 Estrutura

A documentação está dividida em **2 categorias**:

### 📖 Public/ - Documentação Pública

**Para:** CRMs, Portais Imobiliários e integrações externas  
**Conteúdo:** Endpoints de processamento de imagens e vídeos  
**Acesso:** Público (pode ser compartilhado com parceiros)

**Funcionalidades disponíveis:**
- ✅ Virtual Staging
- ✅ Vídeos Before/After, Magic Motion, Magic Drop
- ✅ Processamento direto (enviar → receber URL)

**Características:**
- 🔓 Sem autenticação
- 📤 Retorno direto de URLs públicas
- 💾 Parceiro gerencia próprio armazenamento
- 🔓 Também é consumida pela plataforma RUUM

➡️ **[Ir para documentação pública](./Public/README.md)**

---

### 🔒 Private/ - Documentação Privada

**Para:** Uso interno da plataforma Ruum  
**Conteúdo:** Funcionalidades exclusivas da plataforma Ruum  
**Acesso:** Restrito (NÃO compartilhar externamente)

**Funcionalidades internas:**
- 🗄️ Sistema de aprovação (Airtable)
- 📋 Workflow de curadoria de imagens
- 🔄 Sincronização XML/CRM
- 📦 Upload Firebase Storage/Firestore

**Características:**
- 🔐 Uso exclusivo plataforma Ruum
- 💾 Usa Airtable como banco de dados
- 🔄 Workflows internos de aprovação
- 🚫 NÃO oferecido para integrações externas

➡️ **[Ir para documentação privada](./Private/README.md)**

---

## 🎯 Como Escolher Qual Usar?

| Pergunta | Resposta | Pasta |
|----------|----------|-------|
| Você é um **CRM/Portal** querendo usar nossa API? | Sim | **📖 Public/** |
| Você precisa apenas **processar imagens/vídeos**? | Sim | **📖 Public/** |
| Você gerencia seu **próprio armazenamento**? | Sim | **📖 Public/** |
| Você é **desenvolvedor interno** da Ruum? | Sim | **🔒 Private/** |
| Você precisa acessar **Airtable/Firebase** da Ruum? | Sim | **🔒 Private/** |
| Você precisa da funcionalidade de **curadoria/XML**? | Sim | **🔒 Private/** |

---

## 📞 Suporte

### Para Integrações Externas (Public)
- **Email:** renato@ruum.com.br
- **Resposta:** 24-48h úteis

### Para Desenvolvedores Internos (Private)
- **Email:** renato@ruum.com.br
- **Slack:** #dev-api-ruum

---

## 🔄 Última Atualização

**Data:** 3 de fevereiro de 2026  
**Versão:** 1.0
