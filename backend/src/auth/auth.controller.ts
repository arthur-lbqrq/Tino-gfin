import { Request, Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "./auth.middleware";
import {
  registerUser,
  loginUser,
  deleteUserAccount,
  verifyEmailToken,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword as resetPasswordWithToken,
  AuthError,
} from "./auth.service";

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Senha obrigatória"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  newPassword: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const result = await registerUser(parsed.data);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao registrar usuário." });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const result = await loginUser(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao fazer login." });
  }
}

export async function deleteMe(req: AuthenticatedRequest, res: Response) {
  const parsed = deleteAccountSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    await deleteUserAccount(req.userId!, parsed.data.password);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao excluir a conta." });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    await verifyEmailToken(parsed.data.token);
    return res.status(200).json({ message: "E-mail verificado com sucesso." });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao verificar e-mail." });
  }
}

export async function resendVerification(req: Request, res: Response) {
  const parsed = resendVerificationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    await resendVerificationEmail(parsed.data.email);
    return res.status(200).json({ message: "Se o e-mail existir, um novo link de verificação foi enviado." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao reenviar verificação." });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch (error) {
    // Não deixa um erro interno vazar como diferença observável em relação ao
    // caminho "e-mail não existe" — loga e ainda assim responde 200.
    console.error(error);
  }

  return res.status(200).json({ message: "Se o e-mail existir, enviamos as instruções de redefinição." });
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);
    return res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Erro interno ao redefinir senha." });
  }
}
