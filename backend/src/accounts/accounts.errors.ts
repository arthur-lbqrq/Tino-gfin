export class AccountError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AccountError";
    this.statusCode = statusCode;
  }

  static notFound() {
    return new AccountError("Conta não encontrada.", 404);
  }

  static invalidCreditCardFields() {
    return new AccountError(
      "Contas do tipo cartão de crédito exigem limite, dia de fechamento e dia de vencimento.",
      400
    );
  }

  static hasLinkedTransactions() {
    return new AccountError(
      "Não é possível excluir uma conta que possui transações vinculadas.",
      409
    );
  }
}
