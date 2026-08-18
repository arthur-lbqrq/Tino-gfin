import { describe, expect, it } from "vitest";
import { parseOfx } from "./ofx-parser";

function ofxWith(transactions: string): string {
  return `
OFXHEADER:100
DATA:OFXSGML
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
${transactions}
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;
}

describe("parseOfx", () => {
  it("throws when there are no <STMTTRN> blocks", () => {
    expect(() => parseOfx(ofxWith(""))).toThrow();
  });

  it("parses a debit as DESPESA with a positive amount", () => {
    const content = ofxWith(`
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260815120000[-3:GMT]
<TRNAMT>-150.00
<FITID>2026081500001
<MEMO>PIX ENVIADO
</STMTTRN>
    `);

    const [row] = parseOfx(content);
    expect(row.type).toBe("DESPESA");
    expect(row.amount).toBe(150);
    expect(row.externalId).toBe("2026081500001");
    expect(row.date).toEqual(new Date(2026, 7, 15));
    expect(row.description).toBe("PIX ENVIADO");
  });

  it("parses a credit as RECEITA", () => {
    const content = ofxWith(`
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260810
<TRNAMT>2500.00
<FITID>2026081000001
<MEMO>SALARIO
</STMTTRN>
    `);

    const [row] = parseOfx(content);
    expect(row.type).toBe("RECEITA");
    expect(row.amount).toBe(2500);
  });

  it("falls back to NAME when MEMO is missing", () => {
    const content = ofxWith(`
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260810
<TRNAMT>-50.00
<NAME>MERCADO XYZ
</STMTTRN>
    `);

    const [row] = parseOfx(content);
    expect(row.description).toBe("MERCADO XYZ");
  });

  it("parses multiple transactions in the same file", () => {
    const content = ofxWith(`
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260810
<TRNAMT>-50.00
<FITID>a1
<MEMO>Um
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260811
<TRNAMT>100.00
<FITID>a2
<MEMO>Dois
</STMTTRN>
    `);

    const rows = parseOfx(content);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.externalId)).toEqual(["a1", "a2"]);
  });
});
