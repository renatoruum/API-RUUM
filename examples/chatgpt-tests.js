// Exemplos de teste para a nova API ChatGPT genérica

// Exemplo 1: Virtual Staging
const testVirtualStaging = async () => {
  const response = await fetch('http://localhost:3000/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: 'https://example.com/room.jpg',
      processing_type: 'VIRTUAL_STAGING',
      room_type: 'sala de estar',
      style: 'moderno'
    })
  });

  const result = await response.json();
  console.log('Virtual Staging Result:', result);
  
  // Resultado esperado: 
  // {
  //   "success": true,
  //   "processing_type": "VIRTUAL_STAGING",
  //   "data": {
  //     "type": "image_url",
  //     "result": "https://oaidalleapiprodscus.blob.core.windows.net/..."
  //   }
  // }
};

// Exemplo 2: Identificação de Ambiente
const testRoomIdentification = async () => {
  const response = await fetch('http://localhost:3000/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: 'https://example.com/room.jpg',
      processing_type: 'ROOM_IDENTIFICATION'
    })
  });

  const result = await response.json();
  console.log('Room Identification Result:', result);
  
  // Resultado esperado:
  // {
  //   "success": true,
  //   "processing_type": "ROOM_IDENTIFICATION",
  //   "data": {
  //     "type": "text",
  //     "result": "sala de estar"
  //   }
  // }
};

// Exemplo 3: Geração de Script
const testScriptGeneration = async () => {
  const response = await fetch('http://localhost:3000/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: 'https://example.com/room.jpg',
      processing_type: 'SCRIPT_GENERATION'
    })
  });

  const result = await response.json();
  console.log('Script Generation Result:', result);
  
  // Resultado esperado:
  // {
  //   "success": true,
  //   "processing_type": "SCRIPT_GENERATION",
  //   "data": {
  //     "type": "text",
  //     "result": "Esta belíssima sala de estar apresenta..."
  //   }
  // }
};

// Exemplo de uso com diferentes estilos para Virtual Staging
const testDifferentStyles = async () => {
  const styles = ['moderno', 'clássico', 'minimalista', 'industrial', 'rústico'];
  const roomTypes = ['sala de estar', 'quarto', 'cozinha', 'escritório'];
  
  for (const style of styles) {
    for (const roomType of roomTypes) {
      const response = await fetch('http://localhost:3000/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: 'https://example.com/room.jpg',
          processing_type: 'VIRTUAL_STAGING',
          room_type: roomType,
          style: style
        })
      });

      const result = await response.json();
      console.log(`${style} ${roomType}:`, result.data?.result || result.message);
    }
  }
};

// Exemplo de fluxo completo: identificar ambiente e gerar script
const testCompleteFlow = async (imageUrl) => {
  console.log('=== Fluxo Completo de Processamento ===');
  
  // 1. Identificar o tipo de ambiente
  const identificationResponse = await fetch('http://localhost:3000/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      processing_type: 'ROOM_IDENTIFICATION'
    })
  });

  const identificationResult = await identificationResponse.json();
  console.log('1. Ambiente identificado:', identificationResult.data?.result);
  
  // 2. Gerar script baseado no ambiente
  const scriptResponse = await fetch('http://localhost:3000/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      processing_type: 'SCRIPT_GENERATION'
    })
  });

  const scriptResult = await scriptResponse.json();
  console.log('2. Script gerado:', scriptResult.data?.result);
  
  // 3. Aplicar virtual staging (se identificado como ambiente apropriado)
  const roomType = identificationResult.data?.result;
  if (roomType && roomType !== 'não identificado') {
    const stagingResponse = await fetch('http://localhost:3000/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        processing_type: 'VIRTUAL_STAGING',
        room_type: roomType,
        style: 'moderno'
      })
    });

    const stagingResult = await stagingResponse.json();
    console.log('3. Virtual staging aplicado:', stagingResult.data?.result);
  }
  
  console.log('=== Fluxo Completo Finalizado ===');
};

// Exemplo de tratamento de erros
const testErrorHandling = async () => {
  console.log('=== Testando Tratamento de Erros ===');
  
  // Teste 1: Sem image_url
  try {
    const response = await fetch('http://localhost:3000/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        processing_type: 'VIRTUAL_STAGING'
      })
    });
    const result = await response.json();
    console.log('Erro sem image_url:', result.message);
  } catch (error) {
    console.log('Erro capturado:', error.message);
  }
  
  // Teste 2: Tipo de processamento inválido
  try {
    const response = await fetch('http://localhost:3000/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: 'https://example.com/room.jpg',
        processing_type: 'INVALID_TYPE'
      })
    });
    const result = await response.json();
    console.log('Erro tipo inválido:', result.message);
    console.log('Tipos suportados:', result.supported_types);
  } catch (error) {
    console.log('Erro capturado:', error.message);
  }
  
  // Teste 3: Virtual staging sem parâmetros obrigatórios
  try {
    const response = await fetch('http://localhost:3000/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: 'https://example.com/room.jpg',
        processing_type: 'VIRTUAL_STAGING'
        // Faltando room_type e style
      })
    });
    const result = await response.json();
    console.log('Erro parâmetros faltando:', result.message);
  } catch (error) {
    console.log('Erro capturado:', error.message);
  }
};

// Exportar funções para uso em testes
export {
  testVirtualStaging,
  testRoomIdentification,
  testScriptGeneration,
  testDifferentStyles,
  testCompleteFlow,
  testErrorHandling
};

// Exemplo de uso no Node.js
if (typeof window === 'undefined') {
  // Executar testes apenas em ambiente Node.js
  console.log('Executando testes da API ChatGPT genérica...');
  
  // Descomente as linhas abaixo para executar os testes
  // testErrorHandling();
  // testVirtualStaging();
  // testRoomIdentification();
  // testScriptGeneration();
  // testCompleteFlow('https://example.com/room.jpg');
}
