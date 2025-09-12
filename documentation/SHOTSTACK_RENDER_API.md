# Shotstack API - Documentação

Esta documentação descreve como usar a API Shotstack para renderização de vídeos com monitoramento de status em tempo real.

## Endpoints Disponíveis

### 1. POST `/api/shotstack/render`
Inicia uma renderização de vídeo com dados JSON.

#### Parâmetros
- **Método 1: JSON no Body**
  ```json
  {
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "text",
                "text": "HELLO WORLD",
                "font": {
                  "family": "Montserrat ExtraBold",
                  "color": "#ffffff",
                  "size": 32
                }
              },
              "start": 0,
              "length": 5
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "size": {
        "width": 1024,
        "height": 576
      }
    }
  }
  ```

- **Método 2: Upload de Arquivo JSON**
  - Use `multipart/form-data` com campo `jsonFile`
  - Arquivo deve ter extensão `.json`
  - Tamanho máximo: 10MB

#### Query Parameters
- `wait=true` - Aguarda a conclusão da renderização (pode demorar vários minutos)

#### Headers Obrigatórios
```
Authorization: Bearer ruum-api-secure-token-2024
Content-Type: application/json (para JSON no body)
```

#### Resposta (Renderização Assíncrona)
```json
{
  "success": true,
  "message": "Renderização iniciada com sucesso",
  "data": {
    "renderId": "6ef250b8-ae26-4b15-9ab8-55bcaa9847ff",
    "status": "queued",
    "statusCheckUrl": "/api/shotstack/status/6ef250b8-ae26-4b15-9ab8-55bcaa9847ff"
  }
}
```

#### Resposta (Renderização Síncrona - com wait=true)
```json
{
  "success": true,
  "message": "Vídeo renderizado com sucesso",
  "data": {
    "id": "6ef250b8-ae26-4b15-9ab8-55bcaa9847ff",
    "status": "done",
    "url": "https://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/w0g7ua3h4w/6ef250b8-ae26-4b15-9ab8-55bcaa9847ff.mp4",
    "duration": 5,
    "renderTime": 1767.57,
    "created": "2025-06-06T14:51:35.687Z",
    "updated": "2025-06-06T14:51:39.284Z"
  }
}
```

### 2. GET `/api/shotstack/status/:renderId`
Verifica o status de uma renderização específica.

#### Parâmetros
- `renderId` (path) - ID da renderização retornado pelo endpoint de render

#### Headers Obrigatórios
```
Authorization: Bearer ruum-api-secure-token-2024
```

#### Resposta
```json
{
  "success": true,
  "data": {
    "id": "6ef250b8-ae26-4b15-9ab8-55bcaa9847ff",
    "status": "done",
    "url": "https://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/...",
    "duration": 5,
    "renderTime": 1767.57,
    "created": "2025-06-06T14:51:35.687Z",
    "updated": "2025-06-06T14:51:39.284Z",
    "error": null
  }
}
```

#### Status Possíveis
- `queued` - Na fila para processamento
- `rendering` - Sendo renderizado
- `done` - Concluído com sucesso
- `failed` - Falhou (veja o campo `error`)

### 3. POST `/api/shotstack/wait/:renderId`
Aguarda a conclusão de uma renderização com polling automático.

#### Parâmetros
- `renderId` (path) - ID da renderização
- Body (opcional):
  ```json
  {
    "maxWaitTime": 300,
    "pollInterval": 5
  }
  ```

#### Headers Obrigatórios
```
Authorization: Bearer ruum-api-secure-token-2024
Content-Type: application/json
```

#### Resposta
```json
{
  "success": true,
  "message": "Renderização concluída com sucesso",
  "data": {
    "id": "6ef250b8-ae26-4b15-9ab8-55bcaa9847ff",
    "status": "done",
    "url": "https://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/...",
    "duration": 5,
    "renderTime": 1767.57
  }
}
```

### 4. GET `/api/shotstack/health`
Verifica se a API do Shotstack está acessível.

#### Headers Obrigatórios
```
Authorization: Bearer ruum-api-secure-token-2024
```

#### Resposta
```json
{
  "success": true,
  "message": "Shotstack API está acessível",
  "timestamp": "2025-09-11T10:30:00.000Z"
}
```

## Exemplos de Uso

### 1. Renderização Assíncrona com Polling Manual

```bash
# 1. Iniciar renderização
curl -X POST http://localhost:8080/api/shotstack/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -d '{
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "text",
                "text": "Meu Primeiro Vídeo",
                "font": {
                  "family": "Arial",
                  "color": "#ffffff",
                  "size": 48
                }
              },
              "start": 0,
              "length": 3
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "size": {
        "width": 1920,
        "height": 1080
      }
    }
  }'

# 2. Verificar status (repetir até status = "done")
curl -X GET http://localhost:8080/api/shotstack/status/RENDER_ID \
  -H "Authorization: Bearer ruum-api-secure-token-2024"
```

### 2. Renderização Síncrona

```bash
curl -X POST "http://localhost:8080/api/shotstack/render?wait=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -d '{
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "text",
                "text": "Vídeo Síncrono",
                "font": {
                  "family": "Arial",
                  "color": "#000000",
                  "size": 32
                }
              },
              "start": 0,
              "length": 5
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "size": {
        "width": 1280,
        "height": 720
      }
    }
  }'
```

### 3. Upload de Arquivo JSON

```bash
curl -X POST http://localhost:8080/api/shotstack/render \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -F "jsonFile=@timeline.json"
```

### 4. Aguardar Conclusão com Polling Automático

```bash
# Após obter o renderId do primeiro passo
curl -X POST http://localhost:8080/api/shotstack/wait/RENDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -d '{
    "maxWaitTime": 600,
    "pollInterval": 3
  }'
```

## Frontend - Monitoramento em Tempo Real

O arquivo `examples/shotstack-render-frontend.html` contém um exemplo completo de frontend que demonstra:

1. **Envio de JSON**: Via textarea ou upload de arquivo
2. **Monitoramento Automático**: Polling automático a cada 5 segundos
3. **Barra de Progresso**: Indicador visual do status
4. **Logs em Tempo Real**: Histórico detalhado de todas as operações
5. **Reprodução do Vídeo**: Player integrado para visualizar o resultado

### Recursos do Frontend:
- ✅ Suporte a JSON no textarea ou upload de arquivo
- ✅ Opção para renderização síncrona ou assíncrona
- ✅ Polling automático com controles de start/stop
- ✅ Barra de progresso visual
- ✅ Logs detalhados com timestamps
- ✅ Player de vídeo integrado
- ✅ Links para poster e thumbnail
- ✅ Tratamento de erros

## Tratamento de Erros

### Erros Comuns:

1. **JSON Inválido**
   ```json
   {
     "success": false,
     "message": "Erro ao processar arquivo JSON",
     "error": "Unexpected token..."
   }
   ```

2. **Estrutura JSON Incorreta**
   ```json
   {
     "success": false,
     "message": "O JSON deve conter uma propriedade 'timeline'"
   }
   ```

3. **Renderização Falhou**
   ```json
   {
     "success": false,
     "message": "Erro durante a espera pela renderização",
     "error": "Asset not found",
     "status": "failed"
   }
   ```

4. **Timeout**
   ```json
   {
     "success": false,
     "error": "Timeout: Renderização não foi concluída em 300 segundos",
     "status": "timeout"
   }
   ```

## Configuração Necessária

Certifique-se de que a variável de ambiente `SHOTSTACK_API_KEY` está configurada:

```bash
export SHOTSTACK_API_KEY=your_shotstack_api_key_here
```

## Formatos de Timeline Suportados

A API aceita qualquer formato de timeline válido do Shotstack. Consulte a [documentação oficial do Shotstack](https://shotstack.io/docs/api/) para exemplos detalhados de:

- Clips de texto
- Clips de imagem
- Clips de vídeo
- Clips de áudio
- Transições
- Efeitos
- Filtros
- E muito mais...

## Limites e Considerações

- **Timeout padrão**: 300 segundos (5 minutos)
- **Intervalo de polling**: 5 segundos
- **Tamanho máximo do arquivo**: 10MB
- **Formatos suportados**: Apenas arquivos JSON
- **Ambiente**: Atualmente configurado para Shotstack Sandbox

## Exemplo Completo de Timeline

```json
{
  "timeline": {
    "soundtrack": {
      "src": "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
      "effect": "fadeOut"
    },
    "background": "#000000",
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "image",
              "src": "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/images/earth.jpg"
            },
            "start": 0,
            "length": 5,
            "effect": "zoomIn",
            "transition": {
              "in": "fade",
              "out": "fade"
            }
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "text",
              "text": "Bem-vindos ao Futuro",
              "style": "minimal",
              "color": "#ffffff",
              "size": "x-large",
              "background": "rgba(0,0,0,0.5)",
              "position": "center"
            },
            "start": 1,
            "length": 3,
            "transition": {
              "in": "slideLeft",
              "out": "slideRight"
            }
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "hd",
    "aspectRatio": "16:9",
    "size": {
      "width": 1920,
      "height": 1080
    },
    "fps": 30,
    "scaleTo": "crop"
  },
  "merge": [
    {
      "find": "TITLE",
      "replace": "Meu Título Personalizado"
    }
  ]
}
```
