import { ParsedImportRow } from "./types";

const DATE_HEADERS = ["data", "date", "dt"];
const AMOUNT_HEADERS = ["valor", "amount", "vlr"];
const DESCRIPTION_HEADERS = ["descricao", "historico", "memo", "description", "lancamento"];

// Remove marcas diacríticas (acentos) após normalizar em NFD, comparando por
// code point em vez de um literal de regex pra não depender da codificação do arquivo.
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("")
    .trim();
}

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

// Parser simples com suporte a campos entre aspas (não usa libs externas —
// suficiente pro CSV de extrato bancário, que não tem estrutura aninhada).
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Aceita DD/MM/AAAA (padrão BR) ou AAAA-MM-DD (ISO).
function parseCsvDate(raw: string): Date {
  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const [, day, month, yearRaw] = brMatch;
    const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
    return new Date(year, Number(month) - 1, Number(day));
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(NaN);
}

function parseCsvAmount(raw: string): number {
  // remove separador de milhar (.) e troca vírgula decimal por ponto, estilo pt-BR
  const cleaned = raw.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  return Number(cleaned.replace(/[^\d.-]/g, ""));
}

export function parseCsv(content: string): ParsedImportRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("O arquivo CSV precisa ter um cabeçalho e pelo menos uma linha de dados.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);

  const dateIdx = headers.findIndex((h) => DATE_HEADERS.some((candidate) => h.includes(candidate)));
  const amountIdx = headers.findIndex((h) => AMOUNT_HEADERS.some((candidate) => h.includes(candidate)));
  const descriptionIdx = headers.findIndex((h) =>
    DESCRIPTION_HEADERS.some((candidate) => h.includes(candidate))
  );

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error(
      "Não foi possível identificar as colunas de data e valor no CSV. Colunas esperadas: Data, Valor, Descrição."
    );
  }

  return lines
    .slice(1)
    .map((line): ParsedImportRow | null => {
      const fields = parseCsvLine(line, delimiter);
      const date = parseCsvDate(fields[dateIdx] ?? "");
      const amount = parseCsvAmount(fields[amountIdx] ?? "");

      if (Number.isNaN(date.getTime()) || Number.isNaN(amount) || amount === 0) return null;

      return {
        date,
        description: descriptionIdx >= 0 ? fields[descriptionIdx] || "Transação importada" : "Transação importada",
        amount: Math.abs(amount),
        type: amount < 0 ? "DESPESA" : "RECEITA",
      };
    })
    .filter((row): row is ParsedImportRow => row !== null);
}
