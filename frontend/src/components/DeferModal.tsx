import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Commitment, DeferOption, DeferOptionsResponse, DeferResult } from "@/lib/types";
import { formatCurrency, formatDateBR } from "@/lib/format";

interface DeferModalProps {
  commitment: Commitment;
  onClose: () => void;
  onDeferred: () => void;
}

export function DeferModal({ commitment, onClose, onDeferred }: DeferModalProps) {
  const [data, setData] = useState<DeferOptionsResponse | null>(null);
  const [selected, setSelected] = useState<DeferOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeferResult | null>(null);

  useEffect(() => {
    if (!commitment.recurringId) return;
    api
      .get<DeferOptionsResponse>(`/recurring-transactions/${commitment.recurringId}/defer-options`)
      .then((response) => {
        setData(response);
        const recommended = response.options.find((o) => o.resolves) ?? response.options[0];
        setSelected(recommended);
      })
      .catch(() => setError("Não foi possível calcular as opções de adiamento."))
      .finally(() => setLoading(false));
  }, [commitment.recurringId]);

  async function handleConfirm() {
    if (!data || !selected || !commitment.recurringId) return;
    setConfirming(true);
    setError(null);
    try {
      const response = await api.post<DeferResult>(`/recurring-transactions/${commitment.recurringId}/defer`, {
        originalDate: data.commitment.originalDate,
        newDate: selected.newDate,
      });
      setResult(response);
      onDeferred();
    } catch {
      setError("Não foi possível confirmar o adiamento. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="defer-modal-backdrop" onClick={onClose}>
      <div className="defer-modal" onClick={(e) => e.stopPropagation()}>
        {result ? (
          <DeferResultView
            commitment={commitment}
            newDate={result.newDate}
            result={result}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="defer-modal-header">
              <div>
                <div className="defer-modal-kicker mono">Adiar compromisso</div>
                <div className="defer-modal-title">
                  {commitment.description} · {formatCurrency(commitment.amount)}
                </div>
                <div className="defer-modal-meta mono">vencimento atual {formatDateBR(commitment.date)}</div>
              </div>
              <button className="defer-modal-close" onClick={onClose} aria-label="Fechar">
                ✕
              </button>
            </div>

            {loading && <div className="page-loader">Calculando opções…</div>}
            {error && <p className="error-text">{error}</p>}

            {data && (
              <>
                <div className="defer-options-label mono">Nova data</div>
                <div className="defer-options-grid">
                  {data.options.map((option) => (
                    <button
                      key={option.newDate}
                      type="button"
                      className={`defer-option ${selected?.newDate === option.newDate ? "selected" : ""}`}
                      onClick={() => setSelected(option)}
                    >
                      <div className="defer-option-label">
                        {option.label}
                        {selected?.newDate === option.newDate && <span className="defer-option-check">✓</span>}
                      </div>
                      <div className="defer-option-date mono">
                        {formatDateBR(option.newDate)} · {option.cost > 0 ? `juros ${formatCurrency(option.cost)}` : "sem multa"}
                      </div>
                      <div className={`defer-option-result mono ${option.resolves ? "resolves" : "warn"}`}>
                        {option.projectedDaysToNegative === null
                          ? "sem risco em 45 dias"
                          : `negativo em ${option.projectedDaysToNegative} dias`}
                      </div>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="defer-cost-row">
                    <div className="defer-cost-label mono">CUSTO DE ADIAR</div>
                    <div className="defer-cost-value mono">{formatCurrency(selected.cost)}</div>
                    <div className="defer-cost-formula mono">2% mora + 0,033%/dia</div>
                  </div>
                )}

                <div className="defer-modal-actions">
                  <button className="landing-plano-btn" onClick={onClose} disabled={confirming}>
                    Cancelar
                  </button>
                  <button className="landing-plano-btn landing-plano-btn-primary" onClick={handleConfirm} disabled={confirming || !selected}>
                    {confirming ? "Adiando…" : selected ? `Adiar para ${formatDateBR(selected.newDate)}` : "Adiar"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DeferResultView({
  commitment,
  result,
  onClose,
}: {
  commitment: Commitment;
  newDate: string;
  result: DeferResult;
  onClose: () => void;
}) {
  const before = result.before.daysToNegative;
  const after = result.after.daysToNegative;

  return (
    <div className="defer-result">
      <div className={`defer-result-kicker mono ${result.resolves ? "resolves" : "warn"}`}>
        <span className={`estado-agora-dot ${result.resolves ? "" : "pulse"}`} />
        Compromisso adiado
      </div>
      <h3>{result.resolves ? "Você saiu do vermelho neste ciclo." : "Adiar não resolve totalmente."}</h3>

      <div className={`defer-result-card ${result.resolves ? "" : "warn"}`}>
        <div className="defer-result-label mono">Dias até o caixa negativo</div>
        <div className="defer-result-numbers">
          <div className="defer-result-before">
            <div className="mono">{before ?? "—"}</div>
            <div className="mono defer-result-tag">antes</div>
          </div>
          <div className="defer-result-arrow">→</div>
          <div className={`defer-result-after ${result.resolves ? "resolves" : "warn"}`}>
            <div className="mono">{after ?? "45+"}</div>
            <div className="mono defer-result-tag">depois</div>
          </div>
        </div>
      </div>

      {!result.resolves && result.newRootCause && (
        <div className="defer-root-cause">
          <div className="mono defer-root-cause-kicker">Nova causa raiz</div>
          <div>
            {result.newRootCause.description} · {formatCurrency(result.newRootCause.amount)} em{" "}
            {formatDateBR(result.newRootCause.date)} concentra o próximo aperto de caixa.
          </div>
        </div>
      )}

      {!result.resolves && result.alternatives.length > 0 && (
        <div className="defer-alternatives">
          <div className="mono defer-alternatives-kicker">O motor sugere</div>
          {result.alternatives.map((alt) => (
            <div className="defer-alternative" key={alt.label}>
              <div>{alt.label}</div>
              <div className="mono defer-alternative-note">{alt.note}</div>
            </div>
          ))}
        </div>
      )}

      <p className="defer-result-summary">
        {commitment.description} adiado, com custo de {formatCurrency(result.feeAmount)}.
      </p>

      <button className="landing-plano-btn landing-plano-btn-primary" onClick={onClose}>
        Voltar ao painel
      </button>
    </div>
  );
}
