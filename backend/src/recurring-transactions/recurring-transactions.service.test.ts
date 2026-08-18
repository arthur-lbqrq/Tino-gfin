import { describe, expect, it } from "vitest";
import { addInterval } from "./recurring-transactions.service";

describe("addInterval", () => {
  it("adds one day for DIARIA", () => {
    const result = addInterval(new Date(2026, 0, 31), "DIARIA");
    expect(result).toEqual(new Date(2026, 1, 1));
  });

  it("adds seven days for SEMANAL", () => {
    const result = addInterval(new Date(2026, 0, 1), "SEMANAL");
    expect(result).toEqual(new Date(2026, 0, 8));
  });

  it("adds one month for MENSAL", () => {
    const result = addInterval(new Date(2026, 0, 15), "MENSAL");
    expect(result).toEqual(new Date(2026, 1, 15));
  });

  it("adds one year for ANUAL", () => {
    const result = addInterval(new Date(2026, 0, 15), "ANUAL");
    expect(result).toEqual(new Date(2027, 0, 15));
  });

  it("rolls over into March when adding a month to Jan 31 (no Feb 31)", () => {
    // new Date() normaliza: 31 de fevereiro não existe, então isso é um
    // comportamento conhecido do JS que a regra de recorrência herda.
    const result = addInterval(new Date(2026, 0, 31), "MENSAL");
    expect(result).toEqual(new Date(2026, 2, 3));
  });

  it("does not mutate the input date", () => {
    const original = new Date(2026, 0, 15);
    const copy = new Date(original);
    addInterval(original, "MENSAL");
    expect(original).toEqual(copy);
  });
});
