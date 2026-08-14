# Tino — Backend

API de gestão financeira com foco em insights automáticos para pequenos negócios e autônomos.

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma ORM
- JWT para autenticação
- Docker (banco local)

## Setup local

1. Instale as dependências:

```bash
npm install
```

2. Copie o `.env.example` para `.env` e ajuste se quiser:

```bash
cp .env.example .env
```

3. Suba o Postgres local via Docker:

```bash
docker compose up -d
```

4. Rode as migrations do Prisma:

```bash
npx prisma migrate dev --name init
```

5. Suba a API em modo dev:

```bash
npm run dev
```

A API sobe em `http://localhost:3333`.

## Endpoints disponíveis (Fase 1 — Auth)

| Método | Rota            | Descrição                  |
|--------|-----------------|-----------------------------|
| GET    | /health         | Healthcheck                |
| POST   | /auth/register  | Cria usuário                |
| POST   | /auth/login     | Autentica e retorna token   |

Exemplo de registro:

```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Arthur","email":"arthur@example.com","password":"123456"}'
```

## Próximos módulos (na ordem planejada)

- [ ] `transactions` — CRUD de receitas/despesas + categorização
- [ ] `insights` — motor de regras/alertas
- [ ] `dashboard` — agregações (saldo, receitas, despesas, resultado)

## Estrutura

```
src/
├── auth/         # registro, login, JWT, middleware de proteção de rotas
├── transactions/ # (próxima etapa)
├── insights/      # (próxima etapa)
├── dashboard/     # (próxima etapa)
├── config/       # variáveis de ambiente
├── lib/          # cliente Prisma
└── server.ts     # entry point
```
