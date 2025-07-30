# 🔧 Como Executar e Diagnosticar ShotStack + Endpoints de Áudio

## 🏃 Execução Local

### Pré-requisitos
- Node.js versão 16 ou superior
- npm ou yarn instalado
- Chave da API do ShotStack
- **NOVO**: Dependências para upload de áudio (multer, uuid)

### 1. Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd API_Ruum/apiruum

# Instalar dependências (incluindo novas para áudio)
npm install

# Criar diretório para uploads
mkdir -p uploads/audio
```

### 2. Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ShotStack API
SHOTSTACK_API_KEY=sua_chave_aqui

# Outras configurações
PORT=3000
NODE_ENV=development
```

### 3. Executar a aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com nodemon (recarrega automaticamente)
npm run watch
```

A aplicação estará disponível em: `http://localhost:3000`

## 🔍 Diagnóstico de Problemas

### 1. Teste Rápido de Autenticação

```bash
# Teste rápido
node scripts/diagnose-shotstack.js --quick

# Ou com npm
npm run test:shotstack
```

### 2. Diagnóstico Completo

```bash
# Diagnóstico completo
node scripts/diagnose-shotstack.js

# Com análise detalhada
node scripts/diagnose-shotstack.js --verbose
```

### 3. Teste via API

```bash
# Teste de autenticação
curl -X GET http://localhost:3000/api/shotstack/test-auth

# Diagnóstico completo
curl -X GET http://localhost:3000/api/shotstack/diagnose

# Teste de renderização
curl -X POST http://localhost:3000/api/shotstack/test-render \
  -H "Content-Type: application/json"
```

## 🐛 Resolução de Problemas Comuns

### Erro 401 - Unauthorized

**Causa:** API Key inválida ou expirada

**Solução:**
1. Verifique se a `SHOTSTACK_API_KEY` está no arquivo `.env`
2. Acesse o [painel do ShotStack](https://dashboard.shotstack.io/)
3. Gere uma nova API Key se necessário
4. Reinicie a aplicação

### Erro 402 - Payment Required

**Causa:** Créditos insuficientes

**Solução:**
1. Acesse o [painel do ShotStack](https://dashboard.shotstack.io/)
2. Verifique o saldo de créditos
3. Adicione créditos ou atualize o plano
4. Verifique se a conta não está suspensa

### Erro 400 - Bad Request

**Causa:** Payload inválido ou timeline malformada

**Solução:**
1. Verifique se a timeline possui pelo menos uma track
2. Confirme que os assets têm URLs válidas
3. Valide os parâmetros start e length
4. Use o endpoint `/api/shotstack/test-render` para testar

### Erro 429 - Rate Limit

**Causa:** Muitas requisições

**Solução:**
1. Aguarde alguns minutos
2. Reduza a frequência de requisições
3. Considere upgrade do plano

### Erro 500 - Internal Server Error

**Causa:** Erro interno do servidor

**Solução:**
1. Verifique os logs do servidor
2. Reinicie a aplicação
3. Verifique se todas as dependências estão instaladas
4. Confirme se o Node.js está na versão correta

## 🧪 Testes Automatizados

### Executar todos os testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Testes específicos do ShotStack
npm run test:shotstack
```

### Estrutura de Testes

```
tests/
├── unit/
│   ├── shotstack.test.js
│   └── validators.test.js
├── integration/
│   ├── api.test.js
│   └── shotstack-api.test.js
└── fixtures/
    ├── valid-timeline.json
    └── invalid-timeline.json
```

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
npm run logs

# Logs específicos do ShotStack
npm run logs:shotstack
```

### Métricas

```bash
# Status da aplicação
curl -X GET http://localhost:3000/api/health

# Métricas do ShotStack
curl -X GET http://localhost:3000/api/shotstack/metrics
```

## 🚀 Deploy

### Desenvolvimento

```bash
# Build da aplicação
npm run build

# Executar build
npm run serve
```

### Produção

```bash
# Docker
docker build -t apiruum .
docker run -p 3000:3000 --env-file .env apiruum

# PM2
pm2 start ecosystem.config.js
pm2 logs apiruum
pm2 restart apiruum
```

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
PORT=3000
SHOTSTACK_API_KEY=sua_chave_de_producao
LOG_LEVEL=info
```

## 📋 Checklist de Verificação

### Antes de usar em produção:

- [ ] API Key do ShotStack configurada
- [ ] Teste de autenticação passou
- [ ] Teste de renderização funcionou
- [ ] Créditos suficientes na conta
- [ ] Logs configurados adequadamente
- [ ] Monitoramento implementado
- [ ] Backup das configurações

### Para cada nova renderização:

- [ ] Timeline validada
- [ ] Assets acessíveis via URL
- [ ] Parâmetros de output configurados
- [ ] Timeout apropriado definido
- [ ] Tratamento de erros implementado

## 🆘 Suporte

### Links Úteis

- [Painel ShotStack](https://dashboard.shotstack.io/)
- [Documentação API](https://shotstack.io/docs/)
- [Suporte ShotStack](https://shotstack.io/support/)
- [Status do Serviço](https://status.shotstack.io/)

### Contato

Para problemas específicos do projeto:
1. Execute o diagnóstico completo
2. Salve os logs relevantes
3. Documente os passos para reproduzir o problema
4. Entre em contato com a equipe de desenvolvimento

## 🔄 Atualizações

### Manter dependências atualizadas

```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Atualizar dependências de segurança
npm audit fix
```

### Backup da configuração

```bash
# Backup das configurações
cp .env .env.backup.$(date +%Y%m%d)
```

## 🎵 Endpoints de Áudio (NOVO)

### Funcionalidades Adicionadas
- Upload de arquivos de áudio
- Serving de áudio via URL pública
- Limpeza automática de arquivos antigos
- Integração com ShotStack

### Endpoints Disponíveis

#### Upload de Áudio
```bash
POST /api/audio/upload
Content-Type: multipart/form-data

# Exemplo de teste
curl -X POST \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -F "audio=@exemplo.mp3" \
  http://localhost:3000/api/audio/upload
```

#### Servir Áudio
```bash
GET /api/audio/:id

# Exemplo
curl -X GET http://localhost:3000/api/audio/123e4567-e89b-12d3-a456-426614174000
```

#### Listar Áudios
```bash
GET /api/audio

# Exemplo
curl -X GET http://localhost:3000/api/audio
```

#### Deletar Áudio
```bash
DELETE /api/audio/:id

# Exemplo
curl -X DELETE http://localhost:3000/api/audio/123e4567-e89b-12d3-a456-426614174000
```

### Configurações de Áudio
- **Tamanho máximo**: 10MB
- **Formatos suportados**: MP3, WAV, OGG, AAC, WebM
- **Retenção**: 24 horas (limpeza automática)
- **Storage**: `uploads/audio/`

### Fluxo de Integração
1. **Frontend**: Recebe blob do ElevenLabs
2. **Upload**: POST para `/api/audio/upload`
3. **URL pública**: Retornada pela API
4. **ShotStack**: Usa URL no payload da timeline
5. **Limpeza**: Automática após 24h

### Exemplo de Integração
```javascript
// 1. Upload do áudio
const audioUrl = await uploadAudio(audioBlob);

// 2. Usar no ShotStack
const timeline = {
  tracks: [{ clips: [{ asset: { type: 'video', src: videoUrl } }] }],
  soundtrack: { src: audioUrl, effect: 'fadeIn' }
};

// 3. Renderizar
const result = await sendToShotstack({ timeline });
```

## 🎯 Próximos Passos

1. **Testar localmente** com arquivos MP3 reais
2. **Fazer deploy** no Cloud Run
3. **Integrar no frontend** usando exemplo fornecido
4. **Monitorar uploads** e performance

## 📖 Documentação Adicional

- `AUDIO_ENDPOINTS.md` - Documentação completa dos endpoints de áudio
- `examples/shotstack-audio-integration.js` - Exemplo de integração
- `DEPLOY.md` - Instruções de deploy
