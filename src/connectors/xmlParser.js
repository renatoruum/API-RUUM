import { parseStringPromise } from "xml2js";

export async function parseImoveisXml(xmlString) {
  const result = await parseStringPromise(xmlString, { explicitArray: false });
  // Normalização dos dados conforme necessário
  return result.imoveis.imovel instanceof Array
    ? result.imoveis.imovel
    : [result.imoveis.imovel];
}