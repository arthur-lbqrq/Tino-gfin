import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CategoryError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreateCategoryInput {
  userId: string;
  name: string;
  type: TransactionType;
}

// Retorna categorias padrão do sistema + as criadas pelo próprio usuário
export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function createCategory({ userId, name, type }: CreateCategoryInput) {
  const existing = await prisma.category.findFirst({
    where: { userId, name, type },
  });

  if (existing) {
    throw new CategoryError("Você já tem uma categoria com esse nome para esse tipo.", 409);
  }

  return prisma.category.create({
    data: { userId, name, type, isDefault: false },
  });
}

// "Editar" uma categoria padrão cria uma cópia pessoal do usuário,
// pra não afetar outros usuários que usam a mesma categoria global.
export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name?: string; type?: TransactionType }
) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new CategoryError("Categoria não encontrada.", 404);
  }

  if (category.userId && category.userId !== userId) {
    throw new CategoryError("Você não tem permissão para editar essa categoria.", 403);
  }

  if (category.isDefault && category.userId === null) {
    // Categoria global: cria uma cópia pessoal em vez de alterar o registro global
    return prisma.category.create({
      data: {
        userId,
        name: data.name ?? category.name,
        type: data.type ?? category.type,
        isDefault: false,
      },
    });
  }

  return prisma.category.update({
    where: { id: categoryId },
    data,
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new CategoryError("Categoria não encontrada.", 404);
  }

  if (category.userId !== userId) {
    throw new CategoryError("Você só pode excluir categorias criadas por você.", 403);
  }

  await prisma.category.delete({ where: { id: categoryId } });
}
