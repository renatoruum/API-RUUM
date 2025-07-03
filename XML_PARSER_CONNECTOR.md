# 📄 XML Parser Connector - Documentation

## 📋 **Visão Geral**

O conector XML Parser é responsável por analisar e converter diferentes formatos de XML de imóveis em objetos JavaScript normalizados. Suporta múltiplos formatos de XML comuns no setor imobiliário.

## 🔑 **Configuração**

### **Dependências:**
```bash
npm install xml2js
```

### **Importação:**
```javascript
import { parseImoveisXml } from "../connectors/xmlParser.js";
```

## 🛠️ **Função Principal**

### **parseImoveisXml(xmlString)**
Parseia um XML de imóveis e retorna um array de objetos normalizados.

**Parâmetros:**
- `xmlString` (string): String contendo o XML dos imóveis

**Retorna:**
- `Promise<Array>`: Array de objetos de imóveis normalizados

**Sintaxe:**
```javascript
const imoveis = await parseImoveisXml(xmlString);
```

## 📊 **Formatos XML Suportados**

### **1. Formato Carga/Imoveis/Imovel**
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

### **2. Formato imoveis/imovel**
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

### **3. Formato ListingDataFeed**
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

## 🔄 **Processo de Normalização**

### **Objeto de Saída Normalizado:**
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
    },
    {
      url: "https://example.com/foto2.jpg",
      destaque: false
    }
  ]
}
```

## 📋 **Mapeamento de Campos**

### **Tabela de Mapeamento:**

| Campo Normalizado | Formato 1 | Formato 2 | Formato 3 |
|------------------|-----------|-----------|-----------|
| `codigo` | `CodigoImovel` | `codigo` | `ListingId` |
| `titulo` | `TituloImovel` | `titulo` | `ListingTitle` |
| `categoria` | `Categoria` | `tipo` | `PropertyType` |
| `cidade` | `Cidade` | `cidade` | `City` |
| `bairro` | `Bairro` | `bairro` | `Neighborhood` |
| `endereco` | `Endereco` | `endereco` | `Address` |
| `valor` | `Valor` | `preco` | `Price` |
| `area` | `AreaUtil` | `area` | `LivingArea` |
| `quartos` | `Quartos` | `quartos` | `Bedrooms` |
| `banheiros` | `Banheiros` | `banheiros` | `Bathrooms` |
| `vagas` | `Garagem` | `vagas` | `Parking` |
| `descricao` | `Descricao` | `descricao` | `Description` |

## 🖼️ **Processamento de Fotos**

### **Formato 1 - Fotos/Foto:**
```xml
<Fotos>
  <Foto>
    <URLArquivo>https://example.com/foto1.jpg</URLArquivo>
    <Destaque>true</Destaque>
  </Foto>
</Fotos>
```

### **Formato 2 - fotos/foto (atributos):**
```xml
<fotos>
  <foto url="https://example.com/foto1.jpg" destaque="true"/>
  <foto url="https://example.com/foto2.jpg" destaque="false"/>
</fotos>
```

### **Formato 3 - Media/Item:**
```xml
<Media>
  <Item>
    <MediaURL>https://example.com/image1.jpg</MediaURL>
    <MediaType>image</MediaType>
    <IsPrimary>true</IsPrimary>
  </Item>
</Media>
```

## 🔧 **Configuração do Parser**

### **Opções do xml2js:**
```javascript
const options = {
  explicitArray: false,  // Não força arrays para elementos únicos
  trim: true,           // Remove espaços em branco
  mergeAttrs: true      // Mescla atributos com conteúdo
};
```

## ⚠️ **Tratamento de Erros**

### **Erros Comuns:**
- **XML malformado**: Estrutura inválida
- **Codificação**: Problemas de encoding
- **Formato não suportado**: Estrutura XML não reconhecida
- **Campos obrigatórios**: Falta de dados essenciais

### **Exemplo de Erro:**
```javascript
try {
  const imoveis = await parseImoveisXml(xmlString);
} catch (error) {
  if (error.message.includes('Non-whitespace before first tag')) {
    console.error('XML malformado');
  } else {
    console.error('Erro no parsing:', error.message);
  }
}
```

## 📊 **Logging e Debug**

### **Informações Logadas:**
- Estrutura do XML após parsing (primeiros 1000 chars)
- Formato detectado
- Número de imóveis encontrados
- Estrutura de fotos/media
- Propriedades disponíveis em cada elemento

### **Exemplo de Log:**
```
Estrutura do XML após parsing: {"Carga":{"Imoveis":{"Imovel":[...]}}...
Formato detectado: Carga/Imoveis/Imovel
Número de imóveis: 25
Estrutura de Media.Item: {"MediaURL":"...","MediaType":"image"}
```

## 🚀 **Exemplos de Uso**

### **Parsing Básico:**
```javascript
import { parseImoveisXml } from "../connectors/xmlParser.js";

const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imoveis>
    <Imovel>
      <CodigoImovel>123456</CodigoImovel>
      <TituloImovel>Apartamento Moderno</TituloImovel>
      <Categoria>Apartamento</Categoria>
      <Cidade>São Paulo</Cidade>
      <Valor>850000</Valor>
    </Imovel>
  </Imoveis>
</Carga>`;

try {
  const imoveis = await parseImoveisXml(xmlString);
  console.log(`Encontrados ${imoveis.length} imóveis`);
  
  imoveis.forEach(imovel => {
    console.log(`${imovel.codigo}: ${imovel.titulo}`);
    console.log(`Fotos: ${imovel.fotos.length}`);
  });
} catch (error) {
  console.error("Erro no parsing:", error);
}
```

### **Processamento com Validação:**
```javascript
const processXml = async (xmlString) => {
  try {
    const imoveis = await parseImoveisXml(xmlString);
    
    // Validar dados essenciais
    const imoveisValidos = imoveis.filter(imovel => 
      imovel.codigo && imovel.titulo && imovel.cidade
    );
    
    console.log(`${imoveisValidos.length} de ${imoveis.length} imóveis válidos`);
    
    return imoveisValidos;
  } catch (error) {
    console.error("Erro no processamento:", error);
    throw error;
  }
};
```

### **Análise de Estrutura:**
```javascript
const analisarXml = async (xmlString) => {
  const imoveis = await parseImoveisXml(xmlString);
  
  // Estatísticas
  const stats = {
    total: imoveis.length,
    comFotos: imoveis.filter(i => i.fotos.length > 0).length,
    cidades: [...new Set(imoveis.map(i => i.cidade))],
    categorias: [...new Set(imoveis.map(i => i.categoria))]
  };
  
  console.log("Estatísticas do XML:", stats);
  return stats;
};
```

## 📝 **Validação de Dados**

### **Campos Obrigatórios:**
- `codigo`: Identificador único do imóvel
- `titulo`: Nome/título do imóvel
- `cidade`: Cidade do imóvel

### **Campos Opcionais:**
- `categoria`, `bairro`, `endereco`
- `valor`, `area`, `quartos`, `banheiros`, `vagas`
- `descricao`, `fotos`

### **Validação de Fotos:**
```javascript
const validarFotos = (fotos) => {
  return fotos.filter(foto => {
    // Verificar se URL é válida
    try {
      new URL(foto.url);
      return true;
    } catch {
      return false;
    }
  });
};
```

## 🔗 **Recursos Relacionados**

- [XML Import API](./XML_IMPORT_API.md)
- [Airtable Connector](./AIRTABLE_CONNECTOR.md)
- [XML Watcher API](./XML_WATCHER_API.md)

## ⚙️ **Limitações**

- **Tamanho**: XMLs muito grandes podem causar problemas de memória
- **Encoding**: Suporta UTF-8, problemas com outros encodings
- **Estrutura**: Formatos muito diferentes podem não ser reconhecidos
- **Validação**: Não valida semanticamente os dados dos imóveis
