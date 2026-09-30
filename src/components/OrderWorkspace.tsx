import { useMemo, useState, type FormEvent } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import {
  addOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  clipboardOutline,
  createOutline,
  downloadOutline,
  layersOutline,
  logInOutline,
  logOutOutline,
  searchOutline,
  trashOutline,
} from "ionicons/icons";
import type { User } from "firebase/auth";
import { DEMAND_STAGES, type Demand, type DemandDraft, type DemandStage } from "../lib/types";

interface OrderWorkspaceProps {
  demands: Demand[];
  user: User | null;
  firebaseConfigured: boolean;
  dataError: string;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSave: (draft: DemandDraft, existing?: Demand) => Promise<Demand>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (demand: Demand, status: DemandStage) => Promise<void>;
}

type WorkspaceView = "Resumo" | "Pedidos" | "Fluxo";

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function stageIndex(status: DemandStage): number {
  return DEMAND_STAGES.indexOf(status);
}

function stageClass(status: DemandStage): string {
  if (status === "Orçamento") return "stage-budget";
  if (status === "Arte") return "stage-art";
  if (status === "Produção") return "stage-production";
  return "stage-delivery";
}

function draftFromDemand(demand?: Demand): DemandDraft {
  if (demand) {
    const { id: _id, createdAt: _createdAt, ...draft } = demand;
    return draft;
  }
  return {
    code: "",
    client: "",
    product: "Sacola personalizada",
    quantity: 100,
    material: "TNT",
    width: 35,
    length: 40,
    depth: 10,
    deadline: dateAfter(7),
    status: "Orçamento",
    notes: "",
  };
}

interface OrderFormProps {
  existing?: Demand;
  nextCode: string;
  onSave: (draft: DemandDraft, existing?: Demand) => Promise<Demand>;
  onClose: () => void;
}

function OrderForm({ existing, nextCode, onSave, onClose }: OrderFormProps) {
  const [draft, setDraft] = useState<DemandDraft>(() => draftFromDemand(existing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof DemandDraft>(key: K, value: DemandDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ ...draft, code: existing?.code ?? nextCode }, existing);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o pedido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-form-title">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">{existing ? `Pedido ${existing.code}` : `Novo pedido · ${nextCode}`}</span>
            <h3 id="order-form-title">{existing ? "Editar pedido" : "Adicionar pedido"}</h3>
          </div>
          <button className="icon-close" type="button" aria-label="Fechar formulário" onClick={onClose}>×</button>
        </div>
        <form className="order-form" onSubmit={(event) => void submit(event)}>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Cliente</span>
              <input value={draft.client} onChange={(event) => update("client", event.target.value)} placeholder="Nome da empresa ou cliente" required />
            </label>
            <label className="field field-wide">
              <span>Produto</span>
              <input value={draft.product} onChange={(event) => update("product", event.target.value)} placeholder="Ex.: sacola personalizada" required />
            </label>
            <label className="field">
              <span>Quantidade <small>(un.)</small></span>
              <input type="number" min="1" value={draft.quantity} onChange={(event) => update("quantity", Math.max(1, Number(event.target.value) || 1))} required />
            </label>
            <label className="field">
              <span>Material</span>
              <select value={draft.material} onChange={(event) => update("material", event.target.value)}>
                <option>TNT</option><option>Algodão cru</option><option>Tecido ecológico</option><option>Papel kraft</option><option>Nylon</option>
              </select>
            </label>
            <label className="field">
              <span>Largura <small>(cm)</small></span>
              <input type="number" min="1" value={draft.width} onChange={(event) => update("width", Math.max(1, Number(event.target.value) || 1))} required />
            </label>
            <label className="field">
              <span>Comprimento <small>(cm)</small></span>
              <input type="number" min="1" value={draft.length} onChange={(event) => update("length", Math.max(1, Number(event.target.value) || 1))} required />
            </label>
            <label className="field">
              <span>Profundidade <small>(cm)</small></span>
              <input type="number" min="0" value={draft.depth} onChange={(event) => update("depth", Math.max(0, Number(event.target.value) || 0))} />
            </label>
            <label className="field">
              <span>Previsão de entrega</span>
              <input type="date" value={draft.deadline} onChange={(event) => update("deadline", event.target.value)} required />
            </label>
            <label className="field">
              <span>Etapa</span>
              <select value={draft.status} onChange={(event) => update("status", event.target.value as DemandStage)}>
                {DEMAND_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </label>
            <label className="field field-wide">
              <span>Observações <small>(opcional)</small></span>
              <textarea rows={3} value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Detalhes importantes para acompanhar o pedido" />
            </label>
          </div>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <IonButton fill="clear" onClick={onClose} type="button">Cancelar</IonButton>
            <IonButton type="submit" disabled={busy}>{busy ? "Salvando…" : existing ? "Salvar alterações" : "Criar pedido"}</IonButton>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function OrderWorkspace({
  demands,
  user,
  firebaseConfigured,
  dataError,
  onOpenAuth,
  onSignOut,
  onSave,
  onDelete,
  onStatusChange,
}: OrderWorkspaceProps) {
  const [view, setView] = useState<WorkspaceView>("Resumo");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<DemandStage | "Todos">("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Demand | undefined>();
  const [toast, setToast] = useState("");

  const canManage = !firebaseConfigured || Boolean(user);
  const nextNumber = useMemo(() => {
    const values = demands.map((demand) => Number(demand.code.match(/(\d+)$/)?.[1] ?? 0));
    return Math.max(1023, ...values) + 1;
  }, [demands]);
  const nextCode = `SN-${nextNumber}`;
  const dueSoon = demands.filter((demand) => {
    const days = (new Date(`${demand.deadline}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000;
    return days >= 0 && days <= 7;
  }).length;
  const active = demands.filter((demand) => demand.status === "Arte" || demand.status === "Produção").length;
  const filteredDemands = useMemo(() => demands.filter((demand) => {
    const search = query.trim().toLowerCase();
    const matchesText = !search || [demand.code, demand.client, demand.product, demand.material].some((value) => value.toLowerCase().includes(search));
    const matchesStage = stageFilter === "Todos" || demand.status === stageFilter;
    return matchesText && matchesStage;
  }), [demands, query, stageFilter]);

  async function remove(id: string, code: string) {
    if (!window.confirm(`Remover o pedido ${code}? Esta ação não pode ser desfeita.`)) return;
    try {
      await onDelete(id);
      setToast(`Pedido ${code} removido.`);
      window.setTimeout(() => setToast(""), 3200);
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : "Não foi possível remover o pedido.");
      window.setTimeout(() => setToast(""), 4200);
    }
  }

  async function move(demand: Demand, stage: DemandStage) {
    try {
      await onStatusChange(demand, stage);
      setToast(`${demand.code} atualizado para ${stage}.`);
      window.setTimeout(() => setToast(""), 2600);
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : "Não foi possível atualizar a etapa.");
      window.setTimeout(() => setToast(""), 4200);
    }
  }

  function openNew() {
    if (!canManage) { onOpenAuth(); return; }
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(demand: Demand) {
    if (!canManage) { onOpenAuth(); return; }
    setEditing(demand);
    setShowForm(true);
  }

  const counts = DEMAND_STAGES.map((stage) => ({ stage, count: demands.filter((item) => item.status === stage).length }));
  const maxCount = Math.max(1, ...counts.map((item) => item.count));

  return (
    <section id="painel" className="workspace-section" aria-labelledby="workspace-title">
      <div className="workspace-shell">
        <div className="workspace-topline">
          <div>
            <span className="eyebrow">Visão do produto</span>
            <h2 id="workspace-title">Sua operação, de um só lugar.</h2>
            <p>Organize pedidos e acompanhe o próximo passo sem perder o contexto.</p>
          </div>
          <div className="account-actions">
            <span className={`connection-pill ${firebaseConfigured && user ? "is-connected" : "is-demo"}`}>
              <span className="connection-dot" />
              {firebaseConfigured ? user ? "Firebase · conta ativa" : "Acesso protegido" : "Demonstração local"}
            </span>
            {firebaseConfigured && user ? (
              <IonButton fill="clear" className="account-button" onClick={onSignOut}>
                <IonIcon icon={logOutOutline} slot="start" /> Sair
              </IonButton>
            ) : (
              <IonButton fill="outline" className="account-button" onClick={onOpenAuth}>
                <IonIcon icon={logInOutline} slot="start" /> {firebaseConfigured ? "Entrar" : "Acesso"}
              </IonButton>
            )}
          </div>
        </div>

        {!firebaseConfigured && (
          <div className="demo-banner">
            <span><strong>Ambiente de demonstração.</strong> Os pedidos de exemplo e as alterações são salvos apenas neste navegador.</span>
            <span className="demo-banner-tag">Não são dados reais da North Bag</span>
          </div>
        )}
        {firebaseConfigured && !user && (
          <div className="demo-banner access-banner">
            <span><strong>Entre para acessar seus pedidos.</strong> Os dados são privados por conta e não são exibidos neste modo sem autenticação.</span>
            <IonButton size="small" onClick={onOpenAuth}>Entrar</IonButton>
          </div>
        )}
        {dataError && <div className="inline-error data-error" role="alert">{dataError}</div>}

        <div className="workspace-toolbar">
          <nav className="workspace-tabs" aria-label="Seções do painel">
            {(["Resumo", "Pedidos", "Fluxo"] as const).map((item) => (
              <button type="button" key={item} className={`workspace-tab ${view === item ? "active" : ""}`} onClick={() => setView(item)}>
                {item === "Resumo" && <IonIcon icon={layersOutline} />}
                {item === "Pedidos" && <IonIcon icon={clipboardOutline} />}
                {item === "Fluxo" && <IonIcon icon={arrowForwardOutline} />}
                {item}
              </button>
            ))}
          </nav>
          <IonButton onClick={openNew}>
            <IonIcon icon={addOutline} slot="start" /> Novo pedido
          </IonButton>
        </div>

        {view === "Resumo" && (
          <div className="dashboard-view">
            <div className="metric-grid">
              <article className="metric-card"><span className="metric-icon metric-purple"><IonIcon icon={clipboardOutline} /></span><span className="metric-label">Pedidos acompanhados</span><strong>{demands.length}</strong><small>No fluxo de trabalho</small></article>
              <article className="metric-card"><span className="metric-icon metric-orange"><IonIcon icon={searchOutline} /></span><span className="metric-label">Em orçamento</span><strong>{counts[0]?.count ?? 0}</strong><small>Próxima etapa: arte</small></article>
              <article className="metric-card"><span className="metric-icon metric-blue"><IonIcon icon={layersOutline} /></span><span className="metric-label">Em andamento</span><strong>{active}</strong><small>Arte ou produção</small></article>
              <article className="metric-card"><span className="metric-icon metric-green"><IonIcon icon={checkmarkCircleOutline} /></span><span className="metric-label">Prazo nos próximos 7 dias</span><strong>{dueSoon}</strong><small>Entrega a acompanhar</small></article>
            </div>

            <div className="overview-grid">
              <article className="workspace-card stage-card">
                <div className="card-title-row"><div><span className="card-kicker">Distribuição</span><h3>Pedidos por etapa</h3></div><span className="tiny-label">{demands.length} no total</span></div>
                <div className="stage-bars">
                  {counts.map(({ stage, count }) => (
                    <div className="stage-bar-row" key={stage}>
                      <span className="stage-bar-name">{stage}</span>
                      <div className="stage-track"><div className={`stage-fill ${stageClass(stage)}`} style={{ width: `${Math.max(count ? 5 : 0, (count / maxCount) * 100)}%` }} /></div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                <button className="card-link" type="button" onClick={() => setView("Fluxo")}>Ver o fluxo completo <IonIcon icon={arrowForwardOutline} /></button>
              </article>
              <article className="workspace-card upcoming-card">
                <div className="card-title-row"><div><span className="card-kicker">Próximos passos</span><h3>Pedidos para acompanhar</h3></div><IonIcon className="quiet-icon" icon={downloadOutline} /></div>
                {demands.length === 0 ? <p className="empty-state">Nenhum pedido encontrado. Adicione um para começar.</p> : (
                  <div className="upcoming-list">
                    {demands.slice(0, 4).map((demand) => (
                      <div className="upcoming-row" key={demand.id}>
                        <span className="order-initial">{demand.client.slice(0, 1).toUpperCase()}</span>
                        <div className="upcoming-info"><strong>{demand.client}</strong><span>{demand.product}</span></div>
                        <span className={`status-pill ${stageClass(demand.status)}`}>{demand.status}</span>
                        <time>{formatDate(demand.deadline)}</time>
                      </div>
                    ))}
                  </div>
                )}
                <button className="card-link" type="button" onClick={() => setView("Pedidos")}>Abrir lista de pedidos <IonIcon icon={arrowForwardOutline} /></button>
              </article>
            </div>
          </div>
        )}

        {view === "Pedidos" && (
          <div className="workspace-card orders-card">
            <div className="card-title-row orders-heading">
              <div><span className="card-kicker">Registro operacional</span><h3>Pedidos</h3><p>Dados demonstrativos para apresentar o fluxo do produto.</p></div>
              <div className="order-filters">
                <label className="search-field"><IonIcon icon={searchOutline} /><input aria-label="Buscar pedidos" placeholder="Buscar cliente, código..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                <select aria-label="Filtrar por etapa" value={stageFilter} onChange={(event) => setStageFilter(event.target.value as DemandStage | "Todos")}>
                  <option>Todos</option>{DEMAND_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </div>
            </div>
            {filteredDemands.length === 0 ? <p className="empty-state">Nenhum pedido corresponde a esta busca.</p> : (
              <div className="table-wrap">
                <table className="order-table">
                  <thead><tr><th>Pedido / cliente</th><th>Produto</th><th>Qtd.</th><th>Entrega</th><th>Etapa</th><th aria-label="Ações" /></tr></thead>
                  <tbody>
                    {filteredDemands.map((demand) => (
                      <tr key={demand.id}>
                        <td><strong className="order-code">{demand.code}</strong><span className="table-subline">{demand.client}</span></td>
                        <td><span className="product-name">{demand.product}</span><span className="table-subline">{demand.material} · {demand.width} × {demand.length} cm</span></td>
                        <td>{demand.quantity.toLocaleString("pt-BR")}</td>
                        <td>{formatDate(demand.deadline)}</td>
                        <td><select className={`stage-select ${stageClass(demand.status)}`} aria-label={`Etapa do pedido ${demand.code}`} value={demand.status} disabled={!canManage} onChange={(event) => void move(demand, event.target.value as DemandStage)}>{DEMAND_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></td>
                        <td><div className="row-actions"><button type="button" aria-label={`Editar ${demand.code}`} title="Editar" onClick={() => openEdit(demand)}><IonIcon icon={createOutline} /></button><button type="button" aria-label={`Remover ${demand.code}`} title="Remover" onClick={() => canManage ? void remove(demand.id, demand.code) : onOpenAuth()}><IonIcon icon={trashOutline} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!canManage && <p className="table-footnote">Entre na sua conta para editar ou excluir pedidos.</p>}
          </div>
        )}

        {view === "Fluxo" && (
          <div className="flow-grid">
            {DEMAND_STAGES.map((stage, index) => {
              const inStage = demands.filter((demand) => demand.status === stage);
              const nextStage = DEMAND_STAGES[index + 1];
              return (
                <article className={`flow-column ${stageClass(stage)}`} key={stage}>
                  <div className="flow-column-head"><span className="flow-step-number">0{index + 1}</span><div><span className="card-kicker">Etapa {index + 1}</span><h3>{stage}</h3></div><span className="flow-count">{inStage.length}</span></div>
                  <div className="flow-cards">
                    {inStage.length === 0 ? <p className="flow-empty">Sem pedidos nesta etapa.</p> : inStage.map((demand) => (
                      <article className="flow-order" key={demand.id}>
                        <span className="flow-code">{demand.code}</span><strong>{demand.client}</strong><span>{demand.product}</span><div className="flow-order-foot"><span>{demand.quantity.toLocaleString("pt-BR")} un.</span><time>{formatDate(demand.deadline)}</time></div>
                        <div className="flow-actions">
                          <button type="button" onClick={() => openEdit(demand)}><IonIcon icon={createOutline} /> Detalhes</button>
                          {nextStage && <button type="button" disabled={!canManage} onClick={() => void move(demand, nextStage)}>Avançar <IonIcon icon={arrowForwardOutline} /></button>}
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="workspace-footnote">Painel de demonstração SoftNorth. Indicadores descrevem os pedidos exibidos; não são dados reais nem relatórios oficiais da North Bag.</p>
      </div>
      {showForm && <OrderForm existing={editing} nextCode={nextCode} onSave={onSave} onClose={() => setShowForm(false)} />}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </section>
  );
}
