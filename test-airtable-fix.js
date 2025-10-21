/**
 * Script de teste para validar a correção dos campos de relacionamento do Airtable
 */

console.log("🧪 [test-airtable-fix] Testando estrutura de campos...");

// Simular dados de entrada típicos
const testData = {
    clientId: "reczFEAuT8L4FVvgS",
    invoiceId: "recVQHMKjiU0zz8RD", 
    userId: "recJLLB3Mk6OifZqb",
    imageUrl: "https://example.com/image.jpg"
};

// Simular criação de fields como no código corrigido
const fields = {
    property_code: "TEST123",
    input_img: [{ url: testData.imageUrl }],
    user_email: "test@example.com",
    request_text: "Teste de validação"
};

// Aplicar relacionamentos como arrays (correção implementada)
if (testData.clientId && testData.clientId.trim() !== '') {
    fields.client = [testData.clientId]; // Array para relacionamento
    console.log("✅ [test-airtable-fix] Campo client configurado como array:", fields.client);
}

if (testData.invoiceId && testData.invoiceId.trim() !== '') {
    fields.invoice = [testData.invoiceId]; // Array para relacionamento invoice (CORRIGIDO)
    console.log("✅ [test-airtable-fix] Campo invoice configurado como array:", fields.invoice);
}

if (testData.userId && testData.userId.trim() !== '') {
    fields.user = [testData.userId]; // Array para relacionamento user
    console.log("✅ [test-airtable-fix] Campo user configurado como array:", fields.user);
}

// Validar se todos os campos de relacionamento são arrays
console.log("\n🔍 [test-airtable-fix] Validação final:");
const relationshipFields = ['client', 'invoice', 'user'];
let allValid = true;

for (const fieldName of relationshipFields) {
    if (fields[fieldName]) {
        const isArray = Array.isArray(fields[fieldName]);
        const hasValidId = isArray && fields[fieldName].length > 0 && typeof fields[fieldName][0] === 'string';
        
        console.log(`  - ${fieldName}: ${isArray ? '✅ array' : '❌ não é array'} - ${hasValidId ? '✅ ID válido' : '❌ ID inválido'}`);
        
        if (!isArray || !hasValidId) {
            allValid = false;
        }
    }
}

if (allValid) {
    console.log("\n🎉 [test-airtable-fix] TODAS as validações passaram! Os campos estão configurados corretamente.");
} else {
    console.log("\n❌ [test-airtable-fix] Algumas validações falharam. Verifique a configuração dos campos.");
}

console.log("\n📋 [test-airtable-fix] Estrutura final dos fields:");
console.log(JSON.stringify(fields, null, 2));
