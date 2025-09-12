# 🏠 Virtual Staging AI - API Documentation

## 📋 **Visão Geral**

A integração com Virtual Staging AI permite criar **virtual staging** de imóveis, adicionando móveis virtuais a ambientes vazios, removendo móveis existentes (decluttering) ou fazendo ambos.

## 🔑 **Configuração**

### **Variável de Ambiente:**
```bash
VIRTUAL_STAGING_API_KEY=sua_chave_aqui
```

**Obs**: Requer plano **Enterprise** da Virtual Staging AI.

## 🛠️ **Endpoints Disponíveis**

### **1. Teste de Conexão**
```http
GET /api/virtual-staging/test
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com Virtual Staging AI funcionando",
  "data": {
    "userObj": { "email": "...", "uid": "..." },
    "photoLimit": 123,
    "photosUsedThisPeriod": 19
  }
}
```

### **2. Opções Disponíveis**
```http
GET /api/virtual-staging/options
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "predefined_styles": {
      "MODERN": "modern",
      "SCANDINAVIAN": "scandinavian",
      "INDUSTRIAL": "industrial",
      "LUXURY": "luxury"
    },
    "predefined_room_types": {
      "LIVING": "living",
      "BEDROOM": "bed",
      "KITCHEN": "kitchen",
      "DINING": "dining"
    }
  }
}
```

### **3. Criar Virtual Staging**
```http
POST /api/virtual-staging/create
```

**Payload:**
```json
{
  "image_url": "https://exemplo.com/imagem.jpg",
  "room_type": "living",
  "style": "modern",
  "declutter_mode": "off",
  "add_furniture": true,
  "wait_for_completion": true
}
```

**Parâmetros:**
- **image_url** (obrigatório): URL da imagem
- **room_type**: Tipo de ambiente (`living`, `bed`, `kitchen`, `dining`, `bathroom`, `home_office`, `outdoor`, `kids_room`)
- **style**: Estilo de decoração (`modern`, `scandinavian`, `industrial`, `luxury`, `farmhouse`, `coastal`, `standard`)
- **declutter_mode**: Modo de limpeza (`off`, `on`, `auto`)
- **add_furniture**: Adicionar móveis (`true`, `false`)
- **wait_for_completion**: Aguardar conclusão (`true`, `false`)

**Resposta (wait_for_completion = true):**
```json
{
  "success": true,
  "message": "Virtual staging concluído",
  "result_image_url": "https://resultado.com/imagem.jpg",
  "data": {
    "render_id": "abc123",
    "result_image_url": "https://resultado.com/imagem.jpg"
  }
}
```

**Resposta (wait_for_completion = false):**
```json
{
  "success": true,
  "message": "Virtual staging iniciado - use o render_id para verificar o progresso",
  "data": {
    "render_id": "abc123"
  }
}
```

### **4. Verificar Status**
```http
GET /api/virtual-staging/status/{render_id}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "render_id": "abc123",
    "status": "done",
    "progress": 1.0,
    "outputs": ["https://resultado1.com/imagem.jpg"],
    "created_at": 1685742540902
  }
}
```

**Status possíveis:**
- `rendering`: Em processamento
- `done`: Concluído
- `error`: Erro

### **5. Criar Variação**
```http
POST /api/virtual-staging/variation/{render_id}
```

**Payload:**
```json
{
  "style": "luxury",
  "wait_for_completion": true
}
```

### **6. Análise + Virtual Staging (IA)**
```http
POST /api/virtual-staging/analyze-and-stage
```

**Payload:**
```json
{
  "image_url": "https://exemplo.com/imagem.jpg",
  "style": "modern",
  "wait_for_completion": true
}
```

**Funcionalidade:**
1. **ChatGPT analisa** a imagem para identificar o tipo de ambiente
2. **Virtual Staging** é aplicado automaticamente
3. **Resultado** combinado é retornado

**Resposta:**
```json
{
  "success": true,
  "message": "Análise e virtual staging concluídos",
  "detected_room_type": "living",
  "style_applied": "modern",
  "result_image_url": "https://resultado.com/imagem.jpg",
  "data": {
    "render_id": "abc123",
    "result_image_url": "https://resultado.com/imagem.jpg"
  }
}
```

## 🎨 **Estilos Disponíveis**

- **modern**: Moderno
- **scandinavian**: Escandinavo  
- **industrial**: Industrial
- **midcentury**: Mid-century
- **luxury**: Luxo
- **farmhouse**: Casa de campo
- **coastal**: Costeiro
- **standard**: Padrão

## 🏡 **Tipos de Ambiente**

- **living**: Sala de estar
- **bed**: Quarto
- **kitchen**: Cozinha
- **dining**: Sala de jantar
- **bathroom**: Banheiro
- **home_office**: Escritório
- **outdoor**: Área externa
- **kids_room**: Quarto infantil

## 🔧 **Modos de Operação**

### **1. Apenas Staging (Padrão)**
```json
{
  "declutter_mode": "off",
  "add_furniture": true
}
```
Adiciona móveis virtuais ao ambiente.

### **2. Apenas Decluttering**
```json
{
  "declutter_mode": "on",
  "add_furniture": false
}
```
Remove móveis existentes sem adicionar novos.

### **3. Decluttering + Staging**
```json
{
  "declutter_mode": "auto",
  "add_furniture": true
}
```
Remove móveis existentes e adiciona novos.

## 💡 **Exemplos de Uso no Front-end**

### **Virtual Staging Simples:**
```javascript
async function createVirtualStaging(imageUrl, roomType, style) {
  try {
    const response = await fetch('/api/virtual-staging/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        room_type: roomType,
        style: style,
        wait_for_completion: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.result_image_url;
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

### **Análise Automática + Staging:**
```javascript
async function autoStaging(imageUrl, style = 'modern') {
  try {
    const response = await fetch('/api/virtual-staging/analyze-and-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        style: style,
        wait_for_completion: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        imageUrl: result.result_image_url,
        detectedRoom: result.detected_room_type,
        styleApplied: result.style_applied
      };
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

### **Processamento Assíncrono:**
```javascript
async function asyncStaging(imageUrl, roomType, style) {
  try {
    // Iniciar processamento
    const response = await fetch('/api/virtual-staging/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        room_type: roomType,
        style: style,
        wait_for_completion: false
      })
    });
    
    const result = await response.json();
    const renderId = result.data.render_id;
    
    // Verificar status periodicamente
    const checkStatus = async () => {
      const statusResponse = await fetch(`/api/virtual-staging/status/${renderId}`);
      const statusResult = await statusResponse.json();
      
      if (statusResult.data.status === 'done') {
        return statusResult.data.outputs[0];
      } else if (statusResult.data.status === 'error') {
        throw new Error('Erro no processamento');
      } else {
        // Ainda processando, verificar novamente em 5 segundos
        setTimeout(checkStatus, 5000);
      }
    };
    
    return await checkStatus();
    
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

## ⚠️ **Limitações e Considerações**

1. **Plano Enterprise obrigatório** para acesso à API
2. **Concorrência máxima**: 50 renders simultâneos
3. **Máximo de variações**: 20 por render
4. **Timeout**: 3 minutos para `wait_for_completion=true`
5. **URLs temporárias**: Resultados devem ser salvos em seu próprio storage

## 🎯 **Casos de Uso**

- **Imobiliárias**: Staging virtual de imóveis vazios
- **Arquitetos**: Visualização de projetos
- **Decoradores**: Apresentação de estilos
- **Marketplaces**: Melhoria de anúncios

---

📅 **Criado**: 3 de julho de 2025  
🔧 **Versão**: 1.0.0
