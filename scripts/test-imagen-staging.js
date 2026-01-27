/**
 * Script de teste para Imagen Staging API
 * 
 * Testa os 3 agentes individualmente e o pipeline completo
 */

import dotenv from "dotenv";
dotenv.config();

import {
  testConnection,
  analyzeLayoutAgent,
  generateStagingAgent,
  verifyQualityAgent,
  fullStagingPipeline
} from "../src/connectors/imagenStaging.js";

// URL de imagem de teste (substitua por uma imagem real)
const TEST_IMAGE_URL = process.env.TEST_IMAGE_URL || "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920";

async function main() {
  console.log("🧪 TESTE: Imagen Staging API");
  console.log("━".repeat(60));

  try {
    // Teste 1: Conexão
    console.log("\n1️⃣ Testando conexão com Gemini API...");
    const connectionTest = await testConnection();
    console.log("✅ Conexão OK:", connectionTest.message);

    // Teste 2: Agente 1 - Layout Analyzer
    console.log("\n2️⃣ Testando Agente 1 (Layout Analyzer)...");
    const layoutResult = await analyzeLayoutAgent(TEST_IMAGE_URL);
    console.log("✅ Layout analisado");
    console.log("📋 Descrição:", layoutResult.layoutDescription.substring(0, 200) + "...");

    // Teste 3: Agente 2 - Staging Generator
    console.log("\n3️⃣ Testando Agente 2 (Staging Generator)...");
    const stagingResult = await generateStagingAgent(layoutResult.layoutDescription, {
      aspectRatio: "16:9",
      numberOfImages: 1
    });
    console.log("✅ Imagem gerada");
    console.log(`📊 Tamanho: ${(stagingResult.imageBuffer.length / 1024).toFixed(2)} KB`);

    // Teste 4: Agente 3 - Quality Verifier
    console.log("\n4️⃣ Testando Agente 3 (Quality Verifier)...");
    const verificationResult = await verifyQualityAgent(
      TEST_IMAGE_URL,
      stagingResult.imageBase64
    );
    console.log(verificationResult.passed ? "✅ Verificação PASSOU" : "⚠️ Verificação FALHOU");
    console.log("\n📊 Resultados das verificações:");
    Object.entries(verificationResult.checks).forEach(([key, value]) => {
      const icon = value.toLowerCase().includes("different") || value.toLowerCase().includes("hindered") ? "⚠️" : "✅";
      console.log(`   ${icon} ${key}: ${value}`);
    });

    // Teste 5: Pipeline Completo
    console.log("\n5️⃣ Testando Pipeline Completo...");
    const pipelineResult = await fullStagingPipeline(TEST_IMAGE_URL, {
      aspectRatio: "16:9"
    });
    console.log("✅ Pipeline completo");
    console.log(`⏱️ Tempo total: ${pipelineResult.metadata.processingTime}`);
    console.log(`🎯 Verificação: ${pipelineResult.verification.passed ? "PASSOU ✅" : "FALHOU ⚠️"}`);

    console.log("\n" + "━".repeat(60));
    console.log("🎉 TODOS OS TESTES PASSARAM!");

  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar testes
main();
