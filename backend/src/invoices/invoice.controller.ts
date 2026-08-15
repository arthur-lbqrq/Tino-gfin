import { Response } from "express";
import { AuthenticatedRequest } from "@/auth/auth.middleware";
import { listInvoices, getInvoice, payInvoice, getCreditLimitStatus, InvoiceError } from "./invoice.service";

function handleError(error: unknown, res: Response) {
  if (error instanceof InvoiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Erro interno." });
}

export async function index(req: AuthenticatedRequest, res: Response) {
  try {
    const invoices = await listInvoices(req.userId!, req.params.accountId);
    return res.json(invoices);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function show(req: AuthenticatedRequest, res: Response) {
  try {
    const invoice = await getInvoice(req.userId!, req.params.accountId, req.params.invoiceId);
    return res.json(invoice);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function pay(req: AuthenticatedRequest, res: Response) {
  try {
    const invoice = await payInvoice(req.userId!, req.params.accountId, req.params.invoiceId);
    return res.json(invoice);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function creditLimit(req: AuthenticatedRequest, res: Response) {
  try {
    const status = await getCreditLimitStatus(req.userId!, req.params.accountId);
    return res.json(status);
  } catch (error) {
    return handleError(error, res);
  }
}
