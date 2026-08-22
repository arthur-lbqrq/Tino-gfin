import { Link } from "react-router-dom";
import { ImportBatch } from "@/lib/types";

interface ImportBatchListProps {
  batches: ImportBatch[];
  onDelete: (batchId: string) => void;
}

export function ImportBatchList({ batches, onDelete }: ImportBatchListProps) {
  if (batches.length === 0) {
    return <div className="card empty-state">Nenhum extrato importado ainda.</div>;
  }

  return (
    <div className="card">
      <div className="table-scroll">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Conta</th>
              <th>Formato</th>
              <th>Linhas</th>
              <th>Importado em</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>
                  <Link to={`/importar/${batch.id}`} style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
                    {batch.fileName}
                  </Link>
                </td>
                <td>{batch.account?.name}</td>
                <td>{batch.format}</td>
                <td>{batch._count?.items ?? 0}</td>
                <td>{new Date(batch.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  <button className="delete-btn" onClick={() => onDelete(batch.id)} aria-label="Excluir importação">
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
