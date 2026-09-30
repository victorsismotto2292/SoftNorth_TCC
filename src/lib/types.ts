export const DEMAND_STAGES = ["Orçamento", "Arte", "Produção", "Entrega"] as const;

export type DemandStage = (typeof DEMAND_STAGES)[number];

export interface Demand {
  id: string;
  code: string;
  client: string;
  product: string;
  quantity: number;
  material: string;
  width: number;
  length: number;
  depth: number;
  deadline: string;
  status: DemandStage;
  notes: string;
  createdAt: string;
}

export type DemandDraft = Omit<Demand, "id" | "createdAt">;
