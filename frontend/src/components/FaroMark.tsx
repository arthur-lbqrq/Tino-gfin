interface FaroMarkProps {
  size?: number;
  tone?: "ink" | "paper" | "flat";
}

// Símbolo "Bloco": monograma F em negativo num bloco de tinta, com o feixe
// coral atravessando a borda direita — a leitura de farol sem desenhar um
// farol. Grade fixa 48×48; não redesenhe as coordenadas, só troque o tone.
export function FaroMark({ size = 30, tone = "ink" }: FaroMarkProps) {
  const block = tone === "paper" ? "var(--surface)" : "var(--ink)";
  const cut = tone === "paper" ? "var(--ink)" : "var(--bg)";
  const beam = tone === "flat" ? cut : "var(--brand)";

  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="38" height="40" rx="7" fill={block} />
      <rect x="12" y="12" width="5" height="24" fill={cut} />
      <rect x="17" y="12" width="13" height="5" fill={cut} />
      <rect x="17" y="22" width="10" height="5" fill={cut} />
      <rect x="31" y="12" width="14" height="5" fill={beam} />
    </svg>
  );
}
