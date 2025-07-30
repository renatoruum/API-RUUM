#!/usr/bin/env node

/**
 * Script de diagnóstico para ShotStack API
 * 
 * Uso:
 *   node scripts/diagnose-shotstack.js
 *   node scripts/diagnose-shotstack.js --quick
 *   npm run diagnose-shotstack
 * 
 * Este script testa:
 * - Variáveis de ambiente
 * - Autenticação da API
 * - Renderização de teste
 * - Status de renderização
 * - Conexão com serviços
 */

import dotenv from 'dotenv';
import { diagnoseShotstack, testShotstackAuth, testShotstackRender } from '../src/connectors/shotstack.js';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Cores para output no terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function showHeader() {
    console.log(colorize('='.repeat(60), 'cyan'));
    console.log(colorize('🔍 DIAGNÓSTICO SHOTSTACK API', 'cyan'));
    console.log(colorize('='.repeat(60), 'cyan'));
    console.log();
}

function showEnvironmentInfo() {
    console.log(colorize('📋 INFORMAÇÕES DO AMBIENTE', 'yellow'));
    console.log(colorize('-'.repeat(30), 'yellow'));
    
    console.log(`🔧 Node.js: ${process.version}`);
    console.log(`💻 Plataforma: ${process.platform}`);
    console.log(`📁 Diretório: ${process.cwd()}`);
    
    // Verificar arquivo .env
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    
    console.log(`📄 Arquivo .env: ${envExists ? '✅ Encontrado' : '❌ Não encontrado'}`);
    
    if (envExists) {
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const hasApiKey = envContent.includes('SHOTSTACK_API_KEY');
            console.log(`🔑 SHOTSTACK_API_KEY no .env: ${hasApiKey ? '✅ Presente' : '❌ Ausente'}`);
        } catch (error) {
            console.log(`🔑 Erro ao ler .env: ${error.message}`);
        }
    }
    
    // Verificar variável de ambiente
    const apiKey = process.env.SHOTSTACK_API_KEY;
    console.log(`🔑 SHOTSTACK_API_KEY (runtime): ${apiKey ? '✅ Definida' : '❌ Não definida'}`);
    
    if (apiKey) {
        console.log(`🔑 Preview da API Key: ${apiKey.substring(0, 10)}...`);
    }
    
    console.log();
}

async function runDiagnostics() {
    try {
        showHeader();
        showEnvironmentInfo();
        
        // Executar diagnóstico completo
        console.log(colorize('🔍 EXECUTANDO DIAGNÓSTICO COMPLETO...', 'blue'));
        console.log();
        
        const results = await diagnoseShotstack();
        
        console.log();
        console.log(colorize('📊 RESULTADOS DETALHADOS', 'magenta'));
        console.log(colorize('-'.repeat(30), 'magenta'));
        
        // Mostrar resultados formatados
        showTestResult('Autenticação', results.tests.authentication);
        showTestResult('Renderização', results.tests.rendering);
        showTestResult('Status Check', results.tests.status);
        
        console.log();
        console.log(colorize('💾 SALVANDO RELATÓRIO...', 'blue'));
        
        // Salvar relatório em arquivo
        const reportPath = path.join(process.cwd(), 'shotstack-diagnosis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        
        console.log(`📄 Relatório salvo em: ${reportPath}`);
        
        console.log();
        showRecommendations(results);
        
        // Exit code baseado no resultado
        const exitCode = results.tests.authentication.success ? 0 : 1;
        process.exit(exitCode);
        
    } catch (error) {
        console.error(colorize('❌ ERRO FATAL:', 'red'), error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

function showTestResult(testName, result) {
    if (!result) {
        console.log(`${testName}: ${colorize('⏭️ PULADO', 'yellow')}`);
        return;
    }
    
    const status = result.success ? 
        colorize('✅ SUCESSO', 'green') : 
        colorize('❌ FALHA', 'red');
    
    console.log(`${testName}: ${status}`);
    
    if (result.message) {
        console.log(`   💬 ${result.message}`);
    }
    
    if (result.error) {
        console.log(`   🚨 Erro: ${result.error}`);
    }
    
    if (result.renderId) {
        console.log(`   🆔 Render ID: ${result.renderId}`);
    }
    
    if (result.details) {
        console.log(`   📋 Status HTTP: ${result.details.status}`);
        if (result.details.responseData) {
            console.log(`   📄 Dados: ${JSON.stringify(result.details.responseData, null, 2)}`);
        }
    }
}

function showRecommendations(results) {
    console.log(colorize('💡 RECOMENDAÇÕES', 'cyan'));
    console.log(colorize('-'.repeat(30), 'cyan'));
    
    const authTest = results.tests.authentication;
    
    if (authTest.success) {
        console.log('✅ Autenticação funcionando corretamente!');
        console.log('🎬 API Key está válida.');
        
        if (results.tests.rendering.success) {
            console.log('🎥 Renderização de teste funcionou - créditos disponíveis.');
            console.log('🚀 Tudo pronto para uso em produção!');
        } else {
            console.log('⚠️ Renderização falhou - verifique detalhes abaixo:');
            console.log();
            
            const renderError = results.tests.rendering.error;
            const renderMessage = results.tests.rendering.message;
            
            console.log('🔧 PROBLEMA NA RENDERIZAÇÃO:');
            console.log(`   💬 ${renderMessage}`);
            console.log(`   🚨 Erro: ${renderError}`);
            
            if (renderError.includes('403')) {
                console.log();
                console.log('💡 SOLUÇÃO PARA ERRO 403:');
                console.log('   1. Acesse: https://dashboard.shotstack.io/');
                console.log('   2. Verifique se há créditos suficientes');
                console.log('   3. Confirme se o plano permite renderização');
                console.log('   4. Verifique se a conta não está suspensa');
                console.log('   5. Considere fazer upgrade do plano');
            }
        }
    } else {
        console.log('❌ Problemas encontrados:');
        console.log();
        
        switch (authTest.error) {
            case 'API_KEY_MISSING':
                console.log('🔧 SOLUÇÃO:');
                console.log('   1. Crie um arquivo .env na raiz do projeto');
                console.log('   2. Adicione: SHOTSTACK_API_KEY=sua_chave_aqui');
                console.log('   3. Obtenha sua chave em: https://dashboard.shotstack.io/');
                break;
                
            case 'UNAUTHORIZED':
                console.log('🔧 SOLUÇÃO:');
                console.log('   1. Verifique se a API Key está correta');
                console.log('   2. Acesse o painel: https://dashboard.shotstack.io/');
                console.log('   3. Vá em API Keys e confirme a chave');
                console.log('   4. Se necessário, gere uma nova chave');
                break;
                
            case 'PAYMENT_REQUIRED':
                console.log('🔧 SOLUÇÃO:');
                console.log('   1. Acesse: https://dashboard.shotstack.io/');
                console.log('   2. Verifique o saldo de créditos');
                console.log('   3. Adicione créditos ou atualize o plano');
                console.log('   4. Verifique se a conta não está suspensa');
                break;
                
            case 'RATE_LIMIT':
                console.log('🔧 SOLUÇÃO:');
                console.log('   1. Aguarde alguns minutos');
                console.log('   2. Reduza a frequência de requisições');
                console.log('   3. Considere upgrade do plano para mais quota');
                break;
                
            case 'TIMEOUT':
                console.log('🔧 SOLUÇÃO:');
                console.log('   1. Verifique sua conexão com a internet');
                console.log('   2. Tente novamente em alguns minutos');
                console.log('   3. Verifique se não há firewall bloqueando');
                break;
                
            default:
                console.log('🔧 SOLUÇÃO GERAL:');
                console.log('   1. Verifique a documentação: https://shotstack.io/docs/');
                console.log('   2. Contate o suporte: https://shotstack.io/support/');
                console.log('   3. Verifique status do serviço: https://status.shotstack.io/');
        }
    }
    
    console.log();
    console.log(colorize('🔗 LINKS ÚTEIS', 'blue'));
    console.log('📊 Painel: https://dashboard.shotstack.io/');
    console.log('📖 Documentação: https://shotstack.io/docs/');
    console.log('🆘 Suporte: https://shotstack.io/support/');
    console.log('📊 Status: https://status.shotstack.io/');
}

// Função para teste rápido via linha de comando
async function quickTest() {
    console.log(colorize('⚡ TESTE RÁPIDO DE AUTENTICAÇÃO', 'yellow'));
    console.log();
    
    try {
        const result = await testShotstackAuth();
        
        if (result.success) {
            console.log(colorize('✅ AUTENTICAÇÃO OK', 'green'));
            console.log(`💬 ${result.message}`);
        } else {
            console.log(colorize('❌ AUTENTICAÇÃO FALHOU', 'red'));
            console.log(`🚨 ${result.error}: ${result.message}`);
        }
        
        return result.success;
    } catch (error) {
        console.log(colorize('❌ ERRO NO TESTE:', 'red'), error.message);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        const success = await quickTest();
        process.exit(success ? 0 : 1);
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log(colorize('🔍 DIAGNÓSTICO SHOTSTACK - AJUDA', 'cyan'));
        console.log();
        console.log('Uso:');
        console.log('  node scripts/diagnose-shotstack.js          # Diagnóstico completo');
        console.log('  node scripts/diagnose-shotstack.js --quick  # Teste rápido');
        console.log('  node scripts/diagnose-shotstack.js --help   # Esta ajuda');
        console.log();
        console.log('Opções:');
        console.log('  -q, --quick    Executa apenas teste de autenticação');
        console.log('  -h, --help     Mostra esta ajuda');
        console.log();
        process.exit(0);
    } else {
        await runDiagnostics();
    }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
