import { RecurringTransaction } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface RecurringTransactionListProps {
  recurrences: RecurringTransaction[];
  onDelete: (id: string) => void;
  onToggleActive: (recurring: RecurringTransaction) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  DIARIA: "diária",
  SEMANAL: "semanal",
  MENSAL: "mensal",
  ANUAL: "anual",
};

export function RecurringTransactionList({ recurrences, onDelete, onToggleActive }: RecurringTransactionListProps) {
  if (recurrences.length === 0) {
    return <div className="card empty-state">Nenhum compromisso fixo cadastrado ainda.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Frequência</th>
            <th>Início</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recurrences.map((r) => (
            <tr key={r.id}>
              <td>{r.description}</td>
              <td className={r.type === "RECEITA" ? "amount-receita" : "amount-despesa"}>
                {r.type === "RECEITA" ? "+" : "−"} {formatCurrency(Number(r.amount))}
              </td>
              <td>{FREQUENCY_LABEL[r.frequency]}</td>
              <td>{new Date(r.startDate).toLocaleDateString("pt-BR")}</td>
              <td>
                <button className="logout-btn" style={{ width: "auto", padding: "6px 12px" }} onClick={() => onToggleActive(r)}>
                  {r.active ? "Ativo" : "Pausado"}
                </button>
              </td>
              <td>
                <button className="delete-btn" onClick={() => onDelete(r.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
