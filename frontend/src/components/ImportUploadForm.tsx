import { ChangeEvent, FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Account, ImportBatch, ImportFormat } from "@/lib/types";

interface ImportUploadFormProps {
  accounts: Account[];
  onCreated: (batch: ImportBatch) => void;
}

function detectFormat(fileName: string): ImportFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".ofx")) return "OFX";
  if (lower.endsWith(".csv")) return "CSV";
  return null;
}

export function ImportUploadForm({ accounts, onCreated }: ImportUploadFormProps) {
  const [accountId, setAccountId] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const format = detectFormat(file.name);

    if (!format) {
      setError("Formato não reconhecido. Envie um arquivo .ofx ou .csv.");
      event.target.value = "";
      return;
    }

    if (!accountId) {
      setError("Selecione uma conta antes de escolher o arquivo.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setSubmitting(true);
    try {
      const content = await readFileAsText(file);
      const batch = await api.post<ImportBatch>("/imports", { accountId, fileName: file.name, format, content });
      onCreated(batch);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao importar o arquivo.");
    } finally {
      setSubmitting(false);
      event.target.value = "";
      setFileName("");
    }
  }

  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()} className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Importar extrato</h3>
      <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>
        Envie um extrato em OFX ou CSV do seu banco. O Faro tenta casar cada linha com uma transação já
        lançada e, quando não encontra, deixa pronto pra você confirmar como nova.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="import-account">Conta</label>
          <select id="import-account" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            <option value="">Selecione...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="import-file">Arquivo (.ofx ou .csv)</label>
          <input id="import-file" type="file" accept=".ofx,.csv" onChange={handleFileChange} disabled={submitting} />
        </div>
      </div>

      {submitting && <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Importando {fileName}...</p>}
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}
