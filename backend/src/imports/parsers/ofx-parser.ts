import { ParsedImportRow } from "./types";

// OFX 1.x é SGML (tags sem fechamento por linha), então extraímos por regex em
// vez de um parser XML de verdade — mais simples e cobre o que os bancos exportam.
function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
  return match?.[1]?.trim();
}

// Formato OFX: AAAAMMDDHHMMSS[.sss][:GMT] — só os 8 primeiros dígitos importam aqui.
function parseOfxDate(raw: string): Date {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  return new Date(year, month - 1, day);
}

export function parseOfx(content: string): ParsedImportRow[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi);

  if (!blocks || blocks.length === 0) {
    throw new Error("Nenhuma transação (<STMTTRN>) encontrada no arquivo OFX.");
  }

  return blocks
    .map((block): ParsedImportRow | null => {
      const dtposted = extractTag(block, "DTPOSTED");
      const trnamtRaw = extractTag(block, "TRNAMT");
      if (!dtposted || !trnamtRaw) return null;

      const trnamt = Number(trnamtRaw);
      if (Number.isNaN(trnamt)) return null;

      const date = parseOfxDate(dtposted);
      if (Number.isNaN(date.getTime())) return null;

      const memo = extractTag(block, "MEMO") || extractTag(block, "NAME") || "Transação importada";

      return {
        date,
        description: memo,
        amount: Math.abs(trnamt),
        type: trnamt < 0 ? "DESPESA" : "RECEITA",
        externalId: extractTag(block, "FITID"),
      };
    })
    .filter((row): row is ParsedImportRow => row !== null);
}
