import { Link } from "react-router-dom";
import { Account } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface AccountListProps {
  accounts: Account[];
  onDelete: (id: string) => void;
}

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  CORRENTE: "Conta corrente",
  CARTEIRA: "Carteira",
  CARTAO_CREDITO: "Cartão de crédito",
  POUPANCA: "Poupança",
};

export function AccountList({ accounts, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return <div className="card empty-state">Você ainda não cadastrou nenhuma conta.</div>;
  }

  return (
    <div className="summary-grid">
      {accounts.map((account) => {
        const isCard = account.type === "CARTAO_CREDITO";

        return (
          <div key={account.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="label">{ACCOUNT_TYPE_LABELS[account.type]}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, letterSpacing: "0.01em", marginTop: 4 }}>
                  {account.name}
                </div>
              </div>
              <button className="delete-btn" onClick={() => onDelete(account.id)} aria-label="Excluir conta">
                Excluir
              </button>
            </div>

            {isCard ? (
              <p style={{ marginTop: 12, fontSize: 13 }}>
                Limite <span className="mono">{formatCurrency(Number(account.creditLimit ?? 0))}</span> · fecha dia{" "}
                {account.closingDay} · vence dia {account.dueDay}
              </p>
            ) : (
              <p style={{ marginTop: 12, fontSize: 13 }}>
                Saldo inicial <span className="mono">{formatCurrency(Number(account.initialBalance))}</span>
              </p>
            )}

            {isCard && (
              <Link
                to={`/accounts/${account.id}/invoices`}
                className="btn-primary"
                style={{ display: "inline-block", marginTop: 14, textDecoration: "none" }}
              >
                Ver faturas
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
