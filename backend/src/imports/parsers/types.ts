export interface ParsedImportRow {
  date: Date;
  description: string;
  amount: number;
  type: "RECEITA" | "DESPESA";
  externalId?: string;
}
