// Elemento de assinatura do Faro: uma linha que sobe e desce como um fluxo de caixa.
// Usado com moderação — só nas telas de autenticação, como marca sutil da identidade.
export function FlowDivider() {
  return (
    <svg
      className="flow-divider"
      viewBox="0 0 220 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polyline
        points="0,20 30,20 44,7 58,25 72,12 86,20 130,20 146,9 162,22 178,15 192,20 220,20"
        stroke="#E04A32"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
