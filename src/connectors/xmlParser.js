import { parseStringPromise } from "xml2js";

export async function parseImoveisXml(xmlString) {
  const result = await parseStringPromise(xmlString, { explicitArray: false, trim: true, mergeAttrs: true });

  console.log("Estrutura do XML após parsing:", JSON.stringify(result, null, 2).substring(0, 1000) + "...");

  if (result.ListingDataFeed?.Listings?.Listing) {
    const firstItem = Array.isArray(result.ListingDataFeed.Listings.Listing) ? 
      result.ListingDataFeed.Listings.Listing[0] : 
      result.ListingDataFeed.Listings.Listing;
    
    if (firstItem.Media && firstItem.Media.Item) {
      console.log("Estrutura de Media.Item:", 
        JSON.stringify(firstItem.Media.Item[0] || firstItem.Media.Item, null, 2));
        
      // Verificar mais detalhes do item para debugging
      console.log("Tipo de Media.Item:", typeof firstItem.Media.Item);
      console.log("É array?", Array.isArray(firstItem.Media.Item));
      console.log("Propriedades disponíveis:", Object.keys(firstItem.Media.Item[0] || firstItem.Media.Item));
    }
  }
  
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
  // Estrutura SIGA CRM - ListingDataFeed
  else if (result.ListingDataFeed?.Listings?.Listing) {
    imoveisArr = result.ListingDataFeed.Listings.Listing;
  }

  if (!imoveisArr) {
    throw new Error("Estrutura XML inesperada: não encontrou lista de imóveis");
  }

  return Array.isArray(imoveisArr) ? imoveisArr : [imoveisArr];
}