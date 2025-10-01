# Edge Function: suggest-department-icon

Esta Edge Function utiliza OpenAI GPT-4o para sugerir ícones apropriados para departamentos corporativos.

## 📋 Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # Linux
   brew install supabase/tap/supabase
   ```

2. **OpenAI API Key** configurada nos secrets do Supabase

## 🚀 Deploy

### Passo 1: Login no Supabase CLI
```bash
supabase login
```

### Passo 2: Link com o projeto
```bash
cd /Users/jorgejunior/aksell_cursor
supabase link --project-ref nahyrexnxhzutfeqxjte
```

### Passo 3: Configurar OPENAI_API_KEY
```bash
# Adicionar secret (se ainda não existir)
supabase secrets set OPENAI_API_KEY=sua_chave_aqui

# Verificar secrets existentes
supabase secrets list
```

### Passo 4: Deploy da função
```bash
supabase functions deploy suggest-department-icon
```

## 🧪 Testar localmente (opcional)

```bash
# Servir funções localmente
supabase functions serve suggest-department-icon --env-file .env

# Testar com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/suggest-department-icon' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"departmentName":"Recursos Humanos"}'
```

## 📊 Monitorar logs

```bash
# Ver logs em tempo real
supabase functions logs suggest-department-icon --follow

# Ver logs das últimas 24h
supabase functions logs suggest-department-icon
```

## 🔧 Troubleshooting

### Erro: "Edge Function não encontrada"
- **Causa:** Função não está deployada no Supabase
- **Solução:** Executar `supabase functions deploy suggest-department-icon`

### Erro: "OpenAI API key not configured"
- **Causa:** Secret OPENAI_API_KEY não está configurado
- **Solução:** `supabase secrets set OPENAI_API_KEY=sua_chave`

### Erro: "FunctionsRelayError"
- **Causa:** Problema de rede ou função com erro
- **Solução:** Verificar logs com `supabase functions logs suggest-department-icon`

## 📝 Estrutura da Função

```
supabase/functions/suggest-department-icon/
├── index.ts          # Código principal da função
└── README.md         # Esta documentação
```

## 🎯 Uso no Frontend

```typescript
const { data, error } = await supabase.functions.invoke('suggest-department-icon', {
  body: { departmentName: 'Recursos Humanos' }
});

if (data) {
  console.log('Ícone sugerido:', data.icon);
  console.log('Confiança:', data.confidence);
  console.log('Reasoning:', data.reasoning);
}
```

## 📚 Resposta da Função

```json
{
  "icon": "Users",
  "confidence": 0.95,
  "reasoning": "RH lida diretamente com gestão de pessoas",
  "tokensUsed": 150
}
```

## 🔗 Links Úteis

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
