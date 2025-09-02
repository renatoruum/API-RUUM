import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Compatibilidade com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

try {
  // Tentar carregar o arquivo de service account
  const serviceAccountPath = path.resolve(__dirname, "../../credentials/firebase-service-account.json");
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
    
    // Verificar se o arquivo não está vazio
    if (serviceAccountData.trim()) {
      serviceAccount = JSON.parse(serviceAccountData);
    } else {
      throw new Error('Arquivo de service account está vazio');
    }
  } else {
    throw new Error('Arquivo de service account não encontrado');
  }
} catch (error) {
  console.log('Arquivo de service account não disponível, usando variáveis de ambiente:', error.message);
  
  // Usar variáveis de ambiente como fallback
  if (process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "api-ruum",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
  } else {
    console.warn('⚠️  Firebase não configurado - service account e variáveis de ambiente ausentes');
    serviceAccount = null;
  }
}

// Só inicializar o Firebase se temos credenciais válidas
if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "api-ruum.firebasestorage.app",
    });
    console.log('✅ Firebase inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
  }
} else if (!serviceAccount) {
  console.log('⚠️  Firebase não será inicializado - credenciais ausentes');
}

export const db = serviceAccount ? admin.firestore() : null;
export const storage = serviceAccount ? admin.storage() : null;
export default admin;
