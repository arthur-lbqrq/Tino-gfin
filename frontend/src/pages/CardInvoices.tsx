import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Account, CreditLimitStatus, Invoice } from "@/lib/types";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { CreditLimitBar } from "@/components/CreditLimitBar";

export function CardInvoices() {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [limitStatus, setLimitStatus] = useState<CreditLimitStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    async function loadOverview() {
      const [accountData, invoicesData, limitData] = await Promise.all([
        api.get<Account>(`/accounts/${accountId}`),
        api.get<Invoice[]>(`/accounts/${accountId}/invoices`),
        api.get<CreditLimitStatus>(`/accounts/${accountId}/credit-limit`),
      ]);
      setAccount(accountData);
      setInvoices(invoicesData);
      setLimitStatus(limitData);

      // Seleciona a fatura em aberto mais próxima (ou a mais recente, se todas pagas)
      const openInvoice = invoicesData.find((i) => !i.paid);
      setSelectedId((openInvoice ?? invoicesData[invoicesData.length - 1])?.id ?? null);
      setLoading(false);
    }

    loadOverview();
  }, [accountId]);

  useEffect(() => {
    if (!accountId || !selectedId) return;

    api.get<Invoice>(`/accounts/${accountId}/invoices/${selectedId}`).then(setDetail);
  }, [accountId, selectedId]);

  async function handlePay() {
    if (!accountId || !selectedId) return;

    setPaying(true);
    try {
      await api.patch(`/accounts/${accountId}/invoices/${selectedId}/pay`);
      setInvoices((prev) => prev.map((i) => (i.id === selectedId ? { ...i, paid: true } : i)));
      setDetail((prev) => (prev ? { ...prev, paid: true } : prev));
      const limitData = await api.get<CreditLimitStatus>(`/accounts/${accountId}/credit-limit`);
      setLimitStatus(limitData);
    } finally {
      setPaying(false);
    }
  }

  if (loading || !account) {
    return <p style={{ color: "var(--ink-faint)" }}>Carregando...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/accounts" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>
          ← Contas
        </Link>
        <h1 style={{ marginTop: 8 }}>Faturas — {account.name}</h1>
        <p>Cada compra parcelada aparece dividida nas faturas certas, considerando o fechamento do cartão.</p>
      </div>

      {limitStatus && <CreditLimitBar status={limitStatus} />}

      {invoices.length === 0 ? (
        <div className="card empty-state">
          Nenhuma fatura ainda. Assim que você lançar uma compra nesse cartão, a fatura do mês aparece aqui.
        </div>
      ) : (
        <>
          <div className="invoice-tabs">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                className={`invoice-tab ${invoice.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(invoice.id)}
              >
                {formatMonthLabel(invoice.referenceMonth)}
                <span className={`status ${invoice.paid ? "" : "open"}`}>
                  {invoice.paid ? "paga" : "aberta"}
                </span>
              </button>
            ))}
          </div>

          {detail && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div className="label">Total da fatura</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
                    {formatCurrency(detail.total)}
                  </div>
                  <p style={{ fontSize: 13, marginTop: 4 }}>
                    Vence em {new Date(detail.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {!detail.paid && (
                  <button className="btn-primary" onClick={handlePay} disabled={paying}>
                    {paying ? "Marcando..." : "Marcar como paga"}
                  </button>
                )}
              </div>

              {!detail.transactions || detail.transactions.length === 0 ? (
                <div className="empty-state">Nenhuma compra nessa fatura.</div>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                        <td>
                          {t.description || t.category.name}
                          {t.installmentNumber && t.installmentTotal && (
                            <span className="installment-badge">
                              {t.installmentNumber}/{t.installmentTotal}
                            </span>
                          )}
                        </td>
                        <td>{t.category.name}</td>
                        <td className="amount-despesa">{formatCurrency(Number(t.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
