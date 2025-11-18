# Freepik API - Guia de Integração# Freepik API - Documentação de Uso



## Visão Geral## Configuração



A API do Freepik oferece recursos de edição de imagens com IA:Adicione a API Key do Freepik no arquivo `.env`:

- **Remove Background**: Remove o fundo de imagens

- **Upscale (Magnific V2)**: Melhora a resolução com detalhamento por IA```env

- **Reimagine Flux**: Recria imagens mantendo a composiçãoFREEPIK_API_KEY=your_api_key_here

```

**Base URL**: `https://api.freepik.com/v1`  

**Autenticação**: Header `x-freepik-api-key`## Endpoints Disponíveis



---### 1. Text-to-Image (Geração de Imagens com IA)



## 1. Remove BackgroundGera imagens a partir de descrições em texto.



Remove o fundo de uma imagem. URLs temporárias válidas por **5 minutos**.**Endpoint:** `POST /api/freepik/text-to-image`



### Endpoint**Body:**

``````json

POST /api/freepik/remove-background{

```  "prompt": "A modern living room with minimalist furniture, natural light",

  "negative_prompt": "blurry, low quality, dark",

### Request  "styling": {

```json    "style": "photo"

{  },

  "image_url": "https://img.freepik.com/free-photo/example.jpg"  "num_images": 1,

}  "num_inference_steps": 30,

```  "guidance_scale": 7.5

}

### Response```

```json

{**Estilos disponíveis:**

  "success": true,- `photo` - Fotográfico realista

  "message": "Background removal completed",- `digital-art` - Arte digital

  "data": {- `painting` - Pintura artística

    "original": "https://api.freepik.com/v1/ai/beta/images/original/{id}/thumbnail.jpg",- `sketch` - Esboço

    "high_resolution": "https://api.freepik.com/v1/ai/beta/images/download/{id}/high.png",- `3d` - Renderização 3D

    "preview": "https://api.freepik.com/v1/ai/beta/images/download/{id}/preview.png",

    "url": "https://api.freepik.com/v1/ai/beta/images/download/{id}/high.png"---

  }

}### 2. Remove Background

```

Remove o fundo de uma imagem.

### ⚠️ Importante: Restrições de URL

A API do Freepik tem limitações sobre quais URLs pode baixar:**Endpoint:** `POST /api/freepik/remove-background`



✅ **URLs Aceitas:****Body:**

- `img.freepik.com` - Imagens do próprio Freepik```json

- Outras URLs públicas podem funcionar dependendo da configuração{

  "image_url": "https://example.com/image.jpg"

❌ **URLs que podem falhar:**}

- Firebase Storage URLs com caracteres especiais```

- URLs com tokens de autenticação complexos

- URLs privadas ou restritas---



**Solução**: Se sua imagem não funcionar diretamente, considere:### 3. Upscale (Melhorar Resolução)

1. Fazer upload temporário em serviço de imagens público

2. Usar base64 (para endpoints que suportam)Aumenta a resolução de uma imagem.

3. Proxy da imagem através do seu servidor

**Endpoint:** `POST /api/freepik/upscale`

---

**Body:**

## 2. Upscale (Magnific V2)```json

{

Melhora a resolução da imagem com IA. **Processo assíncrono** - retorna `task_id`.  "image_url": "https://example.com/image.jpg",

  "scaling_factor": 2

### Endpoint}

``````

POST /api/freepik/upscale

```**Scaling factors disponíveis:** `2`, `4`, `8`



### Request---

```json

{### 4. Reimagine

  "image_url": "https://example.com/image.jpg",

  "scale_factor": 2,      // 2-16 (padrão: 2)Recria uma imagem mantendo a composição original mas com estilo diferente.

  "sharpen": 7,           // 0-100 (padrão: 7)

  "smart_grain": 7,       // 0-100 (padrão: 7)**Endpoint:** `POST /api/freepik/reimagine`

  "ultra_detail": 30,     // 0-100 (padrão: 30)

  "flavor": "photo",      // "sublime", "photo", "photo_denoiser"**Body:**

  "webhook_url": "https://..." // opcional```json

}{

```  "image_url": "https://example.com/room.jpg",

  "prompt": "modern minimalist style"

### Response}

```json```

{

  "success": true,---

  "message": "Image upscale initiated (async). Use task_id to check status.",

  "data": {### 5. Sketch to Image

    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",

    "status": "CREATED",Transforma um esboço em uma imagem realista.

    "generated": []

  }**Endpoint:** `POST /api/freepik/sketch-to-image`

}

```**Body:**

```json

### Verificar Status{

```  "sketch_url": "https://example.com/sketch.jpg",

GET /api/freepik/upscale/status/:task_id  "prompt": "modern bedroom with wooden furniture"

```}

```

Response quando completado:

```json---

{

  "success": true,### 6. Search Resources

  "data": {

    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",Busca imagens, vetores ou ícones no banco do Freepik.

    "status": "COMPLETED",

    "generated": [**Endpoint:** `GET /api/freepik/search`

      "https://ai-statics.freepik.com/completed_task_image.jpg"

    ]**Query Parameters:**

  }```

}?query=living room

```&type=photo

&page=1

### Listar Todas as Tasks&limit=20

```&orientation=horizontal

GET /api/freepik/upscale/tasks?page=1&per_page=20&license=free

``````



### Parâmetros de Upscale**Tipos disponíveis:**

- `photo` - Fotos

| Parâmetro | Tipo | Range | Padrão | Descrição |- `vector` - Vetores

|-----------|------|-------|--------|-----------|- `icon` - Ícones

| `scale_factor` | int | 2-16 | 2 | Fator de escala (2x, 4x, etc.) |

| `sharpen` | int | 0-100 | 7 | Nitidez da imagem |**Orientações:**

| `smart_grain` | int | 0-100 | 7 | Granulação inteligente |- `horizontal`

| `ultra_detail` | int | 0-100 | 30 | Nível de detalhamento |- `vertical`

| `flavor` | string | - | "photo" | Estilo de processamento |- `square`



**Flavors disponíveis:**---

- `sublime`: Imagens artísticas e ilustrações

- `photo`: Fotografias realistas### 7. Get Resource Details

- `photo_denoiser`: Fotos com redução de ruído

Obtém detalhes de um recurso específico.

---

**Endpoint:** `GET /api/freepik/resource/:type/:id`

## 3. Reimagine Flux

**Exemplo:**

Recria imagens com IA mantendo a composição. **Processo síncrono** - retorna imagens imediatamente.```

GET /api/freepik/resource/photo/12345

### Endpoint```

```

POST /api/freepik/reimagine---

```

### 8. Check Generation Status

### Request

```jsonVerifica o status de uma geração em andamento.

{

  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",**Endpoint:** `GET /api/freepik/generation/:id`

  "prompt": "modern architectural style",

  "imagination": "wild",           // "wild", "subtle", "vivid"**Exemplo:**

  "aspect_ratio": "square_1_1",   // opcional```

  "webhook_url": "https://..."     // opcionalGET /api/freepik/generation/abc123

}```

```

**Status possíveis:**

⚠️ **Importante**: Este endpoint requer **base64** da imagem, não URL!- `pending` - Em fila

- `processing` - Processando

### Response- `completed` - Concluído

```json- `failed` - Falhou

{

  "success": true,---

  "message": "Image reimagine completed",

  "data": {### 9. List Generations

    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",

    "status": "COMPLETED",Lista todas as gerações do usuário.

    "generated": [

      "https://ai-statics.freepik.com/completed_task_image1.jpg",**Endpoint:** `GET /api/freepik/generations`

      "https://ai-statics.freepik.com/completed_task_image2.jpg"

    ]**Query Parameters:**

  }```

}?page=1&limit=20

``````



### Aspect Ratios Disponíveis---

- `original`: Mantém proporção original

- `square_1_1`: Quadrado (1:1)## Exemplos de Uso

- `classic_4_3`: Clássico (4:3)

- `traditional_3_4`: Tradicional (3:4)### Exemplo 1: Gerar imagem de um quarto

- `widescreen_16_9`: Widescreen (16:9)

- `social_story_9_16`: Stories redes sociais (9:16)```bash

- `standard_3_2`: Padrão (3:2)curl -X POST https://your-api.com/api/freepik/text-to-image \

- `portrait_2_3`: Retrato (2:3)  -H "Content-Type: application/json" \

- `horizontal_2_1`: Horizontal (2:1)  -d '{

- `vertical_1_2`: Vertical (1:2)    "prompt": "A cozy bedroom with warm lighting and wooden furniture",

- `social_post_4_5`: Post redes sociais (4:5)    "negative_prompt": "dark, cluttered, messy",

    "styling": {

---      "style": "photo"

    },

## Exemplo React - Remove Background    "num_images": 2

  }'

```javascript```

const removeBackground = async (imageUrl) => {

  try {### Exemplo 2: Remover fundo de uma imagem

    const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/freepik/remove-background', {

      method: 'POST',```bash

      headers: {curl -X POST https://your-api.com/api/freepik/remove-background \

        'Content-Type': 'application/json',  -H "Content-Type: application/json" \

      },  -d '{

      body: JSON.stringify({    "image_url": "https://example.com/furniture.jpg"

        image_url: imageUrl  }'

      })```

    });

### Exemplo 3: Buscar imagens de salas

    const result = await response.json();

    ```bash

    if (result.success) {curl -X GET "https://your-api.com/api/freepik/search?query=living room&type=photo&limit=10"

      // URLs válidas por 5 minutos```

      const imageWithoutBg = result.data.high_resolution;

      console.log('Imagem sem fundo:', imageWithoutBg);---

      

      // IMPORTANTE: Faça download ou upload imediatamente!## Integração com Frontend

      // As URLs expiram em 5 minutos

    }### React/JavaScript Example

  } catch (error) {

    console.error('Erro:', error);```javascript

  }// Text-to-Image

};const generateImage = async () => {

```  const response = await fetch('https://your-api.com/api/freepik/text-to-image', {

    method: 'POST',

---    headers: {

      'Content-Type': 'application/json',

## Exemplo React - Upscale com Polling    },

    body: JSON.stringify({

```javascript      prompt: 'A modern kitchen with marble countertops',

const upscaleImage = async (imageUrl) => {      num_images: 1,

  try {      styling: {

    // 1. Iniciar upscale        style: 'photo'

    const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/freepik/upscale', {      }

      method: 'POST',    })

      headers: {  });

        'Content-Type': 'application/json',

      },  const data = await response.json();

      body: JSON.stringify({  

        image_url: imageUrl,  if (data.success) {

        scale_factor: 4,    console.log('Generation ID:', data.data.id);

        flavor: 'photo',    // Poll for status

        ultra_detail: 50    checkStatus(data.data.id);

      })  }

    });};



    const result = await response.json();// Check generation status

    const taskId = result.data.task_id;const checkStatus = async (generationId) => {

      const response = await fetch(`https://your-api.com/api/freepik/generation/${generationId}`);

    // 2. Polling para verificar status  const data = await response.json();

    const pollStatus = async () => {  

      const statusResponse = await fetch(  if (data.data.status === 'completed') {

        `https://apiruum-2cpzkgiiia-uc.a.run.app/api/freepik/upscale/status/${taskId}`    console.log('Image URL:', data.data.image_url);

      );  } else if (data.data.status === 'processing') {

      const statusResult = await statusResponse.json();    // Poll again after 2 seconds

          setTimeout(() => checkStatus(generationId), 2000);

      if (statusResult.data.status === 'COMPLETED') {  }

        const upscaledImage = statusResult.data.generated[0];};

        console.log('Imagem upscaled:', upscaledImage);```

        return upscaledImage;

      } else if (statusResult.data.status === 'FAILED') {---

        throw new Error('Upscale falhou');

      } else {## Notas Importantes

        // Ainda processando, tentar novamente em 3 segundos

        await new Promise(resolve => setTimeout(resolve, 3000));1. **Autenticação**: Todas as requisições requerem a API Key configurada no `.env`

        return pollStatus();

      }2. **Processos Assíncronos**: Algumas operações (como text-to-image) são assíncronas:

    };   - A API retorna um ID de geração

       - Use o endpoint `/generation/:id` para verificar o status

    return await pollStatus();   - Implemente polling ou use webhooks

    

  } catch (error) {3. **Limites de Uso**: Verifique seu plano Freepik para limites de:

    console.error('Erro:', error);   - Requisições por minuto

  }   - Gerações por mês

};   - Tamanho das imagens

```

4. **Formatos Suportados**: JPG, PNG, WEBP

---

5. **Webhooks**: Configure webhooks no painel do Freepik para receber notificações quando as gerações forem concluídas

## Exemplo React - Reimagine

---

```javascript

const reimagineImage = async (imageFile) => {## Troubleshooting

  try {

    // 1. Converter imagem para base64### Erro: "Invalid API Key"

    const toBase64 = (file) => new Promise((resolve, reject) => {- Verifique se `FREEPIK_API_KEY` está configurada no `.env`

      const reader = new FileReader();- Confirme que a key está ativa no painel do Freepik

      reader.readAsDataURL(file);

      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove "data:image/...;base64,"### Erro: "Rate limit exceeded"

      reader.onerror = error => reject(error);- Você excedeu o limite de requisições

    });- Aguarde alguns minutos ou upgrade seu plano



    const imageBase64 = await toBase64(imageFile);### Erro: "Image URL not accessible"

    - Certifique-se que a URL da imagem está acessível publicamente

    // 2. Fazer requisição- URLs do Firebase/S3 devem ter permissões corretas

    const response = await fetch('https://apiruum-2cpzkgiiia-uc.a.run.app/api/freepik/reimagine', {

      method: 'POST',---

      headers: {

        'Content-Type': 'application/json',## Roadmap / Próximos Passos

      },

      body: JSON.stringify({- [ ] Implementar webhook handler para notificações

        image_base64: imageBase64,- [ ] Adicionar integração com Airtable para salvar gerações

        prompt: 'modern minimalist style',- [ ] Criar sistema de polling automático

        imagination: 'vivid',- [ ] Adicionar upload direto de imagens (base64)

        aspect_ratio: 'square_1_1'- [ ] Implementar batch processing

      })- [ ] Adicionar cache de resultados

    });

---

    const result = await response.json();

    ## Links Úteis

    if (result.success) {

      // Reimagine é síncrono - imagens já estão prontas- [Documentação Oficial Freepik API](https://developers.freepik.com/docs)

      const reimaginedImages = result.data.generated;- [Dashboard Freepik](https://www.freepik.com/api)

      console.log('Imagens reimaginadas:', reimaginedImages);- [Status da API](https://status.freepik.com)

    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

## Status das Tasks

| Status | Descrição |
|--------|-----------|
| `CREATED` | Task criada, aguardando processamento |
| `IN_PROGRESS` | Processamento em andamento |
| `COMPLETED` | Processamento concluído, imagens disponíveis |
| `FAILED` | Processamento falhou |

---

## Troubleshooting

### Erro: "Failed to download the image"
**Causa**: A API não conseguiu baixar a imagem da URL fornecida.

**Soluções**:
1. Verificar se a URL é pública e acessível
2. Testar com URL do Freepik (img.freepik.com)
3. Para Firebase Storage: considerar URL sem caracteres especiais ou tokens
4. Fazer proxy da imagem através do seu servidor
5. Usar base64 para endpoints que suportam

### Upscale não completa
**Causa**: Processo assíncrono pode demorar dependendo do `scale_factor`.

**Soluções**:
1. Implementar polling com intervalos de 3-5 segundos
2. Usar webhook_url para receber notificação quando completar
3. Verificar se `scale_factor` não é muito alto (máx: 16)

### Reimagine retorna erro
**Causa**: Provavelmente enviando URL ao invés de base64.

**Soluções**:
1. Sempre converter imagem para base64 antes de enviar
2. Remover o prefixo `data:image/...;base64,` do base64
3. Verificar se a imagem não é muito grande (limite de tamanho)

---

## Documentação Oficial

- [Remove Background](https://docs.freepik.com/api-reference/remove-background/post-beta-remove-background)
- [Upscaler Precision V2](https://docs.freepik.com/api-reference/image-upscaler-precision-v2/post-image-upscaler-precision-v2)
- [Reimagine Flux](https://docs.freepik.com/api-reference/text-to-image/reimagine-flux/post-reimagine-flux)

---

## Variáveis de Ambiente

```bash
FREEPIK_API_KEY=FPSXa83017337be072a57a9d9ad62c418b7f
```

**Configurado em**: Cloud Run (via deploy.sh)
