import { Link } from "react-router-dom";
import { useReveal } from "@/hooks/useReveal";
import { FlowDivider } from "@/components/FlowDivider";
import "./Landing.css";

export function Landing() {
  const problemaRef = useReveal<HTMLDivElement>();
  const comoRef = useReveal<HTMLDivElement>();
  const diferencialRef = useReveal<HTMLDivElement>();
  const paraquemRef = useReveal<HTMLDivElement>();
  const segurancaRef = useReveal<HTMLDivElement>();
  const planosRef = useReveal<HTMLDivElement>();
  const ctaFinalRef = useReveal<HTMLDivElement>();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="wrap">
          <div className="landing-logo">Tino</div>
          <div className="landing-nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#diferencial">Diferencial</a>
            <a href="#planos">Planos</a>
          </div>
          <Link to="/register" className="btn-primary">
            Começar grátis
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="wrap landing-hero-grid">
          <div>
            <div className="landing-eyebrow">Gestão financeira para pequenos negócios</div>
            <h1>
              Sua empresa já sabe quanto gastou.
              <br />O Tino mostra <em>o que isso significa</em> antes que vire
              problema.
            </h1>
            <p className="landing-sub">
              Alertas inteligentes sobre o que realmente importa no seu caixa —
              não só mais um extrato bonito.
            </p>
            <div className="landing-cta-row">
              <Link to="/register" className="btn-primary landing-btn-lg">
                Começar gratuitamente
              </Link>
              <a href="#como-funciona" className="landing-btn-ghost">
                Ver como funciona
              </a>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-hero-card">
            <svg
              viewBox="0 0 420 260"
              role="img"
              aria-label="Gráfico mostrando saldo estável seguido de uma projeção de queda com aviso antecipado"
            >
              <line x1="0" y1="65" x2="420" y2="65" stroke="var(--border)" strokeWidth="1" />
              <line x1="0" y1="130" x2="420" y2="130" stroke="var(--border)" strokeWidth="1" />
              <line x1="0" y1="195" x2="420" y2="195" stroke="var(--border)" strokeWidth="1" />
              <path
                d="M0,150 C40,145 60,120 90,125 C120,130 140,100 175,105 C205,110 220,90 250,95"
                fill="none"
                stroke="var(--primary-dark)"
                strokeWidth="2.4"
              />
              <path
                d="M250,95 C275,98 290,140 315,175 C340,208 360,225 400,232"
                fill="none"
                stroke="var(--signal-amber)"
                strokeWidth="2.4"
                strokeDasharray="6 6"
              />
              <line x1="250" y1="30" x2="250" y2="240" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
              <text x="250" y="20" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-faint)">
                hoje
              </text>
              <circle cx="250" cy="95" r="3.5" fill="var(--primary-dark)" />
              <circle cx="360" cy="222" r="4.5" fill="var(--signal-amber)" />
              <g transform="translate(300,235)">
                <rect x="0" y="0" width="118" height="30" rx="5" fill="#ffffff" stroke="var(--border)" />
                <text x="59" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--ink-faint)">
                  caixa negativo em
                </text>
                <text x="59" y="25" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight={700} fill="var(--signal-amber)">
                  18 dias
                </text>
              </g>
            </svg>
            </div>
            <p className="landing-chart-caption">projeção baseada no seu padrão de gastos atual</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="wrap landing-narrow reveal" ref={problemaRef}>
          <div className="landing-kicker">O problema</div>
          <h2>Planilha mostra o passado. Você precisa saber o que vem a seguir.</h2>
          <p className="landing-body-text">
            A maioria dos donos de pequenos negócios só descobre que o caixa vai
            apertar quando ele já apertou. Entre lançar despesas e perceber o
            padrão por trás delas, existe um espaço onde dá tempo de agir — e é
            exatamente aí que o Tino entra.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="como-funciona">
        <div className="wrap">
          <div className="reveal" ref={comoRef}>
            <div className="landing-kicker">Como funciona</div>
            <h2 className="landing-narrow">Três passos entre lançar uma despesa e agir antes que ela vire problema.</h2>
            <div className="landing-steps">
              <div className="card landing-step">
                <div className="landing-step-num mono">01 / registre</div>
                <h3>Lance em segundos</h3>
                <p>Receitas e despesas com categorias que já fazem sentido pro seu negócio, sem burocracia de planilha.</p>
              </div>
              <div className="card landing-step">
                <div className="landing-step-num mono">02 / acompanhe</div>
                <h3>Veja o painel completo</h3>
                <p>Saldo, receitas, despesas e resultado do período, num painel único e claro.</p>
              </div>
              <div className="card landing-step">
                <div className="landing-step-num mono">03 / antecipe</div>
                <h3>Receba o aviso certo</h3>
                <p>Alertas quando algo sair do seu padrão normal, com tempo real de reação antes de impactar o caixa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="diferencial">
        <div className="wrap landing-narrow-wide reveal" ref={diferencialRef}>
          <div className="landing-kicker">O diferencial</div>
          <h2>Não é um relatório. É um aviso, no momento em que ainda dá tempo de agir.</h2>
          <div className="insight-list landing-insight-list">
            <div className="insight-ticket warning">
              <span className="bar" />
              <div className="body">
                <span className="tag">Atenção</span>
                <span className="message">Suas despesas previstas para setembro estão 27% acima da média dos últimos 3 meses.</span>
              </div>
            </div>
            <div className="insight-ticket critical">
              <span className="bar" />
              <div className="body">
                <span className="tag">Crítico</span>
                <span className="message">Nesse ritmo, seu caixa fica negativo em 18 dias.</span>
              </div>
            </div>
            <div className="insight-ticket warning">
              <span className="bar" />
              <div className="body">
                <span className="tag">Atenção</span>
                <span className="message">Seus gastos com fornecedores aumentaram 18% neste mês.</span>
              </div>
            </div>
          </div>
          <p className="landing-rodape">
            Isso é o que separa o Tino de mais um dashboard financeiro:{" "}
            <strong>ele interpreta os seus dados</strong> e te avisa do que
            importa, na hora em que isso ainda é uma escolha — não um fato
            consumado.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="wrap landing-narrow-wide reveal" ref={paraquemRef}>
          <div className="landing-kicker">Para quem é</div>
          <h2>Feito para quem cuida do financeiro sozinho.</h2>
          <p className="landing-body-text">
            Sem contador full-time, sem planilha de 40 abas, sem tempo a perder
            decifrando números. O Tino foi desenhado pra quem toca o negócio no
            dia a dia.
          </p>
          <ul className="landing-checklist">
            <li>MEI e pequenas empresas em fase de crescimento</li>
            <li>Autônomos que faturam e pagam fornecedores</li>
            <li>Quem já usa planilha mas sente que não é suficiente</li>
            <li>Quem quer decisão baseada em dado, não em achismo</li>
          </ul>
        </div>
      </section>

      <section className="landing-section">
        <div className="wrap landing-seguranca reveal" ref={segurancaRef}>
          <div>
            <div className="landing-kicker">Segurança</div>
            <h2 className="landing-narrow">Seus dados financeiros protegidos como deveriam ser.</h2>
            <p className="landing-body-text landing-narrow">
              Tratamos informação financeira com o mesmo cuidado que qualquer
              instituição séria trata. Sem venda de dados, sem compartilhamento
              com terceiros.
            </p>
          </div>
          <div className="landing-seg-grid">
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Autenticação</div>
              <p>Senhas com hash bcrypt e sessão protegida por JWT.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Criptografia</div>
              <p>Tráfego de dados sempre criptografado entre você e o Tino.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Privacidade</div>
              <p>Seus dados são seus. Nunca vendidos ou compartilhados com terceiros.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Controle</div>
              <p>Exclua sua conta e todos os seus dados quando quiser, sem pedir permissão a ninguém.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="planos">
        <div className="wrap">
          <div className="reveal" ref={planosRef}>
            <div className="landing-kicker" style={{ textAlign: "center" }}>
              Planos
            </div>
            <h2 className="landing-narrow" style={{ textAlign: "center", margin: "0 auto 48px" }}>
              Comece de graça. Cresça pro plano que faz sentido pro seu momento.
            </h2>
            <div className="landing-plano-grid">
              <div className="card landing-plano-card">
                <div className="landing-plano-nome">Free</div>
                <div className="landing-plano-preco mono">R$0</div>
                <div className="landing-plano-desc">Pra sentir o motor de insights funcionando.</div>
                <ul className="landing-plano-feats">
                  <li>1 conta</li>
                  <li>Transações ilimitadas</li>
                  <li>Painel de saldo e resultado</li>
                  <li>2 alertas inteligentes básicos</li>
                  <li className="off">Orçamento, metas e recorrências</li>
                  <li className="off">Importação de extrato e MEI</li>
                </ul>
                <Link to="/register" className="landing-plano-btn">
                  Começar grátis
                </Link>
              </div>
              <div className="card landing-plano-card landing-plano-destaque">
                <span className="landing-plano-badge">Mais popular</span>
                <div className="landing-plano-nome">Pro</div>
                <div className="landing-plano-preco mono">
                  R$29,90 <span>/ mês</span>
                </div>
                <div className="landing-plano-desc">Pra quem quer antecipar, não só registrar.</div>
                <ul className="landing-plano-feats">
                  <li>Tudo do Free</li>
                  <li>Contas ilimitadas</li>
                  <li>Todos os alertas inteligentes</li>
                  <li>Orçamento, metas e recorrências</li>
                  <li>Importação de extrato com conciliação</li>
                  <li>Módulo fiscal MEI</li>
                  <li>Alerta crítico por e-mail</li>
                </ul>
                <Link to="/register" className="landing-plano-btn landing-plano-btn-primary">
                  Começar grátis
                </Link>
              </div>
              <div className="card landing-plano-card">
                <div className="landing-plano-nome">Business</div>
                <div className="landing-plano-preco mono">
                  R$69,90 <span>/ mês</span>
                </div>
                <div className="landing-plano-desc">Pra fechar a conta certo com o seu contador.</div>
                <ul className="landing-plano-feats">
                  <li>Tudo do Pro</li>
                  <li>DRE simplificado e comparativo de períodos</li>
                  <li>Exportação de relatórios (PDF, Excel e CSV)</li>
                </ul>
                <Link to="/register" className="landing-plano-btn">
                  Começar grátis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta-final" id="cta-final">
        <div className="wrap reveal" ref={ctaFinalRef}>
          <FlowDivider />
          <h2>Comece a entender sua empresa antes que os números te surpreendam.</h2>
          <p className="landing-sub" style={{ margin: "16px auto 28px" }}>
            Grátis pra começar. Sem cartão de crédito.
          </p>
          <Link to="/register" className="btn-primary landing-btn-lg">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="wrap landing-footer-row">
          <div className="landing-logo">Tino</div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos de uso</Link>
          </div>
          <div className="mono">© 2026 Tino. Gestão financeira para pequenos negócios.</div>
        </div>
      </footer>
    </div>
  );
}
