import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { storage } from "../connectors/firebase.js";

const router = express.Router();

// Middleware para verificar se o Firebase está disponível
const checkFirebaseAvailable = (req, res, next) => {
  if (!storage) {
    return res.status(503).json({
      success: false,
      error: "Firebase Storage não está disponível",
      message: "Credenciais do Firebase não configuradas"
    });
  }
  next();
};

// POST /firebase/upload-local-image
router.post("/firebase/upload-local-image", checkFirebaseAvailable, async (req, res) => {
  try {
    // Caminho absoluto do arquivo local
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const imagePath = path.resolve(__dirname, "../../images", "kaazaa_KZ6125.jpg");

    // Lê o arquivo como buffer
    const fileBuffer = fs.readFileSync(imagePath);

    // Define o destino no Storage
    const bucket = storage.bucket();
    const destination = "Kaaza/images/kaazaa_KZ6125";

    // Faz o upload
    await bucket.file(destination).save(fileBuffer, {
      contentType: "image/jpeg"
    });

    // Torna o arquivo público
    await bucket.file(destination).makePublic();

    // Gera a URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    res.json({ success: true, url: publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
