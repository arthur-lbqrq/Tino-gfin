export class RecurringTransactionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RecurringTransactionError";
    this.statusCode = statusCode;
  }

  static notFound() {
    return new RecurringTransactionError("Recorrência não encontrada.", 404);
  }

  static accountNotFound() {
    return new RecurringTransactionError("Conta não encontrada.", 404);
  }

  static categoryNotFound() {
    return new RecurringTransactionError("Categoria não encontrada.", 404);
  }
}
