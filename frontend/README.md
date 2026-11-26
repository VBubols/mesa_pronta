# Mesa Pronta: frontend

React + Vite + MUI, consumindo a API do `backend/`. Um app só, com duas áreas: o site do cliente e a gestão do restaurante.

## Como rodar

Requer **Node 20.19 ou mais novo** (o `.nvmrc` na raiz indica o 22).

1. Suba o backend (`cd backend && npm run dev`).
2. No `frontend/`:
   ```bash
   cp .env.example .env   # VITE_API_URL = endereço da API
   npm install
   npm run dev            # http://localhost:5173
   ```

O CORS do backend já libera `http://localhost:5173`. Antes de commitar, rode `npm run lint` e `npm run build`.

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Cardápio e horários da casa | Público |
| `/login`, `/cadastro` | Entrar e criar conta de cliente | Público |
| `/reservar` | Reserva de mesa (sexta a domingo) | Cliente |
| `/minhas-reservas` | Reservas, compra antecipada e cancelamento | Cliente |
| `/gestao/pedidos` | Quadro de comandas: lançar, preparar, entregar e receber | Funcionário e admin |
| `/gestao/reservas` | Agenda do dia, check-in e encerramento | Funcionário e admin |
| `/gestao/cardapio` | Produtos e disponibilidade | Admin |
| `/gestao/mesas` | Mesas e lugares | Admin |
| `/gestao/compras` | Compras de alimentos (despesas) | Admin |
| `/gestao/financeiro` | Vendas, despesas, saldo e repasse dos garçons | Admin |
| `/gestao/usuarios` | Equipe e clientes | Admin |

Depois do login, o cliente vai para as reservas e a equipe para a gestão. As rotas são protegidas por perfil em `App.jsx` (`RotaProtegida` + `RotaPorPerfil`), mas quem garante o acesso de verdade é o backend.

## Estrutura

```
src/
├── api/            # uma função por rota da API. Telas nunca chamam fetch direto
├── components/     # layouts, rotas protegidas, Comanda, SeletorItens, diálogos
├── constants/
│   └── rotulos.js  # 'em_preparo' -> 'Em preparo'. Cópia dos enums do backend
├── contexts/       # AuthProvider (sessão)
├── hooks/          # useAuth, useApi (carregar dados), useAviso (mensagens rápidas)
├── pages/          # uma tela por rota; gestao/ é a área da equipe
├── utils/
│   └── formatos.js # dinheiro em centavos, datas no fuso de Brasília, telefone
├── theme.js        # cores e tipografia
└── App.jsx         # rotas
```

## Convenções

- **Dinheiro:** a API trabalha em centavos. Para mostrar, `reais(3490)` dá `R$ 34,90`. Para enviar o que foi digitado, `paraCentavos('34,90')` dá `3490`.
- **Datas:** o restaurante vive no fuso de Brasília. Use `hoje()`, `ehFuturo()` e os formatadores de `utils/formatos.js` em vez de `new Date()` solto.
- **Carregar dados:** `useApi` com a função da API memorizada no `useCallback` (ou uma função de módulo). Ele cuida do carregando, do erro e de respostas fora de ordem.
- **Erros:** toda função da API lança `ErroApi` com a `mensagem` do backend. Em formulários, `errosPorCampo(erro)` devolve `{ campo: mensagem }` para o `helperText`.
- **Valores da API:** para exibir códigos, `rotulo('statusPedido', pedido.status)`; para selects, `opcoes('formasPagamento')`.
- **Componentes:** MUI e `sx`, sem CSS solto. No MUI 9, props do input vão em `slotProps`.
