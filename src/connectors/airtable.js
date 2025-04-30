import Airtable from "airtable";
import dotenv from "dotenv";
dotenv.config();
console.log('Airtable API Key:', process.env.AIRTABLE_API_KEY ? 'Found' : 'Not found');
console.log('Airtable Base ID:', process.env.AIRTABLE_BASE_ID ? 'Found' : 'Not found');


if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY is not defined in environment variables');
}

if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_BASE_ID is not defined in environment variables');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export async function getDataFromAirtable() {
    const records = await base(process.env.AIRTABLE_TABLE_NAME).select({}).firstPage();

    const formattedData = records.map(record => ({
        id: record.id,
        fields: record.fields,
    }));

    return formattedData;
}
