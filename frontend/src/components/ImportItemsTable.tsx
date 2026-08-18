import { useState } from "react";
import { Category, ImportedTransactionItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface ImportItemsTableProps {
  items: ImportedTransactionItem[];
  categories: Category[];
  onAcceptMatch: (itemId: string) => void;
  onConfirm: (itemId: string, categoryId: string) => void;
  onIgnore: (itemId: string) => void;
}

const STATUS_LABEL: Record<ImportedTransactionItem["status"], string> = {
  PENDENTE: "Pendente",
  SUGERIDO: "Sugestão de vínculo",
  CONFIRMADO: "Confirmado",
  IGNORADO: "Ignorado",
};

export function ImportItemsTable({ items, categories, onAcceptMatch, onConfirm, onIgnore }: ImportItemsTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return <div className="card empty-state">Nenhuma linha nesse extrato.</div>;
  }

  return (
    <div className="card">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const eligibleCategories = categories.filter((c) => c.type === item.type);

            return (
              <tr key={item.id}>
                <td>{new Date(item.date).toLocaleDateString("pt-BR")}</td>
                <td>{item.description}</td>
                <td className={item.type === "DESPESA" ? "amount-despesa" : "amount-receita"}>
                  {formatCurrency(Number(item.amount))}
                </td>
                <td>
                  {STATUS_LABEL[item.status]}
                  {item.status === "SUGERIDO" && item.linkedTransaction && (
                    <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                      vincula com: {item.linkedTransaction.description || item.linkedTransaction.category.name} (
                      {new Date(item.linkedTransaction.date).toLocaleDateString("pt-BR")})
                    </div>
                  )}
                </td>
                <td>
                  {item.status === "SUGERIDO" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-secondary" onClick={() => onAcceptMatch(item.id)}>
                        Confirmar vínculo
                      </button>
                      <button className="delete-btn" onClick={() => onIgnore(item.id)}>
                        Ignorar
                      </button>
                    </div>
                  )}

                  {item.status === "PENDENTE" && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select
                        value={selectedCategory[item.id] ?? ""}
                        onChange={(e) => setSelectedCategory((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        style={{ minWidth: 140 }}
                      >
                        <option value="">Categoria...</option>
                        {eligibleCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-secondary"
                        disabled={!selectedCategory[item.id]}
                        onClick={() => onConfirm(item.id, selectedCategory[item.id])}
                      >
                        Criar
                      </button>
                      <button className="delete-btn" onClick={() => onIgnore(item.id)}>
                        Ignorar
                      </button>
                    </div>
                  )}

                  {(item.status === "CONFIRMADO" || item.status === "IGNORADO") && (
                    <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
