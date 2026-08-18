import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv-parser";

describe("parseCsv", () => {
  it("throws when the file has no header + data rows", () => {
    expect(() => parseCsv("Data;Valor;Descrição")).toThrow();
  });

  it("throws when it can't find date/amount columns", () => {
    const content = "Foo;Bar\n1;2";
    expect(() => parseCsv(content)).toThrow(/data e valor/);
  });

  it("parses a semicolon-delimited pt-BR export (negative = despesa)", () => {
    const content = ["Data;Valor;Descrição", "15/08/2026;-150,00;PIX ENVIADO", "10/08/2026;2500,00;SALARIO"].join(
      "\n"
    );

    const rows = parseCsv(content);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: "DESPESA", amount: 150, description: "PIX ENVIADO" });
    expect(rows[0].date).toEqual(new Date(2026, 7, 15));
    expect(rows[1]).toMatchObject({ type: "RECEITA", amount: 2500 });
  });

  it("parses a comma-delimited export with an ISO date and thousands separator", () => {
    // valor entre aspas porque contém vírgula decimal — assim como um CSV real
    // gerado com vírgula como delimitador precisaria escapar o campo
    const content = ["date,amount,description", '2026-08-15,"-1.234,56",Compra grande'].join("\n");

    const [row] = parseCsv(content);
    expect(row.amount).toBe(1234.56);
    expect(row.type).toBe("DESPESA");
    expect(row.date).toEqual(new Date(2026, 7, 15));
  });

  it("skips rows with an unparseable date or amount", () => {
    const content = ["Data;Valor;Descrição", "data-invalida;100;Teste", "15/08/2026;abc;Teste"].join("\n");

    expect(parseCsv(content)).toHaveLength(0);
  });

  it("falls back to a generic description when the column is missing", () => {
    const content = ["Data;Valor", "15/08/2026;100"].join("\n");

    const [row] = parseCsv(content);
    expect(row.description).toBe("Transação importada");
  });
});
