import { Link } from "react-router-dom";

export function TermsOfService() {
  return (
    <div className="auth-screen" style={{ alignItems: "flex-start", paddingTop: 48 }}>
      <div className="auth-card" style={{ maxWidth: 640, textAlign: "left" }}>
        <div className="auth-brand">Tino</div>
        <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 4 }}>Termos de Uso</h1>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 24 }}>
          Última atualização: agosto de 2026
        </p>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>1. O que é o Tino</h3>
          <p>
            Uma ferramenta de gestão financeira pra MEI e autônomo, com um motor de insights que analisa seus
            próprios lançamentos pra avisar sobre padrões de gasto, orçamento e prazos fiscais. O Tino não é
            um contador, não presta consultoria financeira ou fiscal, e os insights são estimativas baseadas
            no que você lança — sempre confirme decisões importantes com um profissional.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>2. Sua conta</h3>
          <p>
            Você é responsável por manter sua senha em sigilo e por tudo que for lançado na sua conta. Os
            dados que você insere (transações, valores, categorias) são seus — o Tino só processa pra exibir
            os relatórios e insights.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>3. Planos e cobrança</h3>
          <p>
            O plano Free tem uso permanente dentro dos limites descritos na página de Planos. Planos pagos são
            cobrados por assinatura recorrente quando o pagamento estiver ativo; cancelamento interrompe a
            renovação e a conta volta ao Free ao fim do período já pago.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>4. Uso aceitável</h3>
          <p>
            Não use o Tino pra armazenar dado de terceiro sem autorização, tentar acessar conta alheia, ou
            sobrecarregar o serviço de propósito. Contas usadas assim podem ser suspensas.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>5. Disponibilidade</h3>
          <p>
            Fazemos o possível pra manter o serviço no ar, mas não garantimos disponibilidade ininterrupta.
            Recomendamos manter seus próprios registros/backups pra além do que o Tino guarda.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>6. Encerramento</h3>
          <p>
            Você pode excluir sua conta a qualquer momento em <Link to="/configuracoes">Configurações</Link>.
            Isso remove permanentemente seus dados, conforme descrito na{" "}
            <Link to="/privacidade">Política de Privacidade</Link>.
          </p>
        </section>

        <p className="auth-switch">
          <Link to="/">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
