import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories: { name: string; type: TransactionType }[] = [
  { name: "Vendas", type: TransactionType.RECEITA },
  { name: "Serviços", type: TransactionType.RECEITA },
  { name: "Outros recebimentos", type: TransactionType.RECEITA },
  { name: "Fornecedores", type: TransactionType.DESPESA },
  { name: "Salários", type: TransactionType.DESPESA },
  { name: "Aluguel", type: TransactionType.DESPESA },
  { name: "Impostos", type: TransactionType.DESPESA },
  { name: "Contas recorrentes", type: TransactionType.DESPESA },
  { name: "Outras despesas", type: TransactionType.DESPESA },
];

async function main() {
  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: category.name, type: category.type },
    });

    if (!existing) {
      await prisma.category.create({
        data: { ...category, isDefault: true, userId: null },
      });
    }
  }

  console.log(`Seed concluído: ${defaultCategories.length} categorias padrão.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
