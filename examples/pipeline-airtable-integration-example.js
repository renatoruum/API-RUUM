/**
 * Exemplo de uso do Pipeline VS+FLUX com integração Airtable
 * 
 * Este exemplo mostra como usar o endpoint completo do pipeline
 * para processar imagens e salvar automaticamente no Airtable.
 */

// ============================================================================
// EXEMPLO 1: Pipeline COMPLETO com salvamento no Airtable
// ============================================================================

const example1_full_pipeline_with_airtable = {
  endpoint: "POST /api/pipeline/staging-and-enhance",
  description: "Pipeline completo: Virtual Staging + FLUX + Airtable",
  
  request: {
    // 🔴 OBRIGATÓRIOS
    image_url: "https://firebasestorage.googleapis.com/v0/b/api-ruum.firebasestorage.app/o/Fotos%2Fimagens%2FLorena_23.jpg?alt=media&token=249a4158-3b5a-4631-bf27-994cdacb2a57",
    
    // 🟡 VIRTUAL STAGING
    room_type: "kitchen",
    style: "modern",
    declutter_mode: "off",
    add_furniture: true,
    
    // 🟡 FLUX ENHANCEMENT
    flux_prompt: "Enhance the realism of the image by adjusting the lighting, reflections, and shadows to make the furniture look naturally integrated into the environment. Focus on adding and adapting shadows to make the elements feel grounded and real. Consider the image's light sources to brightly illuminate the environment, resulting in a well-lit image. Do not change the perspective, furniture design, textures, or any structural elements of the space, only refine the lighting and shadowing for a bright, professional look. Do not change the perspective and angles as well.",
    flux_model: "flux-kontext-pro",
    
    // 🟡 PIPELINE CONTROL
    wait_for_completion: true,
    skip_staging: false,
    skip_enhancement: false,
    
    // 🟢 AIRTABLE INTEGRATION (NOVO!)
    save_to_airtable: true,
    property_code: "Lorena_23",
    property_url: "https://example.com/property/lorena-23",
    client_id: "recXXXXXXXXXXXXXXX", // ⚠️ Substituir por ID real
    user_id: "recYYYYYYYYYYYYYYY",   // ⚠️ Substituir por ID real
    invoice_id: "recZZZZZZZZZZZZZZZ"  // Opcional
  },
  
  curl_example: `
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/staging-and-enhance \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://firebasestorage.googleapis.com/v0/b/api-ruum.firebasestorage.app/o/Fotos%2Fimagens%2FLorena_23.jpg?alt=media&token=249a4158-3b5a-4631-bf27-994cdacb2a57",
    "room_type": "kitchen",
    "style": "modern",
    "wait_for_completion": true,
    "save_to_airtable": true,
    "property_code": "Lorena_23",
    "client_id": "recXXXXXXXXXXXXXXX",
    "user_id": "recYYYYYYYYYYYYYYY"
  }' | jq .
  `,
  
  response_example: {
    success: true,
    message: "Pipeline concluído com sucesso",
    pipeline_id: "pipeline_1763064276268",
    original_image: "https://firebasestorage.googleapis.com/.../Lorena_23.jpg",
    final_image: "https://bfldeliverysc.blob.core.windows.net/.../sample.jpeg",
    data: {
      pipeline_id: "pipeline_1763064276268",
      original_image: "https://firebasestorage.googleapis.com/.../Lorena_23.jpg",
      steps: [
        {
          step: 1,
          name: "virtual_staging",
          status: "completed",
          render_id: "mR2PhxHXEDXEiJKfJv1O",
          result_url: "https://storage.googleapis.com/.../output_1.jpg",
          room_type: "kitchen",
          style: "modern"
        },
        {
          step: 2,
          name: "flux_enhancement",
          status: "completed",
          task_id: "629c0fc7-cd25-41d7-b90a-4209d6d0d608",
          result_url: "https://bfldeliverysc.blob.core.windows.net/.../sample.jpeg",
          model: "flux-kontext-pro"
        },
        {
          step: 3,
          name: "airtable_save",
          status: "completed",
          record_id: "recABC123XYZ456",
          table: "Images"
        }
      ],
      errors: [],
      processing_time_ms: 23790,
      processing_time_seconds: "23.79"
    },
    airtable: {
      success: true,
      record_id: "recABC123XYZ456",
      table: "Images",
      message: "Imagem processada salva com sucesso no Airtable"
    }
  }
};

// ============================================================================
// EXEMPLO 2: Pipeline SEM salvamento no Airtable (comportamento padrão)
// ============================================================================

const example2_pipeline_without_airtable = {
  endpoint: "POST /api/pipeline/staging-and-enhance",
  description: "Pipeline sem Airtable (comportamento padrão)",
  
  request: {
    image_url: "https://firebasestorage.googleapis.com/.../16.jpg",
    room_type: "bathroom",
    style: "modern",
    wait_for_completion: true
    // save_to_airtable: false (padrão)
  },
  
  curl_example: `
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/staging-and-enhance \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://firebasestorage.googleapis.com/v0/b/api-ruum.firebasestorage.app/o/Fotos%2Fimagens%2F16.jpg?alt=media&token=8789700d-516d-4064-a0b0-3cd163eac34f",
    "room_type": "bathroom",
    "style": "modern",
    "wait_for_completion": true
  }' | jq .
  `,
  
  response_example: {
    success: true,
    message: "Pipeline concluído com sucesso",
    pipeline_id: "pipeline_1763064905724",
    original_image: "https://firebasestorage.googleapis.com/.../16.jpg",
    final_image: "https://bfldeliverysc.blob.core.windows.net/.../sample.jpeg",
    data: {
      pipeline_id: "pipeline_1763064905724",
      steps: [
        {
          step: 1,
          name: "virtual_staging",
          status: "completed",
          // ...
        },
        {
          step: 2,
          name: "flux_enhancement",
          status: "completed",
          // ...
        }
        // Sem step 3 (Airtable)
      ],
      errors: [],
      processing_time_ms: 22545,
      processing_time_seconds: "22.55"
    },
    airtable: null // Null quando não é usado
  }
};

// ============================================================================
// EXEMPLO 3: Apenas FLUX + Airtable (pular Virtual Staging)
// ============================================================================

const example3_only_flux_with_airtable = {
  endpoint: "POST /api/pipeline/staging-and-enhance",
  description: "Aplicar apenas FLUX em imagem já mobiliada e salvar no Airtable",
  
  request: {
    image_url: "https://storage.googleapis.com/.../already_staged.jpg",
    
    // Pular Virtual Staging
    skip_staging: true,
    
    // FLUX Enhancement
    flux_model: "flux-kontext-pro",
    wait_for_completion: true,
    
    // Airtable
    save_to_airtable: true,
    property_code: "PROP001",
    client_id: "recXXXXXXXXXXXXXXX",
    user_id: "recYYYYYYYYYYYYYYY"
  },
  
  curl_example: `
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/staging-and-enhance \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://storage.googleapis.com/.../already_staged.jpg",
    "skip_staging": true,
    "wait_for_completion": true,
    "save_to_airtable": true,
    "property_code": "PROP001",
    "client_id": "recXXXXXXXXXXXXXXX",
    "user_id": "recYYYYYYYYYYYYYYY"
  }' | jq .
  `
};

// ============================================================================
// EXEMPLO 4: Tratamento de erro no Airtable (pipeline continua)
// ============================================================================

const example4_airtable_error = {
  description: "Mesmo que o Airtable falhe, o pipeline retorna sucesso com a imagem processada",
  
  response_example: {
    success: true,
    message: "Pipeline concluído com sucesso",
    pipeline_id: "pipeline_1763064905724",
    final_image: "https://bfldeliverysc.blob.core.windows.net/.../sample.jpeg",
    data: {
      steps: [
        {
          step: 1,
          name: "virtual_staging",
          status: "completed"
        },
        {
          step: 2,
          name: "flux_enhancement",
          status: "completed"
        },
        {
          step: 3,
          name: "airtable_save",
          status: "failed",
          error: "Campo obrigatório ausente: client_id"
        }
      ],
      errors: [
        "Airtable: Campo obrigatório ausente: client_id"
      ]
    },
    airtable: {
      success: false,
      error: "Campo obrigatório ausente: client_id",
      message: "Erro ao salvar imagem processada no Airtable"
    }
  },
  
  note: "O pipeline retorna status 200 mesmo com erro no Airtable, pois o processamento principal foi concluído"
};

// ============================================================================
// EXEMPLO 5: Obter informações sobre o pipeline
// ============================================================================

const example5_pipeline_info = {
  endpoint: "GET /api/pipeline/info",
  description: "Obtém informações sobre os endpoints e parâmetros disponíveis",
  
  curl_example: `
curl -X GET https://apiruum-2cpzkgiiia-uc.a.run.app/api/pipeline/info | jq .
  `,
  
  response_includes: {
    endpoints: {
      main_pipeline: "POST /api/pipeline/staging-and-enhance",
      staging_only: "POST /api/pipeline/staging-only",
      enhance_only: "POST /api/pipeline/enhance-only",
      info: "GET /api/pipeline/info"
    },
    steps: [
      {
        step: 1,
        name: "Virtual Staging"
      },
      {
        step: 2,
        name: "FLUX Enhancement"
      },
      {
        step: 3,
        name: "Airtable Save (opcional)"
      }
    ],
    airtable_parameters: {
      save_to_airtable: "boolean - Ativa salvamento no Airtable",
      property_code: "string - Código do imóvel",
      property_url: "string - URL da propriedade",
      client_id: "string - ID do cliente (formato: recXXXXXXXXXXXXXXX)",
      user_id: "string - ID do usuário (formato: recXXXXXXXXXXXXXXX)",
      invoice_id: "string - ID da fatura (opcional)"
    }
  }
};

// ============================================================================
// NOTAS IMPORTANTES
// ============================================================================

const important_notes = {
  airtable_ids: {
    note: "IDs do Airtable devem ser obtidos das tabelas correspondentes",
    format: "recXXXXXXXXXXXXXXX (17 caracteres, começando com 'rec')",
    tables: {
      client_id: "Tabela: Clients",
      user_id: "Tabela: Users",
      invoice_id: "Tabela: Invoices"
    }
  },
  
  saved_fields: {
    note: "Campos salvos na tabela Images do Airtable",
    fields: [
      "output_img - Attachment com a imagem processada pelo FLUX",
      "input_img - Attachment com a imagem do Virtual Staging",
      "property_code - Código do imóvel",
      "property_URL - URL da propriedade",
      "room_type - Tipo de ambiente",
      "workflow - Fixo: 'VS+FLUX'",
      "status - Fixo: 'Processado'",
      "request_log - Log do processamento com metadados",
      "client - Relacionamento com Clients",
      "user - Relacionamento com Users",
      "invoice - Relacionamento com Invoices (opcional)",
      "style - Relacionamento com Styles (se fornecido)"
    ]
  },
  
  error_handling: {
    note: "Se o Airtable falhar, o pipeline NÃO é interrompido",
    behavior: [
      "Pipeline retorna status 200 (sucesso)",
      "Imagem processada é retornada normalmente",
      "Erro do Airtable é incluído no campo 'airtable' da resposta",
      "Step 3 (airtable_save) terá status 'failed' com mensagem de erro"
    ]
  },
  
  optional_parameter: {
    note: "save_to_airtable é OPCIONAL e FALSE por padrão",
    default_behavior: "Se não fornecido ou false, o pipeline funciona normalmente sem salvar no Airtable",
    backward_compatibility: "100% compatível com código existente - não quebra nada"
  }
};

// ============================================================================
// EXPORT PARA TESTES
// ============================================================================

export {
  example1_full_pipeline_with_airtable,
  example2_pipeline_without_airtable,
  example3_only_flux_with_airtable,
  example4_airtable_error,
  example5_pipeline_info,
  important_notes
};
