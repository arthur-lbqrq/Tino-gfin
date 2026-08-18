import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  return (
    <div className="auth-screen" style={{ alignItems: "flex-start", paddingTop: 48 }}>
      <div className="auth-card" style={{ maxWidth: 640, textAlign: "left" }}>
        <div className="auth-brand">Tino</div>
        <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 4 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 24 }}>
          Última atualização: agosto de 2026
        </p>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>1. Que dados coletamos</h3>
          <p>
            Nome e e-mail no cadastro. As transações, contas, categorias, orçamentos e metas que você mesmo
            lança no Tino — inclusive quando importadas de um extrato bancário que você envia. Dados técnicos
            básicos de erro (quando algo quebra) pra conseguirmos corrigir.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>2. Pra que usamos</h3>
          <p>
            Só pra operar o Tino: calcular seus saldos e relatórios, gerar os insights sobre seus próprios
            dados financeiros, processar sua assinatura quando aplicável, e te avisar por e-mail sobre alertas
            críticos que você mesmo optou por receber. Não vendemos nem compartilhamos seus dados financeiros
            com terceiros pra publicidade.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>3. Onde seus dados ficam</h3>
          <p>
            Num banco de dados hospedado por um provedor de nuvem, com backup. Se você configurar integração
            de pagamento ou notificação por e-mail, o mínimo necessário (e-mail, identificador de cobrança)
            passa também pelo provedor daquele serviço, só pra cumprir a função dele.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>4. Seus direitos (LGPD)</h3>
          <p>
            Você pode pedir a qualquer momento: acesso a tudo que temos sobre você, correção de dado errado,
            exportação dos seus dados, e exclusão completa da sua conta — direto na tela de{" "}
            <Link to="/configuracoes">Configurações</Link>, sem precisar abrir chamado. A exclusão remove a
            conta e tudo vinculado a ela (transações, contas, orçamentos, metas) e não tem volta.
          </p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>5. Quanto tempo guardamos</h3>
          <p>
            Enquanto sua conta existir. Se você excluir a conta, os dados são apagados do banco principal
            imediatamente; cópias de backup expiram seguindo a rotina normal de retenção do provedor de
            hospedagem.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>6. Contato</h3>
          <p>Dúvida sobre seus dados ou essa política: fale com quem administra o Tino pelo e-mail de suporte.</p>
        </section>

        <p className="auth-switch">
          <Link to="/">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
