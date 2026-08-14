/**
 * Script pra gerar transações fake em vários meses, simulando histórico real.
 * Útil pra testar o /insights sem precisar lançar dezenas de transações na mão.
 *
 * Uso:
 *   npx tsx prisma/seed-test-data.ts seu@email.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Uso: npx tsx prisma/seed-test-data.ts seu@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Usuário com e-mail "${email}" não encontrado. Registre-se primeiro pela API.`);
    process.exit(1);
  }

  const despesaCategoria = await prisma.category.findFirst({
    where: { name: "Fornecedores", type: "DESPESA" },
  });
  const receitaCategoria = await prisma.category.findFirst({
    where: { name: "Vendas", type: "RECEITA" },
  });

  if (!despesaCategoria || !receitaCategoria) {
    console.error('Categorias padrão não encontradas. Rode "npx prisma db seed" primeiro.');
    process.exit(1);
  }

  const now = new Date();

  function dateInMonth(monthsAgo: number, day: number) {
    return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
  }

  const transactionsToCreate = [
    // 3 meses atrás: despesas moderadas, receitas boas
    { monthsAgo: 3, day: 5, type: "DESPESA" as const, amount: 3200, categoryId: despesaCategoria.id, description: "Fornecedor mensal" },
    { monthsAgo: 3, day: 15, type: "RECEITA" as const, amount: 5000, categoryId: receitaCategoria.id, description: "Vendas do mês" },

    // 2 meses atrás
    { monthsAgo: 2, day: 5, type: "DESPESA" as const, amount: 3400, categoryId: despesaCategoria.id, description: "Fornecedor mensal" },
    { monthsAgo: 2, day: 15, type: "RECEITA" as const, amount: 5200, categoryId: receitaCategoria.id, description: "Vendas do mês" },

    // 1 mês atrás
    { monthsAgo: 1, day: 5, type: "DESPESA" as const, amount: 3300, categoryId: despesaCategoria.id, description: "Fornecedor mensal" },
    { monthsAgo: 1, day: 15, type: "RECEITA" as const, amount: 4800, categoryId: receitaCategoria.id, description: "Vendas do mês" },

    // Mês atual: despesa bem acima da média + receita baixa (deve disparar os 2 insights)
    { monthsAgo: 0, day: 3, type: "DESPESA" as const, amount: 4500, categoryId: despesaCategoria.id, description: "Fornecedor mensal (aumentou)" },
    { monthsAgo: 0, day: 10, type: "DESPESA" as const, amount: 1200, categoryId: despesaCategoria.id, description: "Compra extra de material" },
    { monthsAgo: 0, day: 8, type: "RECEITA" as const, amount: 1800, categoryId: receitaCategoria.id, description: "Vendas do mês (abaixo do normal)" },
  ];

  for (const t of transactionsToCreate) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: t.categoryId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: dateInMonth(t.monthsAgo, t.day),
      },
    });
  }

  console.log(`✅ ${transactionsToCreate.length} transações fake criadas para ${email}.`);
  console.log("Teste agora: GET /dashboard/summary, /dashboard/cashflow e /insights");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
