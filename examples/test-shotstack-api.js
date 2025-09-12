import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8080/api';
const AUTH_TOKEN = 'ruum-api-secure-token-2024';

// Timeline de exemplo para teste
const sampleTimeline = {
    timeline: {
        tracks: [
            {
                clips: [
                    {
                        asset: {
                            type: "text",
                            text: "TESTE API RUUM",
                            font: {
                                family: "Montserrat ExtraBold",
                                color: "#ffffff",
                                size: 32
                            },
                            alignment: {
                                horizontal: "center"
                            }
                        },
                        start: 0,
                        length: 5,
                        transition: {
                            in: "fade",
                            out: "fade"
                        }
                    }
                ]
            }
        ]
    },
    output: {
        format: "mp4",
        size: {
            width: 1024,
            height: 576
        }
    }
};

// Função para adicionar delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para testar conectividade
async function testHealth() {
    console.log('🔍 Testando conectividade...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/shotstack/health`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Conectividade OK');
            return true;
        } else {
            console.log('❌ Erro de conectividade:', result.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

// Função para testar renderização assíncrona
async function testAsyncRender() {
    console.log('\n🎬 Testando renderização assíncrona...');
    
    try {
        // 1. Iniciar renderização
        const renderResponse = await fetch(`${API_BASE_URL}/shotstack/render`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(sampleTimeline)
        });
        
        const renderResult = await renderResponse.json();
        
        if (!renderResponse.ok) {
            throw new Error(renderResult.message || 'Erro ao iniciar renderização');
        }
        
        console.log('✅ Renderização iniciada');
        console.log('📊 Render ID:', renderResult.data.renderId);
        
        const renderId = renderResult.data.renderId;
        
        // 2. Monitorar status
        console.log('⏳ Monitorando status...');
        
        let attempts = 0;
        const maxAttempts = 60; // 5 minutos máximo
        
        while (attempts < maxAttempts) {
            await sleep(5000); // Aguarda 5 segundos
            attempts++;
            
            const statusResponse = await fetch(`${API_BASE_URL}/shotstack/status/${renderId}`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                }
            });
            
            const statusResult = await statusResponse.json();
            
            if (!statusResponse.ok) {
                throw new Error(statusResult.message || 'Erro ao verificar status');
            }
            
            console.log(`📊 Tentativa ${attempts}: Status = ${statusResult.data.status}`);
            
            if (statusResult.data.status === 'done') {
                console.log('🎉 Renderização concluída!');
                console.log('🎥 URL do vídeo:', statusResult.data.url);
                console.log(`⏱️ Tempo de renderização: ${statusResult.data.renderTime}s`);
                console.log(`📏 Duração do vídeo: ${statusResult.data.duration}s`);
                return true;
            } else if (statusResult.data.status === 'failed') {
                console.log('❌ Renderização falhou:', statusResult.data.error);
                return false;
            }
        }
        
        console.log('⏰ Timeout: Renderização não concluída em tempo hábil');
        return false;
        
    } catch (error) {
        console.log('❌ Erro no teste assíncrono:', error.message);
        return false;
    }
}

// Função para testar renderização síncrona (mais rápida para teste)
async function testSyncRender() {
    console.log('\n🚀 Testando renderização síncrona...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/shotstack/render?wait=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(sampleTimeline)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Erro na renderização síncrona');
        }
        
        console.log('🎉 Renderização síncrona concluída!');
        console.log('🎥 URL do vídeo:', result.data.url);
        console.log(`⏱️ Tempo de renderização: ${result.data.renderTime}s`);
        console.log(`📏 Duração do vídeo: ${result.data.duration}s`);
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro no teste síncrono:', error.message);
        return false;
    }
}

// Função principal de teste
async function runTests() {
    console.log('🧪 Iniciando testes da API Shotstack...\n');
    
    // Teste 1: Conectividade
    const healthOk = await testHealth();
    if (!healthOk) {
        console.log('\n❌ Testes interrompidos - problemas de conectividade');
        return;
    }
    
    // Teste 2: Renderização assíncrona (comentado por ser mais demorado)
    // const asyncOk = await testAsyncRender();
    
    // Teste 3: Renderização síncrona (mais rápida para teste)
    console.log('\n⚠️ Teste síncrono pode demorar alguns minutos...');
    const syncOk = await testSyncRender();
    
    // Resumo
    console.log('\n📋 Resumo dos Testes:');
    console.log(`✅ Conectividade: ${healthOk ? 'OK' : 'FALHOU'}`);
    // console.log(`✅ Renderização Assíncrona: ${asyncOk ? 'OK' : 'FALHOU'}`);
    console.log(`✅ Renderização Síncrona: ${syncOk ? 'OK' : 'FALHOU'}`);
    
    if (healthOk && syncOk) {
        console.log('\n🎉 Todos os testes passaram! API está funcionando corretamente.');
    } else {
        console.log('\n❌ Alguns testes falharam. Verifique a configuração.');
    }
}

// Executar os testes
runTests().catch(console.error);
