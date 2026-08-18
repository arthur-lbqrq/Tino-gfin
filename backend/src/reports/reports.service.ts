import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Account, Category, Transaction } from "@prisma/client";
import { listTransactions } from "@/transactions/transaction.service";
import { DreReport, PeriodComparisonPoint } from "./dre.service";
import type { MeiStatus } from "@/mei/mei.service";

export interface ReportFilters {
  userId: string;
  type?: "RECEITA" | "DESPESA";
  categoryId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
}

type TransactionRow = Transaction & { category: Category; account: Account };

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function getTransactionsForReport(filters: ReportFilters): Promise<TransactionRow[]> {
  return listTransactions(filters) as Promise<TransactionRow[]>;
}

function escapeCsvField(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const CSV_HEADER = ["Data", "Tipo", "Categoria", "Conta", "Descrição", "Valor"];

// Ponto e vírgula como separador (não vírgula) porque é o padrão que o Excel
// em pt-BR espera; BOM no início garante acentuação correta ao abrir o arquivo.
export function buildTransactionsCsv(transactions: TransactionRow[]): string {
  const rows = transactions.map((t) => [
    t.date.toLocaleDateString("pt-BR"),
    t.type === "RECEITA" ? "Receita" : "Despesa",
    t.category.name,
    t.account.name,
    t.description ?? "",
    Number(t.amount).toFixed(2).replace(".", ","),
  ]);

  const lines = [CSV_HEADER, ...rows].map((row) => row.map(escapeCsvField).join(";"));
  return "﻿" + lines.join("\r\n");
}

export function buildTransactionsPdf(
  transactions: TransactionRow[],
  periodLabel: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const receitas = transactions
      .filter((t) => t.type === "RECEITA")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const despesas = transactions
      .filter((t) => t.type === "DESPESA")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    doc.fontSize(18).text("Tino — Relatório de Transações", { align: "center" });
    doc.fontSize(10).fillColor("#666").text(periodLabel, { align: "center" });
    doc.moveDown(1);

    doc.fillColor("#000").fontSize(11);
    doc.text(`Receitas: ${formatBRL(receitas)}`);
    doc.text(`Despesas: ${formatBRL(despesas)}`);
    doc.text(`Saldo do período: ${formatBRL(receitas - despesas)}`);
    doc.moveDown(1);

    const columns = { date: 40, type: 100, category: 160, description: 270, amount: 460 };
    const pageBottom = doc.page.height - doc.page.margins.bottom;

    function drawHeaderRow() {
      doc.fontSize(9).fillColor("#666");
      doc.text("Data", columns.date, doc.y, { width: 55 });
      doc.text("Tipo", columns.type, doc.y, { width: 55 });
      doc.text("Categoria", columns.category, doc.y, { width: 105 });
      doc.text("Descrição", columns.description, doc.y, { width: 185 });
      doc.text("Valor", columns.amount, doc.y, { width: 90, align: "right" });
      doc.moveDown(0.5);
      doc
        .moveTo(columns.date, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#ddd")
        .stroke();
      doc.moveDown(0.3);
    }

    drawHeaderRow();

    if (transactions.length === 0) {
      doc.fontSize(10).fillColor("#666").text("Nenhuma transação encontrada para esse filtro.");
    }

    for (const t of transactions) {
      if (doc.y > pageBottom - 20) {
        doc.addPage();
        drawHeaderRow();
      }

      const y = doc.y;
      doc.fontSize(9).fillColor("#000");
      doc.text(t.date.toLocaleDateString("pt-BR"), columns.date, y, { width: 55 });
      doc.text(t.type === "RECEITA" ? "Receita" : "Despesa", columns.type, y, { width: 55 });
      doc.text(t.category.name, columns.category, y, { width: 105 });
      doc.text(t.description || t.category.name, columns.description, y, { width: 185 });
      doc.text(formatBRL(Number(t.amount)), columns.amount, y, { width: 90, align: "right" });
      doc.moveDown(0.6);
    }

    doc.end();
  });
}

export async function buildTransactionsXlsx(transactions: TransactionRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transações");

  sheet.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 20 },
    { header: "Conta", key: "account", width: 20 },
    { header: "Descrição", key: "description", width: 30 },
    { header: "Valor", key: "amount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const t of transactions) {
    sheet.addRow({
      date: t.date.toLocaleDateString("pt-BR"),
      type: t.type === "RECEITA" ? "Receita" : "Despesa",
      category: t.category.name,
      account: t.account.name,
      description: t.description ?? "",
      amount: Number(t.amount),
    });
  }
  sheet.getColumn("amount").numFmt = '"R$" #,##0.00';

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function drePeriodLabel(report: DreReport): string {
  const start = report.startDate.toLocaleDateString("pt-BR");
  const end = report.endDate.toLocaleDateString("pt-BR");
  return `Período: ${start} a ${end}`;
}

export function buildDrePdf(report: DreReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Tino — DRE Simplificado", { align: "center" });
    doc.fontSize(10).fillColor("#666").text(drePeriodLabel(report), { align: "center" });
    doc.moveDown(1.5);

    function drawSection(title: string, lines: { categoryName: string; total: number }[], total: number) {
      doc.fontSize(13).fillColor("#154d40").text(title);
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#000");

      if (lines.length === 0) {
        doc.fillColor("#666").text("Nenhum lançamento nesse período.");
      }

      for (const line of lines) {
        doc.text(line.categoryName, 50, doc.y, { width: 350, continued: true });
        doc.text(formatBRL(line.total), { width: 120, align: "right" });
      }

      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Total", 50, doc.y, { width: 350, continued: true });
      doc.text(formatBRL(total), { width: 120, align: "right" });
      doc.font("Helvetica");
      doc.moveDown(1);
    }

    drawSection("Receitas", report.receitas.items, report.receitas.total);
    drawSection("Despesas", report.despesas.items, report.despesas.total);

    doc.moveDown(0.5);
    doc.fontSize(13).fillColor(report.resultado >= 0 ? "#1f6f5c" : "#b3402f");
    doc.text(`Resultado do período: ${formatBRL(report.resultado)}`, { align: "right" });

    doc.end();
  });
}

export async function buildDreXlsx(report: DreReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("DRE");

  sheet.columns = [
    { header: "Categoria", key: "category", width: 28 },
    { header: "Valor", key: "amount", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  sheet.addRow({ category: "RECEITAS", amount: null }).font = { bold: true };
  for (const line of report.receitas.items) {
    sheet.addRow({ category: line.categoryName, amount: line.total });
  }
  sheet.addRow({ category: "Total receitas", amount: report.receitas.total }).font = { bold: true };
  sheet.addRow({});

  sheet.addRow({ category: "DESPESAS", amount: null }).font = { bold: true };
  for (const line of report.despesas.items) {
    sheet.addRow({ category: line.categoryName, amount: line.total });
  }
  sheet.addRow({ category: "Total despesas", amount: report.despesas.total }).font = { bold: true };
  sheet.addRow({});

  sheet.addRow({ category: "Resultado", amount: report.resultado }).font = { bold: true };
  sheet.getColumn("amount").numFmt = '"R$" #,##0.00';

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Relatório anual pro contador: DRE mês a mês (só os totais, sem detalhar
// categoria — o contador já tem o CSV/Excel de transações se precisar do
// detalhe) mais o status do teto do MEI e o valor da DAS configurado.
export function buildMeiAnnualReportPdf(input: {
  year: number;
  months: PeriodComparisonPoint[];
  meiStatus: MeiStatus;
  dasMonthlyAmount: number | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(`Tino — Relatório Anual MEI ${input.year}`, { align: "center" });
    doc.fontSize(10).fillColor("#666").text("Resumo simplificado para envio ao contador", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#154d40").text("Status do limite MEI");
    doc.fontSize(10).fillColor("#000");
    doc.text(`Faturamento acumulado em ${input.year}: ${formatBRL(input.meiStatus.currentRevenue)}`);
    doc.text(`Teto anual considerado: ${formatBRL(input.meiStatus.revenueLimit)} (${input.meiStatus.usagePercent}% usado)`);
    doc.text(`Projeção pro fim do ano: ${formatBRL(input.meiStatus.projectedRevenue)}`);
    if (input.dasMonthlyAmount) {
      doc.text(`Valor mensal da DAS configurado: ${formatBRL(input.dasMonthlyAmount)}`);
    }
    doc.moveDown(1);

    doc.fontSize(12).fillColor("#154d40").text("Movimento mês a mês");
    doc.moveDown(0.3);

    const columns = { month: 50, receitas: 180, despesas: 320, resultado: 460 };
    doc.fontSize(9).fillColor("#666");
    doc.text("Mês", columns.month, doc.y, { width: 100 });
    doc.text("Receitas", columns.receitas, doc.y, { width: 120, align: "right" });
    doc.text("Despesas", columns.despesas, doc.y, { width: 120, align: "right" });
    doc.text("Resultado", columns.resultado, doc.y, { width: 100, align: "right" });
    doc.moveDown(0.5);

    let totalReceitas = 0;
    let totalDespesas = 0;

    for (const month of input.months) {
      totalReceitas += month.receitas;
      totalDespesas += month.despesas;

      const y = doc.y;
      doc.fontSize(9).fillColor("#000");
      doc.text(month.label, columns.month, y, { width: 100 });
      doc.text(formatBRL(month.receitas), columns.receitas, y, { width: 120, align: "right" });
      doc.text(formatBRL(month.despesas), columns.despesas, y, { width: 120, align: "right" });
      doc.text(formatBRL(month.resultado), columns.resultado, y, { width: 100, align: "right" });
      doc.moveDown(0.5);
    }

    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Total do ano — Receitas: ${formatBRL(totalReceitas)} · Despesas: ${formatBRL(totalDespesas)} · Resultado: ${formatBRL(totalReceitas - totalDespesas)}`);
    doc.font("Helvetica");

    doc.end();
  });
}
