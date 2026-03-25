 # MyFinance — Next.js + Supabase + Vercel

## Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel

---

## Setup completo

### 1. Supabase — criar tabelas
1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase_schema.sql` e clique em **Run**

### 2. Supabase — configurar Auth Google
1. Vá em **Authentication → Providers → Google**
2. Ative o Google provider
3. Adicione o Client ID e Secret do Google Cloud
4. Em **Redirect URLs** adicione: `https://seu-projeto.vercel.app/auth/callback`

### 3. Vercel — variáveis de ambiente
Configure no Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xqpbhqohmsdizapojmwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Deploy
```bash
# Suba o código para o GitHub
# O Vercel faz deploy automático a cada push
```

### 5. Importar dados iniciais
1. Acesse `https://seu-site.vercel.app/seed`
2. Clique em "Importar 245 lançamentos"
3. Execute apenas uma vez

---

## Estrutura do projeto
```
src/
  app/
    dashboard/          # App principal
      tabs/             # Abas: Dashboard, Lançamentos, etc.
    login/              # Página de login
    auth/callback/      # Callback OAuth
    api/seed/           # API para importar dados
    seed/               # Página de seed
  components/           # Componentes reutilizáveis
  lib/
    supabase.ts         # Cliente Supabase
    db.ts               # Funções de banco de dados
    types.ts            # TypeScript types
    utils.ts            # Utilitários
    dados.ts            # Dados de configuração (bancos, orçamento)
    lancamentos_base.ts # 245 lançamentos da planilha
```
