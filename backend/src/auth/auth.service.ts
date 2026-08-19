import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";

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

const VERIFICATION_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_HOURS = 1;

// Token de verificação/reset: o valor puro só existe no e-mail e no request de
// confirmação — o banco guarda apenas o hash sha256, nunca o valor em si.
function createSecureToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function registerUser({ name, email, password }: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AuthError("Já existe uma conta com esse e-mail.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { token: verificationToken, hash: verificationTokenHash } = createSecureToken();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      verificationTokenHash,
      verificationTokenExpiresAt: addHours(new Date(), VERIFICATION_TOKEN_TTL_HOURS),
    },
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

  // Não bloqueia o cadastro se o envio falhar (provedor de e-mail fora do ar,
  // por exemplo) — o usuário sempre pode pedir reenvio depois.
  sendVerificationEmail(user.email, verificationToken).catch((error) => {
    console.error("Falha ao enviar e-mail de verificação:", error);
  });

  // Sem token aqui de propósito: registrar não loga o usuário automaticamente,
  // pra incentivar a confirmação — mas login funciona mesmo sem verificar
  // (ver loginUser), então isso não trava ninguém.
  return {
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
  };
}

export async function verifyEmailToken(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { verificationTokenHash: hashToken(token) },
  });

  if (!user || !user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
    throw new AuthError("Token de verificação inválido ou expirado.", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationTokenHash: null, verificationTokenExpiresAt: null },
  });
}

// Sempre "sucede" silenciosamente se o e-mail não existir ou já estiver
// verificado — mesma lógica de não revelar informação usada em requestPasswordReset.
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return;

  const { token, hash } = createSecureToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationTokenHash: hash,
      verificationTokenExpiresAt: addHours(new Date(), VERIFICATION_TOKEN_TTL_HOURS),
    },
  });

  await sendVerificationEmail(user.email, token).catch((error) => {
    console.error("Falha ao reenviar e-mail de verificação:", error);
  });
}

// Nunca revela se o e-mail existe na base — sempre "sucede" do ponto de vista
// de quem chamou, pra não virar um jeito de enumerar contas cadastradas.
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const { token, hash } = createSecureToken();

  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hash, resetTokenExpiresAt: addHours(new Date(), RESET_TOKEN_TTL_HOURS) },
  });

  await sendPasswordResetEmail(user.email, token).catch((error) => {
    console.error("Falha ao enviar e-mail de redefinição de senha:", error);
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashToken(token) },
  });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new AuthError("Token de redefinição inválido ou expirado.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError("Usuário não encontrado.", 404);

  return { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified };
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

  // Não bloqueia login por e-mail não verificado — só sinaliza pro frontend
  // mostrar um aviso. Bloquear de verdade só faz sentido depois que o envio de
  // e-mail (Resend) estiver configurado; até lá, ninguém consegue confirmar
  // um link que nunca chega, e travaria todo cadastro novo.
  const token = generateToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
    token,
  };
}
