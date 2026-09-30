import { useMemo, useState, type CSSProperties } from "react";
import { IonIcon } from "@ionic/react";
import { calculatorOutline, cubeOutline, resizeOutline } from "ionicons/icons";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function numberValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function Estimator() {
  const [width, setWidth] = useState(34);
  const [length, setLength] = useState(40);
  const [depth, setDepth] = useState(12);
  const [quantity, setQuantity] = useState(200);
  const [material, setMaterial] = useState("Algodão cru");
  const [unitCost, setUnitCost] = useState(28);
  const [waste, setWaste] = useState(12);

  const estimate = useMemo(() => {
    const frontAndBack = width * length * 2;
    const sides = depth * length * 2;
    const base = width * depth;
    const areaPerUnit = (frontAndBack + sides + base) / 10_000;
    const totalArea = areaPerUnit * quantity * (1 + waste / 100);
    return {
      areaPerUnit,
      totalArea,
      totalCost: totalArea * unitCost,
      costPerUnit: (totalArea * unitCost) / Math.max(quantity, 1),
    };
  }, [depth, length, quantity, unitCost, waste, width]);

  const bagStyle = {
    "--bag-w": `${clamp(width * 4.2, 145, 246)}px`,
    "--bag-h": `${clamp(length * 4.5, 178, 286)}px`,
    "--bag-d": `${clamp(depth * 1.7, 18, 58)}px`,
  } as CSSProperties;

  return (
    <section className="estimator-section" id="simulador" aria-labelledby="estimator-title">
      <div className="section-shell">
        <div className="section-intro estimator-intro">
          <span className="eyebrow"><IonIcon icon={calculatorOutline} /> Simulação de material</span>
          <h2 id="estimator-title">Uma estimativa começa com as medidas certas.</h2>
          <p>
            Ajuste as dimensões da peça para visualizar o volume e estimar o consumo de material.
            A tarifa e a margem são editáveis para a demonstração.
          </p>
        </div>

        <div className="estimator-panel">
          <div className="estimator-controls">
            <div className="panel-kicker"><IonIcon icon={resizeOutline} /> Dados do produto</div>
            <div className="input-grid">
              <label className="field">
                <span>Largura <small>(cm)</small></span>
                <input type="number" min="5" max="120" value={width} onChange={(event) => setWidth(clamp(numberValue(event.target.value, 34), 5, 120))} />
              </label>
              <label className="field">
                <span>Comprimento <small>(cm)</small></span>
                <input type="number" min="5" max="150" value={length} onChange={(event) => setLength(clamp(numberValue(event.target.value, 40), 5, 150))} />
              </label>
              <label className="field">
                <span>Profundidade <small>(cm)</small></span>
                <input type="number" min="0" max="60" value={depth} onChange={(event) => setDepth(clamp(numberValue(event.target.value, 12), 0, 60))} />
              </label>
              <label className="field">
                <span>Quantidade <small>(un.)</small></span>
                <input type="number" min="1" max="100000" value={quantity} onChange={(event) => setQuantity(clamp(numberValue(event.target.value, 1), 1, 100000))} />
              </label>
              <label className="field">
                <span>Material</span>
                <select value={material} onChange={(event) => setMaterial(event.target.value)}>
                  <option>Algodão cru</option>
                  <option>TNT</option>
                  <option>Tecido ecológico</option>
                  <option>Papel kraft</option>
                  <option>Nylon</option>
                </select>
              </label>
              <label className="field">
                <span>Custo do material <small>(R$/m²)</small></span>
                <input type="number" min="0" step="0.5" value={unitCost} onChange={(event) => setUnitCost(clamp(numberValue(event.target.value, 0), 0, 10000))} />
              </label>
            </div>
            <label className="range-field">
              <span>Margem de corte <strong>{waste}%</strong></span>
              <input type="range" min="0" max="30" step="1" value={waste} onChange={(event) => setWaste(Number(event.target.value))} />
              <small>Premissa de simulação — ajuste conforme o encaixe real do material.</small>
            </label>
            <p className="estimate-note">
              Tarifa de demonstração: <strong>R$ 28,00/m²</strong> como valor inicial editável, não fornecido pela North Bag.
            </p>
          </div>

          <div className="estimator-visual">
            <div className="visual-topline">
              <span><IonIcon icon={cubeOutline} /> Prévia volumétrica</span>
              <span className="demo-chip">visual ilustrativo</span>
            </div>
            <div className="bag-stage" aria-label={`Sacola ilustrativa com largura de ${width} centímetros, comprimento de ${length} centímetros e profundidade de ${depth} centímetros`}>
              <div className="bag-measure measure-width">{width} cm · largura</div>
              <div className="bag-shadow" />
              <div className="bag-model" style={bagStyle}>
                <div className="bag-body">
                  <div className="bag-front">
                    <div className="bag-handle bag-handle-left" />
                    <div className="bag-handle bag-handle-right" />
                    <div className="bag-panel-mark" />
                    <span className="bag-monogram">SN</span>
                  </div>
                  <div className="bag-side" />
                  <div className="bag-bottom" />
                </div>
              </div>
              <div className="bag-measure measure-length">{length} cm · comprimento</div>
              <div className="visual-caption">{material} <span>•</span> {depth} cm de profundidade</div>
            </div>
            <div className="estimate-results">
              <div className="result-cell">
                <span>Material estimado</span>
                <strong>{estimate.totalArea.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²</strong>
                <small>{estimate.areaPerUnit.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} m² por unidade</small>
              </div>
              <div className="result-cell result-highlight">
                <span>Custo de material estimado</span>
                <strong>{currency.format(estimate.totalCost)}</strong>
                <small>{currency.format(estimate.costPerUnit)} por unidade</small>
              </div>
            </div>
            <p className="formula-note">
              Estimativa didática de duas faces, laterais e base + margem de corte. Não inclui alças,
              costura, impressão, mão de obra ou variações de encaixe; não substitui um orçamento de produção.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
