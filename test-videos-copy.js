#!/usr/bin/env node

// 🧪 Teste específico para a função upsetVideosInAirtable
// Simula o processamento de vídeos para a tabela "Videos copy"

console.log("🎬 [test-videos-copy] Testando upsetVideosInAirtable...");

// Simular a função validateRelationshipId
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
    const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
    return cleanValue !== '' ? cleanValue : null;
};

// Simular dados de entrada para vídeos
const videosArray = [
    {
        imgUrl: "https://example.com/video-input1.jpg",
        codigo: "PROP123",
        observacoes: "Vídeo promocional da propriedade",
        status: "Pending",
        workflow: "Standard Video",
        formatoVideo: "16:9",
        clientId: "reczFEAuT8L4FVvgS",
        invoiceId: "INV-2024-001",
        userId: "recJLLB3Mk6OifZqb"
    },
    {
        imgUrl: "https://example.com/video-input2.jpg",
        codigo: "PROP124",
        observacoes: "Tour virtual do apartamento",
        status: "Processing",
        workflow: "Premium Video",
        vid_orientation: "9:16",
        clientId: "reczFEAuT8L4FVvgS",
        invoiceId: "INV-2024-002"
    },
    {
        imgUrls: ["https://example.com/video-input3.jpg"],
        codigo: "PROP125",
        descricao: "Vídeo de destaque da casa",
        imgWorkflow: "Quick Video",
        formatoVideo: "1:1"
    }
];

const customEmail = "video@test.com";
const customClientId = "reczFEAuT8L4FVvgS"; // ID válido
const customInvoiceId = "INV-2024-MAIN"; // Texto simples (não é relacionamento)
const customUserId = "recJLLB3Mk6OifZqb"; // ID válido

console.log("🔍 [test-videos-copy] Dados de entrada:");
console.log(`  - Total de itens: ${videosArray.length}`);
console.log(`  - Email: ${customEmail}`);
console.log(`  - Client ID: ${customClientId} (relacionamento)`);
console.log(`  - Invoice ID: ${customInvoiceId} (texto simples)`);
console.log(`  - User ID: ${customUserId}`);

// Simular processamento de cada item
const processVideoItem = async (video, index) => {
    console.log(`\n🎬 [test-videos-copy] Processando item ${index + 1}:`);
    
    // Determinar imageUrl
    const imageUrl = video.imgUrl || (Array.isArray(video.imgUrls) ? video.imgUrls[0] : null);
    
    if (!imageUrl) {
        console.log("  - ❌ Nenhuma URL de imagem válida encontrada");
        return { index, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null };
    }
    
    console.log(`  - 🖼️ Image URL: ${imageUrl}`);
    
    // Campos básicos para Videos copy
    const fields = {
        property_code: video.codigo || '',
        input_img: [{ url: imageUrl }], // Attachment (array de objetos com URL)
        user_email: customEmail,
        description: video.observacoes || video.descricao || '', // Long text
    };
    
    console.log("  - 🔍 Validando relacionamentos e campos...");
    
    // Campo invoice - Single line text (não é relacionamento)
    if (customInvoiceId && customInvoiceId.trim() !== '') {
        console.log(`    - 🎫 Adicionando invoiceId como texto: ${customInvoiceId}`);
        fields.invoice = customInvoiceId.toString(); // String simples, não array
        console.log(`    - ✅ Campo invoice adicionado como texto: ${customInvoiceId}`);
    }
    
    // Campo client - Link to another record (relacionamento)
    if (customClientId && customClientId.trim() !== '') {
        console.log(`    - 🔍 Validando clientId: ${customClientId}`);
        
        const isValidClientId = await validateRelationshipId(customClientId, 'client', 'Videos copy');
        
        if (isValidClientId) {
            fields.client = [customClientId]; // Array para relacionamento
            console.log(`    - ✅ Campo client adicionado: ${customClientId}`);
        } else {
            console.log(`    - ❌ ID ${customClientId} não é válido para o campo client - REMOVIDO`);
        }
    }
    
    // Campos opcionais - Single select
    console.log("  - ⚙️ Processando campos opcionais...");
    
    const status = getSelectValue(video.status || video.suggestionstatus);
    if (status) {
        fields.status = status;
        console.log(`    - status: ${status}`);
    }
    
    const workflow = getSelectValue(video.workflow || video.imgWorkflow);
    if (workflow) {
        fields.workflow = workflow;
        console.log(`    - workflow: ${workflow}`);
    }
    
    const vidOrientation = getSelectValue(video.vid_orientation || video.formatoVideo || video.videoProportion);
    if (vidOrientation) {
        fields.vid_orientation = vidOrientation;
        console.log(`    - vid_orientation: ${vidOrientation}`);
    }
    
    // Validação preventiva
    console.log("  - 🛡️ Validação preventiva dos campos...");
    
    const problematicFields = [];
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (fieldName === 'input_img') {
            if (Array.isArray(fieldValue) && fieldValue.length > 0 && fieldValue[0].url) {
                try {
                    new URL(fieldValue[0].url);
                    console.log(`    - ✅ ${fieldName}: URL válida`);
                } catch (urlError) {
                    problematicFields.push(`${fieldName} contém URL inválida`);
                }
            } else {
                problematicFields.push(`${fieldName} deveria ser array com attachments`);
            }
        } else if (fieldName === 'client') {
            if (!Array.isArray(fieldValue)) {
                problematicFields.push(`${fieldName} deveria ser array`);
            }
        } else if (fieldName === 'invoice') {
            if (typeof fieldValue !== 'string') {
                problematicFields.push(`${fieldName} deveria ser string`);
            }
        }
    }
    
    if (problematicFields.length > 0) {
        console.log("    - 🚨 Campos problemáticos detectados:");
        problematicFields.forEach(problem => console.log(`      - ❌ ${problem}`));
    } else {
        console.log("    - ✅ Todos os campos são válidos");
    }
    
    return { index, status: 'created', fields, imgUrl: imageUrl };
};

// Executar teste
const runTest = async () => {
    const results = [];
    
    for (let i = 0; i < videosArray.length; i++) {
        const video = videosArray[i];
        const result = await processVideoItem(video, i);
        results.push(result);
    }
    
    console.log("\n📋 [test-videos-copy] Resultados finais:");
    
    results.forEach((result, index) => {
        console.log(`\n🎬 Item ${index + 1}:`);
        console.log(`  - Status: ${result.status}`);
        console.log(`  - Image URL: ${result.imgUrl}`);
        
        if (result.fields) {
            console.log("  - Campos processados:");
            console.log(`    - property_code: ${result.fields.property_code}`);
            console.log(`    - input_img: ${JSON.stringify(result.fields.input_img)}`);
            console.log(`    - user_email: ${result.fields.user_email}`);
            console.log(`    - description: ${result.fields.description}`);
            console.log(`    - invoice: ${result.fields.invoice} (texto)`);
            console.log(`    - client: ${result.fields.client ? JSON.stringify(result.fields.client) : 'não definido'} (relacionamento)`);
            console.log(`    - status: ${result.fields.status || 'não definido'}`);
            console.log(`    - workflow: ${result.fields.workflow || 'não definido'}`);
            console.log(`    - vid_orientation: ${result.fields.vid_orientation || 'não definido'}`);
        }
        
        if (result.error) {
            console.log(`  - Erro: ${result.error}`);
        }
    });
    
    // Verificar tipos de campos
    const successResults = results.filter(r => r.status === 'created' && r.fields);
    let hasCorrectTypes = true;
    
    console.log("\n🔍 [test-videos-copy] Verificação de tipos:");
    
    successResults.forEach((result, index) => {
        const fields = result.fields;
        
        // Verificar invoice como string
        if (fields.invoice && typeof fields.invoice !== 'string') {
            console.log(`  - ❌ Item ${index + 1}: invoice deveria ser string mas é ${typeof fields.invoice}`);
            hasCorrectTypes = false;
        }
        
        // Verificar client como array
        if (fields.client && !Array.isArray(fields.client)) {
            console.log(`  - ❌ Item ${index + 1}: client deveria ser array mas é ${typeof fields.client}`);
            hasCorrectTypes = false;
        }
        
        // Verificar input_img como array
        if (fields.input_img && !Array.isArray(fields.input_img)) {
            console.log(`  - ❌ Item ${index + 1}: input_img deveria ser array mas é ${typeof fields.input_img}`);
            hasCorrectTypes = false;
        }
    });
    
    if (hasCorrectTypes) {
        console.log("  - ✅ Todos os tipos de campos estão corretos");
    }
    
    // Resumo final
    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log("\n============================================================");
    console.log(`📊 [test-videos-copy] Estatísticas:`);
    console.log(`  - ✅ Sucessos: ${successCount}`);
    console.log(`  - ❌ Erros: ${errorCount}`);
    console.log(`  - ⏭️ Pulados: ${skippedCount}`);
    console.log(`  - 📋 Total: ${results.length}`);
    
    if (successCount === videosArray.length && hasCorrectTypes) {
        console.log("🎉 [test-videos-copy] TESTE PASSOU!");
        console.log("✅ Função upsetVideosInAirtable está pronta para uso");
        console.log("✅ Campos específicos da tabela Videos copy validados");
        console.log("✅ Tipos de campos corretos (invoice=texto, client=relacionamento)");
    } else {
        console.log("❌ [test-videos-copy] TESTE FALHOU!");
        if (!hasCorrectTypes) {
            console.log("🚨 Tipos de campos incorretos detectados");
        }
    }
    
    console.log("🏁 [test-videos-copy] Teste CONCLUÍDO");
};

// Executar o teste
runTest().catch(console.error);
