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

export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable
) {
    const tableName = imageTable || "Images";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    // Usar valores personalizados do frontend se fornecidos, ou valores padrão caso contrário
    const email = customEmail || ""
    const clientId = customClientId || ""
    const invoiceId = customInvoiceId || ""
    const userId = customUserId || ""

    const results = [];

    // Função para validar campos de single select - só inclui se tiver valor válido
    const getSelectValue = (value) => {
        if (!value) return null;
        // Remove aspas duplas extras e espaços em branco
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };

    // Lógica especial para "Image suggestions" - criar apenas um registro com todas as imagens
    if (tableName === "Image suggestions") {
        console.log(`Processing ${imagesArray.length} images as single record for Image suggestions`);
        
        try {
            // Busca registro existente (temporariamente desabilitado para sempre criar novos registros)
            const records = [];

            // Coletar todas as imagens para o campo INPUT IMAGE
            const allImages = [];
            
            // Verificar se há imgUrls (array) ou imgUrl (string único)
            if (imagesArray[0].imgUrls && Array.isArray(imagesArray[0].imgUrls)) {
                // Usar todas as URLs do array imgUrls
                imagesArray[0].imgUrls.forEach(url => {
                    if (url) allImages.push({ url: url });
                });
            } else {
                // Fallback para o formato antigo (imgUrl por item)
                imagesArray
                    .filter(img => img.imgUrl) // Só inclui imagens com URL válida
                    .forEach(img => allImages.push({ url: img.imgUrl }));
            }

            // Usar dados da primeira imagem como base para outros campos
            const firstImg = imagesArray[0];
            const encodedUrl = firstImg.imagensReferencia ? encodeURI(firstImg.imagensReferencia) : '';

            const fields = {
                Clients: [clientId],
                ["Property's URL"]: firstImg.propertyUrl || '',
                ["INPUT IMAGE"]: allImages, // Todas as imagens em um campo
                ["Owner Email"]: email,
                ["Client Internal Code"]: firstImg.codigo || '',
                Message: firstImg.observacoes || '',
            };

            // Adicionar outros campos baseados na primeira imagem
            if (encodedUrl) {
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
            }

            const imageWorkflow = getSelectValue(firstImg.imgWorkflow);
            if (imageWorkflow) {
                let workflowValue = imageWorkflow;
                if (imageWorkflow === "Atelier") {
                    workflowValue = "Boutique workflow";
                } else if (imageWorkflow === "SmartStage") {
                    workflowValue = "Imob workflow";
                }
                fields["Image_workflow"] = workflowValue;
            }

            const suggestionstatus = getSelectValue(firstImg.suggestionstatus);
            if (suggestionstatus) {
                fields["Suggestion Status"] = suggestionstatus;
            }

            // Adicionar campos específicos que estavam faltando
            let destaques = firstImg.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                // Remove valores vazios e normaliza para string
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }

            const endereco = getSelectValue(firstImg.endereco);
            if (endereco) {
                fields["Endereço"] = endereco;
            }

            const preco = getSelectValue(firstImg.preco);
            if (preco) {
                // Converte para número, removendo possíveis caracteres não numéricos (exceto ponto e vírgula)
                const precoNumber = Number(
                    preco
                        .toString()
                        .replace(/\./g, '') // remove pontos de milhar
                        .replace(',', '.')  // troca vírgula decimal por ponto
                        .replace(/[^\d.-]/g, '') // remove outros caracteres
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }

            // Adicionar outros campos que podem estar presentes
            const roomType = getSelectValue(firstImg.tipo);
            if (roomType) {
                fields["Room Type"] = roomType;
            }

            const finish = getSelectValue(firstImg.acabamento);
            if (finish) {
                fields["Finish"] = finish;
            }

            const estilo = getSelectValue(firstImg.estilo);
            if (estilo) {
                try {
                    // Buscar o record ID na tabela de estilos
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();

                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id]; // Passar como array com o Record ID
                    }
                } catch (styleError) {
                    console.error(`Erro ao buscar estilo '${estilo}':`, styleError.message);
                }
            }

            console.log(`Fields being sent for Image suggestions (${allImages.length} images):`, JSON.stringify(fields, null, 2));

            // Criar registro único
            const result = await baseInstance(tableName).create(fields);
            console.log(`✅ Image suggestions record created successfully with ${allImages.length} images:`, result.id);
            results.push({ 
                index: 0, 
                status: 'created', 
                id: result.id, 
                imageCount: allImages.length,
                imgUrls: imagesArray[0].imgUrls || imagesArray.map(img => img.imgUrl)
            });

        } catch (error) {
            console.error(`❌ Error processing Image suggestions record:`, error.message);
            results.push({ 
                index: 0, 
                status: 'error', 
                error: error.message, 
                imageCount: imagesArray.length,
                imgUrls: imagesArray[0].imgUrls || imagesArray.map(img => img.imgUrl)
            });
        }

        console.log(`Processing complete for Image suggestions. Results:`, results);
        return results;
    }

    // Lógica original para outras tabelas
    for (let i = 0; i < imagesArray.length; i++) {
        const img = imagesArray[i];

        try {
            console.log(`Processing image ${i + 1}/${imagesArray.length}:`, img.imgUrl);

            // Busca registro existente pelo campo 'Client Internal Code' e 'INPUT IMAGE'
            // Temporariamente desabilitado para sempre criar novos registros
            const records = [];

            const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';

            // Função para validar campos de single select - só inclui se tiver valor válido
            const getSelectValue = (value) => {
                if (!value) return null;
                // Remove aspas duplas extras e espaços em branco
                const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
                return cleanValue !== '' ? cleanValue : null;
            };

            const fields = {
                Clients: [clientId],
                ["Property's URL"]: img.propertyUrl || '',
                ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
                ["Owner Email"]: email,
                ["Client Internal Code"]: img.codigo || '',
                Message: img.observacoes || '',     // Long text
                //["ADDITIONAL ATTACHMENTS"]: encodedUrl ? [{ url: encodedUrl }] : [],
            };

            if (tableName === "Images") {
                fields.Invoices = [invoiceId];
                fields.Users = [userId];
            }

            // Adiciona campos de select apenas se tiverem valores válidos


            if (encodedUrl) {
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }]
            }

            const decluttering = getSelectValue(img.retirar);
            if (decluttering) {
                fields["Decluttering"] = decluttering;
            }

            const roomType = getSelectValue(img.tipo);
            if (roomType) {
                fields["Room Type"] = roomType;
            }

            const videoTemplate = getSelectValue(img.modeloVideo);
            if (videoTemplate) {
                fields["Video Template"] = videoTemplate;
            }

            const videoProportion = getSelectValue(img.formatoVideo);
            if (videoProportion) {
                fields["Video Proportion"] = videoProportion;
            }

            const finish = getSelectValue(img.acabamento);
            if (finish) {
                fields["Finish"] = finish;
            }

            const estilo = getSelectValue(img.estilo);
            if (estilo) {
                try {
                    // Buscar o record ID na tabela de estilos
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`, // Assumindo que o campo se chama "Name"
                        maxRecords: 1
                    }).firstPage();

                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id]; // Passar como array com o Record ID
                    }
                } catch (styleError) {
                    console.error(`Erro ao buscar estilo '${estilo}':`, styleError.message);
                }
            }

            const imageWorkflow = getSelectValue(img.imgWorkflow);
            if (imageWorkflow) {
                const workflowFieldName = tableName === "Image suggestions" ? "Image_workflow" : "Image Workflow";

                // Mapear valores específicos para a tabela "Image suggestions"
                let workflowValue = imageWorkflow;
                if (tableName === "Image suggestions") {
                    if (imageWorkflow === "Atelier") {
                        workflowValue = "Boutique workflow";
                    } else if (imageWorkflow === "SmartStage") {
                        workflowValue = "Imob workflow";
                    }
                }

                fields[workflowFieldName] = workflowValue;
            }

            const suggestionstatus = getSelectValue(img.suggestionstatus);
            if (suggestionstatus) {
                fields["Suggestion Status"] = suggestionstatus;
            }

            let destaques = img.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                // Remove valores vazios e normaliza para string
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }

            const endereco = getSelectValue(img.endereco);
            if (endereco) {
                fields["Endereço"] = endereco;
            }

            const preco = getSelectValue(img.preco);
            if (preco) {
                // Converte para número, removendo possíveis caracteres não numéricos (exceto ponto e vírgula)
                const precoNumber = Number(
                    preco
                        .toString()
                        .replace(/\./g, '') // remove pontos de milhar
                        .replace(',', '.')  // troca vírgula decimal por ponto
                        .replace(/[^\d.-]/g, '') // remove outros caracteres
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }

            console.log(`Fields being sent for image ${i + 1}:`, JSON.stringify(fields, null, 2));

            let result;
            if (records.length > 0) {
                // Atualiza registro existente
                result = await baseInstance(tableName).update(records[0].id, fields);
                console.log(`✅ Image ${i + 1} updated successfully:`, records[0].id);
                results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: img.imgUrl });
            } else {
                // Cria novo registro
                result = await baseInstance(tableName).create(fields);
                console.log(`✅ Image ${i + 1} created successfully:`, result.id);
                results.push({ index: i, status: 'created', id: result.id, imgUrl: img.imgUrl });
            }
        } catch (error) {
            console.error(`❌ Error processing image ${i + 1}:`, error.message);
            results.push({ index: i, status: 'error', error: error.message, imgUrl: img.imgUrl });
            // Continua processando as outras imagens mesmo se uma falhar
        }
    }

    console.log(`Processing complete. Results:`, results);
    return results;
}

export async function syncImoveisWithAirtable(imoveisFromXml) {
    const tableName = "ACasa7";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Acasa7 Inteligência Imobiliária";

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
            quartos, suites, banheiros, vagas, descricao, fotos = "";

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

            // Tratar fotos do SIGA (dentro do objeto Media)
            if (isSiga && imovel.Media && imovel.Media.Item) {
                console.log("Processando fotos do SIGA para imóvel:", codigo);

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
                        console.error("Erro ao processar fotos do SIGA:", e);
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
                console.error("Erro ao processar fotos do SIGA:", e);
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

        if (!airtableMap[codigo]) {
            // Adicionar novo imóvel
            await baseInstance(tableName).create(fields);
        } else {
            // Atualizar apenas se houver diferença
            const currentFields = airtableMap[codigo].fields;
            const hasDiff = Object.keys(fields).some(key => fields[key] != currentFields[key]);
            if (hasDiff) {
                await baseInstance(tableName).update(airtableMap[codigo].id, fields);
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