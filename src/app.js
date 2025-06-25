/**
 * API Ruum - Aplicação principal
 * 
 * Gerencia as rotas da API e middlewares necessários
 */

// Carrega as variáveis de ambiente
import dotenv from "dotenv";
dotenv.config();

// Dependências
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Inicialização
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verifica as variáveis de ambiente essenciais
const requiredEnvVars = ['API_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  console.warn('⚠️ Algumas funcionalidades podem não funcionar corretamente');
}

// Configuração de middlewares básicos
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: "application/xml" }));

// Logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  // Caminhos públicos não precisam de autenticação
  const publicPaths = ['/health', '/', '/api/health'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.warn(`🔒 Acesso negado: Token ausente na requisição para ${req.path}`);
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  // Verifica se o token coincide com nossa API key
  const validToken = process.env.API_TOKEN || 'your-secret-api-token-here';
  
  if (token !== validToken) {
    console.warn(`🔒 Acesso negado: Token inválido na requisição para ${req.path}`);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }

  next();
};

// Aplica middleware de autenticação a todas as rotas
app.use(authenticateToken);

// Health check
app.get('/health', (req, res) => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado',
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? '✅ Configurado' : '❌ Não configurado',
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? '✅ Configurado' : '❌ Não configurado',
    SHOTSTACK_API_KEY: process.env.SHOTSTACK_API_KEY ? '✅ Configurado' : '❌ Não configurado',
    API_TOKEN: process.env.API_TOKEN ? '✅ Configurado' : '❌ Não configurado',
  };

  console.log('Health check called');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: envStatus,
    auth: 'Token required for API endpoints'
  });
});

// Endpoint raiz com documentação dos endpoints
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'API Ruum is running!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check com status das variáveis de ambiente (sem auth)',
      'POST /api/chatgpt - ChatGPT Vision API para análise de imagens',
      'POST /api/update-images-airtable - Atualiza imagens no Airtable',
      'POST /api/send-shotstack - Envia requisição de renderização de vídeo para Shotstack',
      'GET /api/shotstack-status/:id - Obtém status de renderização do Shotstack',
      'POST /api/send-data - Envia dados para o ChatGPT',
      'POST /api/import-xml - Importa dados XML',
      'POST /api/start-xmlwatcher - Inicia serviço de monitoramento XML',
      'POST /api/stop-xmlwatcher - Para serviço de monitoramento XML'
    ],
    auth: 'Use Bearer token in Authorization header'
  });
});

// Função para carregar uma rota com segurança
async function loadRoute(routeName, routePath) {
  try {
    console.log(`🔍 Tentando carregar rota ${routeName}...`);
    const { default: router } = await import(routePath);
    app.use("/api", router);
    console.log(`✅ Rota ${routeName} carregada com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Falha ao carregar rota ${routeName}:`, error.message);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n')[1]?.trim() || 'N/A'}`);
    }
    return false;
  }
}

// Carrega todas as rotas da API
console.log('🔄 Iniciando carregamento das rotas...');

// Rota ChatGPT
await loadRoute('ChatGPT', './routes/sendChatGpt.js');

// Rota de atualização de imagens no Airtable
await loadRoute('Update Images Airtable', './routes/updateImagesAirtable.js');

// Rota do Shotstack (renderização de vídeos)
await loadRoute('Shotstack', './routes/sendShotStack.js');

// Rota de envio de dados
await loadRoute('Send Data', './routes/sendData.js');

// Rota de importação XML
await loadRoute('Import XML', './routes/importXml.js');

// Rota XML Watcher
await loadRoute('XML Watcher', './routes/xmlWatcher.js');

// Fallback para rotas que falharam na inicialização
app.use("/api/*", (req, res) => {
  res.status(503).json({
    success: false,
    message: "Este endpoint não pôde ser carregado devido a um problema de configuração no servidor. Por favor, verifique os logs para mais detalhes."
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 API Ruum - Servidor rodando na porta ${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 API Token: ${process.env.API_TOKEN ? '[Configurado]' : '⚠️ NÃO CONFIGURADO'}`);
  console.log(`📝 Variáveis de ambiente carregadas: ${Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', ')}`);
});

server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Sinal SIGTERM recebido, encerrando servidor...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Sinal SIGINT recebido, encerrando servidor...');
  server.close(() => process.exit(0));
});

export default app;