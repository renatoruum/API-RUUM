import express from "express";
import { db } from "../connectors/firebase.js";

const router = express.Router();

// Middleware para verificar se o Firebase está disponível
const checkFirebaseAvailable = (req, res, next) => {
  if (!db) {
    return res.status(503).json({
      success: false,
      error: "Firebase Firestore não está disponível",
      message: "Credenciais do Firebase não configuradas"
    });
  }
  next();
};

// Rota para adicionar um documento de teste
router.post("/firebase/test-add", checkFirebaseAvailable, async (req, res) => {
  try {
    const { collection, data } = req.body;
    const docRef = await db.collection(collection).add(data);
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para buscar documentos de teste
router.get("/firebase/test-get/:collection", checkFirebaseAvailable, async (req, res) => {
  try {
    const { collection } = req.params;
    const snapshot = await db.collection(collection).get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
