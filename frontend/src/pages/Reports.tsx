import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DailyExpensePoint, DreReport, PeriodComparisonPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { PeriodComparisonChart } from "@/components/PeriodComparisonChart";
import { ExpenseHeatmap } from "@/components/ExpenseHeatmap";
import { PageLoader } from "@/components/PageLoader";
import { UpgradeRequired } from "@/components/UpgradeRequired";

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function monthLabel(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function Reports() {
  const { plan } = useAuth();
  const locked = plan !== null && plan.plan !== "BUSINESS";
  const now = new Date();
  const [startDate, setStartDate] = useState(toInputDate(startOfMonth(now)));
  const [endDate, setEndDate] = useState(toInputDate(endOfMonth(now)));
  const [dre, setDre] = useState<DreReport | null>(null);
  const [dreLoading, setDreLoading] = useState(true);
  const [exportingDre, setExportingDre] = useState<"pdf" | "xlsx" | null>(null);

  const [comparisonMode, setComparisonMode] = useState<"month" | "year">("month");
  const [comparison, setComparison] = useState<PeriodComparisonPoint[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(true);

  const [heatmapMonth, setHeatmapMonth] = useState(startOfMonth(now));
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpensePoint[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  useEffect(() => {
    if (locked) return;
    setDreLoading(true);
    api
      .get<DreReport>(`/reports/dre?startDate=${startDate}&endDate=${endDate}`)
      .then(setDre)
      .finally(() => setDreLoading(false));
  }, [startDate, endDate, locked]);

  useEffect(() => {
    if (locked) return;
    setComparisonLoading(true);
    const count = comparisonMode === "month" ? 6 : 5;
    api
      .get<PeriodComparisonPoint[]>(`/reports/comparison?mode=${comparisonMode}&count=${count}`)
      .then(setComparison)
      .finally(() => setComparisonLoading(false));
  }, [comparisonMode, locked]);

  useEffect(() => {
    if (locked) return;
    setHeatmapLoading(true);
    api
      .get<DailyExpensePoint[]>(`/dashboard/daily-expenses?referenceDate=${toInputDate(heatmapMonth)}`)
      .then(setDailyExpenses)
      .finally(() => setHeatmapLoading(false));
  }, [heatmapMonth, locked]);

  async function handleExportDre(format: "pdf" | "xlsx") {
    setExportingDre(format);
    try {
      await api.download(`/reports/dre.${format}?startDate=${startDate}&endDate=${endDate}`, `tino-dre.${format}`);
    } finally {
      setExportingDre(null);
    }
  }

  if (locked) {
    return (
      <div>
        <div className="page-header">
          <h1>Relatórios</h1>
          <p>DRE simplificado, comparativo entre períodos e onde seu dinheiro sai ao longo do mês.</p>
        </div>
        <UpgradeRequired feature="Relatórios" minPlan="BUSINESS" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Relatórios</h1>
        <p>DRE simplificado, comparativo entre períodos e onde seu dinheiro sai ao longo do mês.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>DRE simplificado</h3>
            <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Receitas e despesas do período, por categoria.</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="dre-start">De</label>
              <input id="dre-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="dre-end">Até</label>
              <input id="dre-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className="btn-secondary" onClick={() => handleExportDre("pdf")} disabled={exportingDre !== null}>
              {exportingDre === "pdf" ? "Gerando..." : "PDF"}
            </button>
            <button className="btn-secondary" onClick={() => handleExportDre("xlsx")} disabled={exportingDre !== null}>
              {exportingDre === "xlsx" ? "Gerando..." : "Excel"}
            </button>
          </div>
        </div>

        {dreLoading || !dre ? (
          <PageLoader />
        ) : (
          <div className="grid-2col" style={{ gap: 24 }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>
                Receitas — <span className="mono">{formatCurrency(dre.receitas.total)}</span>
              </div>
              {dre.receitas.items.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Nenhuma receita no período.</p>
              ) : (
                dre.receitas.items.map((item) => (
                  <div key={item.categoryId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span>{item.categoryName}</span>
                    <span className="mono">{formatCurrency(item.total)}</span>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="label" style={{ marginBottom: 8 }}>
                Despesas — <span className="mono">{formatCurrency(dre.despesas.total)}</span>
              </div>
              {dre.despesas.items.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Nenhuma despesa no período.</p>
              ) : (
                dre.despesas.items.map((item) => (
                  <div key={item.categoryId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                    <span>{item.categoryName}</span>
                    <span className="mono">{formatCurrency(item.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!dreLoading && dre && (
          <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600, textAlign: "right", color: dre.resultado >= 0 ? "var(--primary)" : "var(--signal-red)" }}>
            Resultado: {formatCurrency(dre.resultado)}
          </p>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
          <button
            className={comparisonMode === "month" ? "btn-primary" : "btn-secondary"}
            onClick={() => setComparisonMode("month")}
          >
            Mês x mês
          </button>
          <button
            className={comparisonMode === "year" ? "btn-primary" : "btn-secondary"}
            onClick={() => setComparisonMode("year")}
          >
            Ano x ano
          </button>
        </div>
        {comparisonLoading ? <PageLoader /> : <PeriodComparisonChart data={comparison} />}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button
            type="button"
            className="logout-btn"
            style={{ width: "auto", padding: "8px 12px" }}
            onClick={() => setHeatmapMonth((m) => shiftMonth(m, -1))}
            aria-label="Mês anterior"
          >
            ←
          </button>
          <span className="mono" style={{ fontSize: 13 }}>{monthLabel(heatmapMonth)}</span>
          <button
            type="button"
            className="logout-btn"
            style={{ width: "auto", padding: "8px 12px" }}
            onClick={() => setHeatmapMonth((m) => shiftMonth(m, 1))}
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>
        {heatmapLoading ? <PageLoader /> : <ExpenseHeatmap data={dailyExpenses} monthLabel={monthLabel(heatmapMonth)} />}
      </div>
    </div>
  );
}
