# Changelog - API Ruum

## [Deploy 70] - 2024-12-19

### 🚀 Novos Recursos
- **Campo URL_Propriedade**: Implementado mapeamento de URLs de propriedades para todos os formatos XML suportados
  - Kenlo: Campo `URLGaiaSite`
  - SIGA: Campo `ListingURL`
  - Padrão: Campo `url_propriedade`

### 🔧 Melhorias
- **Tratamento de Erro Robusto**: Implementado fallback automático para campos não existentes no Airtable
  - Detecta erros "Unknown field name" automaticamente
  - Remove campos problemáticos e tenta novamente
  - Mantém logs detalhados para auditoria
- **Campo Decluttering**: Adicionado processamento do campo "Decluttering" na tabela Image suggestions
- **Validação de Campos**: Melhorada validação condicional de campos baseada em disponibilidade

### 🔄 Compatibilidade
- **Vista CRM**: Resolvida compatibilidade com XMLs do Vista CRM (formato SIGA)
- **Multi-CRM**: Suporte robusto para Kenlo, SIGA e Vista CRM
- **Backward Compatibility**: Mantida compatibilidade com implementações existentes

### 🛠️ Correções
- **Erro de Campo**: Corrigido erro "Unknown field name: URL_Propriedade" para tabelas sem o campo
- **Processamento Defensivo**: Implementado processamento defensivo para evitar falhas em campos ausentes
- **Logs Melhorados**: Adicionados logs específicos para debugging de problemas de campos

### 📊 Testes
- **URL Capture**: Testado com 100% de sucesso em 1,784 propriedades do Kenlo
- **Vista CRM**: Validado suporte completo ao formato Vista CRM
- **Fallback**: Testado mecanismo de fallback para campos não existentes

### 🌐 Deploy
- **Produção**: Deploy realizado com sucesso na versão apiruum-00070-4q6
- **URL**: https://apiruum-2cpzkgiiia-uc.a.run.app
- **Status**: ✅ Ativo e funcionando

### 📝 Notas Técnicas
- Implementação de retry logic para operações Airtable
- Mapeamento inteligente de campos baseado no tipo de XML detectado
- Logs detalhados para troubleshooting e monitoramento

### 🔍 Arquivos Modificados
- `/src/connectors/airtable.js` - Função `syncImoveisWithAirtable` com tratamento de erro robusto
- `/src/connectors/airtable.js` - Função `upsetImagesInAirtable` com campo Decluttering
