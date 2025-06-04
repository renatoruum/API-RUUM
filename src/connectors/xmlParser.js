import { parseStringPromise } from "xml2js";

export async function parseImoveisXml(xmlString) {
  const result = await parseStringPromise(xmlString, { explicitArray: false, trim: true, mergeAttrs: true });

  let imoveisArr = null;

  // Estrutura <Carga><Imoveis><Imovel>
  if (result.Carga?.Imoveis?.Imovel) {
    imoveisArr = result.Carga.Imoveis.Imovel;
  }
  // Estrutura <imoveis><imovel>
  else if (result.imoveis?.imovel) {
    imoveisArr = result.imoveis.imovel;
  }
  // Estrutura <Imoveis><Imovel>
  else if (result.Imoveis?.Imovel) {
    imoveisArr = result.Imoveis.Imovel;
  }
  // Estrutura GaiaWsLancamentos
  else if (result.GaiaWsLancamentos?.Lancamentos?.Lancamento) {
    imoveisArr = result.GaiaWsLancamentos.Lancamentos.Lancamento;
  }

  if (!imoveisArr) {
    throw new Error("Estrutura XML inesperada: não encontrou lista de imóveis");
  }

  return Array.isArray(imoveisArr) ? imoveisArr : [imoveisArr];
}