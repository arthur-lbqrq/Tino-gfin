import { Response } from "express";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { sendCriticalInsightDigest } from "./notification.service";

export async function sendOwnDigest(req: AuthenticatedRequest, res: Response) {
  const result = await sendCriticalInsightDigest(req.userId!);
  return res.json(result);
}

// Chamada pelo agendador externo (cron do hosting) uma vez por dia — protegida
// por ADMIN_EMAIL do mesmo jeito que a concessão manual de plano, já que ainda
// não existe um token de serviço separado pra jobs internos.
export async function sendAllDigests(req: AuthenticatedRequest, res: Response) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!env.adminEmail || requester?.email !== env.adminEmail) {
    return res.status(403).json({ message: "Sem permissão." });
  }

  const users = await prisma.user.findMany({ where: { plan: { in: ["PRO", "BUSINESS"] } }, select: { id: true } });
  const results = await Promise.all(users.map((u) => sendCriticalInsightDigest(u.id)));

  return res.json({
    usersChecked: users.length,
    digestsSent: results.filter((r) => r.sent).length,
  });
}
