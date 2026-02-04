# 🏢 CRM/XML Integration API - Carga Automática de Imóveis

> **Endpoint Base:** `/api`  
> **Métodos:** POST  
> **Tipo:** Síncrono / Background  
> **Tempo de Resposta:** 2-30 segundos (depende da quantidade de imóveis)

---

## 📋 Visão Geral

A API de Integração CRM/XML permite sincronização automática de imóveis de sistemas externos (CRMs, arquivos XML) com o Airtable. O sistema suporta importação manual, automática via webhook e monitoramento contínuo de feeds XML.

**Casos de uso:**
- Sincronizar catálogo de imóveis do CRM para Airtable
- Importar feeds XML de imobiliárias
- Monitoramento automático de alterações em feeds
- Webhook para notificações de novos imóveis

**Formatos suportados:**
- XML Kenlo
- XML SIGA
- XML Padrão (formato customizado)

---

## 🔗 Endpoints Disponíveis

### 1. Importar XML Manual

```
POST /api/import-xml
```

### 2. Iniciar Monitoramento Automático

```
POST /api/start-xmlwatcher
```

### 3. Parar Monitoramento

```
POST /api/stop-xmlwatcher
```

---

## 📥 Importar XML Manual

### Endpoint:

```
POST /api/import-xml
```

### Content-Type:

```
application/xml
```

### Requisição (XML no body):

Envie o conteúdo XML diretamente no corpo da requisição.

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/import-xml \
  -H "Content-Type: application/xml" \
  --data-binary @imoveis.xml
```

### Exemplo com JavaScript:

```javascript
async function importXmlFile(xmlContent) {
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/import-xml',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlContent
    }
  );
  
  const result = await response.json();
  console.log(`${result.count} imóveis importados`);
  
  return result;
}

// Uso com arquivo
const xmlFile = await fetch('/path/to/imoveis.xml');
const xmlText = await xmlFile.text();
await importXmlFile(xmlText);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "count": 45
}
```

**Campos da resposta:**
- `success`: Indica sucesso da operação
- `count`: Número total de imóveis encontrados no XML

---

## 🔄 Iniciar Monitoramento Automático

### Endpoint:

```
POST /api/start-xmlwatcher
```

### Descrição:

Inicia monitoramento contínuo de um feed XML, verificando e sincronizando automaticamente a cada 24 horas.

### Requisição (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `xmlUrl` | string | ✅ | URL do feed XML a ser monitorado |
| `intervalMinutes` | number | ❌ | Intervalo de verificação em minutos (padrão: 1440 = 24h) |

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/start-xmlwatcher \
  -H "Content-Type: application/json" \
  -d '{
    "xmlUrl": "https://meucrm.com.br/feed/imoveis.xml",
    "intervalMinutes": 1440
  }'
```

### Exemplo com JavaScript:

```javascript
async function startXmlWatcher(xmlUrl, intervalHours = 24) {
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/start-xmlwatcher',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        xmlUrl: xmlUrl,
        intervalMinutes: intervalHours * 60
      })
    }
  );
  
  const result = await response.json();
  console.log(result.message);
  
  return result;
}

// Iniciar monitoramento diário
await startXmlWatcher('https://meucrm.com.br/feed/imoveis.xml', 24);
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Observador iniciado para https://meucrm.com.br/feed/imoveis.xml a cada 1440 minutos."
}
```

**Comportamento:**
- Executa uma importação **imediatamente** ao iniciar
- Agenda próximas importações no intervalo definido
- Substitui qualquer watcher anterior (apenas 1 ativo por vez)
- Continua rodando em background até ser parado

---

## ⏹️ Parar Monitoramento

### Endpoint:

```
POST /api/stop-xmlwatcher
```

### Exemplo com cURL:

```bash
curl -X POST https://apiruum-562831020087.us-central1.run.app/api/stop-xmlwatcher
```

### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Observador parado."
}
```

### Resposta quando não há watcher ativo (200):

```json
{
  "success": false,
  "message": "Nenhum observador em execução."
}
```

---

## 📋 Estrutura do XML

### Formato XML Kenlo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Imoveis>
  <Imovel>
    <CodigoImovel>IMO-001</CodigoImovel>
    <TipoImovel>Apartamento</TipoImovel>
    <Finalidade>Venda</Finalidade>
    <PrecoVenda>850000</PrecoVenda>
    <Bairro>Jardins</Bairro>
    <Cidade>São Paulo</Cidade>
    <Estado>SP</Estado>
    <AreaUtil>120</AreaUtil>
    <QtdDormitorios>3</QtdDormitorios>
    <QtdSuites>2</QtdSuites>
    <QtdBanheiros>3</QtdBanheiros>
    <QtdVagas>2</QtdVagas>
    <TituloImovel>Apartamento Moderno nos Jardins</TituloImovel>
    <Observacao>Apartamento com acabamento de alto padrão</Observacao>
    <URLGaiaSite>https://meusite.com/imovel/IMO-001</URLGaiaSite>
    <Fotos>
      <Foto>
        <URLArquivo>https://cdn.example.com/foto1.jpg</URLArquivo>
      </Foto>
      <Foto>
        <URLArquivo>https://cdn.example.com/foto2.jpg</URLArquivo>
      </Foto>
    </Fotos>
  </Imovel>
</Imoveis>
```

### Formato XML SIGA:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Listings>
  <Listing>
    <ListingID>IMO-002</ListingID>
    <TransactionType>For Sale</TransactionType>
    <ListingURL>https://meusite.com/imovel/IMO-002</ListingURL>
    <Title>Casa Moderna em Condomínio</Title>
    <Details>
      <PropertyType>Casa</PropertyType>
      <ListPrice>1200000</ListPrice>
      <LivingArea>250</LivingArea>
      <Bedrooms>4</Bedrooms>
      <Suites>3</Suites>
      <Bathrooms>4</Bathrooms>
      <Garage>3</Garage>
      <Description>Casa moderna com piscina</Description>
    </Details>
    <Location>
      <Neighborhood>Alphaville</Neighborhood>
      <City>Barueri</City>
      <State>
        <abbreviation>SP</abbreviation>
      </State>
    </Location>
    <Media>
      <Item medium="image">
        <_>https://cdn.example.com/casa1.jpg</_>
      </Item>
      <Item medium="image">
        <_>https://cdn.example.com/casa2.jpg</_>
      </Item>
    </Media>
  </Listing>
</Listings>
```

---

## 🔄 Comportamento de Sincronização

### Lógica de Importação:

1. **Detecta e Remove Duplicatas no XML:**
   - Identifica imóveis com mesmo código
   - Mantém apenas primeira ocorrência

2. **Detecta e Remove Duplicatas no Airtable:**
   - Busca registros com mesmo código
   - Remove duplicatas existentes

3. **Cadastra Apenas Novos Imóveis:**
   - Compara códigos XML vs Airtable
   - Cria registro somente se não existir
   - **NÃO atualiza** registros existentes

### Campos Mapeados no Airtable:

| Campo Airtable | XML Kenlo | XML SIGA | Tipo |
|----------------|-----------|----------|------|
| `client` | Fixo: "Tamiles Bortoletto" | Fixo: "Tamiles Bortoletto" | Text |
| `code` | CodigoImovel | ListingID | Text (único) |
| `type` | TipoImovel | PropertyType | Text |
| `finally` | Finalidade | TransactionType | Text |
| `value` | PrecoVenda | ListPrice | Number |
| `neighbordhood` | Bairro | Neighborhood | Text |
| `city` | Cidade | City | Text |
| `state` | Estado | State.abbreviation | Text |
| `util_area` | AreaUtil | LivingArea | Number |
| `rooms` | QtdDormitorios | Bedrooms | Number |
| `suits` | QtdSuites | Suites | Number |
| `bathrooms` | QtdBanheiros | Bathrooms | Number |
| `parking_spaces` | QtdVagas | Garage | Number |
| `description` | TituloImovel/Observacao | Title/Description | Long Text |
| `photos` | Fotos.Foto[] | Media.Item[] | Long Text (URLs separadas por `\n`) |
| `url_photos` | Fotos.Foto[] | Media.Item[] | Long Text |
| `URL_Propriedade` | URLGaiaSite | ListingURL | URL |

---

## ⚠️ Códigos de Erro

### 400 - Missing XML URL

**Causa:** Campo `xmlUrl` não fornecido ao iniciar watcher

```json
{
  "success": false,
  "message": "xmlUrl is required"
}
```

**Solução:** Forneça uma URL válida do feed XML

---

### 400 - Invalid XML

**Causa:** Conteúdo XML malformado ou inválido

```json
{
  "success": false,
  "message": "XML parsing error: ..."
}
```

**Solução:** 
1. Valide o XML em um validador online
2. Verifique a codificação (UTF-8)
3. Certifique-se que todos os tags estão fechados

---

### 500 - XML Fetch Failed

**Causa:** Falha ao buscar XML da URL fornecida

```json
{
  "success": false,
  "message": "Failed to fetch XML"
}
```

**Possíveis causas:**
1. URL inaccessível ou inválida
2. Servidor do feed está offline
3. Problemas de rede

**Solução:**
1. Teste a URL no navegador
2. Verifique se o feed é público
3. Confirme que o servidor está online

---

### 500 - Airtable Sync Error

**Causa:** Erro ao sincronizar com Airtable

```json
{
  "success": false,
  "message": "Airtable synchronization error"
}
```

**Solução:** Entre em contato com o suporte técnico

---

## 💡 Exemplos de Uso Completos

### Exemplo 1: Importação Manual Única

```javascript
async function importPropertyFeed(xmlUrl) {
  try {
    // Buscar XML
    const response = await fetch(xmlUrl);
    const xmlContent = await response.text();
    
    // Importar para Airtable
    const importResponse = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/import-xml',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlContent
      }
    );
    
    const result = await importResponse.json();
    
    if (result.success) {
      console.log(`✅ ${result.count} imóveis importados com sucesso`);
    } else {
      console.error('❌ Erro na importação:', result.message);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Uso
await importPropertyFeed('https://meucrm.com.br/feed/imoveis.xml');
```

### Exemplo 2: Configurar Sincronização Diária

```javascript
async function setupDailySync(xmlUrl) {
  // Parar qualquer watcher anterior
  await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/stop-xmlwatcher',
    { method: 'POST' }
  );
  
  // Iniciar novo watcher (24h)
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/start-xmlwatcher',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        xmlUrl: xmlUrl,
        intervalMinutes: 1440 // 24 horas
      })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Sincronização diária configurada');
    console.log('📅 Próxima sincronização em 24 horas');
  }
  
  return result;
}

// Configurar sincronização automática
await setupDailySync('https://meucrm.com.br/feed/imoveis.xml');
```

### Exemplo 3: Monitoramento com Verificação a Cada 6 Horas

```javascript
async function setupFrequentSync(xmlUrl) {
  const response = await fetch(
    'https://apiruum-562831020087.us-central1.run.app/api/start-xmlwatcher',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        xmlUrl: xmlUrl,
        intervalMinutes: 360 // 6 horas
      })
    }
  );
  
  const result = await response.json();
  console.log('🔄 Sincronização a cada 6 horas ativada');
  
  return result;
}
```

### Exemplo 4: Importação com Validação Prévia

```javascript
async function validateAndImportXml(xmlUrl) {
  try {
    console.log('📥 Baixando XML...');
    const response = await fetch(xmlUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlContent = await response.text();
    
    // Validação básica
    if (!xmlContent.includes('<?xml')) {
      throw new Error('Conteúdo não parece ser XML válido');
    }
    
    console.log('✅ XML baixado com sucesso');
    console.log(`📊 Tamanho: ${(xmlContent.length / 1024).toFixed(2)} KB`);
    
    // Importar
    console.log('📤 Importando para Airtable...');
    const importResponse = await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/import-xml',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlContent
      }
    );
    
    const result = await importResponse.json();
    
    if (result.success) {
      console.log(`✅ Importação concluída: ${result.count} imóveis`);
    } else {
      console.error('❌ Erro:', result.message);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Falha na validação/importação:', error.message);
    throw error;
  }
}

// Uso
await validateAndImportXml('https://meucrm.com.br/feed/imoveis.xml');
```

### Exemplo 5: Sistema de Controle do Watcher

```javascript
class XmlWatcherController {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.isActive = false;
  }
  
  async start(xmlUrl, intervalHours = 24) {
    if (this.isActive) {
      console.log('⚠️ Watcher já está ativo. Reiniciando...');
      await this.stop();
    }
    
    const response = await fetch(
      `${this.apiUrl}/start-xmlwatcher`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlUrl: xmlUrl,
          intervalMinutes: intervalHours * 60
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      this.isActive = true;
      console.log(`✅ Watcher iniciado (intervalo: ${intervalHours}h)`);
    }
    
    return result;
  }
  
  async stop() {
    const response = await fetch(
      `${this.apiUrl}/stop-xmlwatcher`,
      { method: 'POST' }
    );
    
    const result = await response.json();
    
    if (result.success) {
      this.isActive = false;
      console.log('⏹️ Watcher parado');
    }
    
    return result;
  }
  
  async restart(xmlUrl, intervalHours = 24) {
    await this.stop();
    return await this.start(xmlUrl, intervalHours);
  }
  
  getStatus() {
    return {
      active: this.isActive
    };
  }
}

// Uso
const watcher = new XmlWatcherController(
  'https://apiruum-562831020087.us-central1.run.app/api'
);

// Iniciar
await watcher.start('https://meucrm.com.br/feed/imoveis.xml', 24);

// Verificar status
console.log(watcher.getStatus()); // { active: true }

// Parar
await watcher.stop();

// Reiniciar com novo intervalo
await watcher.restart('https://meucrm.com.br/feed/imoveis.xml', 12);
```

---

## 📊 Boas Práticas

### ✅ Recomendações:

1. **Intervalo Adequado:** Use intervalo de 24h para feeds que não mudam frequentemente
2. **Validação de URL:** Sempre teste a URL do feed antes de configurar watcher
3. **Monitoramento:** Implemente logs para acompanhar importações
4. **Tratamento de Erro:** Configure retry em caso de falha temporária
5. **Codificação:** Certifique-se que o XML está em UTF-8

### ❌ Evite:

1. ❌ Intervalos muito curtos (<1 hora) - sobrecarga no sistema
2. ❌ Múltiplos watchers simultâneos - apenas 1 é permitido
3. ❌ URLs privadas que exigem autenticação
4. ❌ Feeds XML malformados ou incompletos
5. ❌ Importar sem validar estrutura do XML primeiro

---

## 🔍 Detecção Automática de Formato

A API detecta automaticamente o formato do XML baseado nos campos presentes:

| Formato | Campo Identificador | Prioridade |
|---------|---------------------|------------|
| **XML SIGA** | `ListingID` presente | 1ª |
| **XML Kenlo** | `CodigoImovel` presente | 2ª |
| **XML Padrão** | Campo `codigo` | 3ª (padrão) |

**Você não precisa especificar o formato** - a API identifica automaticamente.

---

## ⚙️ Limitações

- ⚠️ **Apenas 1 watcher ativo:** Iniciar novo watcher substitui o anterior
- ⚠️ **Não atualiza existentes:** Apenas adiciona novos imóveis
- ⚠️ **Remove duplicatas:** Imóveis duplicados (mesmo código) são ignorados
- ⚠️ **Tabela fixa:** Importa para tabela "Tamiles" apenas
- ⚠️ **Cliente fixo:** Todos os imóveis ficam com cliente "Tamiles Bortoletto"

---

## 🆘 Troubleshooting

### Problema: Watcher para de funcionar após reiniciar servidor

**Causa:** Watchers são armazenados em memória e são perdidos ao reiniciar

**Solução:** Configure o watcher novamente após reinicializações:

```javascript
// Adicionar no startup da aplicação
async function initializeWatcher() {
  const xmlUrl = process.env.XML_FEED_URL;
  
  if (xmlUrl) {
    await fetch(
      'https://apiruum-562831020087.us-central1.run.app/api/start-xmlwatcher',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlUrl: xmlUrl,
          intervalMinutes: 1440
        })
      }
    );
  }
}
```

---

### Problema: Imóveis não aparecem no Airtable após importação

**Causas possíveis:**
1. Imóveis já existem (código duplicado)
2. Erro de parsing do XML
3. Campos obrigatórios ausentes

**Solução:**
1. Verifique se `code` é único
2. Valide estrutura do XML
3. Consulte logs do servidor

---

### Problema: XML muito grande causa timeout

**Solução:** Use importação em lotes ou otimize o feed XML:

```javascript
// Para feeds muito grandes, considere dividir
async function importLargeXml(xmlUrl) {
  // Implementar paginação no lado do CRM
  // ou processar em chunks menores
}
```

---

## 📖 Documentação Relacionada

- [IMAGE_SUGGESTIONS.md](./IMAGE_SUGGESTIONS.md) - Sistema de sugestões
- [FIREBASE_STORAGE.md](./FIREBASE_STORAGE.md) - Upload de fotos
- [README.md](./README.md) - Visão geral da API

---

## 🆘 Suporte

- **Email:** renato@ruum.com.br
- **Documentação:** Esta pasta CRM_INTEGRATION
- **Resposta:** 24-48h úteis
