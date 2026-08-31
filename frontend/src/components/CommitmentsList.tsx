import { Commitment } from "@/lib/types";
import { formatCurrency, formatDateBR } from "@/lib/format";

interface CommitmentsListProps {
  commitments: Commitment[];
  onAdiar: (commitment: Commitment) => void;
}

export function CommitmentsList({ commitments, onAdiar }: CommitmentsListProps) {
  const total = commitments.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="card commitments-card">
      <div className="commitments-header">
        <div className="commitments-title">Compromissos fixos · próximos 30 dias</div>
        <div className="mono commitments-total">
          {commitments.length} lançamento{commitments.length === 1 ? "" : "s"} · {formatCurrency(total)}
        </div>
      </div>

      {commitments.length === 0 ? (
        <div className="empty-state">Nenhum compromisso fixo agendado pros próximos 30 dias.</div>
      ) : (
        <div className="commitments-list">
          {commitments.map((commitment) => (
            <div className={`commitment-row ${commitment.severity === "critical" ? "critical" : ""}`} key={commitment.id}>
              <div className={`mono commitment-date ${commitment.severity === "critical" ? "critical" : ""}`}>
                {formatDateBR(commitment.date)}
              </div>
              <div className="commitment-info">
                <div className="commitment-description">{commitment.description}</div>
                {commitment.causeNote && (
                  <div className={`mono commitment-cause ${commitment.severity === "critical" ? "critical" : ""}`}>
                    {commitment.causeNote}
                  </div>
                )}
              </div>
              <div className="mono commitment-amount">{formatCurrency(commitment.amount)}</div>
              {commitment.deferrable ? (
                <button
                  className={`commitment-adiar-btn ${commitment.severity === "critical" ? "critical" : ""}`}
                  onClick={() => onAdiar(commitment)}
                >
                  Adiar
                </button>
              ) : (
                <span className="commitment-adiar-btn disabled">Adiar</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
