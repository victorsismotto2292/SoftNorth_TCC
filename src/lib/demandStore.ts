import { firebaseConfigured, getFirebaseContext } from "./firebase";
import { DEMAND_STAGES, type Demand, type DemandDraft, type DemandStage } from "./types";

type Unsubscribe = () => void;
const STORAGE_KEY = "softnorth_demo_demands_v2";

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sampleDemands(): Demand[] {
  return [
    {
      id: "demo-1024",
      code: "SN-1024",
      client: "Aurora Eventos",
      product: "Sacola TNT personalizada",
      quantity: 500,
      material: "TNT",
      width: 30,
      length: 40,
      depth: 10,
      deadline: addDays(4),
      status: "Arte",
      notes: "Aguardando aprovação da arte final.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-1025",
      code: "SN-1025",
      client: "Casa Verde",
      product: "Ecobag de algodão",
      quantity: 200,
      material: "Algodão cru",
      width: 35,
      length: 42,
      depth: 12,
      deadline: addDays(7),
      status: "Orçamento",
      notes: "Cotação para evento de lançamento.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-1026",
      code: "SN-1026",
      client: "Nexo Tecnologia",
      product: "Mochila personalizada",
      quantity: 80,
      material: "Tecido ecológico",
      width: 32,
      length: 45,
      depth: 14,
      deadline: addDays(10),
      status: "Produção",
      notes: "Lote do kit de boas-vindas.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-1027",
      code: "SN-1027",
      client: "Mercado do Bairro",
      product: "Sacola retornável",
      quantity: 1000,
      material: "Tecido ecológico",
      width: 36,
      length: 40,
      depth: 12,
      deadline: addDays(13),
      status: "Entrega",
      notes: "Pedido de demonstração; entrega por lote.",
      createdAt: new Date().toISOString(),
    },
  ];
}

function readLocalDemands(): Demand[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const initial = sampleDemands();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Demand[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDemands(demands: Demand[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demands));
}

function sortByDeadline(demands: Demand[]): Demand[] {
  return [...demands].sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export function loadDemoDemands(): Demand[] {
  return sortByDeadline(readLocalDemands());
}

export function subscribeDemands(
  uid: string | null,
  onData: (demands: Demand[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!firebaseConfigured) {
    onData(loadDemoDemands());
    return () => undefined;
  }
  if (!uid) {
    onData([]);
    return () => undefined;
  }

  let cancelled = false;
  let unsubscribe: Unsubscribe = () => undefined;
  void getFirebaseContext()
    .then(async (context) => {
      if (cancelled || !context) return;
      const { collection, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;
      unsubscribe = onSnapshot(
        collection(context.db, "users", uid, "demands"),
        (snapshot) => {
          const items = snapshot.docs.map((entry) => ({
            ...(entry.data() as Omit<Demand, "id">),
            id: entry.id,
          }));
          onData(sortByDeadline(items));
        },
        (error) => onError(error),
      );
    })
    .catch((error: unknown) => onError(error instanceof Error ? error : new Error("Falha ao iniciar Firebase.")));

  return () => {
    cancelled = true;
    unsubscribe();
  };
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveDemand(
  uid: string | null,
  draft: DemandDraft,
  existing?: Demand,
): Promise<Demand> {
  const record: Demand = {
    ...draft,
    id: existing?.id ?? makeId(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  if (firebaseConfigured) {
    const context = await getFirebaseContext();
    if (!context || !uid) throw new Error("Entre na sua conta Firebase para salvar este pedido.");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(context.db, "users", uid, "demands", record.id), record);
    return record;
  }

  const current = readLocalDemands();
  const next = existing
    ? current.map((item) => (item.id === existing.id ? record : item))
    : [record, ...current];
  writeLocalDemands(next);
  return record;
}

export async function removeDemand(uid: string | null, id: string): Promise<void> {
  if (firebaseConfigured) {
    const context = await getFirebaseContext();
    if (!context || !uid) throw new Error("Entre na sua conta Firebase para remover este pedido.");
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(context.db, "users", uid, "demands", id));
    return;
  }

  writeLocalDemands(readLocalDemands().filter((item) => item.id !== id));
}

export function countByStage(demands: Demand[], stage: DemandStage): number {
  return demands.filter((demand) => demand.status === stage).length;
}

export function stageTotals(demands: Demand[]): Record<DemandStage, number> {
  return Object.fromEntries(
    DEMAND_STAGES.map((stage) => [stage, countByStage(demands, stage)]),
  ) as Record<DemandStage, number>;
}
