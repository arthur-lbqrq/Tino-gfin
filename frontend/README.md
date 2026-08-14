# Tino — Frontend

Interface web do Tino: login/registro, dashboard com insights e lançamento de transações.

## Stack

- React + TypeScript + Vite
- React Router (navegação)
- Recharts (gráfico de fluxo de caixa)
- CSS puro com tokens de design (sem framework de UI)

## Setup local

1. Instale as dependências:

```bash
npm install
```

2. Copie o `.env.example` para `.env` e ajuste a URL da API se necessário:

```bash
cp .env.example .env
```

3. Certifique-se de que o backend está rodando em `http://localhost:3333` (ver `../backend/README.md`).

4. Suba o frontend em modo dev:

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Estrutura

```
src/
├── pages/          # Login, Register, Dashboard, Transactions
├── components/     # Layout, cards, formulários, gráfico
├── context/        # AuthContext (sessão do usuário)
├── lib/            # cliente de API, tipos, formatação
└── styles/         # tokens de design (cores, tipografia, componentes)
```

## Identidade visual

- **Cor de marca:** verde-pinho (`#1f6f5c`) — remete a fluxo/confiança
- **Sinalização:** âmbar (atenção), vermelho (crítico), menta (receita/positivo)
- **Tipografia:** Fraunces (títulos), Manrope (corpo), IBM Plex Mono (valores monetários)
- **Elemento de assinatura:** os cards de insight em formato de "ticket" com barra lateral colorida — reforça que são alertas, não apenas dados

## Fluxo de autenticação

O token JWT fica salvo no `localStorage` (`tino_token`). Todas as chamadas à API passam por `src/lib/api.ts`, que já injeta o header `Authorization` automaticamente.

## Próximos passos (fora do MVP)

- Edição de transações (hoje só cria/lista/exclui)
- Gestão de categorias pela UI (hoje só lista as existentes)
- Paginação na listagem de transações
- Loading states mais refinados (skeletons)
