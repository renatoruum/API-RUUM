# 📄 XML Import - API Documentation

## 📋 **Visão Geral**

A API de importação XML permite importar dados de imóveis a partir de arquivos XML no formato padrão do setor imobiliário. O sistema parseia o XML e sincroniza os dados com a base do Airtable.

## 🔑 **Configuração**

### **Variáveis de Ambiente:**
```bash
AIRTABLE_API_KEY=sua_chave_aqui
AIRTABLE_BASE_ID=seu_base_id_aqui
```

**Obs**: Requer conta válida no Airtable com acesso à base de dados configurada.

## 🛠️ **Endpoint Disponível**

### **Importação de XML**
```http
POST /api/import-xml
```

**Descrição**: Importa dados de imóveis a partir de um arquivo XML e sincroniza com o Airtable.

**Headers da Requisição:**
```
Content-Type: application/xml
```

**Corpo da Requisição:**
O corpo deve conter um XML válido com dados de imóveis em um dos formatos suportados.

**Formatos XML Suportados:**

1. **Formato Carga/Imoveis:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imoveis>
    <Imovel>
      <CodigoImovel>123456</CodigoImovel>
      <TituloImovel>Apartamento Moderno</TituloImovel>
      <Categoria>Apartamento</Categoria>
      <Cidade>São Paulo</Cidade>
      <Bairro>Vila Madalena</Bairro>
      <Endereco>Rua das Flores, 123</Endereco>
      <Valor>850000</Valor>
      <AreaUtil>85</AreaUtil>
      <Quartos>2</Quartos>
      <Banheiros>2</Banheiros>
      <Garagem>1</Garagem>
      <Descricao>Apartamento com vista para o parque</Descricao>
      <Fotos>
        <Foto>
          <URLArquivo>https://example.com/foto1.jpg</URLArquivo>
          <Destaque>true</Destaque>
        </Foto>
      </Fotos>
    </Imovel>
  </Imoveis>
</Carga>
```

2. **Formato imoveis/imovel:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<imoveis>
  <imovel>
    <codigo>123456</codigo>
    <titulo>Casa Térrea</titulo>
    <tipo>Casa</tipo>
    <cidade>Rio de Janeiro</cidade>
    <bairro>Copacabana</bairro>
    <endereco>Av. Atlântica, 456</endereco>
    <preco>1200000</preco>
    <area>120</area>
    <quartos>3</quartos>
    <banheiros>2</banheiros>
    <vagas>2</vagas>
    <descricao>Casa com vista para o mar</descricao>
    <fotos>
      <foto url="https://example.com/foto1.jpg" destaque="true"/>
      <foto url="https://example.com/foto2.jpg" destaque="false"/>
    </fotos>
  </imovel>
</imoveis>
```

3. **Formato ListingDataFeed:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed>
  <Listings>
    <Listing>
      <ListingId>123456</ListingId>
      <ListingTitle>Cobertura Luxuosa</ListingTitle>
      <PropertyType>Apartment</PropertyType>
      <City>São Paulo</City>
      <Neighborhood>Jardins</Neighborhood>
      <Address>Rua Oscar Freire, 789</Address>
      <Price>2500000</Price>
      <LivingArea>200</LivingArea>
      <Bedrooms>3</Bedrooms>
      <Bathrooms>3</Bathrooms>
      <Parking>2</Parking>
      <Description>Cobertura com terraço gourmet</Description>
      <Media>
        <Item>
          <MediaURL>https://example.com/image1.jpg</MediaURL>
          <MediaType>image</MediaType>
          <IsPrimary>true</IsPrimary>
        </Item>
      </Media>
    </Listing>
  </Listings>
</ListingDataFeed>
```

**Exemplo de Resposta Sucesso:**
```json
{
  "success": true,
  "count": 25,
  "message": "25 imóveis importados com sucesso"
}
```

## 📊 **Campos Mapeados**

### **Mapeamento de Campos XML → Airtable**

| Campo XML (Formato 1) | Campo XML (Formato 2) | Campo XML (Formato 3) | Campo Airtable |
|----------------------|----------------------|----------------------|----------------|
| `CodigoImovel` | `codigo` | `ListingId` | `Codigo` |
| `TituloImovel` | `titulo` | `ListingTitle` | `Titulo` |
| `Categoria` | `tipo` | `PropertyType` | `Categoria` |
| `Cidade` | `cidade` | `City` | `Cidade` |
| `Bairro` | `bairro` | `Neighborhood` | `Bairro` |
| `Endereco` | `endereco` | `Address` | `Endereco` |
| `Valor` | `preco` | `Price` | `Valor` |
| `AreaUtil` | `area` | `LivingArea` | `Area` |
| `Quartos` | `quartos` | `Bedrooms` | `Quartos` |
| `Banheiros` | `banheiros` | `Bathrooms` | `Banheiros` |
| `Garagem` | `vagas` | `Parking` | `Vagas` |
| `Descricao` | `descricao` | `Description` | `Descricao` |

## ⚠️ **Tratamento de Erros**

### **Erro de Parsing XML (400)**
```json
{
  "success": false,
  "message": "Erro ao fazer parse do XML: Invalid XML structure"
}
```

### **Erro de Formato Não Suportado (400)**
```json
{
  "success": false,
  "message": "Formato XML não suportado ou não encontrado"
}
```

### **Erro de Sincronização (500)**
```json
{
  "success": false,
  "message": "Erro ao sincronizar com Airtable: Connection timeout"
}
```

## 🔧 **Funcionalidades do Conector**

### **parseImoveisXml(xmlString)**
Parseia um XML de imóveis e retorna um array de objetos normalizados.

**Parâmetros:**
- `xmlString` (string): String contendo o XML dos imóveis

**Retorna:** Promise\<Array> com objetos de imóveis normalizados

### **Estrutura do Objeto Retornado:**
```javascript
{
  codigo: "123456",
  titulo: "Apartamento Moderno",
  categoria: "Apartamento",
  cidade: "São Paulo",
  bairro: "Vila Madalena",
  endereco: "Rua das Flores, 123",
  valor: "850000",
  area: "85",
  quartos: "2",
  banheiros: "2",
  vagas: "1",
  descricao: "Apartamento com vista para o parque",
  fotos: [
    {
      url: "https://example.com/foto1.jpg",
      destaque: true
    }
  ]
}
```

## 📝 **Processo de Importação**

1. **Recebimento**: XML é recebido via POST
2. **Parsing**: XML é parseado e validado
3. **Normalização**: Dados são normalizados para formato padrão
4. **Validação**: Campos obrigatórios são verificados
5. **Sincronização**: Dados são enviados para o Airtable
6. **Resposta**: Retorna contagem de imóveis processados

## 🚀 **Exemplos de Uso**

### **Importação via cURL**
```bash
curl -X POST https://apiruum-667905204535.us-central1.run.app/api/import-xml \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imoveis>
    <Imovel>
      <CodigoImovel>123456</CodigoImovel>
      <TituloImovel>Apartamento Moderno</TituloImovel>
      <Categoria>Apartamento</Categoria>
      <Cidade>São Paulo</Cidade>
      <Valor>850000</Valor>
      <AreaUtil>85</AreaUtil>
      <Quartos>2</Quartos>
    </Imovel>
  </Imoveis>
</Carga>'
```

### **Importação via JavaScript**
```javascript
const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<imoveis>
  <imovel>
    <codigo>789012</codigo>
    <titulo>Casa Térrea</titulo>
    <tipo>Casa</tipo>
    <cidade>Rio de Janeiro</cidade>
    <preco>1200000</preco>
    <area>120</area>
    <quartos>3</quartos>
  </imovel>
</imoveis>`;

fetch('https://apiruum-667905204535.us-central1.run.app/api/import-xml', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/xml'
  },
  body: xmlData
})
.then(response => response.json())
.then(data => console.log(data));
```

## 📊 **Monitoramento**

O sistema fornece logs detalhados:
- Estrutura do XML recebido
- Formato detectado
- Número de imóveis encontrados
- Resultado da sincronização
- Erros de parsing ou validação

## 🔗 **Recursos Relacionados**

- [XML Parser Connector](./XML_PARSER_CONNECTOR.md)
- [Airtable Sync Documentation](./AIRTABLE_CONNECTOR.md)
- [XML Schema Examples](./xml/)
