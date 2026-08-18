import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MeiSettings, MeiStatus } from "@/lib/types";
import { MeiGauge } from "@/components/MeiGauge";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";
import { formatCurrency } from "@/lib/format";

export function Mei() {
  const { plan } = useAuth();
  const locked = plan?.plan === "FREE";
  const [status, setStatus] = useState<MeiStatus | null>(null);
  const [settings, setSettings] = useState<MeiSettings | null>(null);
  const [dasInput, setDasInput] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (locked) {
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const [statusData, settingsData] = await Promise.all([
          api.get<MeiStatus>("/mei/status"),
          api.get<MeiSettings>("/mei/settings"),
        ]);
        setStatus(statusData);
        setSettings(settingsData);
        setDasInput(settingsData.dasMonthlyAmount ? String(settingsData.dasMonthlyAmount) : "");
        setLimitInput(settingsData.meiRevenueLimit ? String(settingsData.meiRevenueLimit) : "");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locked]);

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await api.put<MeiSettings>("/mei/settings", {
        dasMonthlyAmount: dasInput ? Number(dasInput) : null,
        meiRevenueLimit: limitInput ? Number(limitInput) : null,
      });
      setSettings(updated);
      const statusData = await api.get<MeiStatus>("/mei/status");
      setStatus(statusData);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportAnnualReport() {
    setExporting(true);
    try {
      await api.download(`/mei/annual-report.pdf`, `tino-mei-${status?.year ?? new Date().getFullYear()}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (locked) {
    return (
      <div>
        <div className="page-header">
          <h1>Fiscal MEI</h1>
          <p>Acompanhe o teto anual de faturamento, a guia DAS e exporte um resumo pronto pro seu contador.</p>
        </div>
        <UpgradeRequired feature="Fiscal MEI" minPlan="PRO" />
      </div>
    );
  }

  if (!status || !settings) {
    return <PageLoader />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Fiscal MEI</h1>
        <p>Acompanhe o teto anual de faturamento, a guia DAS e exporte um resumo pronto pro seu contador.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <MeiGauge status={status} />

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Guia DAS</h3>
          <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
            A DAS vence todo dia 20. Configure o valor da sua guia mensal pra receber o lembrete com o valor certo
            nos dias que antecedem o vencimento.
          </p>

          <form onSubmit={handleSaveSettings}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label htmlFor="das-amount">Valor mensal da DAS (R$)</label>
              <input
                id="das-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 75.90"
                value={dasInput}
                onChange={(e) => setDasInput(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label htmlFor="mei-limit">Teto anual do MEI (R$)</label>
              <input
                id="mei-limit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Padrão: R$ 81.000,00"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
              />
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>
                Deixe em branco pra usar o valor padrão vigente. Sobrescreva só se a lei mudar.
              </p>
            </div>

            {error && <p className="error-text">{error}</p>}
            {saved && !error && (
              <p style={{ fontSize: 13, color: "var(--primary)", marginBottom: 8 }}>Configurações salvas.</p>
            )}

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Relatório anual pro contador</h3>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
          PDF com o movimento mês a mês de {status.year}
          {" "}(<span className="mono">{formatCurrency(status.currentRevenue)}</span> acumulado) e o status do teto
          MEI — pronto pra enviar direto pro seu contador.
        </p>
        <button className="btn-secondary" onClick={handleExportAnnualReport} disabled={exporting}>
          {exporting ? "Gerando..." : "Baixar relatório anual (PDF)"}
        </button>
      </div>
    </div>
  );
}
