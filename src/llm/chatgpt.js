import axios from "axios";
import fs from "fs";
import tmp from "tmp";
import sharp from "sharp";
import FormData from "form-data";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

export async function sendToChatGPT({ image_url, room_type, style }) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY não definida");

    // Baixa imagem original
    const response = await fetch(image_url);
    if (!response.ok) throw new Error("Erro ao baixar imagem");
    const originalBuffer = await response.buffer();

    // Converte imagem para PNG
    const pngBuffer = await sharp(originalBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true }) // Reduz tamanho, respeita proporção
      .png({ compressionLevel: 9 }) // Máxima compressão para reduzir peso
      .toBuffer();
    console.log("Tamanho final PNG:", pngBuffer.length / 1024, "KB");

    const { width, height } = await sharp(pngBuffer).metadata();

    // Cria imagem branca com mesmas dimensões para máscara
    const maskBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer();

    // Arquivos temporários
    const tempImage = tmp.fileSync({ postfix: ".png" });
    const tempMask = tmp.fileSync({ postfix: ".png" });
    fs.writeFileSync(tempImage.name, pngBuffer);
    fs.writeFileSync(tempMask.name, maskBuffer);

    // Monta o FormData
    const form = new FormData();
    form.append("image", fs.createReadStream(tempImage.name), {
      contentType: "image/png",
      filename: "image.png",
    });
    form.append("mask", fs.createReadStream(tempMask.name), {
      contentType: "image/png",
      filename: "mask.png",
    });
    form.append("prompt", `Faça o virtual staging deste ambiente com estilo ${style}, no cômodo ${room_type}, mantendo proporções realistas e respeitando elementos arquitetônicos originais.`);
    form.append("model", "dall-e-2");
    form.append("n", 1);
    form.append("size", "1024x1024");

    // Envia requisição
    const result = await axios.post("https://api.openai.com/v1/images/edits", form, {
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    // Debug completo do retorno
    console.log("✅ Resposta completa da OpenAI:", JSON.stringify(result.data, null, 2));

    if (!result.data || !result.data.data || !result.data.data[0]?.url) {
      throw new Error("❌ Resposta inesperada da OpenAI: não encontrou URL da imagem.");
    }

    tempImage.removeCallback();
    tempMask.removeCallback();

    return result.data?.data?.[0]?.url;

  } catch (error) {
    console.error("❌ Erro ao gerar staging:", error.response?.data || error.message);
    throw error;
  }
}
