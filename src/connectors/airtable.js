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
    const tableName = "Tamiles";
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Tamiles";

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
        client: client,
        code: codigo,
        type: tipo,
        finally: finalidade,
        value: Number(valor),
        neighbordhood: bairro,
        city: cidade,
        state: uf,
        util_area: Number(area_util),
        rooms: Number(quartos),
        suits: Number(suites),
        bathrooms: Number(banheiros),
        parking_spaces: Number(vagas),
        description: descricao,
        photos: fotos ? fotos : "",
        url_photos: fotos ? fotos : "",
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
 * Função específica para transferir sugestões aprovadas do Feed para tabela Images copy (Rota 3)
 * Converte 1 registro de Image suggestions (múltiplas imagens) 
 * em N registros individuais na tabela Images copy
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
    console.log("🔄 [transferApprovedSuggestionToImages] Iniciando transferência de sugestão aprovada");
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const results = [];
    
    // Extrair URLs das imagens - APENAS do campo inputImages
    const imageUrls = suggestionData.inputImages || [];
    
    console.log("📊 [transferApprovedSuggestionToImages] URLs encontradas:", imageUrls.length);
    
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.log("❌ [transferApprovedSuggestionToImages] Nenhuma URL válida encontrada");
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
        
        console.log(`🖼️ [transferApprovedSuggestionToImages] Processando imagem ${i + 1}/${imageUrls.length}: ${imageUrl.substring(0, 50)}...`);
        
        try {
            
            const fields = {
                property_code: suggestionData.codigo || '',
                input_img: [{ url: imageUrl }], // UMA imagem por registro - nome correto do campo
                user_email: customEmail || '',
                request_text: suggestionData.observacoes || '',
            };
            
            console.log("🔗 [transferApprovedSuggestionToImages] Adicionando relacionamentos...");
            
            // Relacionamentos - usando nomes corretos dos campos para tabela Images copy
            if (customClientId) {
                fields.client = [customClientId]; // Array para relacionamento
                console.log("  - client:", customClientId);
            }
            if (customInvoiceId) {
                fields.invoice = customInvoiceId; // String para invoice
                console.log("  - invoice:", customInvoiceId);
            }
            if (customUserId) {
                fields.user = [customUserId]; // Array para relacionamento
                console.log("  - user:", customUserId);
            }
            
            // Style ref se houver imagensReferencia
            if (suggestionData.imagensReferencia) {
                const encodedUrl = encodeURI(suggestionData.imagensReferencia);
                fields["style_ref"] = [{ url: encodedUrl }];
            }
            
            // Campos opcionais - usando nomes corretos para tabela Images copy
            const decluttering = getSelectValue(suggestionData.retirar);
            if (decluttering) fields["decluttering"] = decluttering;
            
            const roomType = getSelectValue(suggestionData.tipo);
            if (roomType) fields["room_type"] = roomType;
            
            const videoTemplate = getSelectValue(suggestionData.modeloVideo);
            if (videoTemplate) fields["vid_type"] = videoTemplate;
            
            const videoProportion = getSelectValue(suggestionData.formatoVideo);
            if (videoProportion) fields["vid_orientation"] = videoProportion;
            
            const finish = getSelectValue(suggestionData.acabamento);
            if (finish) fields["finishing"] = finish;
            
            const imageWorkflow = getSelectValue(suggestionData.imgWorkflow);
            if (imageWorkflow) fields["workflow"] = imageWorkflow;
            
            const suggestionstatus = getSelectValue(suggestionData.suggestionstatus);
            if (suggestionstatus) fields["Suggestion Status"] = suggestionstatus;
            
            // Estilo (relacionamento) - nome correto do campo
            const estilo = getSelectValue(suggestionData.estilo);
            if (estilo) {
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        fields["style"] = [styleRecords[0].id]; // Array para relacionamento
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
            
            
            // Criar registro individual na tabela Images copy
            const result = await baseInstance("Images copy").create(fields);
            
            console.log(`✅ [transferApprovedSuggestionToImages] Registro criado: ${result.id}`);
            
            results.push({ 
                index: i, 
                status: 'created', 
                id: result.id, 
                imgUrl: imageUrl 
            });
            
        } catch (error) {
            console.log(`❌ [transferApprovedSuggestionToImages] Erro na imagem ${i + 1}: ${error.message}`);
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
    
    console.log("📊 [transferApprovedSuggestionToImages] Resumo final:");
    console.log("  - ✅ Sucessos:", successCount);
    console.log("  - ❌ Erros:", errorCount);
    console.log("  - 📋 Total processado:", results.length);
    
    
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
    
    const tableName = imageTable || "Images copy";
    
    // Log de identificação da origem da requisição
    
    // 🚨 ALERTA: Se esta função for chamada durante ROTA 3, há problema no frontend
    if (requestSource === 'suggestion-feed-approval' || processMode === 'individual-records-only') {
        console.log("⚠️ [upsetImagesInAirtable] Detectado processamento de suggestion feed");
    }
    
    // Verificar se é uma requisição do suggestion feed
    const isSuggestionFeedApproval = requestSource === 'suggestion-feed-approval' || 
                                    processMode === 'individual-records-only';
    
    if (isSuggestionFeedApproval) {
        console.log("🔄 [upsetImagesInAirtable] Modo suggestion feed ativado");
    }

    // Configuração do Airtable
    console.log("🔧 [upsetImagesInAirtable] Configurando Airtable...");
    console.log("  - AIRTABLE_API_KEY existe:", !!process.env.AIRTABLE_API_KEY);
    console.log("  - AIRTABLE_BASE_ID:", process.env.AIRTABLE_BASE_ID);
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Valores processados
    const email = customEmail || (imagesArray[0]?.userEmail || 'email@default.com');
    const clientId = customClientId || (imagesArray[0]?.clientId || null);
    const invoiceId = customInvoiceId || (imagesArray[0]?.invoiceId || null);
    const userId = customUserId || (imagesArray[0]?.userId || null);
    
    const results = [];
    
    // Função para validar campos de single select
    const getSelectValue = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // NOVO: Lógica diferente baseada na tabela de destino
    if (tableName === "Image suggestions") {
        console.log("📋 [upsetImagesInAirtable] Processando para tabela 'Image suggestions'");
        
        // Para Image suggestions: criar apenas 1 registro com todas as imagens
        try {
            // Coletar todas as URLs de imagens de todos os itens do array
            const allImageUrls = [];
            
            console.log("🖼️ [upsetImagesInAirtable] Coletando URLs de imagens...");
            for (const img of imagesArray) {
                console.log("  - Processando item:", { imgUrl: img.imgUrl, imgUrls: img.imgUrls?.length, inputImages: img["INPUT IMAGES"]?.length });
                
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
            console.log("📊 [upsetImagesInAirtable] URLs coletadas:", {
                total: allImageUrls.length,
                unique: uniqueImageUrls.length,
                urls: uniqueImageUrls.slice(0, 3) // Mostrar apenas as 3 primeiras
            });
            
            if (uniqueImageUrls.length === 0) {
                console.log("❌ [upsetImagesInAirtable] Nenhuma URL válida encontrada");
                return [{ index: 0, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null }];
            }
            
            // Usar o primeiro item como base para os outros campos
            const baseImg = imagesArray[0];
            console.log("🎯 [upsetImagesInAirtable] Usando item base:", {
                propertyUrl: baseImg.propertyUrl,
                codigo: baseImg.codigo,
                observacoes: baseImg.observacoes?.length || 0
            });
            
            const encodedUrl = baseImg.imagensReferencia ? encodeURI(baseImg.imagensReferencia) : '';
            
            // Campos básicos para Image suggestions
            const fields = {
                ["Property's URL"]: baseImg.propertyUrl || '',
                ["INPUT IMAGE"]: uniqueImageUrls.map(url => ({ url })), // TODAS as imagens em um só campo
                ["Owner Email"]: email,
                ["Client Internal Code"]: baseImg.codigo || '',
                Message: baseImg.observacoes || '',
            };
            
            console.log("🔨 [upsetImagesInAirtable] Campos básicos criados:", {
                propertyUrl: fields["Property's URL"],
                imageCount: fields["INPUT IMAGE"].length,
                email: fields["Owner Email"],
                code: fields["Client Internal Code"],
                messageLength: fields.Message?.length || 0
            });
            
            // Relacionamentos condicionais
            if (clientId && clientId.trim() !== '') {
                fields.Clients = [clientId];
                console.log("🔗 [upsetImagesInAirtable] Adicionado relacionamento Clients:", clientId);
            }
            
            if (encodedUrl) {
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
                console.log("📎 [upsetImagesInAirtable] Adicionado attachment:", encodedUrl.substring(0, 50) + "...");
            }
            
            // Campos opcionais do primeiro item
            console.log("⚙️ [upsetImagesInAirtable] Processando campos opcionais...");
            
            const decluttering = getSelectValue(baseImg.retirar);
            if (decluttering) {
                fields["Decluttering"] = decluttering;
                console.log("  - Decluttering:", decluttering);
            }
            
            const roomType = getSelectValue(baseImg.tipo);
            if (roomType) {
                fields["Room Type"] = roomType;
                console.log("  - Room Type:", roomType);
            }
            
            const finish = getSelectValue(baseImg.acabamento);
            if (finish) {
                fields["Finish"] = finish;
                console.log("  - Finish:", finish);
            }
            
            // Estilo (relacionamento)
            const estilo = getSelectValue(baseImg.estilo);
            if (estilo) {
                console.log("🎨 [upsetImagesInAirtable] Processando estilo:", estilo);
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id];
                        console.log("  - Estilo encontrado, ID:", styleRecords[0].id);
                    } else {
                        console.log("  - Estilo não encontrado na tabela Styles");
                    }
                } catch (styleError) {
                    console.log("  - Erro ao buscar estilo:", styleError.message);
                }
            }
            
            const suggestionstatus = getSelectValue(baseImg.suggestionstatus);
            if (suggestionstatus) {
                fields["Suggestion Status"] = suggestionstatus;
                console.log("  - Suggestion Status:", suggestionstatus);
            }
            
            // Destaques
            let destaques = baseImg.destaques;
            console.log("✨ [upsetImagesInAirtable] Processando destaques:", { type: typeof destaques, value: destaques });
            if (Array.isArray(destaques) && destaques.length > 0) {
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
                console.log("  - Destaques (array):", fields["Destaques"]);
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
                console.log("  - Destaques (string):", fields["Destaques"]);
            }
            
            const endereco = getSelectValue(baseImg.endereco);
            if (endereco) {
                fields["Endereço"] = endereco;
                console.log("  - Endereço:", endereco);
            }
            
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
                    console.log("  - Preço:", precoNumber);
                }
            }
            
            console.log("💾 [upsetImagesInAirtable] Criando registro único na tabela Image suggestions...");
            console.log("📋 [upsetImagesInAirtable] Campos finais:", Object.keys(fields));
            
            // Criar registro único
            const result = await baseInstance(tableName).create(fields);
            
            console.log("✅ [upsetImagesInAirtable] Registro criado com sucesso:", result.id);
            
            return [{ 
                index: 0, 
                status: 'created', 
                id: result.id, 
                imgUrl: uniqueImageUrls.join(', '),
                imageCount: uniqueImageUrls.length
            }];
            
        } catch (error) {
            console.log("❌ [upsetImagesInAirtable] Erro ao criar registro em Image suggestions:", error.message);
            console.log("🔍 [upsetImagesInAirtable] Stack trace:", error.stack);
            return [{ index: 0, status: 'error', error: error.message, imgUrl: null }];
        }
        
    } else {
        // Para outras tabelas (Images): comportamento original - 1 registro por imagem
        console.log("📋 [upsetImagesInAirtable] Processando para tabela:", tableName);
        
        // Validação específica para suggestion feed
        if (isSuggestionFeedApproval) {
            console.log("🔍 [upsetImagesInAirtable] Validação suggestion feed...");
            // Verificar se cada item do array tem flag skipAggregatedRecord
            const hasSkipFlags = imagesArray.every(img => img.skipAggregatedRecord === true);
            if (hasSkipFlags) {
                console.log("  - ✅ Todos itens têm skipAggregatedRecord");
            } else {
                console.log("  - ⚠️ Nem todos itens têm skipAggregatedRecord");
            }
            
            // Verificar se cada item tem source = 'suggestion-feed-approved'
            const hasSourceFlags = imagesArray.every(img => img.source === 'suggestion-feed-approved');
            if (hasSourceFlags) {
                console.log("  - ✅ Todos itens têm source correto");
            } else {
                console.log("  - ⚠️ Nem todos itens têm source correto");
            }
        }
        
        for (let i = 0; i < imagesArray.length; i++) {
            const img = imagesArray[i];
            
            // Definir imageUrl ANTES do try para estar disponível no catch
            const imageUrl = img.imgUrl || (Array.isArray(img.imgUrls) ? img.imgUrls[0] : null) || 
                            (Array.isArray(img["INPUT IMAGES"]) ? img["INPUT IMAGES"][0] : null);
            
            // Definir fields ANTES do try para estar disponível no catch
            let fields = null;
            
            try {
                
                // Buscar registros existentes (temporariamente desabilitado para sempre criar novos)
                const records = [];
                
                const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';
                
                if (!imageUrl) {
                    results.push({ index: i, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null });
                    continue;
                }
                
                // Campos básicos
                fields = {
                    property_code: img.codigo || '',
                    input_img: [{ url: imageUrl }], // Nome correto do campo
                    user_email: email,
                    request_text: img.observacoes || '',
                };
                
                // Adicionar metadados de origem nos campos se for suggestion feed
                if (isSuggestionFeedApproval) {
                    fields["Processing Source"] = "suggestion-feed-approval";
                    fields["Created From"] = "feed-approval";
                    
                    // Adicionar timestamp específico
                    fields["Approved At"] = new Date().toISOString();
                }

                 // Usar a tabela especificada no parâmetro, não forçar "Images"
                const actualTableName = tableName;
                
                // Relacionamentos condicionais - TODOS como arrays para Images copy
                if (clientId && clientId.trim() !== '') {
                    fields.client = [clientId]; // Array para relacionamento
                    console.log("  - 🔗 Campo client adicionado como array:", [clientId]);
                }
                
                // Aplicar campos específicos baseados na tabela de destino
                console.log("  - 📋 Tabela destino:", actualTableName);
                console.log("  - 🎫 invoiceId:", invoiceId);
                console.log("  - 👤 userId:", userId);
                
                // Para tabela Images copy - invoice é string, user é array
                if (invoiceId && invoiceId.trim() !== '') {
                    fields.invoice = invoiceId; // String para invoice
                    console.log("    - 💰 Campo invoice adicionado como string:", invoiceId);
                }
                if (userId && userId.trim() !== '') {
                    fields.user = [userId]; // Array para user (relacionamento)
                    console.log("    - � Campo user adicionado como array:", [userId]);
                }
                
                if (encodedUrl) {
                    fields["style_ref"] = [{ url: encodedUrl }];
                    console.log("  - 📎 Style ref adicionado");
                }
                
                // Campos opcionais
                console.log("  - ⚙️ Processando campos opcionais...");
                
                const decluttering = getSelectValue(img.retirar);
                if (decluttering) {
                    fields["decluttering"] = decluttering;
                    console.log("    - decluttering:", decluttering);
                }
                
                const roomType = getSelectValue(img.tipo);
                if (roomType) {
                    fields["room_type"] = roomType;
                    console.log("    - room_type:", roomType);
                }
                
                const videoTemplate = getSelectValue(img.modeloVideo);
                if (videoTemplate) {
                    fields["vid_type"] = videoTemplate;
                    console.log("    - vid_type:", videoTemplate);
                }
                
                const videoProportion = getSelectValue(img.formatoVideo);
                if (videoProportion) {
                    fields["vid_orientation"] = videoProportion;
                    console.log("    - vid_orientation:", videoProportion);
                }
                
                const finish = getSelectValue(img.acabamento);
                if (finish) {
                    fields["finishing"] = finish;
                    console.log("    - finishing:", finish);
                }
                
                // Estilo (relacionamento)
                const estilo = getSelectValue(img.estilo);
                if (estilo) {
                    console.log("  - 🎨 Processando estilo:", estilo);
                    try {
                        const styleRecords = await baseInstance("Styles").select({
                            filterByFormula: `{Style Name} = '${estilo}'`,
                            maxRecords: 1
                        }).firstPage();
                        
                        if (styleRecords.length > 0) {
                            fields["style"] = [styleRecords[0].id]; // Array para relacionamento
                            console.log("    - ✅ Estilo encontrado, ID:", styleRecords[0].id);
                        } else {
                            console.log("    - Estilo não encontrado na tabela Styles");
                        }
                    } catch (styleError) {
                        console.log("    - Erro ao buscar estilo:", styleError.message);
                    }
                }
                
                const imageWorkflow = getSelectValue(img.imgWorkflow);
                if (imageWorkflow) {
                    fields["workflow"] = imageWorkflow;
                    console.log("    - workflow:", imageWorkflow);
                }
                
                const suggestionstatus = getSelectValue(img.suggestionstatus);
                if (suggestionstatus) {
                    fields["Suggestion Status"] = suggestionstatus;
                    console.log("    - Suggestion Status:", suggestionstatus);
                }
                
                // Destaques
                let destaques = img.destaques;
                console.log("  - ✨ Processando destaques:", { type: typeof destaques, value: destaques });
                if (Array.isArray(destaques) && destaques.length > 0) {
                    fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
                    console.log("    - Destaques (array):", fields["Destaques"]);
                } else if (typeof destaques === "string" && destaques.trim() !== "") {
                    fields["Destaques"] = [destaques.trim()];
                    console.log("    - Destaques (string):", fields["Destaques"]);
                }
                
                const endereco = getSelectValue(img.endereco);
                if (endereco) {
                    fields["Endereço"] = endereco;
                    console.log("    - Endereço:", endereco);
                }
                
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
                        console.log("    - Preço:", precoNumber);
                    }
                }
                
                // Log mais específico
                if (isSuggestionFeedApproval) {
                    console.log("  - 🎯 Processamento suggestion feed - campos finais:", Object.keys(fields).length);
                } else {
                    console.log("  - 📝 Processamento normal - campos finais:", Object.keys(fields).length);
                }
                
                // VALIDAÇÃO PREVENTIVA FINAL DOS CAMPOS
                console.log("  - 🛡️ Validação preventiva dos campos...");
                const problematicFields = [];
                
                for (const [fieldName, fieldValue] of Object.entries(fields)) {
                    // Verificar campo input_img especificamente
                    if (fieldName === 'input_img') {
                        console.log(`    - ${fieldName}: ${Array.isArray(fieldValue) ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                        
                        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                            const attachment = fieldValue[0];
                            if (attachment && attachment.url) {
                                console.log(`      - URL attachment: ${attachment.url}`);
                                
                                // Verificar se a URL é válida
                                try {
                                    new URL(attachment.url);
                                    console.log(`      - ✅ URL válida`);
                                } catch (urlError) {
                                    console.error(`      - ❌ URL inválida: ${urlError.message}`);
                                    problematicFields.push(`${fieldName} contém URL inválida: ${attachment.url}`);
                                }
                            } else {
                                console.error(`      - ❌ Attachment sem URL válida`);
                                problematicFields.push(`${fieldName} contém attachment sem URL`);
                            }
                        } else {
                            console.error(`      - ❌ input_img não é um array válido`);
                            problematicFields.push(`${fieldName} deveria ser array com attachments`);
                        }
                    }
                    
                    // Verificar campos que são sempre relacionamentos (arrays)
                    else if (['client', 'user', 'style'].includes(fieldName)) {
                        const isArray = Array.isArray(fieldValue);
                        console.log(`    - ${fieldName}: ${isArray ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                        
                        if (!isArray) {
                            problematicFields.push(`${fieldName} deveria ser array mas é ${typeof fieldValue}`);
                        }
                    }
                    
                    // Verificar campos que são sempre strings
                    else if (['invoice'].includes(fieldName)) {
                        const isString = typeof fieldValue === 'string';
                        console.log(`    - ${fieldName}: ${typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                        
                        if (!isString) {
                            problematicFields.push(`${fieldName} deveria ser string mas é ${typeof fieldValue}`);
                        }
                    }
                }
                
                if (problematicFields.length > 0) {
                    console.error("  - 🚨 CAMPOS PROBLEMÁTICOS DETECTADOS:");
                    problematicFields.forEach(problem => console.error(`    - ❌ ${problem}`));
                }
                
                // Criar/atualizar registro
                let result;
                console.log("  - 💾 Salvando registro...");
                console.log("  - 📋 Campos que serão enviados:", Object.keys(fields));
                
                // Validação de tipos de campos antes de enviar
                console.log("  - 🔍 Validando tipos de campos...");
                for (const [fieldName, fieldValue] of Object.entries(fields)) {
                    const valueType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;
                    const arrayLength = Array.isArray(fieldValue) ? fieldValue.length : 'N/A';
                    const isEmpty = fieldValue === '' || fieldValue === null || fieldValue === undefined || 
                                   (Array.isArray(fieldValue) && fieldValue.length === 0);
                    
                    console.log(`    - ${fieldName}: ${valueType} ${arrayLength !== 'N/A' ? `(${arrayLength} items)` : ''} = ${JSON.stringify(fieldValue)}`);
                    
                    if (isEmpty) {
                        console.log(`      ⚠️  Campo vazio detectado: ${fieldName}`);
                    }
                    
                    // Verificar se é um campo que deveria ser array mas não é
                    if (['client', 'invoice', 'user'].includes(fieldName) && actualTableName !== "Images copy" && !Array.isArray(fieldValue)) {
                        console.log(`      ⚠️  ATENÇÃO: Campo ${fieldName} deveria ser array para tabela ${actualTableName}`);
                    }
                    
                    // Verificar se é um campo que deveria ser string mas é array
                    if (['client', 'invoice', 'user'].includes(fieldName) && actualTableName === "Images copy" && Array.isArray(fieldValue)) {
                        console.log(`      ⚠️  ATENÇÃO: Campo ${fieldName} deveria ser string para tabela ${actualTableName}`);
                    }
                    
                    // Verificar campos de relacionamento obrigatórios como arrays vazios
                    if (['style', 'Invoices', 'Users'].includes(fieldName) && Array.isArray(fieldValue) && fieldValue.length === 0) {
                        console.log(`      ⚠️  Campo relacionamento vazio: ${fieldName}`);
                    }
                }
                
                console.log("  - 🔍 Campos detalhados:", JSON.stringify(fields, null, 2));
                
                if (records.length > 0) {
                    result = await baseInstance(actualTableName).update(records[0].id, fields);
                    console.log("  - ✅ Registro atualizado:", records[0].id);
                    results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: imageUrl });
                } else {
                    result = await baseInstance(actualTableName).create(fields);
                    console.log("  - ✅ Registro criado:", result.id);
                    if (isSuggestionFeedApproval) {
                        console.log("    - 🎯 Criado via suggestion feed");
                    } else {
                        console.log("    - 📝 Criado via processo normal");
                    }
                    results.push({ index: i, status: 'created', id: result.id, imgUrl: imageUrl });
                }
                
            } catch (error) {
                console.log(`  - ❌ Erro ao processar imagem ${i + 1}:`, error.message);
                console.error("    - 🔍 Erro completo:", error);
                console.error("    - 🔍 Erro nome:", error.name);
                console.error("    - 🔍 Erro detalhes:", error.error);
                
                // Verificar se é erro de validação de campo
                if (error.message.includes('Value is not an array of record IDs')) {
                    console.error("    - 🚨 ERRO DE VALIDAÇÃO DE CAMPO DETECTADO!");
                    console.error("    - 🔍 Analisando campos enviados...");
                    console.error("    - 📊 Fields definido?", fields !== null);
                    
                    // Mostrar todos os campos que foram enviados
                    if (fields !== null) {
                        console.error("    - 📋 Total de campos:", Object.keys(fields).length);
                        for (const [fieldName, fieldValue] of Object.entries(fields)) {
                            const isArray = Array.isArray(fieldValue);
                            const valueType = isArray ? 'array' : typeof fieldValue;
                            console.error(`      - ${fieldName}: ${valueType} = ${JSON.stringify(fieldValue)}`);
                            
                            // Identificar possíveis culpados
                            if (isArray && fieldValue.length > 0 && typeof fieldValue[0] === 'string') {
                                console.error(`        ⚠️  SUSPEITO: ${fieldName} é array de strings - pode ser campo de relationship`);
                            }
                        }
                    } else {
                        console.error("    - ❌ Fields não está definido - erro aconteceu antes da criação dos campos");
                    }
                }
                
                console.log("  - 🔍 Stack trace:", error.stack);
                
                results.push({ index: i, status: 'error', error: error.message, imgUrl: imageUrl || 'URL_NOT_AVAILABLE' });
            }
        }
        
        // Log final específico para suggestion feed
        if (isSuggestionFeedApproval) {
            const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
            const errorCount = results.filter(r => r.status === 'error').length;
            
            console.log("📊 [upsetImagesInAirtable] Resumo final suggestion feed:");
            console.log("  - ✅ Sucessos:", successCount);
            console.log("  - ❌ Erros:", errorCount);
            console.log("  - 📋 Total processado:", results.length);
        } else {
            const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
            const errorCount = results.filter(r => r.status === 'error').length;
            
            console.log("📊 [upsetImagesInAirtable] Resumo final:");
            console.log("  - ✅ Sucessos:", successCount);
            console.log("  - ❌ Erros:", errorCount);
            console.log("  - 📋 Total processado:", results.length);
        }
    }
    
    console.log("🏁 [upsetImagesInAirtable] Função finalizada, retornando resultados");
    return results;
}


export async function syncImoveisWithAirtable(imoveisFromXml) {
    const tableName = "Tamiles";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Tamiles"

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
            client: client,
            code: codigo,
            type: tipo,
            finally: finalidade,
            value: Number(valor),
            neighbordhood: bairro,
            city: cidade,
            state: uf,
            util_area: Number(area_util),
            rooms: Number(quartos),
            suits: Number(suites),
            bathrooms: Number(banheiros),
            parking_spaces: Number(vagas),
            description: descricao,
            photos: fotos ? fotos : "",
            url_photos: fotos ? fotos : "",
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