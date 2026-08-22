import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <div className="card empty-state">Nenhuma transação lançada ainda.</div>;
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-scroll">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th style={{ textAlign: "right" }}>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                <td>{t.category.name}</td>
                <td>{t.description || "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <span className={t.type === "RECEITA" ? "amount-receita" : "amount-despesa"}>
                    {t.type === "RECEITA" ? "+" : "-"} {formatCurrency(Number(t.amount))}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="delete-btn" onClick={() => onDelete(t.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
