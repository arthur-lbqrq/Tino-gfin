import { describe, expect, it } from "vitest";
import { buildTransactionsCsv } from "./reports.service";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    date: new Date(2026, 7, 15),
    type: "DESPESA",
    amount: 1234.5,
    description: null,
    category: { name: "Mercado" },
    account: { name: "Carteira" },
    ...overrides,
  } as never;
}

describe("buildTransactionsCsv", () => {
  it("includes a header row and a UTF-8 BOM", () => {
    const csv = buildTransactionsCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Data;Tipo;Categoria;Conta;Descrição;Valor");
  });

  it("formats the amount with a comma and semicolon-separated columns", () => {
    const csv = buildTransactionsCsv([row()]);
    expect(csv).toContain("15/08/2026;Despesa;Mercado;Carteira;;1234,50");
  });

  it("falls back to an empty description when none is set", () => {
    const csv = buildTransactionsCsv([row({ description: null })]);
    const dataLine = csv.split("\r\n")[1];
    expect(dataLine.endsWith(";;1234,50")).toBe(true);
  });

  it("escapes a description containing a semicolon", () => {
    const csv = buildTransactionsCsv([row({ description: "Mercado; padaria" })]);
    expect(csv).toContain('"Mercado; padaria"');
  });

  it("labels RECEITA transactions correctly", () => {
    const csv = buildTransactionsCsv([row({ type: "RECEITA" })]);
    expect(csv).toContain(";Receita;");
  });
});
