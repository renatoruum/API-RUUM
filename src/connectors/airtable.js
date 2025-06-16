import dotenv from "dotenv";
import Airtable from 'airtable';
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
    const tableName = "ACasa7";
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "A Casa 7";

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

export async function upsetImagesInAirtable(imagesArray) {
    const tableName = "Images";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const email = "galia@acasa7.com.br"
    const clientId = "recZqOfnZXwqbbVZY";
    const invoiceId = "reclDmUiMoLKzRe8k"
    const userId = "recMjeDtB77Ijl9BL"

    for (const img of imagesArray) {
        console.log("Processing image:", img);
        // Busca registro existente pelo campo 'imgUrl'
        const records = await baseInstance(tableName)
            .select({
                filterByFormula: `{IMAGE_CRM} = '${img.imgUrl}'`,
                maxRecords: 1,
            })
            .firstPage();

        const fields = {
            Invoices: [invoiceId],
            Clients: [clientId],
            ["Property's URL"]: img.propertyUrl || '',
            Decluttering: img.retirar,
            ["Image Workflow"]: "SmartStage",
            ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
            ["Room Type"]: img.tipo,
            ["Owner Email"]: email,
            //["Data de submissão"]: new Date().toISOString(),
            Users: [userId],
            ["Client Internal Code"]: img.codigo || '',
        };

        if (records.length > 0) {
            // Atualiza registro existente
            await baseInstance(tableName).update(records[0].id, fields);
        } else {
            // Cria novo registro
            await baseInstance(tableName).create(fields);
        }
    }
}

export async function syncImoveisWithAirtable(imoveisFromXml) {
    const tableName = "ACasa7";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    // Busca todos os imóveis atuais do Airtable
    const airtableRecords = await baseInstance(tableName).select({}).all();
    const airtableMap = {};
    airtableRecords.forEach(record => {
        airtableMap[record.fields.Codigo] = { id: record.id, fields: record.fields };
    });

    // Cria um Set com todos os códigos do XML
    const xmlCodigos = new Set(imoveisFromXml.map(imovel => imovel.codigo || imovel.CodigoImovel));

    // Adiciona/Atualiza imóveis do XML
    for (const imovel of imoveisFromXml) {
        const codigo = imovel.CodigoImovel || imovel.codigo;
        const fields = {
            // ...monte os campos igual já faz...
            Codigo: codigo,
            // ...outros campos...
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
