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
    console.log("🔄 [transferApprovedSuggestionToImages] Iniciando transferência de sugestão aprovada");
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const results = [];
    
    // Extrair URLs das imagens - de inputImages OU outputImages (para SmartBanana que só tem output)
    const imageUrls = suggestionData.inputImages || suggestionData.outputImages || [];
    
    console.log("📊 [transferApprovedSuggestionToImages] URLs encontradas:", imageUrls.length);
    
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.log("❌ [transferApprovedSuggestionToImages] Nenhuma URL válida encontrada");
        return [{ status: 'error', error: 'Nenhuma URL de imagem válida', imgUrl: null }];
    }
    
    // 🔍 Função para validar se um ID pertence à tabela correta para evitar erros de relacionamento
    const validateRelationshipId = async (recordId, fieldName, tableName) => {
        try {
            // IDs conhecidos que causam problemas específicos
            const knownProblematicIds = {
                'recVQHMKjiU0zz8RD': {
                    field: 'invoice',
                    issue: 'Pertence à tabela errada para o campo invoice',
                    solution: 'Remover do campo invoice'
                }
            };
            
            if (knownProblematicIds[recordId]) {
                const problem = knownProblematicIds[recordId];
                if (problem.field === fieldName) {
                    console.log(`🚨 [validateRelationshipId] ID problemático detectado: ${recordId}`);
                    console.log(`  - Campo: ${fieldName}`);
                    console.log(`  - Problema: ${problem.issue}`);
                    console.log(`  - Solução: ${problem.solution}`);
                    return false; // ID não é válido para este campo
                }
            }
            
            return true; // ID parece válido
            
        } catch (error) {
            console.log(`⚠️ [validateRelationshipId] Erro ao validar ${recordId}: ${error.message}`);
            return false; // Em caso de erro, considerar inválido por segurança
        }
    };
    
    // Função para validar campos
    const getSelectValue = (value) => {
        if (!value) return null;
        // Remove TODAS as aspas duplas (não só início/fim)
        const cleanValue = value.toString().replace(/"/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // Criar UM registro individual para CADA imagem
    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        console.log(`🖼️ [transferApprovedSuggestionToImages] Processando imagem ${i + 1}/${imageUrls.length}: ${imageUrl.substring(0, 50)}...`);
        
        try {
             
            const fields = {
                property_code: suggestionData.codigo || '',
                request_log: suggestionData.observacoes || '', // Campo correto: request_log (não request_text)
            };
            
            // Se tem inputImages, salva em input_img. Se só tem outputImages, salva em output_img
            if (suggestionData.inputImages && Array.isArray(suggestionData.inputImages)) {
                fields.input_img = [{ url: imageUrl }];
            }
            
            // Adicionar output_img se disponível (para SmartBanana e workflows de processamento)
            if (suggestionData.outputImages && Array.isArray(suggestionData.outputImages) && suggestionData.outputImages.length > 0) {
                // Para cada input_img, usar o output_img correspondente
                const outputUrl = suggestionData.outputImages[i] || suggestionData.outputImages[0];
                fields.output_img = [{ url: outputUrl }];
                console.log("🎨 [transferApprovedSuggestionToImages] Adicionando output_img:", outputUrl.substring(0, 50) + '...');
            }
            
            // Adicionar property_URL se disponível  
            if (suggestionData.propertyUrl) {
                fields.property_URL = suggestionData.propertyUrl;
            }
            
            console.log("🔗 [transferApprovedSuggestionToImages] Adicionando relacionamentos...");
            
            // Relacionamentos - usando nomes corretos dos campos para tabela Images - TODOS como arrays
            console.log("🔍 [DEBUG] Validando IDs de relacionamento antes de adicionar...");
            
            if (customClientId && customClientId.trim() !== '') {
                console.log(`🔍 [DEBUG] Validando customClientId: ${customClientId}`);
                console.log(`  - Formato válido: ${customClientId.startsWith('rec') && customClientId.length >= 17}`);
                console.log(`  - Será usado no campo 'client' da tabela 'Images'`);
                
                // 🔍 Validar se o ID pertence à tabela correta
                const isValidClientId = await validateRelationshipId(customClientId, 'client', 'Images');
                
                if (isValidClientId) {
                    fields.client = [customClientId]; // Array para relacionamento
                    console.log("  - 🔗 client:", customClientId);
                } else {
                    console.log(`  - ❌ ID ${customClientId} não é válido para o campo client - REMOVIDO`);
                }
            }
            
            if (customInvoiceId && customInvoiceId.trim() !== '') {
                console.log(`🔍 [DEBUG] Validando customInvoiceId: ${customInvoiceId}`);
                console.log(`  - Formato válido: ${customInvoiceId.startsWith('rec') && customInvoiceId.length >= 17}`);
                console.log(`  - Será usado no campo 'invoice' da tabela 'Images'`);
                
                // 🔍 Validar se o ID pertence à tabela correta
                const isValidInvoiceId = await validateRelationshipId(customInvoiceId, 'invoice', 'Images');
                
                if (isValidInvoiceId) {
                    fields.invoice = [customInvoiceId]; // Array para relacionamento invoice
                    console.log("  - 🎫 invoice:", customInvoiceId);
                } else {
                    console.log(`  - ❌ ID ${customInvoiceId} não é válido para o campo invoice - REMOVIDO`);
                }
            }
            
            if (customUserId && customUserId.trim() !== '') {
                console.log(`🔍 [DEBUG] Validando customUserId: ${customUserId}`);
                console.log(`  - Formato válido: ${customUserId.startsWith('rec') && customUserId.length >= 17}`);
                console.log(`  - Será usado no campo 'user' da tabela 'Images'`);
                
                // 🔍 Validar se o ID pertence à tabela correta
                const isValidUserId = await validateRelationshipId(customUserId, 'user', 'Images');
                
                if (isValidUserId) {
                    fields.user = [customUserId]; // Array para relacionamento
                    console.log("  - 👤 user:", customUserId);
                } else {
                    console.log(`  - ❌ ID ${customUserId} não é válido para o campo user - REMOVIDO`);
                }
            }
            
            // Style ref se houver imagensReferencia
            if (suggestionData.imagensReferencia) {
                const encodedUrl = encodeURI(suggestionData.imagensReferencia);
                fields["style_ref"] = [{ url: encodedUrl }];
            }
            
            // Campos opcionais - usando nomes corretos para tabela Images
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
            console.log("🔍 [DEBUG] imgWorkflow original:", suggestionData.imgWorkflow);
            console.log("🔍 [DEBUG] imgWorkflow após getSelectValue:", imageWorkflow);
            console.log("🔍 [DEBUG] imgWorkflow tipo:", typeof imageWorkflow);
            console.log("🔍 [DEBUG] imgWorkflow JSON:", JSON.stringify(imageWorkflow));
            if (imageWorkflow) {
                // Limpeza extra: remover QUALQUER tipo de aspas (simples, duplas, escapadas)
                const cleanedWorkflow = imageWorkflow.replace(/["'\\]/g, '').trim();
                console.log("🔍 [DEBUG] workflow limpo final:", cleanedWorkflow);
                fields["workflow"] = cleanedWorkflow;
            }
            
            const suggestionstatus = getSelectValue(suggestionData.suggestionstatus);
            if (suggestionstatus) fields["status"] = suggestionstatus; // Campo correto: status (não Suggestion Status)
            
            // Estilo (relacionamento) - nome correto do campo
            const estilo = getSelectValue(suggestionData.estilo);
            if (estilo) {
                console.log("🎨 [transferApprovedSuggestionToImages] Processando estilo:", estilo);
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        const styleId = styleRecords[0].id;
                        console.log(`🔍 [DEBUG] Validando styleId: ${styleId}`);
                        console.log(`  - Formato válido: ${styleId.startsWith('rec') && styleId.length >= 17}`);
                        console.log(`  - Será usado no campo 'style' da tabela 'Images'`);
                        fields["style"] = [styleId]; // Array para relacionamento
                        console.log("  - ✅ Estilo encontrado, ID:", styleId);
                    } else {
                        console.log("  - Estilo não encontrado na tabela Styles");
                    }
                } catch (styleError) {
                    console.log("  - Erro ao buscar estilo:", styleError.message);
                }
            }
            
            // Observação: Campos como Destaques, Endereço e Preço não existem na tabela Images
            // Estas informações podem ser incluídas no request_log se necessário
            let destaques = suggestionData.destaques;
            let endereco = getSelectValue(suggestionData.endereco);
            let preco = getSelectValue(suggestionData.preco);
            
            if (destaques || endereco || preco) {
                let additionalInfo = [];
                
                if (Array.isArray(destaques) && destaques.length > 0) {
                    additionalInfo.push(`Destaques: ${destaques.filter(d => typeof d === "string" && d.trim() !== "").join(", ")}`);
                } else if (typeof destaques === "string" && destaques.trim() !== "") {
                    additionalInfo.push(`Destaques: ${destaques.trim()}`);
                }
                
                if (endereco) {
                    additionalInfo.push(`Endereço: ${endereco}`);
                }
                
                if (preco) {
                    const precoNumber = Number(
                        preco.toString()
                            .replace(/\./g, '')
                            .replace(',', '.')
                            .replace(/[^\d.-]/g, '')
                    );
                    if (!isNaN(precoNumber)) {
                        additionalInfo.push(`Preço: R$ ${precoNumber.toLocaleString('pt-BR')}`);
                    }
                }
                
                if (additionalInfo.length > 0) {
                    const currentLog = fields.request_log || '';
                    fields.request_log = currentLog + (currentLog ? '\n\n' : '') + additionalInfo.join('\n');
                }
            }
            
            // VALIDAÇÃO PREVENTIVA FINAL DOS CAMPOS
            console.log("🛡️ [transferApprovedSuggestionToImages] Validação preventiva dos campos...");
            const problematicFields = [];
            
            for (const [fieldName, fieldValue] of Object.entries(fields)) {
                // Verificar campo input_img especificamente
                if (fieldName === 'input_img') {
                    console.log(`  - ${fieldName}: ${Array.isArray(fieldValue) ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                        const attachment = fieldValue[0];
                        if (attachment && attachment.url) {
                            console.log(`    - URL attachment: ${attachment.url}`);
                            
                            // Verificar se a URL é válida
                            try {
                                new URL(attachment.url);
                                console.log(`    - ✅ URL válida`);
                            } catch (urlError) {
                                console.error(`    - ❌ URL inválida: ${urlError.message}`);
                                problematicFields.push(`${fieldName} contém URL inválida: ${attachment.url}`);
                            }
                        } else {
                            console.error(`    - ❌ Attachment sem URL válida`);
                            problematicFields.push(`${fieldName} contém attachment sem URL`);
                        }
                    } else {
                        console.error(`    - ❌ input_img não é um array válido`);
                        problematicFields.push(`${fieldName} deveria ser array com attachments`);
                    }
                }
                
                // Verificar campos que são sempre relacionamentos (arrays)
                else if (['client', 'user', 'style'].includes(fieldName)) {
                    const isArray = Array.isArray(fieldValue);
                    console.log(`  - ${fieldName}: ${isArray ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (!isArray) {
                        problematicFields.push(`${fieldName} deveria ser array mas é ${typeof fieldValue}`);
                    }
                }
                
                // Verificar campos que são arrays para relacionamento
                else if (['invoice'].includes(fieldName)) {
                    const isArray = Array.isArray(fieldValue);
                    console.log(`  - ${fieldName}: ${isArray ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (!isArray) {
                        problematicFields.push(`${fieldName} deveria ser array mas é ${typeof fieldValue}`);
                    }
                }
            }
            
            if (problematicFields.length > 0) {
                console.error("🚨 [transferApprovedSuggestionToImages] CAMPOS PROBLEMÁTICOS DETECTADOS:");
                problematicFields.forEach(problem => console.error(`  - ❌ ${problem}`));
            }
            
            // 🔍 DEBUG: Log detalhado dos relacionamentos antes de criar
            console.log("🔍 [DEBUG] Resumo dos relacionamentos que serão enviados:");
            const relationshipFields = ['client', 'invoice', 'user', 'style'];
            for (const fieldName of relationshipFields) {
                if (fields[fieldName]) {
                    const fieldValue = fields[fieldName];
                    console.log(`  - ${fieldName}: ${JSON.stringify(fieldValue)}`);
                    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                        console.log(`    - Primeiro ID: ${fieldValue[0]}`);
                        console.log(`    - Tabela destino: Images`);
                        if (fieldValue[0] === 'recVQHMKjiU0zz8RD') {
                            console.log(`    - 🚨 ATENÇÃO: Este é o ID que causou o erro! Campo: ${fieldName}`);
                        }
                    }
                }
            }
            
            
            // Criar registro individual na tabela Images
            console.log("💾 [transferApprovedSuggestionToImages] Criando registro...");
            console.log("📋 [transferApprovedSuggestionToImages] Campos que serão enviados:", Object.keys(fields));
            
            const result = await baseInstance("Images").create(fields);
            
            console.log(`✅ [transferApprovedSuggestionToImages] Registro criado: ${result.id}`);
            
            results.push({ 
                index: i, 
                status: 'created', 
                id: result.id, 
                imgUrl: imageUrl 
            });
            
        } catch (error) {
            console.log(`❌ [transferApprovedSuggestionToImages] Erro na imagem ${i + 1}: ${error.message}`);
            console.error("🔍 [transferApprovedSuggestionToImages] Erro completo:", error);
            console.error("🔍 [transferApprovedSuggestionToImages] Erro nome:", error.name);
            console.error("🔍 [transferApprovedSuggestionToImages] Erro detalhes:", error.error);
            
            // 🔍 DEBUG: Análise específica do erro ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE
            if (error.message.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || error.error === 'ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') {
                console.error("🚨 [transferApprovedSuggestionToImages] ERRO DE RELACIONAMENTO DETECTADO!");
                console.error("🔍 [transferApprovedSuggestionToImages] Este erro indica que um ID está sendo usado no campo errado");
                console.error("📊 [transferApprovedSuggestionToImages] Analisando campos de relacionamento enviados...");
                
                console.error("📋 [transferApprovedSuggestionToImages] Campos de relacionamento encontrados:");
                const relationshipFields = ['client', 'invoice', 'user', 'style'];
                
                for (const fieldName of relationshipFields) {
                    if (fields[fieldName]) {
                        const fieldValue = fields[fieldName];
                        console.error(`  - ${fieldName}: ${JSON.stringify(fieldValue)}`);
                        
                        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                            const recordId = fieldValue[0];
                            console.error(`    - Record ID: ${recordId}`);
                            console.error(`    - Formato válido: ${recordId.startsWith('rec') && recordId.length >= 17}`);
                            
                            // Identificar o ID específico que está causando o erro
                            if (error.message.includes(recordId)) {
                                console.error(`    - 🎯 ENCONTRADO! Este é o ID que está causando o erro!`);
                                console.error(`    - Campo problemático: ${fieldName}`);
                                console.error(`    - ID problemático: ${recordId}`);
                                console.error(`    - Tabela destino: Images`);
                            }
                        }
                    }
                }
            }
            
            // Verificar se é erro de validação de campo
            if (error.message.includes('Value is not an array of record IDs')) {
                console.error("🚨 [transferApprovedSuggestionToImages] ERRO DE VALIDAÇÃO DE CAMPO DETECTADO!");
                console.error("🔍 [transferApprovedSuggestionToImages] Analisando campos enviados...");
                console.error("📊 [transferApprovedSuggestionToImages] Total de campos:", Object.keys(fields).length);
                
                for (const [fieldName, fieldValue] of Object.entries(fields)) {
                    const isArray = Array.isArray(fieldValue);
                    const valueType = isArray ? 'array' : typeof fieldValue;
                    console.error(`  - ${fieldName}: ${valueType} = ${JSON.stringify(fieldValue)}`);
                    
                    // Identificar possíveis culpados
                    if (isArray && fieldValue.length > 0 && typeof fieldValue[0] === 'string') {
                        console.error(`    ⚠️  SUSPEITO: ${fieldName} é array de strings - pode ser campo de relationship`);
                    }x
                }
            }
            
            console.log("🔍 [transferApprovedSuggestionToImages] Stack trace:", error.stack);
            
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
    
    // 🎯 Determinar tabela automaticamente baseado no workflow
    let tableName = imageTable || "Images";
    
    // Se o primeiro item tem workflow MagicMotion, usar tabela Videos
    if (imagesArray && imagesArray.length > 0) {
        const firstItem = imagesArray[0];
        const workflow = firstItem.imgWorkflow || firstItem.workflow;
        
        // Se workflow for MagicMotion, automaticamente usar tabela Videos
        if (workflow && workflow.toString().replace(/["'\\]/g, '').trim() === 'MagicMotion') {
            tableName = "Videos";
            console.log("🎬 [upsetImagesInAirtable] Workflow MagicMotion detectado - usando tabela Videos");
        } else if (!imageTable) {
            // Se não especificou tabela e não é MagicMotion, usar Images
            tableName = "Images";
            console.log("📷 [upsetImagesInAirtable] Usando tabela padrão: Images");
        }
    }
    
    console.log("📋 [upsetImagesInAirtable] Tabela final selecionada:", tableName);
    
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
    const email = customEmail || imagesArray[0]?.userEmail || null;
    const clientId = customClientId || (imagesArray[0]?.clientId || null);
    const invoiceId = customInvoiceId || (imagesArray[0]?.invoiceId || null);
    const userId = customUserId || (imagesArray[0]?.userId || null);
    
    const results = [];
    
    // Função para validar campos de single select
    const getSelectValue = (value) => {
        if (!value) return null;
        // Remove TODAS as aspas duplas (não só início/fim)
        const cleanValue = value.toString().replace(/"/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // 🔍 Função para validar se um ID pertence à tabela correta para evitar erros de relacionamento
    const validateRelationshipId = async (recordId, fieldName, tableName) => {
        try {
            // IDs conhecidos que causam problemas específicos
            const knownProblematicIds = {
                'recVQHMKjiU0zz8RD': {
                    field: 'invoice',
                    issue: 'Pertence à tabela errada para o campo invoice',
                    solution: 'Remover do campo invoice'
                }
            };
            
            if (knownProblematicIds[recordId]) {
                const problem = knownProblematicIds[recordId];
                if (problem.field === fieldName) {
                    console.log(`🚨 [validateRelationshipId] ID problemático detectado: ${recordId}`);
                    console.log(`  - Campo: ${fieldName}`);
                    console.log(`  - Problema: ${problem.issue}`);
                    console.log(`  - Solução: ${problem.solution}`);
                    return false; // ID não é válido para este campo
                }
            }
            
            return true; // ID parece válido
            
        } catch (error) {
            console.log(`⚠️ [validateRelationshipId] Erro ao validar ${recordId}: ${error.message}`);
            return false; // Em caso de erro, considerar inválido por segurança
        }
    };
    
    // 🔍 Função MELHORADA para buscar Record ID do cliente usando o campo Formula 'id'
    const getClientRecordIdByFormulaId = async (clientFormulaId) => {
        try {
            console.log(`🔍 [getClientRecordIdByFormulaId] Buscando cliente com id (formula): ${clientFormulaId}`);
            
            // 🎯 NOVA ABORDAGEM: Buscar TODOS os registros e filtrar manualmente
            // Porque filtros do Airtable podem não funcionar bem com campos Formula
            console.log(`🔍 [getClientRecordIdByFormulaId] Buscando todos os clientes para comparação manual...`);
            
            const allClients = await baseInstance("Clients").select({
                fields: ['id', 'name'] // Apenas campos necessários
            }).all();
            
            console.log(`📊 [getClientRecordIdByFormulaId] Total de clientes encontrados: ${allClients.length}`);
            
            // Buscar manualmente o cliente com o id (Formula) correspondente
            const matchingClient = allClients.find(record => {
                const recordFormulaId = record.fields.id;
                const matches = recordFormulaId === clientFormulaId;
                if (matches) {
                    console.log(`  - ✅ MATCH encontrado: "${recordFormulaId}" === "${clientFormulaId}"`);
                }
                return matches;
            });
            
            if (matchingClient) {
                const recordId = matchingClient.id; // Record ID REAL do Airtable
                const clientName = matchingClient.fields.name || 'N/A';
                
                console.log(`✅ [getClientRecordIdByFormulaId] Cliente encontrado!`);
                console.log(`  - Campo 'id' (Formula): ${clientFormulaId}`);
                console.log(`  - Record ID (Airtable): ${recordId}`);
                console.log(`  - Nome: ${clientName}`);
                console.log(`  - 🎯 CONFIRMAÇÃO: Record ID ≠ Formula ID? ${recordId !== clientFormulaId ? 'SIM ✅' : 'NÃO ⚠️'}`);
                
                if (recordId === clientFormulaId) {
                    console.warn(`⚠️ [getClientRecordIdByFormulaId] ATENÇÃO: Record ID é igual ao Formula ID!`);
                    console.warn(`  - Isso pode indicar que a fórmula retorna o próprio Record ID`);
                    console.warn(`  - Ou que este ID pertence à tabela errada`);
                }
                
                return {
                    success: true,
                    recordId: recordId,
                    clientName: clientName,
                    formulaId: clientFormulaId
                };
            } else {
                console.error(`❌ [getClientRecordIdByFormulaId] Cliente não encontrado com id: ${clientFormulaId}`);
                console.error(`  - Nenhum registro tem campo 'id' (Formula) = "${clientFormulaId}"`);
                console.error(`  - Total de clientes verificados: ${allClients.length}`);
                
                // 🔍 DEBUG: Mostrar os primeiros 5 valores de 'id' para comparação
                console.error(`📊 [getClientRecordIdByFormulaId] Primeiros 5 valores de 'id' encontrados:`);
                allClients.slice(0, 5).forEach((record, index) => {
                    console.error(`  ${index + 1}. id="${record.fields.id}" | Record ID="${record.id}" | Nome="${record.fields.name}"`);
                });
                
                return {
                    success: false,
                    recordId: null,
                    error: `Cliente com id="${clientFormulaId}" não encontrado na tabela Clients`
                };
            }
            
        } catch (error) {
            console.error(`❌ [getClientRecordIdByFormulaId] Erro ao buscar cliente: ${error.message}`);
            console.error(`  - Erro completo:`, error);
            return {
                success: false,
                recordId: null,
                error: error.message
            };
        }
    };
    
    // 🔍 Função melhorada para validar e diagnosticar se um ID pertence à tabela Clients
    const validateClientId = async (recordId) => {
        try {
            console.log(`🔍 [validateClientId] Iniciando validação do ID: ${recordId}`);
            
            if (!recordId || !recordId.startsWith('rec') || recordId.length < 17) {
                console.log(`⚠️ [validateClientId] ID inválido: ${recordId}`);
                console.log(`  - Começa com 'rec': ${recordId?.startsWith('rec')}`);
                console.log(`  - Comprimento >= 17: ${recordId?.length >= 17} (atual: ${recordId?.length})`);
                return false;
            }
            
            // 🎯 DIAGNÓSTICO: Tentar buscar em TODAS as tabelas para descobrir onde o ID realmente está
            console.log(`🔍 [validateClientId] Verificando em quais tabelas o ID ${recordId} existe...`);
            
            const tablesToCheck = ['Clients', 'Users', 'Invoices', 'Styles'];
            const foundInTables = [];
            
            for (const tableName of tablesToCheck) {
                try {
                    const record = await baseInstance(tableName).find(recordId);
                    if (record) {
                        foundInTables.push({
                            table: tableName,
                            recordId: record.id,
                            fields: Object.keys(record.fields),
                            name: record.fields.Name || record.fields['Client Name'] || record.fields['User Name'] || 'N/A'
                        });
                        console.log(`✅ [validateClientId] ID encontrado na tabela: ${tableName}`);
                        console.log(`  - Nome: ${record.fields.Name || record.fields['Client Name'] || 'N/A'}`);
                    }
                } catch (error) {
                    // Ignorar - ID não pertence a esta tabela
                    console.log(`  - Não encontrado em: ${tableName}`);
                }
            }
            
            // 📊 RELATÓRIO DO DIAGNÓSTICO
            console.log(`📊 [validateClientId] DIAGNÓSTICO COMPLETO DO ID ${recordId}:`);
            console.log(`  - Encontrado em ${foundInTables.length} tabela(s)`);
            
            if (foundInTables.length === 0) {
                console.error(`❌ [validateClientId] ID ${recordId} NÃO encontrado em nenhuma tabela!`);
                console.error(`  - Isso pode indicar que:`);
                console.error(`    1. O ID não existe mais no Airtable`);
                console.error(`    2. O ID está em outra tabela não verificada`);
                console.error(`    3. O valor é do campo Formula 'id' ao invés do Record ID`);
                return false;
            }
            
            if (foundInTables.length > 1) {
                console.warn(`⚠️ [validateClientId] ID ${recordId} encontrado em MÚLTIPLAS tabelas:`);
                foundInTables.forEach(info => {
                    console.warn(`  - ${info.table}: "${info.name}"`);
                });
            }
            
            // Verificar se está na tabela Clients
            const foundInClients = foundInTables.find(info => info.table === 'Clients');
            
            if (foundInClients) {
                console.log(`✅ [validateClientId] ID ${recordId} pertence à tabela Clients`);
                console.log(`  - Nome do cliente: ${foundInClients.name}`);
                console.log(`  - Campos disponíveis: ${foundInClients.fields.join(', ')}`);
                return true;
            } else {
                console.error(`❌ [validateClientId] ID ${recordId} NÃO pertence à tabela Clients`);
                console.error(`  - Tabelas onde foi encontrado: ${foundInTables.map(i => i.table).join(', ')}`);
                console.error(`  - Este ID deve ser removido do campo 'Clients' para evitar erro`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ [validateClientId] Erro ao validar ID ${recordId}:`, error.message);
            console.error(`  - Erro completo:`, error);
            return false;
        }
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
                ["Client Internal Code"]: baseImg.codigo || '',
                Message: baseImg.observacoes || '',
            };
            
            // Adicionar Owner Email apenas se houver um email válido
            if (email && email.trim() !== '') {
                fields["Owner Email"] = email;
            }
            
            console.log("🔨 [upsetImagesInAirtable] Campos básicos criados:", {
                propertyUrl: fields["Property's URL"],
                imageCount: fields["INPUT IMAGE"].length,
                email: fields["Owner Email"],
                code: fields["Client Internal Code"],
                messageLength: fields.Message?.length || 0
            });
            
            // Relacionamentos condicionais
            if (clientId && clientId.trim() !== '') {
                console.log(`🔍 [upsetImagesInAirtable] Processando clientId para Image suggestions: ${clientId}`);
                console.log(`  - Este valor pode ser do campo Formula 'id', não o Record ID`);
                console.log(`  - Buscando Record ID real correspondente...`);
                
                // 🎯 BUSCAR O RECORD ID REAL USANDO O CAMPO FORMULA 'id'
                const clientLookup = await getClientRecordIdByFormulaId(clientId);
                
                if (clientLookup.success && clientLookup.recordId) {
                    fields.client = [clientLookup.recordId];
                    console.log("🔗 [upsetImagesInAirtable] Adicionado relacionamento client:");
                    console.log(`  - Campo Formula 'id' fornecido: ${clientId}`);
                    console.log(`  - Record ID usado: ${clientLookup.recordId}`);
                    console.log(`  - Nome do cliente: ${clientLookup.clientName}`);
                } else {
                    console.log(`❌ [upsetImagesInAirtable] Cliente não encontrado - campo client NÃO será preenchido`);
                    console.log(`  - Campo 'id' buscado: ${clientId}`);
                    console.log(`  - Erro: ${clientLookup.error}`);
                    console.log(`💡 [upsetImagesInAirtable] Verifique se o cliente com id="${clientId}" existe na tabela Clients`);
                }
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
            
            // Image Workflow
            const imageWorkflow = getSelectValue(baseImg.imgWorkflow);
            if (imageWorkflow) {
                // Mapear valores: Atelier -> Boutique workflow, outros -> Imob workflow
                const workflowValue = imageWorkflow === 'Atelier' ? 'Boutique workflow' : 'Imob workflow';
                fields["Image_workflow"] = workflowValue;
                console.log("  - Image_workflow:", workflowValue, `(original: ${imageWorkflow})`);
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
                };
                
                // 🎬 Usar campo correto baseado na tabela de destino
                if (tableName === "Videos") {
                    // Tabela Videos usa campo 'description'
                    fields.description = img.observacoes || '';
                    console.log("    - 🎬 Usando campo 'description' para tabela Videos");
                } else {
                    // Tabela Images usa campo 'request_log'
                    fields.request_log = img.observacoes || '';
                    console.log("    - 📷 Usando campo 'request_log' para tabela Images");
                }
                
                // Adicionar property_URL se disponível  
                if (img.propertyUrl) {
                    fields.property_URL = img.propertyUrl;
                }
                
                // Metadados de suggestion feed podem ser incluídos no campo apropriado
                if (isSuggestionFeedApproval) {
                    if (tableName === "Videos") {
                        const currentLog = fields.description || '';
                        fields.description = currentLog + (currentLog ? '\n' : '') + `[Aprovado via suggestion feed em ${new Date().toISOString()}]`;
                    } else {
                        const currentLog = fields.request_log || '';
                        fields.request_log = currentLog + (currentLog ? '\n' : '') + `[Aprovado via suggestion feed em ${new Date().toISOString()}]`;
                    }
                }

                 // Usar a tabela especificada no parâmetro, não forçar "Images"
                const actualTableName = tableName;
                
                // Relacionamentos condicionais - TODOS como arrays para Images
                console.log("🔍 [DEBUG] Validando IDs de relacionamento antes de adicionar...");
                
                if (clientId && clientId.trim() !== '') {
                    console.log(`🔍 [DEBUG] Validando clientId: ${clientId}`);
                    console.log(`  - Formato válido: ${clientId.startsWith('rec') && clientId.length >= 17}`);
                    console.log(`  - Será usado no campo 'client' da tabela '${actualTableName}'`);
                    
                    // 🔍 Validar se o ID pertence à tabela correta
                    const isValidClientId = await validateRelationshipId(clientId, 'client', actualTableName);
                    
                    if (isValidClientId) {
                        fields.client = [clientId]; // Array para relacionamento
                        console.log("  - 🔗 Campo client adicionado como array:", [clientId]);
                    } else {
                        console.log(`  - ❌ ID ${clientId} não é válido para o campo client - REMOVIDO`);
                    }
                }
                
                // Aplicar campos específicos baseados na tabela de destino
                console.log("  - 📋 Tabela destino:", actualTableName);
                console.log("  - 🎫 invoiceId:", invoiceId);
                console.log("  - 👤 userId:", userId);
                
                // Para tabela Images/Videos - TODOS os relacionamentos são arrays
                if (invoiceId && invoiceId.trim() !== '') {
                    console.log(`🔍 [DEBUG] Validando invoiceId: ${invoiceId}`);
                    console.log(`  - Formato válido: ${invoiceId.startsWith('rec') && invoiceId.length >= 17}`);
                    
                    // 🎬 Usar campo correto baseado na tabela
                    const invoiceFieldName = actualTableName === "Videos" ? "Invoices" : "invoice";
                    console.log(`  - Será usado no campo '${invoiceFieldName}' da tabela '${actualTableName}'`);
                    
                    // Validar se o ID pertence à tabela correta
                    const isValidInvoiceId = await validateRelationshipId(invoiceId, invoiceFieldName, actualTableName);
                    
                    if (isValidInvoiceId) {
                        fields[invoiceFieldName] = [invoiceId]; // Array para relacionamento
                        console.log(`    - 🎫 Campo ${invoiceFieldName} adicionado como array:`, [invoiceId]);
                    } else {
                        console.log(`    - ❌ ID ${invoiceId} não é válido para o campo ${invoiceFieldName} - REMOVIDO`);
                    }
                }
                if (userId && userId.trim() !== '') {
                    console.log(`🔍 [DEBUG] Validando userId: ${userId}`);
                    console.log(`  - Formato válido: ${userId.startsWith('rec') && userId.length >= 17}`);
                    console.log(`  - Será usado no campo 'user' da tabela '${actualTableName}'`);
                    
                    // 🔍 Validar se o ID pertence à tabela correta
                    const isValidUserId = await validateRelationshipId(userId, 'user', actualTableName);
                    
                    if (isValidUserId) {
                        fields.user = [userId]; // Array para relacionamento user
                        console.log("    - 👤 Campo user adicionado como array:", [userId]);
                    } else {
                        console.log(`    - ❌ ID ${userId} não é válido para o campo user - REMOVIDO`);
                    }
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
                
                // 🎬 Para tabela Videos, usar mm_type; para Images, usar vid_type
                const videoTemplate = getSelectValue(img.modeloVideo);
                if (videoTemplate) {
                    if (tableName === "Videos") {
                        fields["mm_type"] = videoTemplate;
                        console.log("    - mm_type:", videoTemplate);
                    } else {
                        fields["vid_type"] = videoTemplate;
                        console.log("    - vid_type:", videoTemplate);
                    }
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
                            const styleId = styleRecords[0].id;
                            console.log(`🔍 [DEBUG] Validando styleId: ${styleId}`);
                            console.log(`  - Formato válido: ${styleId.startsWith('rec') && styleId.length >= 17}`);
                            console.log(`  - Será usado no campo 'style' da tabela '${actualTableName}'`);
                            fields["style"] = [styleId]; // Array para relacionamento
                            console.log("    - ✅ Estilo encontrado, ID:", styleId);
                        } else {
                            console.log("    - Estilo não encontrado na tabela Styles");
                        }
                    } catch (styleError) {
                        console.log("    - Erro ao buscar estilo:", styleError.message);
                    }
                }
                
                const imageWorkflow = getSelectValue(img.imgWorkflow);
                if (imageWorkflow) {
                    // Limpeza extra: remover QUALQUER tipo de aspas (simples, duplas, escapadas)
                    const cleanedWorkflow = imageWorkflow.replace(/["'\\]/g, '').trim();
                    fields["workflow"] = cleanedWorkflow;
                    console.log("    - workflow original:", img.imgWorkflow);
                    console.log("    - workflow limpo:", cleanedWorkflow);
                }
                
                const suggestionstatus = getSelectValue(img.suggestionstatus);
                if (suggestionstatus) {
                    fields["status"] = suggestionstatus; // Campo correto: status
                    console.log("    - status:", suggestionstatus);
                }
                
                // Observação: Campos como Destaques, Endereço e Preço não existem na tabela Images
                // Estas informações podem ser incluídas no request_log se necessário
                
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
                    
                    // Verificar se é um campo que deveria ser array mas não é (relacionamentos)
                    if (['client', 'invoice', 'user'].includes(fieldName) && !Array.isArray(fieldValue)) {
                        console.log(`      ⚠️  ATENÇÃO: Campo ${fieldName} deveria ser array (relacionamento) mas é ${typeof fieldValue}`);
                    }
                    
                    // Verificar campos de relacionamento obrigatórios como arrays vazios
                    if (['client', 'invoice', 'user', 'style'].includes(fieldName) && Array.isArray(fieldValue) && fieldValue.length === 0) {
                        console.log(`      ⚠️  Campo relacionamento vazio: ${fieldName}`);
                    }
                }
                
                console.log("  - 🔍 Campos detalhados:", JSON.stringify(fields, null, 2));
                
                // 🔍 DEBUG: Log detalhado dos relacionamentos antes de criar/atualizar
                console.log("🔍 [DEBUG] Resumo dos relacionamentos que serão enviados:");
                const relationshipFields = ['client', 'invoice', 'user', 'style'];
                for (const fieldName of relationshipFields) {
                    if (fields[fieldName]) {
                        const fieldValue = fields[fieldName];
                        console.log(`  - ${fieldName}: ${JSON.stringify(fieldValue)}`);
                        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                            console.log(`    - Primeiro ID: ${fieldValue[0]}`);
                            console.log(`    - Tabela destino: ${actualTableName}`);
                            if (fieldValue[0] === 'recVQHMKjiU0zz8RD') {
                                console.log(`    - 🚨 ATENÇÃO: Este é o ID que causou o erro! Campo: ${fieldName}`);
                            }
                        }
                    }
                }
                
                if (records.length > 0) {
                    console.log("🔍 [DEBUG] Tentando ATUALIZAR registro...");
                    result = await baseInstance(actualTableName).update(records[0].id, fields);
                    console.log("  - ✅ Registro atualizado:", records[0].id);
                    results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: imageUrl });
                } else {
                    console.log("🔍 [DEBUG] Tentando CRIAR novo registro...");
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
                
                // 🔍 DEBUG: Análise específica do erro ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE
                if (error.message.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || error.error === 'ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') {
                    console.error("    - 🚨 ERRO DE RELACIONAMENTO DETECTADO!");
                    console.error("    - 🔍 Este erro indica que um ID está sendo usado no campo errado");
                    console.error("    - 📊 Analisando campos de relacionamento enviados...");
                    
                    if (fields !== null) {
                        console.error("    - 📋 Campos de relacionamento encontrados:");
                        const relationshipFields = ['client', 'invoice', 'user', 'style'];
                        
                        for (const fieldName of relationshipFields) {
                            if (fields[fieldName]) {
                                const fieldValue = fields[fieldName];
                                console.error(`      - ${fieldName}: ${JSON.stringify(fieldValue)}`);
                                
                                if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                                    const recordId = fieldValue[0];
                                    console.error(`        - Record ID: ${recordId}`);
                                    console.error(`        - Formato válido: ${recordId.startsWith('rec') && recordId.length >= 17}`);
                                    
                                    // Identificar o ID específico que está causando o erro
                                    if (error.message.includes(recordId)) {
                                        console.error(`        - 🎯 ENCONTRADO! Este é o ID que está causando o erro!`);
                                        console.error(`        - Campo problemático: ${fieldName}`);
                                        console.error(`        - ID problemático: ${recordId}`);
                                        console.error(`        - Tabela destino: ${tableName}`);
                                    }
                                }
                            }
                        }
                    }
                }
                
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


/**
 * Salva imagem processada pelo FLUX Kontext na tabela Images do Airtable
 * @param {Object} processedImageData - Dados da imagem processada
 * @param {string} processedImageData.property_code - Código do imóvel
 * @param {string} processedImageData.input_image_url - URL da imagem de entrada (Virtual Staging)
 * @param {string} processedImageData.output_image_url - URL da imagem processada pelo FLUX
 * @param {string} processedImageData.property_url - URL da propriedade (opcional)
 * @param {string} processedImageData.room_type - Tipo de ambiente
 * @param {string} processedImageData.style - Estilo aplicado
 * @param {string} processedImageData.workflow - Workflow (padrão: "VS+FLUX")
 * @param {string} processedImageData.client_id - ID do cliente (relacionamento)
 * @param {string} processedImageData.user_id - ID do usuário (relacionamento)
 * @param {string} processedImageData.invoice_id - ID da fatura (opcional)
 * @param {string} processedImageData.request_log - Log/observações do processamento
 * @returns {Promise<Object>} Resultado da operação com ID do registro criado
 */
export async function saveProcessedFluxImage(processedImageData) {
    console.log("💾 [saveProcessedFluxImage] Iniciando salvamento de imagem processada pelo FLUX...");
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const tableName = "Images";
    
    try {
        // Validação dos campos obrigatórios
        if (!processedImageData.output_image_url) {
            throw new Error("Campo obrigatório ausente: output_image_url");
        }
        
        // Baixar a imagem do FLUX e fazer upload como attachment
        console.log("📥 [saveProcessedFluxImage] Preparando attachment da imagem processada...");
        
        // Campos básicos
        const fields = {
            property_code: processedImageData.property_code || '',
            workflow: processedImageData.workflow || 'SmartStage', // Workflow específico para pipeline VS+FLUX (imagens)
            status: 'Finalizado', // Status indicando que já foi processado
            request_log: processedImageData.request_log || `Processado via pipeline FLUX Kontext em ${new Date().toISOString()}`,
        };
        
        // Campo output_img como Attachment - imagem processada pelo FLUX
        fields.output_img = [{ url: processedImageData.output_image_url }];

        console.log("  - output_img (FLUX):", processedImageData.output_image_url.substring(0, 50) + "...");
        
        // Campo input_img (opcional) - imagem do Virtual Staging
        if (processedImageData.input_image_url) {
            fields.input_img = [{ url: processedImageData.input_image_url }];
            console.log("  - input_img (VS):", processedImageData.input_image_url.substring(0, 50) + "...");
        }
        
        // Property URL
        if (processedImageData.property_url) {
            fields.property_URL = processedImageData.property_url;
            console.log("  - property_URL:", processedImageData.property_url);
        }
        
        // Room type - Mapear para valores do Airtable
        if (processedImageData.room_type) {
            // Mapeamento de room_type para valores aceitos no Airtable
            const roomTypeMapping = {
                'living': 'Sala de estar/jantar',
                'bedroom': 'Quarto',
                'kitchen': 'Cozinha',
                'bathroom': 'Banheiro',
                'dining': 'Sala de jantar',
                'office': 'Escritório',
                'outdoor': 'Área externa',
                'laundry': 'Lavanderia'
            };
            
            const mappedRoomType = roomTypeMapping[processedImageData.room_type] || processedImageData.room_type;
            fields.room_type = mappedRoomType;
            console.log("  - room_type:", processedImageData.room_type, "→", mappedRoomType);
        }
        
        // Relacionamentos
        console.log("🔗 [saveProcessedFluxImage] Adicionando relacionamentos...");
        
        // Client (obrigatório para relacionamento)
        if (processedImageData.client_id && processedImageData.client_id.trim() !== '') {
            fields.client = [processedImageData.client_id]; // Array para relacionamento
            console.log("  - client:", processedImageData.client_id);
        }
        
        // User (obrigatório para relacionamento)
        if (processedImageData.user_id && processedImageData.user_id.trim() !== '') {
            fields.user = [processedImageData.user_id]; // Array para relacionamento
            console.log("  - user:", processedImageData.user_id);
        }
        
        // Invoice (opcional)
        if (processedImageData.invoice_id && processedImageData.invoice_id.trim() !== '') {
            fields.invoice = [processedImageData.invoice_id]; // Array para relacionamento
            console.log("  - invoice:", processedImageData.invoice_id);
        }
        
        // Style (buscar ID do estilo se fornecido como string)
        if (processedImageData.style) {
            console.log("🎨 [saveProcessedFluxImage] Processando estilo:", processedImageData.style);
            try {
                const styleRecords = await baseInstance("Styles").select({
                    filterByFormula: `{Style Name} = '${processedImageData.style}'`,
                    maxRecords: 1
                }).firstPage();
                
                if (styleRecords.length > 0) {
                    fields.style = [styleRecords[0].id]; // Array para relacionamento
                    console.log("  - style encontrado, ID:", styleRecords[0].id);
                } else {
                    console.log("  - style não encontrado na tabela Styles:", processedImageData.style);
                }
            } catch (styleError) {
                console.log("  - Erro ao buscar estilo:", styleError.message);
            }
        }
        
        // Campos adicionais do pipeline
        if (processedImageData.pipeline_id) {
            const currentLog = fields.request_log || '';
            fields.request_log = currentLog + `\nPipeline ID: ${processedImageData.pipeline_id}`;
        }
        
        if (processedImageData.staging_render_id) {
            const currentLog = fields.request_log || '';
            fields.request_log = currentLog + `\nVirtual Staging Render ID: ${processedImageData.staging_render_id}`;
        }
        
        if (processedImageData.flux_task_id) {
            const currentLog = fields.request_log || '';
            fields.request_log = currentLog + `\nFLUX Task ID: ${processedImageData.flux_task_id}`;
        }
        
        // Log de campos finais
        console.log("📋 [saveProcessedFluxImage] Campos que serão enviados:", Object.keys(fields));
        console.log("🔍 [saveProcessedFluxImage] Resumo:");
        console.log(`  - Total de campos: ${Object.keys(fields).length}`);
        console.log(`  - output_img presente: ${!!fields.output_img}`);
        console.log(`  - input_img presente: ${!!fields.input_img}`);
        console.log(`  - Relacionamentos: client=${!!fields.client}, user=${!!fields.user}, invoice=${!!fields.invoice}`);
        
        // Criar registro na tabela Images
        console.log("💾 [saveProcessedFluxImage] Criando registro na tabela Images...");
        const result = await baseInstance(tableName).create(fields);
        
        console.log(`✅ [saveProcessedFluxImage] Registro criado com sucesso: ${result.id}`);
        
        return {
            success: true,
            record_id: result.id,
            table: tableName,
            message: 'Imagem processada salva com sucesso no Airtable'
        };
        
    } catch (error) {
        console.error("❌ [saveProcessedFluxImage] Erro ao salvar imagem:", error.message);
        console.error("🔍 [saveProcessedFluxImage] Erro completo:", error);
        
        return {
            success: false,
            error: error.message,
            message: 'Erro ao salvar imagem processada no Airtable'
        };
    }
}

export async function syncImoveisWithAirtable(imoveisFromXml) {
    const tableName = "Tamiles";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Tamiles Bortoletto"

    console.log("🔄 [syncImoveisWithAirtable] Iniciando sincronização...");
    console.log(`📊 [syncImoveisWithAirtable] Total de imóveis do XML: ${imoveisFromXml.length}`);

    // Busca todos os imóveis atuais do Airtable
    const airtableRecords = await baseInstance(tableName).select({}).all();
    const airtableMap = {};
    const duplicatesInAirtable = []; // Para rastrear duplicatas no Airtable
    
    console.log(`📊 [syncImoveisWithAirtable] Total de registros no Airtable: ${airtableRecords.length}`);
    
    // Identificar e mapear registros existentes (incluindo duplicatas)
    airtableRecords.forEach(record => {
        const codigo = record.fields.code;  // ✅ CORRIGIDO: campo correto é 'code', não 'Codigo'
        
        if (airtableMap[codigo]) {
            // Duplicata encontrada! Marcar para remoção
            console.log(`🔍 [syncImoveisWithAirtable] Duplicata encontrada para código: ${codigo}`);
            duplicatesInAirtable.push({
                id: record.id,
                codigo: codigo,
                reason: 'Duplicata no Airtable'
            });
        } else {
            // Primeira ocorrência deste código
            airtableMap[codigo] = { id: record.id, fields: record.fields };
        }
    });

    console.log(`⚠️ [syncImoveisWithAirtable] Duplicatas encontradas no Airtable: ${duplicatesInAirtable.length}`);

    // 🧹 LIMPAR DUPLICATAS DO AIRTABLE
    if (duplicatesInAirtable.length > 0) {
        console.log("🧹 [syncImoveisWithAirtable] Removendo duplicatas do Airtable...");
        
        for (const duplicate of duplicatesInAirtable) {
            try {
                await baseInstance(tableName).destroy(duplicate.id);
                console.log(`✅ [syncImoveisWithAirtable] Duplicata removida: ${duplicate.codigo} (${duplicate.id})`);
            } catch (error) {
                console.error(`❌ [syncImoveisWithAirtable] Erro ao remover duplicata ${duplicate.codigo}:`, error.message);
            }
        }
    }

    // Criar Set com códigos únicos do XML (remover duplicatas do XML também)
    const xmlCodigosSet = new Set();
    const imoveisUnicos = [];
    const duplicatesInXml = [];

    for (const imovel of imoveisFromXml) {
        // Detectar o tipo de XML
        const isKenlo = !!imovel.CodigoImovel;
        const isSiga = !!imovel.ListingID;

        // Define código com base no tipo de XML
        const codigo = isKenlo ? imovel.CodigoImovel :
            isSiga ? imovel.ListingID :
                imovel.codigo;

        if (xmlCodigosSet.has(codigo)) {
            // Duplicata no XML
            duplicatesInXml.push({
                codigo: codigo,
                reason: 'Duplicata no XML'
            });
        } else {
            xmlCodigosSet.add(codigo);
            imoveisUnicos.push(imovel);
        }
    }

    console.log(`⚠️ [syncImoveisWithAirtable] Duplicatas encontradas no XML: ${duplicatesInXml.length}`);
    console.log(`📊 [syncImoveisWithAirtable] Imóveis únicos do XML: ${imoveisUnicos.length}`);

    // 📝 CADASTRAR APENAS OS NOVOS (que não existem no Airtable)
    let novosAdicionados = 0;
    let jaExistentes = 0;

    for (const imovel of imoveisUnicos) {
        // Detectar o tipo de XML e definir código PRIMEIRO
        const isKenlo = !!imovel.CodigoImovel;
        const isSiga = !!imovel.ListingID;

        // Define código com base no tipo de XML
        const codigo = isKenlo ? imovel.CodigoImovel :
            isSiga ? imovel.ListingID :
                imovel.codigo;

        // ✅ VERIFICAR SE JÁ EXISTE - SE EXISTIR, PULAR
        if (airtableMap[codigo]) {
            console.log(`ℹ️ [syncImoveisWithAirtable] Imóvel já existe, pulando: ${codigo}`);
            jaExistentes++;
            continue; // PULAR - NÃO ATUALIZAR
        }

        // 🆕 CADASTRAR APENAS OS NOVOS
        console.log(`🆕 [syncImoveisWithAirtable] Adicionando novo imóvel: ${codigo}`);

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

            // Tratar fotos do SIGA
            if (isSiga && imovel.Media && imovel.Media.Item) {
                if (Array.isArray(imovel.Media.Item)) {
                    fotos = imovel.Media.Item
                        .filter(item => item.medium === "image")
                        .map(item => item._)
                        .join('\n');
                } else if (imovel.Media.Item.medium === "image") {
                    fotos = imovel.Media.Item._;
                }

                if (!fotos) {
                    try {
                        const mediaItems = Array.isArray(imovel.Media.Item) ?
                            imovel.Media.Item : [imovel.Media.Item];

                        const urls = [];
                        for (const item of mediaItems) {
                            if (typeof item === 'string') {
                                urls.push(item);
                            } else if (item._) {
                                urls.push(item._);
                            } else if (item.primary === "true" || item.medium === "image") {
                                const url = Object.values(item).find(val =>
                                    typeof val === 'string' &&
                                    val.startsWith('http')
                                );
                                if (url) urls.push(url);
                            }
                        }
                        fotos = urls.join('\n');
                    } catch (e) {
                        console.error(`⚠️ [syncImoveisWithAirtable] Erro ao processar fotos SIGA: ${e.message}`);
                    }
                }
            }
        } else if (isKenlo) {
            // Mapeamento Kenlo
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
            // Mapeamento padrão
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

        // 🆕 CRIAR NOVO REGISTRO
        try {
            const result = await baseInstance(tableName).create(fields);
            console.log(`✅ [syncImoveisWithAirtable] Novo imóvel criado: ${codigo} (${result.id})`);
            novosAdicionados++;
        } catch (error) {
            // Se erro for devido a campo desconhecido, tentar novamente sem campos problemáticos
            if (error.message && error.message.includes('Unknown field name')) {
                console.log(`⚠️ [syncImoveisWithAirtable] Campo desconhecido, tentando sem URL_Propriedade: ${codigo}`);
                
                const fieldsWithoutUrl = { ...fields };
                delete fieldsWithoutUrl.URL_Propriedade;
                
                try {
                    const result = await baseInstance(tableName).create(fieldsWithoutUrl);
                    console.log(`✅ [syncImoveisWithAirtable] Novo imóvel criado (sem URL): ${codigo} (${result.id})`);
                    novosAdicionados++;
                } catch (retryError) {
                    console.error(`❌ [syncImoveisWithAirtable] Erro ao criar imóvel ${codigo}:`, retryError.message);
                }
            } else {
                console.error(`❌ [syncImoveisWithAirtable] Erro ao criar imóvel ${codigo}:`, error.message);
            }
        }
    }

    // 🗑️ REMOVER REGISTROS QUE NÃO ESTÃO MAIS NO XML
    let registrosRemovidos = 0;
    console.log("🗑️ [syncImoveisWithAirtable] Verificando registros para remoção...");
    
    for (const codigo in airtableMap) {
        if (!xmlCodigosSet.has(codigo)) {
            try {
                await baseInstance(tableName).destroy(airtableMap[codigo].id);
                console.log(`🗑️ [syncImoveisWithAirtable] Registro removido: ${codigo} (${airtableMap[codigo].id})`);
                registrosRemovidos++;
            } catch (error) {
                console.error(`❌ [syncImoveisWithAirtable] Erro ao remover registro ${codigo}:`, error.message);
            }
        }
    }

    // 📊 RELATÓRIO FINAL
    console.log("📊 [syncImoveisWithAirtable] RELATÓRIO FINAL:");
    console.log(`  - 🆕 Novos imóveis adicionados: ${novosAdicionados}`);
    console.log(`  - ℹ️ Imóveis já existentes (pulados): ${jaExistentes}`);
    console.log(`  - 🧹 Duplicatas removidas do Airtable: ${duplicatesInAirtable.length}`);
    console.log(`  - ⚠️ Duplicatas encontradas no XML: ${duplicatesInXml.length}`);
    console.log(`  - 🗑️ Registros removidos (não estão mais no XML): ${registrosRemovidos}`);
    console.log(`  - 📋 Total de imóveis únicos processados: ${imoveisUnicos.length}`);
    
    return {
        novosAdicionados,
        jaExistentes,
        duplicatasRemovidas: duplicatesInAirtable.length,
        duplicatasXml: duplicatesInXml.length,
        registrosRemovidos,
        totalProcessados: imoveisUnicos.length
    };
}

/**
 * Salva dados de vídeo na tabela "Videos" do Airtable
 * @param {Array} videosArray - Array de objetos com dados das imagens para processamento de vídeo
 * @param {string} customEmail - Email do usuário
 * @param {string} customClientId - ID do cliente (relacionamento)
 * @param {string} customInvoiceId - ID da fatura (relacionamento)
 * @param {string} customUserId - ID do usuário (relacionamento)
 * @returns {Promise<Array>} Array com resultados da operação
 * 
 * Campos suportados:
 * - property_code: Single line text
 * - property_URL: URL
 * - status: Single select (padrão: "Enviado")
 * - workflow: Single select (padrão: "MagicMotion")
 * - client: Link to another record
 * - Invoices: Link to another record
 * - user: Link to another record
 * - description: Long text
 * - mm_type: Single select
 * - vid_orientation: Single select
 * - input_img: Attachment
 * - output_vid: Attachment
 * - user_email: Email
 */
export async function upsetVideosInAirtable(
    videosArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId
) {
    console.log("🎬 [upsetVideosInAirtable] Iniciando processamento para tabela Videos");
    console.log("📊 [upsetVideosInAirtable] Total de itens:", videosArray.length);
    
    // ✅ LOGS ESPECÍFICOS PARA DEBUG DOS PARÂMETROS RECEBIDOS
    console.log("🎬 [upsetVideosInAirtable] PARÂMETROS RECEBIDOS DEBUG:");
    console.log(`👤 [upsetVideosInAirtable] customClientId recebido: "${customClientId}" (tipo: ${typeof customClientId})`);
    console.log(`📄 [upsetVideosInAirtable] customInvoiceId recebido: "${customInvoiceId}" (tipo: ${typeof customInvoiceId})`);
    console.log(`👤 [upsetVideosInAirtable] customUserId recebido: "${customUserId}" (tipo: ${typeof customUserId})`);
    console.log(`📧 [upsetVideosInAirtable] customEmail recebido: "${customEmail}" (tipo: ${typeof customEmail})`);
    
    // Configuração do Airtable
    console.log("🔧 [upsetVideosInAirtable] Configurando Airtable...");
    console.log("  - AIRTABLE_API_KEY existe:", !!process.env.AIRTABLE_API_KEY);
    console.log("  - AIRTABLE_BASE_ID:", process.env.AIRTABLE_BASE_ID);
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const tableName = "Videos";
    
    // Valores processados - VERIFICAR SE OS VALORES ESTÃO CHEGANDO
    const email = customEmail || (videosArray[0]?.userEmail || '');
    const clientId = customClientId || (videosArray[0]?.clientId || null);
    const invoiceId = customInvoiceId || (videosArray[0]?.invoiceId || null);
    const userId = customUserId || (videosArray[0]?.userId || null);
    
    console.log("🔍 [upsetVideosInAirtable] Valores processados após fallbacks:");
    console.log(`👤 [upsetVideosInAirtable] clientId final: "${clientId}" (tipo: ${typeof clientId})`);
    console.log(`📄 [upsetVideosInAirtable] invoiceId final: "${invoiceId}" (tipo: ${typeof invoiceId})`);
    console.log(`👤 [upsetVideosInAirtable] userId final: "${userId}" (tipo: ${typeof userId})`);
    console.log(`📧 [upsetVideosInAirtable] email final: "${email}" (tipo: ${typeof email})`);
    
    const results = [];
    
    // 🔍 Função para validar se um ID pertence à tabela correta para evitar erros de relacionamento
    const validateRelationshipId = async (recordId, fieldName, tableName) => {
        try {
            // IDs conhecidos que causam problemas específicos
            const knownProblematicIds = {
                'recVQHMKjiU0zz8RD': {
                    field: 'invoice',
                    issue: 'Pertence à tabela errada para o campo invoice',
                    solution: 'Remover do campo invoice'
                }
            };
            
            if (knownProblematicIds[recordId]) {
                const problem = knownProblematicIds[recordId];
                if (problem.field === fieldName) {
                    console.log(`🚨 [validateRelationshipId] ID problemático detectado: ${recordId}`);
                    console.log(`  - Campo: ${fieldName}`);
                    console.log(`  - Problema: ${problem.issue}`);
                    console.log(`  - Solução: ${problem.solution}`);
                    return false; // ID não é válido para este campo
                }
            }
            
            return true; // ID parece válido
            
        } catch (error) {
            console.log(`⚠️ [validateRelationshipId] Erro ao validar ${recordId}: ${error.message}`);
            return false; // Em caso de erro, considerar inválido por segurança
        }
    };
    
    // Função para validar campos de single select
    const getSelectValue = (value) => {
        if (!value) return null;
        // Remove TODAS as aspas duplas (não só início/fim)
        const cleanValue = value.toString().replace(/"/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // Processar cada item do array (cada imagem = 1 registro)
    for (let i = 0; i < videosArray.length; i++) {
        const video = videosArray[i];
        
        // Definir imageUrl ANTES do try para estar disponível no catch
        const imageUrl = video.imgUrl || (Array.isArray(video.imgUrls) ? video.imgUrls[0] : null) || 
                        (Array.isArray(video["INPUT IMAGES"]) ? video["INPUT IMAGES"][0] : null);
        
        // Definir fields ANTES do try para estar disponível no catch
        let fields = null;
        
        try {
            console.log(`🎬 [upsetVideosInAirtable] Processando item ${i + 1}/${videosArray.length}`);
            
            if (!imageUrl) {
                console.log(`⚠️ [upsetVideosInAirtable] Item ${i + 1}: Nenhuma URL de imagem válida encontrada`);
                results.push({ index: i, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null });
                continue;
            }
            
            // 📋 CAMPOS BÁSICOS OBRIGATÓRIOS
            fields = {
                // Single line text
                property_code: video.codigo || video.property_code || '',
                
                // URL 
                property_URL: video.propertyUrl || video.property_URL || '',
                
                // Attachment (array de objetos com URL)
                input_img: [{ url: imageUrl }],
                
                // Email
                user_email: email,
                
                // Long text
                description: video.observacoes || video.descricao || video.description || '',
                
                // Single select - valores padrão se não fornecidos
                status: getSelectValue(video.status || video.suggestionstatus) || 'Enviado',
                workflow: getSelectValue(video.workflow || video.imgWorkflow) || 'MagicMotion'
            };
            
            console.log("🔍 [upsetVideosInAirtable] Validando relacionamentos e campos...");
            
            // 🔗 CAMPOS DE RELACIONAMENTO (Link to another record)
            console.log("🔗 [upsetVideosInAirtable] INICIANDO PROCESSAMENTO DE RELACIONAMENTOS");
            console.log(`🔗 [upsetVideosInAirtable] clientId disponível: "${clientId}" (${clientId ? 'sim' : 'não'})`);
            console.log(`🔗 [upsetVideosInAirtable] invoiceId disponível: "${invoiceId}" (${invoiceId ? 'sim' : 'não'})`);
            console.log(`🔗 [upsetVideosInAirtable] userId disponível: "${userId}" (${userId ? 'sim' : 'não'})`);
            
            // Campo client - Link to another record
            if (clientId && clientId.trim() !== '' && clientId !== 'default_client') {
                console.log(`🔍 [DEBUG] Validando clientId: ${clientId}`);
                console.log(`  - Formato válido: ${clientId.startsWith('rec') && clientId.length >= 17}`);
                console.log(`  - Será usado no campo 'client' da tabela '${tableName}'`);
                
                const isValidClientId = await validateRelationshipId(clientId, 'client', tableName);
                
                if (isValidClientId) {
                    fields.client = [clientId]; // Array para relacionamento
                    console.log("  - 🔗 Campo client adicionado:", clientId);
                } else {
                    console.log(`  - ❌ ID ${clientId} não é válido para o campo client - REMOVIDO`);
                }
            } else {
                console.log(`⚠️ [upsetVideosInAirtable] Cliente ignorado: "${clientId}" (inválido ou padrão)`);
            }
            
            // Campo Invoices - Link to another record (relacionamento)
            if (invoiceId && invoiceId.trim() !== '' && invoiceId !== 'default_invoice') {
                console.log(`🎫 [DEBUG] Validando invoiceId: ${invoiceId}`);
                console.log(`  - Formato válido: ${invoiceId.startsWith('rec') && invoiceId.length >= 17}`);
                console.log(`  - Será usado no campo 'Invoices' da tabela '${tableName}'`);
                
                const isValidInvoiceId = await validateRelationshipId(invoiceId, 'Invoices', tableName);
                
                if (isValidInvoiceId) {
                    fields.Invoices = [invoiceId]; // Array para relacionamento
                    console.log("  - 🔗 Campo Invoices adicionado:", invoiceId);
                } else {
                    console.log(`  - ❌ ID ${invoiceId} não é válido para o campo Invoices - REMOVIDO`);
                }
            } else {
                console.log(`⚠️ [upsetVideosInAirtable] Invoice ignorado: "${invoiceId}" (inválido ou padrão)`);
            }
            
            // Campo user - Link to another record
            if (userId && userId.trim() !== '' && userId !== 'default_user') {
                console.log(`👤 [DEBUG] Validando userId: ${userId}`);
                console.log(`  - Formato válido: ${userId.startsWith('rec') && userId.length >= 17}`);
                console.log(`  - Será usado no campo 'user' da tabela '${tableName}'`);
                
                const isValidUserId = await validateRelationshipId(userId, 'user', tableName);
                
                if (isValidUserId) {
                    fields.user = [userId]; // Array para relacionamento
                    console.log("  - 🔗 Campo user adicionado:", userId);
                } else {
                    console.log(`  - ❌ ID ${userId} não é válido para o campo user - REMOVIDO`);
                }
            }
            
            // 📋 CAMPOS OPCIONAIS - Single select
            console.log("⚙️ [upsetVideosInAirtable] Processando campos opcionais...");
            
            // mm_type - Single select
            const mmType = getSelectValue(video.mm_type || video.mmType || video.magicMotionType);
            if (mmType) {
                fields.mm_type = mmType;
                console.log("  - mm_type:", mmType);
            }
            
            // vid_orientation - Single select
            const vidOrientation = getSelectValue(video.vid_orientation || video.formatoVideo || video.videoProportion || video.videoOrientation);
            if (vidOrientation) {
                fields.vid_orientation = vidOrientation;
                console.log("  - vid_orientation:", vidOrientation);
            }
            
            // 📎 CAMPO DE OUTPUT (se disponível)
            // output_vid - Attachment
            const outputVideoUrl = video.output_vid || video.outputVideo || video.videoUrl;
            if (outputVideoUrl && outputVideoUrl.trim() !== '') {
                fields.output_vid = [{ url: outputVideoUrl }];
                console.log("  - output_vid adicionado:", outputVideoUrl.substring(0, 50) + "...");
            }
            
            // VALIDAÇÃO PREVENTIVA FINAL DOS CAMPOS
            console.log("🛡️ [upsetVideosInAirtable] Validação preventiva dos campos...");
            const problematicFields = [];
            
            for (const [fieldName, fieldValue] of Object.entries(fields)) {
                // Verificar campo input_img especificamente
                if (fieldName === 'input_img') {
                    console.log(`  - ${fieldName}: ${Array.isArray(fieldValue) ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                        const attachment = fieldValue[0];
                        if (attachment && attachment.url) {
                            // Verificar se a URL é válida
                            try {
                                new URL(attachment.url);
                                console.log(`    - ✅ URL válida`);
                            } catch (urlError) {
                                console.error(`    - ❌ URL inválida: ${urlError.message}`);
                                problematicFields.push(`${fieldName} contém URL inválida: ${attachment.url}`);
                            }
                        } else {
                            console.error(`    - ❌ Attachment sem URL válida`);
                            problematicFields.push(`${fieldName} contém attachment sem URL`);
                        }
                    } else {
                        console.error(`    - ❌ input_img não é um array válido`);
                        problematicFields.push(`${fieldName} deveria ser array com attachments`);
                    }
                }
                
                // Verificar campos de relacionamento (arrays)
                else if (['client', 'Invoices', 'user'].includes(fieldName)) {
                    const isArray = Array.isArray(fieldValue);
                    console.log(`  - ${fieldName}: ${isArray ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (!isArray) {
                        problematicFields.push(`${fieldName} deveria ser array mas é ${typeof fieldValue}`);
                    }
                }
                
                // Verificar campo output_vid (attachment)
                else if (fieldName === 'output_vid') {
                    console.log(`  - ${fieldName}: ${Array.isArray(fieldValue) ? 'array' : typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                    
                    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                        const attachment = fieldValue[0];
                        if (attachment && attachment.url) {
                            try {
                                new URL(attachment.url);
                                console.log(`    - ✅ URL de vídeo válida`);
                            } catch (urlError) {
                                console.error(`    - ❌ URL de vídeo inválida: ${urlError.message}`);
                                problematicFields.push(`${fieldName} contém URL inválida: ${attachment.url}`);
                            }
                        } else {
                            console.error(`    - ❌ Attachment de vídeo sem URL válida`);
                            problematicFields.push(`${fieldName} contém attachment sem URL`);
                        }
                    }
                }
                
                // Verificar outros campos
                else {
                    console.log(`  - ${fieldName}: ${typeof fieldValue} - ${JSON.stringify(fieldValue)}`);
                }
            }
            
            if (problematicFields.length > 0) {
                console.error("🚨 [upsetVideosInAirtable] CAMPOS PROBLEMÁTICOS DETECTADOS:");
                problematicFields.forEach(problem => console.error(`  - ❌ ${problem}`));
            }
            
            // 🔍 DEBUG: Log detalhado dos campos antes de criar
            console.log("🔍 [DEBUG] Resumo dos campos que serão enviados:");
            console.log(`  - property_code: ${fields.property_code}`);
            console.log(`  - property_URL: ${fields.property_URL}`);
            console.log(`  - input_img: ${JSON.stringify(fields.input_img)}`);
            console.log(`  - user_email: ${fields.user_email}`);
            console.log(`  - description: ${fields.description ? fields.description.substring(0, 50) + '...' : 'vazio'}`);
            console.log(`  - status: ${fields.status || 'não definido'}`);
            console.log(`  - workflow: ${fields.workflow || 'não definido'}`);
            console.log(`  - client: ${fields.client ? JSON.stringify(fields.client) : 'não definido'} (relacionamento)`);
            console.log(`  - Invoices: ${fields.Invoices ? JSON.stringify(fields.Invoices) : 'não definido'} (relacionamento)`);
            console.log(`  - user: ${fields.user ? JSON.stringify(fields.user) : 'não definido'} (relacionamento)`);
            console.log(`  - mm_type: ${fields.mm_type || 'não definido'}`);
            console.log(`  - vid_orientation: ${fields.vid_orientation || 'não definido'}`);
            console.log(`  - output_vid: ${fields.output_vid ? 'presente' : 'não definido'} (attachment)`);
            console.log(`  - Total de campos: ${Object.keys(fields).length}`);
            
            // Criar registro na tabela Videos copy
            console.log("💾 [upsetVideosInAirtable] Criando registro...");
            console.log("📋 [upsetVideosInAirtable] Campos que serão enviados:", Object.keys(fields));
            
            const result = await baseInstance(tableName).create(fields);
            
            console.log(`✅ [upsetVideosInAirtable] Registro criado: ${result.id}`);
            
            results.push({ 
                index: i, 
                status: 'created', 
                id: result.id, 
                imgUrl: imageUrl 
            });
            
        } catch (error) {
            console.log(`❌ [upsetVideosInAirtable] Erro ao processar item ${i + 1}: ${error.message}`);
            console.error("🔍 [upsetVideosInAirtable] Erro completo:", error);
            console.error("🔍 [upsetVideosInAirtable] Erro nome:", error.name);
            console.error("🔍 [upsetVideosInAirtable] Erro detalhes:", error.error);
            
            // 🔍 DEBUG: Análise específica do erro ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE
            if (error.message.includes('ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') || error.error === 'ROW_TABLE_DOES_NOT_MATCH_LINKED_TABLE') {
                console.error("🚨 [upsetVideosInAirtable] ERRO DE RELACIONAMENTO DETECTADO!");
                console.error("🔍 [upsetVideosInAirtable] Este erro indica que um ID está sendo usado no campo errado");
                console.error("📊 [upsetVideosInAirtable] Analisando campos de relacionamento enviados...");
                
                if (fields !== null) {
                    console.error("📋 [upsetVideosInAirtable] Campos de relacionamento encontrados:");
                    
                    // Verificar todos os campos de relacionamento
                    const relationshipFields = ['client', 'Invoices', 'user'];
                    
                    for (const fieldName of relationshipFields) {
                        if (fields[fieldName]) {
                            const fieldValue = fields[fieldName];
                            console.error(`  - ${fieldName}: ${JSON.stringify(fieldValue)}`);
                            
                            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                                const recordId = fieldValue[0];
                                console.error(`    - Record ID: ${recordId}`);
                                console.error(`    - Formato válido: ${recordId.startsWith('rec') && recordId.length >= 17}`);
                                
                                // Identificar o ID específico que está causando o erro
                                if (error.message.includes(recordId)) {
                                    console.error(`    - 🎯 ENCONTRADO! Este é o ID que está causando o erro!`);
                                    console.error(`    - Campo problemático: ${fieldName}`);
                                    console.error(`    - ID problemático: ${recordId}`);
                                    console.error(`    - Tabela destino: ${tableName}`);
                                }
                            }
                        }
                    }
                }
            }
            
            // Verificar se é erro de validação de campo
            if (error.message.includes('Value is not an array of record IDs')) {
                console.error("🚨 [upsetVideosInAirtable] ERRO DE VALIDAÇÃO DE CAMPO DETECTADO!");
                console.error("🔍 [upsetVideosInAirtable] Analisando campos enviados...");
                console.error("📊 [upsetVideosInAirtable] Fields definido?", fields !== null);
                
                // Mostrar todos os campos que foram enviados
                if (fields !== null) {
                    console.error("📋 [upsetVideosInAirtable] Total de campos:", Object.keys(fields).length);
                    for (const [fieldName, fieldValue] of Object.entries(fields)) {
                        const isArray = Array.isArray(fieldValue);
                        const valueType = isArray ? 'array' : typeof fieldValue;
                        console.error(`  - ${fieldName}: ${valueType} = ${JSON.stringify(fieldValue)}`);
                        
                        // Identificar possíveis culpados
                        if (isArray && fieldValue.length > 0 && typeof fieldValue[0] === 'string') {
                            console.error(`    ⚠️  SUSPEITO: ${fieldName} é array de strings - pode ser campo de relationship`);
                        }
                    }
                } else {
                    console.error("❌ [upsetVideosInAirtable] Fields não está definido - erro aconteceu antes da criação dos campos");
                }
            }
            
            console.log("🔍 [upsetVideosInAirtable] Stack trace:", error.stack);
            
            results.push({ 
                index: i, 
                status: 'error', 
                error: error.message, 
                imgUrl: imageUrl || 'URL_NOT_AVAILABLE' 
            });
        }
    }
    
    // Log final
    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log("📊 [upsetVideosInAirtable] Resumo final:");
    console.log("  - ✅ Sucessos:", successCount);
    console.log("  - ❌ Erros:", errorCount);
    console.log("  - ⏭️ Pulados:", skippedCount);
    console.log("  - 📋 Total processado:", results.length);
    
    console.log("🏁 [upsetVideosInAirtable] Função finalizada, retornando resultados");
    return results;
}