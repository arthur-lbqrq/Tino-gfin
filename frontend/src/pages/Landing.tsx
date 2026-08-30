import { useState } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "@/hooks/useReveal";
import { FlowDivider } from "@/components/FlowDivider";
import { Logo } from "@/components/Logo";
import "./Landing.css";

const PRICES = {
  mensal: { pro: "R$ 29,90", biz: "R$ 69,90", suffix: "/ mês" },
  anual: { pro: "R$ 23,90", biz: "R$ 55,90", suffix: "/ mês, no anual" },
};

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="landing-check-icon" aria-hidden="true">
      <polyline points="3,10 7,14 15,4" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PulseDot({ size = 9 }: { size?: number }) {
  return <span className="landing-pulse-dot" style={{ width: size, height: size }} />;
}

export function Landing() {
  const [billingCycle, setBillingCycle] = useState<"mensal" | "anual">("mensal");
  const prices = PRICES[billingCycle];

  const problemaRef = useReveal<HTMLDivElement>();
  const comoRef = useReveal<HTMLDivElement>();
  const diferencialRef = useReveal<HTMLDivElement>();
  const paraquemRef = useReveal<HTMLDivElement>();
  const segurancaRef = useReveal<HTMLDivElement>();
  const planosRef = useReveal<HTMLDivElement>();
  const faqRef = useReveal<HTMLDivElement>();
  const ctaFinalRef = useReveal<HTMLDivElement>();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="wrap landing-nav-row">
          <Logo size={17} wordmarkFontSize={22} />
          <div className="landing-nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#diferencial">Diferencial</a>
            <a href="#planos">Planos</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-login mono">
              Entrar
            </Link>
            <Link to="/register" className="btn-primary landing-btn-mono">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="wrap landing-hero-grid">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">
              <PulseDot />
              Gestão financeira para pequenos negócios
            </div>
            <h1>
              Sua empresa já sabe quanto gastou. O Faro mostra{" "}
              <em>o que isso significa</em> antes que vire problema.
            </h1>
            <p className="landing-sub">
              Alertas sobre o que realmente importa no seu caixa — com dias de
              antecedência, não no fim do mês.
            </p>
            <div className="landing-cta-row">
              <Link to="/register" className="btn-primary landing-btn-lg landing-btn-mono">
                Começar gratuitamente
              </Link>
              <a href="#como-funciona" className="landing-btn-ghost">
                Ver como funciona
              </a>
            </div>
            <div className="landing-reassurance mono">
              <span>Grátis para começar</span>
              <span>·</span>
              <span>Sem cartão de crédito</span>
              <span>·</span>
              <span>Feito para o MEI brasileiro</span>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-hero-card">
              <div className="landing-hero-card-head">
                <div>
                  <div className="landing-hero-card-kicker mono">Projeção de caixa · 45 dias</div>
                  <div className="landing-hero-card-title">Doces da Bia · setembro</div>
                </div>
                <div className="landing-hero-card-alert mono">● ALERTA</div>
              </div>
              <svg
                viewBox="0 0 520 250"
                role="img"
                aria-label="Gráfico mostrando saldo estável seguido de uma projeção de queda com aviso antecipado"
              >
                <rect x="0" y="168" width="520" height="82" fill="var(--brand-soft)" />
                <line x1="0" y1="168" x2="520" y2="168" stroke="var(--brand)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="4" y="186" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--brand-strong)">
                  zona de risco
                </text>
                <line x1="0" y1="34" x2="520" y2="34" stroke="var(--surface-alt)" strokeWidth="1" />
                <line x1="0" y1="101" x2="520" y2="101" stroke="var(--surface-alt)" strokeWidth="1" />
                <line x1="286" y1="0" x2="286" y2="250" stroke="var(--ink-disabled)" strokeWidth="1" strokeDasharray="3 4" />
                <text x="292" y="14" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-faint)">
                  hoje
                </text>
                <polyline
                  points="0,74 52,64 104,90 156,54 208,78 260,102 286,92"
                  fill="none"
                  stroke="var(--signal-mint)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  points="286,92 332,120 372,146 396,168"
                  fill="none"
                  stroke="var(--signal-mint)"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                  strokeLinecap="round"
                />
                <polyline
                  points="396,168 440,196 480,188 520,220"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                  strokeLinecap="round"
                />
                <circle cx="396" cy="168" r="6" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2.5" />
                <text x="0" y="24" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-faint)">
                  R$ 2.310
                </text>
                <text x="470" y="240" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--brand-strong)">
                  −R$ 384
                </text>
              </svg>
              <div className="landing-hero-callout">
                <PulseDot size={8} />
                <div className="landing-hero-callout-text">caixa negativo em 18 dias</div>
                <div className="landing-hero-callout-date mono">18/09</div>
              </div>
            </div>
            <p className="landing-chart-caption mono">projeção baseada no seu padrão de gastos atual</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="wrap landing-problema-wrap reveal" ref={problemaRef}>
          <div className="landing-kicker">O problema</div>
          <h2>Planilha mostra o passado. Você precisa saber o que vem a seguir.</h2>
          <p className="landing-body-text">
            A maioria dos donos de pequenos negócios só descobre que o caixa vai
            apertar quando ele já apertou. Entre lançar despesas e perceber o
            padrão por trás delas existe um espaço onde ainda dá tempo de agir —
            e é exatamente aí que o Faro entra.
          </p>
          <div className="landing-stats-row">
            <div className="landing-stat">
              <div className="landing-stat-value mono">18 dias</div>
              <div className="landing-stat-label mono">de antecedência média do primeiro alerta de caixa</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value mono">3 min</div>
              <div className="landing-stat-label mono">do cadastro até a primeira previsão real</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value mono">0</div>
              <div className="landing-stat-label mono">planilhas para manter atualizadas</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="como-funciona">
        <div className="wrap">
          <div className="reveal" ref={comoRef}>
            <div className="landing-como-head">
              <div className="landing-kicker">Como funciona</div>
              <h2>Três passos entre lançar uma despesa e agir antes que ela vire problema.</h2>
            </div>
            <div className="landing-steps">
              <div className="card landing-step">
                <div className="landing-step-num">
                  <span className="mono landing-step-num-n">01</span>
                  <span className="mono landing-step-num-label">registre</span>
                </div>
                <h3>Lance em segundos</h3>
                <p>
                  Receitas e despesas com categorias que já fazem sentido pro seu
                  negócio, sem burocracia de planilha. Pix e extrato entram
                  automaticamente.
                </p>
                <div className="landing-step-proof">
                  <div className="landing-step-proof-row">
                    <span>Venda balcão</span>
                    <span className="mono landing-proof-positive">+ 180</span>
                  </div>
                  <div className="landing-step-proof-row">
                    <span>Embalagens</span>
                    <span className="mono">− 96</span>
                  </div>
                </div>
              </div>

              <div className="card landing-step">
                <div className="landing-step-num">
                  <span className="mono landing-step-num-n">02</span>
                  <span className="mono landing-step-num-label">acompanhe</span>
                </div>
                <h3>Veja o painel completo</h3>
                <p>
                  Saldo, receitas, despesas e resultado do período num painel
                  único — com a projeção dos próximos 45 dias sempre à vista.
                </p>
                <div className="landing-step-kpis">
                  <div className="landing-step-kpi">
                    <div className="mono landing-step-kpi-label">SALDO</div>
                    <div className="mono landing-step-kpi-value">R$ 2.310</div>
                  </div>
                  <div className="landing-step-kpi">
                    <div className="mono landing-step-kpi-label">DESPESAS</div>
                    <div className="mono landing-step-kpi-value landing-proof-negative">+27%</div>
                  </div>
                </div>
              </div>

              <div className="card landing-step landing-step-alert">
                <div className="landing-step-num">
                  <span className="mono landing-step-num-n">03</span>
                  <span className="mono landing-step-num-label landing-step-num-label-crit">antecipe</span>
                </div>
                <h3>Receba o aviso certo</h3>
                <p>
                  O alerta chega no app e no WhatsApp quando algo sai do seu
                  padrão — com a saída que resolve, não só o susto.
                </p>
                <div className="landing-step-proof">
                  <div className="landing-step-alert-ticket">
                    Caixa negativo em <strong>18 dias</strong>
                  </div>
                  <div className="landing-step-before-after">
                    <span className="mono landing-before">18</span>
                    <span className="landing-arrow">→</span>
                    <span className="mono landing-after">34</span>
                    <span className="mono landing-before-after-label">dias, adiando 1 boleto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section-dark" id="diferencial">
        <div className="wrap landing-diferencial-grid reveal" ref={diferencialRef}>
          <div className="landing-diferencial-copy">
            <div className="landing-kicker landing-kicker-dark">
              <PulseDot />
              O diferencial
            </div>
            <h2>Não é um relatório. É um aviso, no momento em que ainda dá tempo de agir.</h2>
            <p className="landing-body-text landing-body-text-dark">
              Isso é o que separa o Faro de mais um dashboard financeiro:{" "}
              <strong>ele interpreta os seus dados</strong> e te avisa do que
              importa enquanto ainda é uma escolha — não um fato consumado.
            </p>
            <div className="landing-diferencial-note">
              <div className="mono landing-diferencial-note-kicker">E QUANDO ADIAR NÃO RESOLVE</div>
              <div>O Faro diz. Mostra os 3 dias que você ganhou, nomeia a nova causa e sugere o que de fato resolve.</div>
            </div>
          </div>

          <div className="insight-list landing-insight-list">
            <div className="insight-ticket warning">
              <span className="bar" />
              <div className="body landing-ticket-body">
                <div className="landing-ticket-head">
                  <span className="tag">Atenção · despesas</span>
                  <span className="mono landing-ticket-time">hoje 08:14</span>
                </div>
                <span className="message">
                  Suas despesas previstas para setembro estão <strong>27% acima</strong> da
                  média dos últimos 3 meses.
                </span>
              </div>
            </div>
            <div className="insight-ticket critical">
              <span className="bar" />
              <div className="body landing-ticket-body">
                <div className="landing-ticket-head">
                  <span className="tag">Crítico · caixa</span>
                  <span className="mono landing-ticket-time">hoje 08:14</span>
                </div>
                <span className="message">
                  Nesse ritmo, seu caixa fica negativo em <strong>18 dias</strong>.
                </span>
                <div className="landing-ticket-footer">
                  <span>Adie o boleto do dia 12 para o dia 22 — o mês fecha positivo.</span>
                  <span className="mono landing-ticket-action">Adiar</span>
                </div>
              </div>
            </div>
            <div className="insight-ticket warning">
              <span className="bar" />
              <div className="body landing-ticket-body">
                <div className="landing-ticket-head">
                  <span className="tag">Atenção · fornecedores</span>
                  <span className="mono landing-ticket-time">ontem</span>
                </div>
                <span className="message">
                  Seus gastos com fornecedores aumentaram <strong>18%</strong> neste mês.
                </span>
              </div>
            </div>
            <div className="mono landing-diferencial-legend">exemplos reais do motor · é assim que o aviso chega</div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="wrap landing-paraquem-grid reveal" ref={paraquemRef}>
          <div>
            <div className="landing-kicker">Para quem é</div>
            <h2>Feito para quem cuida do financeiro sozinho.</h2>
            <p className="landing-body-text">
              Sem contador full-time, sem planilha de 40 abas, sem tempo a
              perder decifrando números. O Faro foi desenhado pra quem toca o
              negócio no dia a dia.
            </p>
          </div>
          <div className="landing-check-rows">
            <div className="landing-check-row">
              <CheckIcon />
              <div>MEI e pequenas empresas em fase de crescimento</div>
            </div>
            <div className="landing-check-row">
              <CheckIcon />
              <div>Autônomos que faturam e pagam fornecedores</div>
            </div>
            <div className="landing-check-row">
              <CheckIcon />
              <div>Quem já usa planilha mas sente que não é suficiente</div>
            </div>
            <div className="landing-check-row landing-check-row-last">
              <CheckIcon />
              <div>Quem quer decisão baseada em dado, não em achismo</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="wrap landing-seguranca reveal" ref={segurancaRef}>
          <div>
            <div className="landing-kicker">Segurança</div>
            <h2 className="landing-h2-md">Seus dados financeiros protegidos como deveriam ser.</h2>
            <p className="landing-body-text landing-narrow">
              Tratamos informação financeira com o mesmo cuidado que qualquer
              instituição séria trata. Sem venda de dados, sem
              compartilhamento com terceiros.
            </p>
            <div className="mono landing-seg-note">
              Conexões bancárias são somente leitura.
              <br />O Faro nunca movimenta dinheiro.
            </div>
          </div>
          <div className="landing-seg-grid">
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Autenticação</div>
              <p>Senhas com hash bcrypt e sessão protegida por JWT.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Criptografia</div>
              <p>Tráfego sempre criptografado entre você e o Faro.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Privacidade</div>
              <p>Seus dados são seus. Nunca vendidos ou compartilhados.</p>
            </div>
            <div className="card landing-seg-item">
              <div className="landing-seg-tag mono">Controle</div>
              <p>Exclua sua conta e todos os seus dados quando quiser.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="planos">
        <div className="wrap">
          <div className="reveal" ref={planosRef}>
            <div className="landing-plano-head">
              <div className="landing-plano-head-copy">
                <div className="landing-kicker">Planos</div>
                <h2>Comece de graça. Cresça pro plano que faz sentido pro seu momento.</h2>
              </div>
              <div className="landing-billing-toggle-wrap">
                <div className="landing-billing-toggle" role="group" aria-label="Ciclo de cobrança">
                  <button
                    type="button"
                    className={billingCycle === "mensal" ? "active" : ""}
                    aria-pressed={billingCycle === "mensal"}
                    onClick={() => setBillingCycle("mensal")}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    className={billingCycle === "anual" ? "active" : ""}
                    aria-pressed={billingCycle === "anual"}
                    onClick={() => setBillingCycle("anual")}
                  >
                    Anual
                  </button>
                </div>
                <div className="mono landing-billing-discount">−20% no anual</div>
              </div>
            </div>

            <div className="landing-plano-grid">
              <div className="card landing-plano-card">
                <div className="landing-plano-nome">Free</div>
                <div className="landing-plano-preco mono">R$ 0</div>
                <div className="landing-plano-desc">Pra sentir o motor de insights funcionando.</div>
                <ul className="landing-plano-feats">
                  <li>1 conta conectada</li>
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
                <div className="landing-plano-nome landing-plano-nome-crit">Pro</div>
                <div className="landing-plano-preco-row">
                  <div className="landing-plano-preco mono">{prices.pro}</div>
                  <div className="mono landing-plano-preco-suffix">{prices.suffix}</div>
                </div>
                <div className="landing-plano-desc">Pra quem quer antecipar, não só registrar.</div>
                <ul className="landing-plano-feats">
                  <li className="landing-feat-strong">Tudo do Free</li>
                  <li>Contas ilimitadas</li>
                  <li>Todos os alertas inteligentes</li>
                  <li>Orçamento, metas e recorrências</li>
                  <li>Importação de extrato com conciliação</li>
                  <li>Módulo fiscal MEI</li>
                  <li>Alerta crítico por WhatsApp e e-mail</li>
                </ul>
                <Link to="/register" className="landing-plano-btn landing-plano-btn-primary">
                  Começar grátis
                </Link>
              </div>

              <div className="card landing-plano-card">
                <div className="landing-plano-nome">Business</div>
                <div className="landing-plano-preco-row">
                  <div className="landing-plano-preco mono">{prices.biz}</div>
                  <div className="mono landing-plano-preco-suffix">{prices.suffix}</div>
                </div>
                <div className="landing-plano-desc">Pra fechar a conta certo com o seu contador.</div>
                <ul className="landing-plano-feats">
                  <li className="landing-feat-strong">Tudo do Pro</li>
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

      <section className="landing-section landing-section-alt">
        <div className="wrap landing-faq-grid reveal" ref={faqRef}>
          <div>
            <div className="landing-kicker">Dúvidas</div>
            <h2 className="landing-h2-sm">O que costumam perguntar antes de começar.</h2>
          </div>
          <div className="landing-faq-list">
            <div className="landing-faq-item">
              <div className="landing-faq-q">Preciso conectar meu banco?</div>
              <div className="landing-faq-a">
                Não. Três lançamentos fixos já bastam para a primeira previsão.
                Conectar Pix ou Open Finance só deixa o motor mais preciso — e
                é sempre somente leitura.
              </div>
            </div>
            <div className="landing-faq-item">
              <div className="landing-faq-q">Em quanto tempo recebo o primeiro alerta?</div>
              <div className="landing-faq-a">
                A primeira previsão sai no cadastro, em cerca de 3 minutos. Os
                alertas passam a chegar conforme seus lançamentos formam
                padrão — normalmente na primeira semana.
              </div>
            </div>
            <div className="landing-faq-item">
              <div className="landing-faq-q">O Faro pode mexer no meu dinheiro?</div>
              <div className="landing-faq-a">
                Nunca. Ele lê, projeta e avisa. Adiar um boleto, dividir uma
                compra ou cobrar um cliente são ações que só acontecem quando
                você confirma.
              </div>
            </div>
            <div className="landing-faq-item landing-faq-item-last">
              <div className="landing-faq-q">E se eu quiser cancelar?</div>
              <div className="landing-faq-a">
                Cancela dentro do app, sem falar com ninguém. Você pode apagar
                a conta e todos os dados junto.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta-final" id="cta-final">
        <div className="wrap reveal" ref={ctaFinalRef}>
          <FlowDivider />
          <h2>Comece a entender sua empresa antes que os números te surpreendam.</h2>
          <p className="landing-sub landing-cta-final-sub">
            Grátis pra começar. Sem cartão de crédito.
          </p>
          <Link to="/register" className="btn-primary landing-btn-lg landing-btn-mono">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="wrap landing-footer-row">
          <Logo size={15} wordmarkFontSize={21} textColor="var(--on-dark-text)" />
          <div className="landing-footer-links">
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos de uso</Link>
          </div>
          <div className="mono landing-footer-copyright">© 2026 Faro. Gestão financeira para pequenos negócios.</div>
        </div>
      </footer>
    </div>
  );
}
