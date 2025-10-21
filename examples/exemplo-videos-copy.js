// 📋 Exemplo de uso da função upsetVideosInAirtable
// Para processar imagens destinadas à criação de vídeos na tabela "Videos copy"

import { upsetVideosInAirtable } from '../src/connectors/airtable.js';

// 🎬 EXEMPLO DE USO - Como chamar a função no seu frontend/rota

async function exemploProcessarVideos() {
    
    // 📊 1. Dados vindos do frontend (exemplo)
    const videosArray = [
        {
            imgUrl: "https://exemplo.com/imagem1.jpg",
            codigo: "IMOVEL123",
            observacoes: "Vídeo tour da sala de estar",
            status: "Pending", // Single select
            workflow: "Premium Video", // Single select  
            formatoVideo: "16:9" // Será mapeado para vid_orientation
        },
        {
            imgUrl: "https://exemplo.com/imagem2.jpg", 
            codigo: "IMOVEL123",
            descricao: "Vídeo da cozinha moderna",
            imgWorkflow: "Standard Video", // Será mapeado para workflow
            vid_orientation: "9:16" // Diretamente no campo correto
        }
    ];
    
    // 📧 2. Informações do usuário e contexto
    const email = "usuario@exemplo.com";
    const clientId = "recABC123DEF456789"; // ID do relacionamento client
    const invoiceId = "INV-2024-001"; // Texto simples (não é relacionamento)
    const userId = "recXYZ789ABC123456"; // Pode ser usado para auditoria
    
    try {
        console.log("🎬 Processando vídeos...");
        
        // 🚀 3. Chamar a função
        const results = await upsetVideosInAirtable(
            videosArray,
            email,
            clientId,
            invoiceId,
            userId
        );
        
        // 📊 4. Analisar resultados
        console.log("📋 Resultados do processamento:");
        
        const sucessos = results.filter(r => r.status === 'created').length;
        const erros = results.filter(r => r.status === 'error').length;
        const pulados = results.filter(r => r.status === 'skipped').length;
        
        console.log(`✅ Sucessos: ${sucessos}`);
        console.log(`❌ Erros: ${erros}`);
        console.log(`⏭️ Pulados: ${pulados}`);
        
        // 🔍 5. Processar cada resultado individual
        results.forEach((result, index) => {
            if (result.status === 'created') {
                console.log(`✅ Item ${index + 1}: Registro criado com ID ${result.id}`);
            } else if (result.status === 'error') {
                console.log(`❌ Item ${index + 1}: Erro - ${result.error}`);
            } else if (result.status === 'skipped') {
                console.log(`⏭️ Item ${index + 1}: Pulado - ${result.error}`);
            }
        });
        
        return {
            success: erros === 0,
            total: results.length,
            created: sucessos,
            errors: erros,
            skipped: pulados,
            details: results
        };
        
    } catch (error) {
        console.error("❌ Erro geral no processamento:", error);
        throw error;
    }
}

// 🛠️ EXEMPLO PARA ROTA EXPRESS

export async function rotaProcessarVideos(req, res) {
    try {
        const { 
            videos, // Array de objetos com imgUrl, codigo, observacoes, etc.
            email,
            clientId,
            invoiceId,
            userId 
        } = req.body;
        
        // Validações básicas
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Array 'videos' é obrigatório e deve conter pelo menos um item"
            });
        }
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: "Email válido é obrigatório"
            });
        }
        
        // Processar vídeos
        const resultado = await upsetVideosInAirtable(
            videos,
            email,
            clientId,
            invoiceId,
            userId
        );
        
        // Resposta baseada no resultado
        const temErros = resultado.some(r => r.status === 'error');
        
        res.status(temErros ? 207 : 200).json({
            success: !temErros,
            message: temErros ? 'Processamento concluído com alguns erros' : 'Todos os vídeos processados com sucesso',
            data: {
                total: resultado.length,
                created: resultado.filter(r => r.status === 'created').length,
                errors: resultado.filter(r => r.status === 'error').length,
                skipped: resultado.filter(r => r.status === 'skipped').length,
                details: resultado
            }
        });
        
    } catch (error) {
        console.error("❌ Erro na rota de processamento de vídeos:", error);
        res.status(500).json({
            success: false,
            error: "Erro interno do servidor",
            details: error.message
        });
    }
}

// 📚 DOCUMENTAÇÃO DOS CAMPOS

/*
🎬 TABELA "Videos copy" - CAMPOS DISPONÍVEIS:

✅ OBRIGATÓRIOS:
- input_img: Attachment (array de objetos {url: "..."})
- property_code: Single line text 
- user_email: Email

✅ OPCIONAIS:
- invoice: Single line text (texto simples, não relacionamento)
- client: Link to another record (relacionamento, array de IDs)
- status: Single select
- workflow: Single select  
- vid_orientation: Single select
- description: Long text

🔄 MAPEAMENTOS AUTOMÁTICOS:
- imgUrl OU imgUrls[0] → input_img
- codigo → property_code
- observacoes OU descricao → description
- formatoVideo OU videoProportion → vid_orientation
- imgWorkflow → workflow
- suggestionstatus → status

🛡️ VALIDAÇÕES IMPLEMENTADAS:
- ✅ URLs válidas nos attachments
- ✅ Relacionamentos com IDs corretos
- ✅ Tipos de campos apropriados
- ✅ Remoção automática de IDs problemáticos
- ✅ Logs detalhados para debugging

⚠️ DIFERENÇAS DA TABELA "Images copy":
- invoice é TEXTO SIMPLES (não array/relacionamento)
- Não tem campos user, style_ref, room_type, etc.
- Focada especificamente em processamento de vídeo
*/
