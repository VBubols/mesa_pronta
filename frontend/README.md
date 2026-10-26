# Portal de Vagas: frontend

React + Vite + MUI, consumindo a API do `backend/`.

## Como rodar

Requer **Node 20.19 ou mais novo** (o Vite 8 não roda no Node 18). O `.nvmrc` na raiz indica a versão 22: com nvm, rode `nvm use`.

1. Suba o backend (`cd backend && npm run dev`). A API precisa estar no ar para o login funcionar.
2. No `frontend/`:
   ```bash
   cp .env.example .env   # VITE_API_URL = endereço da API
   npm install
   npm run dev            # http://localhost:5173
   ```
3. Entre com o admin do seed (`ADMIN_EMAIL` e `ADMIN_SENHA` do `.env` do backend) ou cadastre um usuário.

O CORS do backend já libera `http://localhost:5173`. Antes de abrir PR, rode `npm run lint` e `npm run build`.

## Estrutura

```
src/
├── api/            # uma função por rota da API. Telas nunca chamam fetch direto
│   ├── client.js   # URL base, token, erros (ErroApi) e errosPorCampo()
│   ├── auth.js  usuario.js  vagas.js  curriculo.js  skills.js  admin.js
├── contexts/       # AuthProvider (sessão)
├── hooks/
│   ├── useAuth.js      # sessão: usuario, ehAdmin, entrar, sair
│   ├── useApi.js       # carrega dados da API (carregando, erro, recarregar)
│   └── useDebounce.js  # espera a digitação parar antes de buscar
├── components/     # peças usadas em várias telas
│   ├── Layout, RotaProtegida, RotaAdmin
│   ├── CampoSkills.jsx  # autocomplete de skills (currículo e vagas internas)
│   ├── Markdown.jsx     # descrição das vagas, sanitizada
│   └── VagaCard, ChipCompatibilidade, EstadoVazio, ConfirmarDialog
├── constants/
│   ├── rotulo.js   # 'junior' -> 'Júnior'. Cópia dos enums do backend
│   └── paises.js   # países do cadastro
├── pages/          # uma tela por rota
│   ├── curriculo/  # modelo de dados do formulário e lista editável
│   └── admin/      # sincronização, vagas e usuários
├── utils/
│   └── formatos.js # máscaras (CPF, telefone), datas e local da vaga
├── theme.js        # tema do MUI (cores e textos em pt-BR)
├── App.jsx         # rotas
└── main.jsx
```

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/login`, `/cadastro` | Login e cadastro | Público |
| `/vagas` | Lista com filtros e % de match | Logado |
| `/vagas/:id` | Detalhe da vaga e match | Logado |
| `/curriculo` | Formulário do currículo e PDF | Logado |
| `/admin` | Sincronização, usuários e vagas internas | Admin |

Cada tela é carregada só quando é aberta (`lazy` no `App.jsx`).

Filtros, aba e página de `/vagas` ficam na URL: voltar do detalhe mantém a busca, e dá para compartilhar o link.

## Convenções

- **Carregar dados:** use o `useApi` com a função da API memorizada no `useCallback` (veja `Vagas.jsx`). Ele já cuida do carregando, do erro e de respostas fora de ordem.
- **Chamadas à API:** sempre pelas funções de `src/api/`. Se a rota ainda não tiver função, crie no arquivo do assunto usando o `http` do `client.js`.
- **Erros:** toda função da API lança `ErroApi` com a `mensagem` do backend. Mostre num `<Alert severity="error">`. Em formulários, `errosPorCampo(erro)` devolve `{ campo: mensagem }` para o `helperText` de cada `TextField`.
- **Sessão:** `const { usuario, ehAdmin, entrar, sair } = useAuth()`. Token expirado desloga sozinho.
- **Valores da API:** a API devolve códigos (`junior`, `hibrido`). Para exibir, use `rotulo('niveis', vaga.nivel)`. Para selects, `opcoes('niveis')`.
- **Componentes:** use os do MUI (`TextField`, `Select`, `Autocomplete`, `Card`, `Alert`...) e o `sx` para ajustes, sem CSS solto. No MUI 9, props do input vão em `slotProps`, não em `InputProps`.
- **Descrição das vagas:** vem do GitHub em markdown com HTML. Nunca use `dangerouslySetInnerHTML` sem sanitizar.
- **Login durante os testes:** o backend bloqueia após 3 senhas erradas em 15 minutos. Reiniciar o backend libera.
