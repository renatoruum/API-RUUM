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

export async function upsertImovelInAirtable(imovel) {
    const tableName = "Imobiliaria X";
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Imobiliaria X";

    const records = await base(tableName)
        .select({
            filterByFormula: `{codigo} = '${imovel.codigo}'`,
            maxRecords: 1,
        })
        .firstPage();

    const fields = {
        Client: client,
        Codigo: imovel.codigo,
        Tipo: imovel.tipo,
        Finalidade: imovel.finalidade,
        Valor: Number(imovel.valor),
        Bairro: imovel.bairro,
        Cidade: imovel.cidade,
        UF: imovel.uf,
        Area_util: Number(imovel.area_util),
        Quartos: Number(imovel.quartos),
        Suites: Number(imovel.suites),
        Banheiros: Number(imovel.banheiros),
        Vagas: Number(imovel.vagas),
        Descricao: imovel.descricao,
        Fotos_URLs: Array.isArray(imovel.fotos?.foto)
            ? imovel.fotos.foto.join('\n')
            : imovel.fotos?.foto || '',
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

export async function upsertImagesInAirtable(imagesArray) {
    const tableName = "Images API";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const client = "Imobiliaria X";

    for (const img of imagesArray) {
        console.log("Processing image:", img);
        // Busca registro existente pelo campo 'imgUrl'
        const records = await baseInstance(tableName)
            .select({
                filterByFormula: `{Image} = '${img.imgUrl}'`,
                maxRecords: 1,
            })
            .firstPage();


        const fields = {
            Image: img.imgUrl,
            Tipo: img.tipo,
            Estilo: img.estilo,
            Acabamento: img.acabamento,
            Observacoes: img.observacoes,
            Retirar: img.retirar,
            //Codigo: img.codigo,
            Client: client,
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