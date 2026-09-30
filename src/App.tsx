import { useEffect, useState } from "react";
import { IonApp, IonButton, IonIcon } from "@ionic/react";
import {
  arrowDownOutline,
  arrowForwardOutline,
  analyticsOutline,
  bagHandleOutline,
  checkmarkDoneOutline,
  cloudOutline,
  fileTrayStackedOutline,
  layersOutline,
  lockClosedOutline,
  menuOutline,
  pricetagOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  timeOutline,
  trendingUpOutline,
} from "ionicons/icons";
import type { User } from "firebase/auth";
import AuthModal from "./components/AuthModal";
import Estimator from "./components/Estimator";
import OrderWorkspace from "./components/OrderWorkspace";
import { loadDemoDemands, removeDemand, saveDemand, subscribeDemands } from "./lib/demandStore";
import { firebaseConfigured, getFirebaseContext } from "./lib/firebase";
import type { Demand, DemandDraft, DemandStage } from "./lib/types";

const team = [
  "Enzo Rassani",
  "Eric Maggi",
  "Joaquim Macario",
  "Leonardo Fumagalli",
  "Millena Mitsue",
  "Victor Gabriel",
];

function Header({ onOpenAuth, isSignedIn }: { onOpenAuth: () => void; isSignedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["#solucao", "Solução"],
    ["#como-funciona", "Como funciona"],
    ["#painel", "Painel"],
    ["#simulador", "Simulador"],
    ["#equipe", "Equipe"],
  ];

  return (
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand-link" href="#top" aria-label="SoftNorth, início">
          <img src="/assets/logo-softnorth.png" alt="SoftNorth" />
        </a>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <IonIcon icon={menuOutline} />
        </button>
        <nav className={`site-nav ${menuOpen ? "nav-open" : ""}`} aria-label="Navegação principal">
          {links.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <IonButton className="nav-cta" size="small" onClick={() => { setMenuOpen(false); onOpenAuth(); }}>
            <IonIcon icon={isSignedIn ? checkmarkDoneOutline : lockClosedOutline} slot="start" />
            {isSignedIn ? "Minha conta" : "Acessar"}
          </IonButton>
        </nav>
      </div>
    </header>
  );
}

function LandingHero({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [heroImageError, setHeroImageError] = useState(false);
  return (
    <section className="hero-section" id="top">
      <div className="hero-shell">
        <div className="hero-copy">
          <span className="hero-eyebrow"><span className="eyebrow-dot" /> SaaS de pedidos personalizados · TechRiar</span>
          <h1>Menos papel.<br /><span>Mais fluxo</span> em cada pedido.</h1>
          <p className="hero-lede">
            O SoftNorth reúne especificações, estimativas e etapas de produção em um só lugar —
            pensado para a rotina de brindes personalizados da North Bag.
          </p>
          <div className="hero-actions">
            <IonButton size="large" href="#painel">Explorar a demonstração <IonIcon icon={arrowForwardOutline} slot="end" /></IonButton>
            <IonButton size="large" fill="clear" onClick={onOpenAuth}><IonIcon icon={lockClosedOutline} slot="start" /> Acesso da equipe</IonButton>
          </div>
          <div className="hero-trust">
            <span className="trust-avatar"><IonIcon icon={bagHandleOutline} /></span>
            <p><strong>Feito para organizar a operação.</strong><br />Da especificação ao acompanhamento da entrega.</p>
          </div>
        </div>
        <div className="hero-visual-wrap">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <figure className="hero-visual">
            <img src={heroImageError ? "/assets/softnorth-hero-fallback.svg" : "/manus-storage/async-images/vkNO3ao0o3ASjJVpuVYAYj/image-1.webp"} onError={() => setHeroImageError(true)} alt="Sacola de tecido cru em uma bancada de produção de brindes personalizados; imagem ilustrativa" />
            <figcaption className="image-caption"><span className="caption-mark"><IonIcon icon={sparklesOutline} /></span><span><strong>Produtos sob medida</strong><small>Visual ilustrativo · sem marca comercial</small></span></figcaption>
          </figure>
          <div className="floating-order-card">
            <div className="floating-order-head"><span className="floating-check"><IonIcon icon={checkmarkDoneOutline} /></span><span className="floating-status">EM PRODUÇÃO</span></div>
            <strong>Pedido acompanhado</strong>
            <div className="mini-progress"><span /></div>
            <span className="floating-order-foot">Arte aprovada <b>•</b> Próxima etapa: entrega</span>
          </div>
          <div className="floating-measure"><IonIcon icon={pricetagOutline} /><span>Medidas no pedido<br /><strong>Prontas para revisar</strong></span></div>
        </div>
      </div>
      <div className="hero-bottom-line"><span>ORÇAMENTO</span><i /><span>ARTE</span><i /><span>PRODUÇÃO</span><i /><span>ENTREGA</span><IonIcon icon={arrowDownOutline} /></div>
    </section>
  );
}

function SolutionSection() {
  const features = [
    { icon: fileTrayStackedOutline, title: "Informações em um registro", text: "Centralize especificações e observações do pedido, sem depender de papéis e mensagens espalhadas." },
    { icon: pricetagOutline, title: "Estimativa mais clara", text: "Use as medidas da peça para simular o consumo de material com premissas que podem ser revisadas." },
    { icon: analyticsOutline, title: "Etapas visíveis", text: "Identifique em que ponto cada pedido está e enxergue a distribuição entre orçamento, arte e produção." },
    { icon: timeOutline, title: "Prazos à vista", text: "Consulte as previsões de entrega para ajudar a equipe a priorizar o trabalho." },
  ];

  return (
    <section className="solution-section section-shell" id="solucao">
      <div className="section-intro solution-intro">
        <span className="eyebrow">O desafio · a proposta</span>
        <h2>De anotações dispersas<br />a um fluxo que dá para acompanhar.</h2>
        <p>
          Em operações de produção sob medida, dados de clientes, quantidades e especificações podem
          ficar espalhados. O SoftNorth propõe organizar essas informações e facilitar a gestão do pedido.
        </p>
      </div>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <article className="feature-card" key={feature.title}>
            <span className={`feature-icon feature-tone-${index + 1}`}><IonIcon icon={feature.icon} /></span>
            <span className="feature-index">0{index + 1}</span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
      <p className="claims-note">São objetivos do produto a validar com a operação; não representam resultados medidos ou garantidos.</p>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { number: "01", title: "Registre o pedido", text: "Cadastre cliente, produto, material, dimensões, quantidade e previsão de entrega." },
    { number: "02", title: "Revise a estimativa", text: "Confira uma simulação de consumo de material com parâmetros editáveis." },
    { number: "03", title: "Acompanhe as etapas", text: "Atualize o fluxo de Orçamento para Arte, Produção e Entrega." },
  ];
  return (
    <section id="como-funciona" className="how-section">
      <div className="section-shell how-shell">
        <div className="how-heading"><span className="eyebrow">Um caminho simples</span><h2>Do pedido à entrega,<br />um passo de cada vez.</h2><p>A demonstração torna visível o fluxo que a equipe pode adaptar à própria rotina.</p></div>
        <div className="how-steps">
          {steps.map((step, index) => (
            <article className="how-step" key={step.number}>
              <span className="how-number">{step.number}</span>
              <span className="how-icon"><IonIcon icon={index === 0 ? bagHandleOutline : index === 1 ? pricetagOutline : checkmarkDoneOutline} /></span>
              <h3>{step.title}</h3><p>{step.text}</p>
              {index < steps.length - 1 && <IonIcon className="step-arrow" icon={arrowForwardOutline} />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="team-section section-shell" id="equipe">
      <div className="team-card">
        <div className="team-copy">
          <span className="eyebrow"><IonIcon icon={cloudOutline} /> Projeto TCC · 3EMIA 2026</span>
          <h2>Tecnologia aplicada<br />à rotina de produção.</h2>
          <p>SoftNorth é a proposta de produto SaaS da TechRiar para ajudar a organizar pedidos e apoiar a precificação na indústria de brindes.</p>
          <div className="team-context"><span>Problema</span><IonIcon icon={arrowForwardOutline} /><span>Processo manual</span><IonIcon icon={arrowForwardOutline} /><span>Gestão digital</span></div>
        </div>
        <div className="team-roster">
          <span className="roster-label">Equipe do projeto</span>
          <div className="team-names">
            {team.map((member, index) => <span className="team-name" key={member}><i>{String(index + 1).padStart(2, "0")}</i>{member}</span>)}
          </div>
          <p>O material compartilhado não informa canais individuais de contato; nenhum e-mail ou telefone foi inventado para esta página.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <a className="footer-brand" href="#top"><img src="/assets/logo-softnorth.png" alt="SoftNorth" /></a>
        <p>Organizar a operação. Acompanhar cada pedido.</p>
        <span className="footer-credit">TechRiar · Projeto acadêmico 3EMIA-2026</span>
      </div>
    </footer>
  );
}

function firebaseError(error: Error): string {
  const code = (error as Error & { code?: string }).code ?? "";
  if (code.includes("permission-denied")) return "O Firebase recusou o acesso. Publique as regras em firestore.rules e confira o projeto configurado.";
  if (code.includes("unavailable")) return "O Firebase está indisponível no momento. Confira sua conexão e tente novamente.";
  return error.message || "Não foi possível acessar os dados. Confira a configuração do Firebase.";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [authOpen, setAuthOpen] = useState(false);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    let unsubscribe: () => void = () => undefined;
    void getFirebaseContext()
      .then(async (context) => {
        if (!context) { setAuthReady(true); return; }
        const { onAuthStateChanged } = await import("firebase/auth");
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(context.auth, (nextUser) => {
          setUser(nextUser);
          setAuthReady(true);
          setDataError("");
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDataError(firebaseError(error instanceof Error ? error : new Error("Falha ao iniciar Firebase.")));
        setAuthReady(true);
      });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setDemands(loadDemoDemands());
      return;
    }
    if (!authReady) return;
    if (!user) {
      setDemands([]);
      return;
    }
    setDataError("");
    return subscribeDemands(user.uid, setDemands, (error) => setDataError(firebaseError(error)));
  }, [authReady, user]);

  async function handleSave(draft: DemandDraft, existing?: Demand): Promise<Demand> {
    setDataError("");
    const saved = await saveDemand(firebaseConfigured ? user?.uid ?? null : null, draft, existing);
    if (!firebaseConfigured) {
      setDemands((current) => {
        const updated = existing
          ? current.map((item) => (item.id === existing.id ? saved : item))
          : [saved, ...current];
        return [...updated].sort((a, b) => a.deadline.localeCompare(b.deadline));
      });
    }
    return saved;
  }

  async function handleDelete(id: string): Promise<void> {
    setDataError("");
    await removeDemand(firebaseConfigured ? user?.uid ?? null : null, id);
    if (!firebaseConfigured) setDemands((current) => current.filter((item) => item.id !== id));
  }

  async function handleStatusChange(demand: Demand, status: DemandStage): Promise<void> {
    const { id: _id, createdAt: _createdAt, ...draft } = demand;
    await handleSave({ ...draft, status }, demand);
  }

  async function handleSignOut(): Promise<void> {
    const context = await getFirebaseContext();
    if (context) {
      const { signOut } = await import("firebase/auth");
      await signOut(context.auth);
    }
  }

  return (
    <IonApp>
      <div className="app-root">
        <Header onOpenAuth={() => setAuthOpen(true)} isSignedIn={Boolean(user)} />
        <main>
          <LandingHero onOpenAuth={() => setAuthOpen(true)} />
          <SolutionSection />
          <HowItWorks />
          <OrderWorkspace
            demands={demands}
            user={user}
            firebaseConfigured={firebaseConfigured}
            dataError={dataError}
            onOpenAuth={() => setAuthOpen(true)}
            onSignOut={() => void handleSignOut()}
            onSave={handleSave}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
          <Estimator />
          <TeamSection />
        </main>
        <Footer />
        <AuthModal open={authOpen} configured={firebaseConfigured} onClose={() => setAuthOpen(false)} onAuthenticated={() => setAuthOpen(false)} />
      </div>
    </IonApp>
  );
}
