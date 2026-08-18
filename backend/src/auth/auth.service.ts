import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

function generateToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function registerUser({ name, email, password }: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AuthError("Já existe uma conta com esse e-mail.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Toda transação exige uma conta, então já cria uma conta "Padrão"
  // pra não deixar o usuário travado antes de configurar as contas dele.
  await prisma.account.create({
    data: {
      userId: user.id,
      name: "Padrão",
      type: "CORRENTE",
      initialBalance: 0,
    },
  });

  const token = generateToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
}

// Exclusão definitiva da conta e de todo o resto (transações, contas, metas,
// importações etc. — tudo referencia User com onDelete: Cascade). Exige a
// senha de novo como confirmação, já que não tem volta.
export async function deleteUserAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError("Usuário não encontrado.", 404);

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthError("Senha incorreta.", 401);
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthError("E-mail ou senha inválidos.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("E-mail ou senha inválidos.", 401);
  }

  const token = generateToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
}
