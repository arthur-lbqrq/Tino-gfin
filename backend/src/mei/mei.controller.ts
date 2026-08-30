import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { getMeiSettings, getMeiStatus, MeiError, updateMeiSettings } from "./mei.service";
import { getPeriodComparison, monthsOfYear } from "@/reports/dre.service";
import { buildMeiAnnualReportPdf } from "@/reports/reports.service";

const updateSettingsSchema = z.object({
  dasMonthlyAmount: z.number().positive().nullable().optional(),
  meiRevenueLimit: z.number().positive().nullable().optional(),
});

const annualReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof MeiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function status(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getMeiStatus(req.userId!);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function showSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await getMeiSettings(req.userId!);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  const parsed = updateSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const data = await updateMeiSettings(req.userId!, parsed.data);
    return res.json(data);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function annualReportPdf(req: AuthenticatedRequest, res: Response) {
  const parsed = annualReportQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const now = new Date();
  const year = parsed.data.year ?? now.getFullYear();
  // Ano corrente: usa a data de hoje pra projeção fazer sentido (quantos meses
  // já se passaram). Ano fechado: 31/12 daquele ano, já que os 12 meses passaram.
  const meiReferenceDate = year === now.getFullYear() ? now : new Date(year, 11, 31);

  try {
    const [meiStatus, settings, months] = await Promise.all([
      getMeiStatus(req.userId!, meiReferenceDate),
      getMeiSettings(req.userId!),
      getPeriodComparison(req.userId!, monthsOfYear(year)),
    ]);

    const pdf = await buildMeiAnnualReportPdf({
      year,
      months,
      meiStatus,
      dasMonthlyAmount: settings.dasMonthlyAmount,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="faro-mei-${year}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    return handleError(error, res);
  }
}
