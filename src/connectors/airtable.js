import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
}

if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_BASE_ID is not defined in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

/**
 * Cria ou atualiza um imóvel no Airtable.
 * @param {Object} imovel - Objeto do imóvel vindo do XML.
 */
/**
 * Atualiza ou insere imagens na tabela "Images" do Airtable.
 * @param {Array} imagesArray - Array de objetos com dados das imagens.
 */

export async function getDataFromAirtable() {
    const records = await base(process.env.AIRTABLE_TABLE_NAME).select({}).firstPage();

    const formattedData = records.map(record => ({
        id: record.id,
        fields: record.fields,
    }));

    return formattedData;
}

export async function upsetImovelInAirtable(imovel) {
    const tableName = "Luagge";
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Luagge Imóveis";

    const isKenlo = !!imovel.CodigoImovel;

    const codigo = isKenlo ? imovel.CodigoImovel : imovel.codigo;
    const tipo = isKenlo ? imovel.TipoImovel : imovel.tipo;
    const finalidade = isKenlo ? imovel.Finalidade : imovel.finalidade;
    const valor = isKenlo ? imovel.PrecoVenda : imovel.valor;
    const bairro = isKenlo ? imovel.Bairro : imovel.bairro;
    const cidade = isKenlo ? imovel.Cidade : imovel.cidade;
    const uf = isKenlo ? imovel.Estado : imovel.uf;
    const area_util = isKenlo ? imovel.AreaUtil : imovel.area_util;
    const quartos = isKenlo ? imovel.QtdDormitorios : imovel.quartos;
    const suites = isKenlo ? imovel.QtdSuites || imovel.suites : imovel.suites;
    const banheiros = isKenlo ? imovel.QtdBanheiros : imovel.banheiros;
    const vagas = isKenlo ? imovel.QtdVagas : imovel.vagas;
    const descricao = isKenlo ? imovel.Observacao || imovel.TituloImovel : imovel.descricao;

    let fotos = "";
    if (isKenlo && imovel.Fotos && imovel.Fotos.Foto) {
        if (Array.isArray(imovel.Fotos.Foto)) {
            fotos = imovel.Fotos.Foto.map(f => f.URLArquivo).join('\n');
        } else if (imovel.Fotos.Foto.URLArquivo) {
            fotos = imovel.Fotos.Foto.URLArquivo;
        }
    } else if (imovel.fotos?.foto) {
        fotos = Array.isArray(imovel.fotos.foto)
            ? imovel.fotos.foto.join('\n')
            : imovel.fotos.foto;
    }

    const records = await base(tableName)
        .select({
            filterByFormula: `{Codigo} = '${codigo}'`,
            maxRecords: 1,
        })
        .firstPage();

    const fields = {
        Client: client,
        Codigo: codigo,
        Tipo: tipo,
        Finalidade: finalidade,
        Valor: Number(valor),
        Bairro: bairro,
        Cidade: cidade,
        UF: uf,
        Area_util: Number(area_util),
        Quartos: Number(quartos),
        Suites: Number(suites),
        Banheiros: Number(banheiros),
        Vagas: Number(vagas),
        Descricao: descricao,
        Fotos: fotos ? fotos : "",
        Fotos_URLs: fotos ? fotos : "",
    };

    if (records.length > 0) {
        // Atualiza registro existente
        await base(tableName).update(records[0].id, fields);
        return { updated: true, id: records[0].id };
    } else {
        // Cria novo registro
        const created = await base(tableName).create(fields);
        return { created: true, id: created.id };
    }
}

/**
 * Atualiza o status de sugestões na tabela Image suggestions
 * @param {Array} suggestionIds - Array com IDs das sugestões a serem atualizadas
 * @param {string} status - Novo status a ser aplicado (ex: "Approved", "Rejected", etc.)
 * @returns {Promise<Object>} Resultado da operação com contadores de sucesso/erro
 */
export async function updateImageSuggestionsFields(suggestionIds, status = "Approved") {
    if (!suggestionIds || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
        return { updated: 0, errors: 0, details: [] };
    }
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const results = { updated: 0, errors: 0, details: [] };
    
    for (const suggestionId of suggestionIds) {
        try {
            await baseInstance("Image suggestions").update(suggestionId, {
                "Suggestion Status": status
            });
            
            results.updated++;
            results.details.push({ id: suggestionId, status: 'success', message: `Status atualizado para ${status}` });
            
        } catch (error) {
            results.errors++;
            results.details.push({ id: suggestionId, status: 'error', message: error.message });
        }
    }
    
    return results;
}

/**
 * Função específica para transferir sugestões aprovadas do Feed para tabela Images (Rota 3)
 * Converte 1 registro de Image suggestions (múltiplas imagens) 
 * em N registros individuais na tabela Images
 * @param {Object} suggestionData - Dados da sugestão aprovada
 * @param {string} customEmail - Email do usuário
 * @param {string} customClientId - ID do cliente
 * @param {string} customInvoiceId - ID da fatura
 * @param {string} customUserId - ID do usuário
 * @returns {Promise<Array>} Array com resultados da operação
 */
export async function transferApprovedSuggestionToImages(
    suggestionData,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId
) {
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const results = [];
    
    // Extrair URLs das imagens - APENAS do campo inputImages
    const imageUrls = suggestionData.inputImages || [];
    
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return [{ status: 'error', error: 'Nenhuma URL de imagem válida', imgUrl: null }];
    }
    
    
    // Função para validar campos
    const getSelectValue = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // Criar UM registro individual para CADA imagem
    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
            
            const fields = {
                ["Property's URL"]: suggestionData.propertyUrl || '',
                ["INPUT IMAGE"]: [{ url: imageUrl }], // UMA imagem por registro
                ["Owner Email"]: customEmail || '',
                ["Client Internal Code"]: suggestionData.codigo || '',
                ["Message"]: suggestionData.observacoes || '',
            };
            
            // Relacionamentos
            if (customClientId) fields.Clients = [customClientId];
            if (customInvoiceId) fields.Invoices = [customInvoiceId];
            if (customUserId) fields.Users = [customUserId];
            
            // ADDITIONAL ATTACHMENTS se houver imagensReferencia
            if (suggestionData.imagensReferencia) {
                const encodedUrl = encodeURI(suggestionData.imagensReferencia);
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
            }
            
            // Campos opcionais
            const decluttering = getSelectValue(suggestionData.retirar);
            if (decluttering) fields["Decluttering"] = decluttering;
            
            const roomType = getSelectValue(suggestionData.tipo);
            if (roomType) fields["Room Type"] = roomType;
            
            const videoTemplate = getSelectValue(suggestionData.modeloVideo);
            if (videoTemplate) fields["Video Template"] = videoTemplate;
            
            const videoProportion = getSelectValue(suggestionData.formatoVideo);
            if (videoProportion) fields["Video Proportion"] = videoProportion;
            
            const finish = getSelectValue(suggestionData.acabamento);
            if (finish) fields["Finish"] = finish;
            
            const imageWorkflow = getSelectValue(suggestionData.imgWorkflow);
            if (imageWorkflow) fields["Image Workflow"] = imageWorkflow;
            
            const suggestionstatus = getSelectValue(suggestionData.suggestionstatus);
            if (suggestionstatus) fields["Suggestion Status"] = suggestionstatus;
            
            // Estilo (relacionamento)
            const estilo = getSelectValue(suggestionData.estilo);
            if (estilo) {
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id];
                    }
                } catch (styleError) {
                }
            }
            
            // Destaques
            let destaques = suggestionData.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }
            
            const endereco = getSelectValue(suggestionData.endereco);
            if (endereco) fields["Endereço"] = endereco;
            
            const preco = getSelectValue(suggestionData.preco);
            if (preco) {
                const precoNumber = Number(
                    preco.toString()
                        .replace(/\./g, '')
                        .replace(',', '.')
                        .replace(/[^\d.-]/g, '')
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }
            
            
            // Criar registro individual na tabela Images
            const result = await baseInstance("Images").create(fields);
            
            results.push({ 
                index: i, 
                status: 'created', 
                id: result.id, 
                imgUrl: imageUrl 
            });
            
        } catch (error) {
            results.push({ 
                index: i, 
                status: 'error', 
                error: error.message, 
                imgUrl: imageUrl 
            });
        }
    }
    
    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    
    // Retornar formato compatível com a rota
    return {
        success: errorCount === 0,
        created: successCount,
        errors: errorCount,
        details: results,
        message: errorCount === 0 ? 'Transferência realizada com sucesso' : 'Transferência concluída com alguns erros'
    };
}

export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable,
    originalSuggestionIds = [],
    requestSource = null,
    processMode = null
) {
    
    const tableName = imageTable || "Images";
    
    // Log de identificação da origem da requisição
    
    // 🚨 ALERTA: Se esta função for chamada durante ROTA 3, há problema no frontend
    if (requestSource === 'suggestion-feed-approval' || processMode === 'individual-records-only') {
    }
    
    // Verificar se é uma requisição do suggestion feed
    const isSuggestionFeedApproval = requestSource === 'suggestion-feed-approval' || 
                                    processMode === 'individual-records-only';
    
    if (isSuggestionFeedApproval) {
    }

    // Configuração do Airtable
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Valores padrão
    const email = customEmail || "";
    const clientId = customClientId || "";
    const invoiceId = customInvoiceId || "";
    const userId = customUserId || "";
    
    const results = [];
    
    // Função para validar campos de single select
    const getSelectValue = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // NOVO: Lógica diferente baseada na tabela de destino
    if (tableName === "Image suggestions") {
        
        // Para Image suggestions: criar apenas 1 registro com todas as imagens
        try {
            // Coletar todas as URLs de imagens de todos os itens do array
            const allImageUrls = [];
            
            for (const img of imagesArray) {
                // Extrair URLs das diferentes possíveis fontes
                if (img.imgUrl) {
                    allImageUrls.push(img.imgUrl);
                }
                if (Array.isArray(img.imgUrls)) {
                    allImageUrls.push(...img.imgUrls);
                }
                if (Array.isArray(img["INPUT IMAGES"])) {
                    allImageUrls.push(...img["INPUT IMAGES"]);
                }
            }
            
            // Remover duplicatas
            const uniqueImageUrls = [...new Set(allImageUrls)];
            
            if (uniqueImageUrls.length === 0) {
                return [{ index: 0, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null }];
            }
            
            // Usar o primeiro item como base para os outros campos
            const baseImg = imagesArray[0];
            const encodedUrl = baseImg.imagensReferencia ? encodeURI(baseImg.imagensReferencia) : '';
            
            // Campos básicos para Image suggestions
            const fields = {
                ["Property's URL"]: baseImg.propertyUrl || '',
                ["INPUT IMAGE"]: uniqueImageUrls.map(url => ({ url })), // TODAS as imagens em um só campo
                ["Owner Email"]: email,
                ["Client Internal Code"]: baseImg.codigo || '',
                Message: baseImg.observacoes || '',
            };
            
            // Relacionamentos condicionais
            if (clientId && clientId.trim() !== '') {
                fields.Clients = [clientId];
            }
            
            if (encodedUrl) {
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
            }
            
            // Campos opcionais do primeiro item
            const decluttering = getSelectValue(baseImg.retirar);
            if (decluttering) fields["Decluttering"] = decluttering;
            
            const roomType = getSelectValue(baseImg.tipo);
            if (roomType) fields["Room Type"] = roomType;
            
            const finish = getSelectValue(baseImg.acabamento);
            if (finish) fields["Finish"] = finish;
            
            // Estilo (relacionamento)
            const estilo = getSelectValue(baseImg.estilo);
            if (estilo) {
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id];
                    }
                } catch (styleError) {
                }
            }
            
            const suggestionstatus = getSelectValue(baseImg.suggestionstatus);
            if (suggestionstatus) fields["Suggestion Status"] = suggestionstatus;
            
            // Destaques
            let destaques = baseImg.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }
            
            const endereco = getSelectValue(baseImg.endereco);
            if (endereco) fields["Endereço"] = endereco;
            
            const preco = getSelectValue(baseImg.preco);
            if (preco) {
                const precoNumber = Number(
                    preco.toString()
                        .replace(/\./g, '')
                        .replace(',', '.')
                        .replace(/[^\d.-]/g, '')
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }
            
            
            // Criar registro único
            const result = await baseInstance(tableName).create(fields);
            
            return [{ 
                index: 0, 
                status: 'created', 
                id: result.id, 
                imgUrl: uniqueImageUrls.join(', '),
                imageCount: uniqueImageUrls.length
            }];
            
        } catch (error) {
            return [{ index: 0, status: 'error', error: error.message, imgUrl: null }];
        }
        
    } else {
        // Para outras tabelas (Images): comportamento original - 1 registro por imagem
        
        // Validação específica para suggestion feed
        if (isSuggestionFeedApproval) {
            // Verificar se cada item do array tem flag skipAggregatedRecord
            const hasSkipFlags = imagesArray.every(img => img.skipAggregatedRecord === true);
            if (hasSkipFlags) {
            } else {
            }
            
            // Verificar se cada item tem source = 'suggestion-feed-approved'
            const hasSourceFlags = imagesArray.every(img => img.source === 'suggestion-feed-approved');
            if (hasSourceFlags) {
            } else {
            }
        }
        
        for (let i = 0; i < imagesArray.length; i++) {
            const img = imagesArray[i];
            
            try {
                // Log específico para cada imagem do suggestion feed
                if (isSuggestionFeedApproval) {
                }
                
                // Buscar registros existentes (temporariamente desabilitado para sempre criar novos)
                const records = [];
                
                const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';
                
                // Usar apenas imgUrl como fonte de verdade para INPUT IMAGE
                // Ignorar imgUrls e "INPUT IMAGES" para evitar duplicação
                const imageUrl = img.imgUrl || (Array.isArray(img.imgUrls) ? img.imgUrls[0] : null) || 
                                (Array.isArray(img["INPUT IMAGES"]) ? img["INPUT IMAGES"][0] : null);
                
                if (!imageUrl) {
                    results.push({ index: i, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null });
                    continue;
                }
                
                // Validação adicional para suggestion feed
                if (isSuggestionFeedApproval && img.skipAggregatedRecord !== true) {
                }
                
                // Campos básicos
                const fields = {
                    ["Property's URL"]: img.propertyUrl || '',
                    ["INPUT IMAGE"]: [{ url: imageUrl }], // Uma imagem por registro
                    ["Owner Email"]: email,
                    ["Client Internal Code"]: img.codigo || '',
                    Message: img.observacoes || '',
                };
                
                // Adicionar metadados de origem nos campos se for suggestion feed
                if (isSuggestionFeedApproval) {
                    fields["Processing Source"] = "suggestion-feed-approval";
                    fields["Created From"] = "feed-approval";
                    
                    // Adicionar timestamp específico
                    fields["Approved At"] = new Date().toISOString();
                }
                
                // Relacionamentos condicionais
                if (clientId && clientId.trim() !== '') {
                    fields.Clients = [clientId];
                }
                
                // Usar a tabela especificada no parâmetro, não forçar "Images"
                const actualTableName = tableName;
                
                // Aplicar campos específicos baseados na tabela de destino
                if (actualTableName === "Images") {
                    if (invoiceId && invoiceId.trim() !== '') {
                        fields.Invoices = [invoiceId];
                    }
                    if (userId && userId.trim() !== '') {
                        fields.Users = [userId];
                    }
                }
                
                if (encodedUrl) {
                    fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
                }
                
                // Campos opcionais
                const decluttering = getSelectValue(img.retirar);
                if (decluttering) fields["Decluttering"] = decluttering;
                
                const roomType = getSelectValue(img.tipo);
                if (roomType) fields["Room Type"] = roomType;
                
                const videoTemplate = getSelectValue(img.modeloVideo);
                if (videoTemplate) fields["Video Template"] = videoTemplate;
                
                const videoProportion = getSelectValue(img.formatoVideo);
                if (videoProportion) fields["Video Proportion"] = videoProportion;
                
                const finish = getSelectValue(img.acabamento);
                if (finish) fields["Finish"] = finish;
                
                // Estilo (relacionamento)
                const estilo = getSelectValue(img.estilo);
                if (estilo) {
                    try {
                        const styleRecords = await baseInstance("Styles").select({
                            filterByFormula: `{Style Name} = '${estilo}'`,
                            maxRecords: 1
                        }).firstPage();
                        
                        if (styleRecords.length > 0) {
                            fields["STYLE"] = [styleRecords[0].id];
                        }
                    } catch (styleError) {
                    }
                }
                
                const imageWorkflow = getSelectValue(img.imgWorkflow);
                if (imageWorkflow) fields["Image Workflow"] = imageWorkflow;
                
                const suggestionstatus = getSelectValue(img.suggestionstatus);
                if (suggestionstatus) fields["Suggestion Status"] = suggestionstatus;
                
                // Destaques
                let destaques = img.destaques;
                if (Array.isArray(destaques) && destaques.length > 0) {
                    fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
                } else if (typeof destaques === "string" && destaques.trim() !== "") {
                    fields["Destaques"] = [destaques.trim()];
                }
                
                const endereco = getSelectValue(img.endereco);
                if (endereco) fields["Endereço"] = endereco;
                
                const preco = getSelectValue(img.preco);
                if (preco) {
                    const precoNumber = Number(
                        preco.toString()
                            .replace(/\./g, '')
                            .replace(',', '.')
                            .replace(/[^\d.-]/g, '')
                    );
                    if (!isNaN(precoNumber)) {
                        fields["Preço"] = precoNumber;
                    }
                }
                
                // Log mais específico
                if (isSuggestionFeedApproval) {
                } else {
                }
                
                // Criar/atualizar registro
                let result;
                if (records.length > 0) {
                    result = await baseInstance(actualTableName).update(records[0].id, fields);
                    results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: imageUrl });
                } else {
                    result = await baseInstance(actualTableName).create(fields);
                    if (isSuggestionFeedApproval) {
                    } else {
                    }
                    results.push({ index: i, status: 'created', id: result.id, imgUrl: imageUrl });
                }
                
            } catch (error) {
                results.push({ index: i, status: 'error', error: error.message, imgUrl: imageUrl || img.imgUrl });
            }
        }
        
        // Log final específico para suggestion feed
        if (isSuggestionFeedApproval) {
            const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
            const errorCount = results.filter(r => r.status === 'error').length;
            
        }
    }
    
    return results;
}


export async function syncImoveisWithAirtable(imoveisFromXml) {
    const tableName = "Krolow";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Krolow imóveis";

    // Busca todos os imóveis atuais do Airtable
    const airtableRecords = await baseInstance(tableName).select({}).all();
    const airtableMap = {};
    airtableRecords.forEach(record => {
        airtableMap[record.fields.Codigo] = { id: record.id, fields: record.fields };
    });

    // Cria um Set com todos os códigos do XML
    const xmlCodigos = new Set(imoveisFromXml.map(imovel => {
        return imovel.CodigoImovel || imovel.codigo || imovel.ListingID;
    }));

    // Adiciona/Atualiza imóveis do XML
    for (const imovel of imoveisFromXml) {
        // Detectar o tipo de XML
        const isKenlo = !!imovel.CodigoImovel;
        const isSiga = !!imovel.ListingID;

        // Define código com base no tipo de XML
        const codigo = isKenlo ? imovel.CodigoImovel :
            isSiga ? imovel.ListingID :
                imovel.codigo;

        // Mapear os campos conforme o tipo de XML
        let tipo, finalidade, valor, bairro, cidade, uf, area_util,
            quartos, suites, banheiros, vagas, descricao, fotos = "", url_propriedade = "";

        if (isSiga) {
            // Campos específicos do SIGA
            tipo = imovel.Details?.PropertyType || "";
            finalidade = imovel.TransactionType === "For Sale" ? "Venda" :
                imovel.TransactionType === "For Rent" ? "Aluguel" :
                    imovel.TransactionType || "";
            valor = imovel.Details?.ListPrice || 0;
            bairro = imovel.Location?.Neighborhood || "";
            cidade = imovel.Location?.City || "";
            uf = imovel.Location?.State?.abbreviation || "";
            area_util = imovel.Details?.LivingArea || 0;
            quartos = imovel.Details?.Bedrooms || 0;
            suites = imovel.Details?.Suites || 0;
            banheiros = imovel.Details?.Bathrooms || 0;
            vagas = imovel.Details?.Garage || 0;
            descricao = imovel.Title || imovel.Details?.Description || "";
            url_propriedade = imovel.ListingURL || "";

            // Tratar fotos do SIGA (dentro do objeto Media)
            if (isSiga && imovel.Media && imovel.Media.Item) {

                // Verificar se é um array ou item único
                if (Array.isArray(imovel.Media.Item)) {
                    // Extrair URLs das imagens do array 
                    fotos = imovel.Media.Item
                        .filter(item => item.medium === "image") // Com mergeAttrs, o atributo está direto no objeto
                        .map(item => item._) // O conteúdo está em _
                        .join('\n');
                } else if (imovel.Media.Item.medium === "image") {
                    // Caso seja apenas um item
                    fotos = imovel.Media.Item._;
                }

                // Verificar se conseguimos extrair fotos
                if (!fotos) {
                    // Tentativa alternativa - o conteúdo pode ser o próprio texto do item
                    try {
                        const mediaItems = Array.isArray(imovel.Media.Item) ?
                            imovel.Media.Item : [imovel.Media.Item];

                        // Percorrer os items e extrair textos
                        const urls = [];
                        for (const item of mediaItems) {
                            if (typeof item === 'string') {
                                urls.push(item);
                            } else if (item._) {
                                urls.push(item._);
                            } else if (item.primary === "true" || item.medium === "image") {
                                // Tentativa de extrair com base em outros atributos
                                const url = Object.values(item).find(val =>
                                    typeof val === 'string' &&
                                    val.startsWith('http')
                                );
                                if (url) urls.push(url);
                            }
                        }

                        fotos = urls.join('\n');
                    } catch (e) {
                    }
                }
            }
        } else if (isKenlo) {
            // Mapeamento Kenlo (existente)
            tipo = imovel.TipoImovel;
            finalidade = imovel.Finalidade;
            valor = imovel.PrecoVenda;
            bairro = imovel.Bairro;
            cidade = imovel.Cidade;
            uf = imovel.Estado;
            area_util = imovel.AreaUtil;
            quartos = imovel.QtdDormitorios;
            suites = imovel.QtdSuites || imovel.suites;
            banheiros = imovel.QtdBanheiros;
            vagas = imovel.QtdVagas;
            descricao = imovel.Observacao || imovel.TituloImovel;
            url_propriedade = imovel.URLGaiaSite || "";

            if (imovel.Fotos && imovel.Fotos.Foto) {
                if (Array.isArray(imovel.Fotos.Foto)) {
                    fotos = imovel.Fotos.Foto.map(f => f.URLArquivo).join('\n');
                } else if (imovel.Fotos.Foto.URLArquivo) {
                    fotos = imovel.Fotos.Foto.URLArquivo;
                }
            }
        } else {
            // Mapeamento padrão (existente)
            tipo = imovel.tipo;
            finalidade = imovel.finalidade;
            valor = imovel.valor;
            bairro = imovel.bairro;
            cidade = imovel.cidade;
            uf = imovel.uf;
            area_util = imovel.area_util;
            quartos = imovel.quartos;
            suites = imovel.suites;
            banheiros = imovel.banheiros;
            vagas = imovel.vagas;
            descricao = imovel.descricao;
            url_propriedade = imovel.url_propriedade || "";

            if (imovel.fotos?.foto) {
                fotos = Array.isArray(imovel.fotos.foto)
                    ? imovel.fotos.foto.join('\n')
                    : imovel.fotos.foto;
            }
        }

        // Tratar fotos especificamente para o SIGA - segunda tentativa
        // O formato pode variar conforme a estrutura XML exata
        if (isSiga && !fotos && imovel.Media) {
            try {
                const mediaItems = Array.isArray(imovel.Media.Item) ?
                    imovel.Media.Item :
                    [imovel.Media.Item];

                fotos = mediaItems
                    .filter(item => typeof item === 'string')
                    .join('\n');
            } catch (e) {
            }
        }

        const fields = {
            Client: client,
            Codigo: codigo,
            Tipo: tipo,
            Finalidade: finalidade,
            Valor: Number(valor),
            Bairro: bairro,
            Cidade: cidade,
            UF: uf,
            Area_util: Number(area_util),
            Quartos: Number(quartos),
            Suites: Number(suites),
            Banheiros: Number(banheiros),
            Vagas: Number(vagas),
            Descricao: descricao,
            Fotos: fotos ? fotos : "",
            Fotos_URLs: fotos ? fotos : "",
        };

        // Adicionar URL_Propriedade apenas se houver valor
        if (url_propriedade) {
            fields.URL_Propriedade = url_propriedade;
        }

        if (!airtableMap[codigo]) {
            // Adicionar novo imóvel
            try {
                await baseInstance(tableName).create(fields);
            } catch (error) {
                // Se erro for devido a campo desconhecido, tentar novamente sem campos problemáticos
                if (error.message && error.message.includes('Unknown field name')) {
                    
                    // Remover URL_Propriedade e tentar novamente
                    const fieldsWithoutUrl = { ...fields };
                    delete fieldsWithoutUrl.URL_Propriedade;
                    
                    
                    try {
                        await baseInstance(tableName).create(fieldsWithoutUrl);
                    } catch (retryError) {
                        throw retryError;
                    }
                } else {
                    throw error;
                }
            }
        } else {
            // Atualizar apenas se houver diferença
            const currentFields = airtableMap[codigo].fields;
            const hasDiff = Object.keys(fields).some(key => fields[key] != currentFields[key]);
            if (hasDiff) {
                try {
                    await baseInstance(tableName).update(airtableMap[codigo].id, fields);
                } catch (error) {
                    // Se erro for devido a campo desconhecido, tentar novamente sem campos problemáticos
                    if (error.message && error.message.includes('Unknown field name')) {
                        
                        // Remover URL_Propriedade e tentar novamente
                        const fieldsWithoutUrl = { ...fields };
                        delete fieldsWithoutUrl.URL_Propriedade;
                        
                        
                        try {
                            await baseInstance(tableName).update(airtableMap[codigo].id, fieldsWithoutUrl);
                        } catch (retryError) {
                            throw retryError;
                        }
                    } else {
                        throw error;
                    }
                }
            }
        }
    }

    // Remover imóveis que estão no Airtable mas não estão mais no XML
    for (const codigo in airtableMap) {
        if (!xmlCodigos.has(codigo)) {
            await baseInstance(tableName).destroy(airtableMap[codigo].id);
        }
    }
}