# 🔒 **Configuração das Regras do Firebase Storage**

## ❌ **Problema Identificado:**
```
Firebase Storage: User does not have permission to access 'clients/cliente_teste_ruum/images/...'. (storage/unauthorized)
```

## 🛠️ **Solução - Configurar Regras do Firebase Storage:**

### **1. Acesse o Firebase Console:**
- Vá para: https://console.firebase.google.com/
- Selecione o projeto: `api-ruum`
- No menu lateral, clique em **"Storage"**
- Clique na aba **"Rules"**

### **2. Configurar Regras Permissivas (Para Desenvolvimento):**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leitura e escrita para arquivos organizados por cliente
    match /clients/{clientId}/{allPaths=**} {
      allow read, write: if true; // ATENÇÃO: Apenas para desenvolvimento
    }
    
    // Regra alternativa mais restritiva (para produção)
    // match /clients/{clientId}/{allPaths=**} {
    //   allow read: if true;
    //   allow write: if request.auth != null; // Apenas usuários autenticados
    // }
  }
}
```

### **3. Regras de Produção (Mais Seguras):**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Regras para arquivos de clientes
    match /clients/{clientId}/images/{filename} {
      // Permitir leitura pública
      allow read: if true;
      
      // Permitir escrita apenas com autenticação
      allow write: if request.auth != null 
                   && request.auth.token.admin == true; // Apenas admins
    }
    
    // Bloquear tudo que não está especificamente permitido
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### **4. Passo a Passo para Aplicar:**

1. **Copie as regras acima (versão desenvolvimento)**
2. **Cole no editor de regras do Firebase Console**
3. **Clique em "Publicar"**
4. **Aguarde alguns segundos para as regras serem aplicadas**

### **5. Verificar se as Regras Foram Aplicadas:**

Execute o teste novamente:
```bash
node test-firebase-airtable.js
```

### **6. Se ainda não funcionar, tente regras completamente abertas (APENAS PARA TESTE):**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // CUIDADO: Totalmente aberto!
    }
  }
}
```

---

## ⚠️ **IMPORTANTE - Segurança:**

- ✅ **Para desenvolvimento**: Use regras permissivas
- ⚠️ **Para produção**: Use regras restritivas com autenticação
- 🔒 **Nunca deixe produção com `allow read, write: if true`**

---

## 🧪 **Após configurar as regras, teste novamente:**

```bash
# Teste via arquivo
node test-firebase-airtable.js

# Ou teste via curl (quando o servidor estiver rodando)
curl -X POST "http://localhost:8080/api/firebase/upload-image" \
  -H "Authorization: Bearer ruum-api-secure-token-2024" \
  -F "image=@images/kaazaa_KZ6125.jpg" \
  -F "clientName=Kaaza"
```