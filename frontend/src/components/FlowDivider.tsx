// Elemento de assinatura do Tino: uma linha que sobe e desce como um fluxo de caixa.
// Usado com moderação — só nas telas de autenticação, como marca sutil da identidade.
export function FlowDivider() {
  return (
    <svg
      className="flow-divider"
      viewBox="0 0 320 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 16 C 30 16, 30 4, 60 4 S 90 20, 120 20 S 150 8, 180 8 S 210 18, 240 18 S 270 6, 300 6 L 320 6"
        stroke="#1F6F5C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
