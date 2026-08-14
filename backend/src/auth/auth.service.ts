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

  const token = generateToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
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
