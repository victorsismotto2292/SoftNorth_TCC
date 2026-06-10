const STORAGE_KEY = "softnorth_demands_v1";

const statuses = ["Orçamento", "Arte", "Produção", "Entrega"];

const statusLabels = {
  "Orçamento": "Orçamento",
  "Arte": "Aguardando arte",
  "Produção": "Em produção",
  "Entrega": "Pronto/entrega"
};

const demoDemands = [
  {
    id: "SN-1024",
    client: "Empresa Aurora",
    product: "Sacola TNT personalizada",
    quantity: 500,
    material: "TNT",
    color: "Preto",
    customization: "Logo em 2 cores",
    deadline: "2026-07-15",
    status: "Arte",
    notes: "Cliente precisa aprovar a arte antes da produção."
  },
  {
    id: "SN-1025",
    client: "Evento Verde",
    product: "Ecobag de algodão",
    quantity: 200,
    material: "Algodão cru",
    color: "Cru",
    customization: "Logo em 1 cor",
    deadline: "2026-07-18",
    status: "Orçamento",
    notes: "Verificar prazo de entrega para evento."
  },
  {
    id: "SN-1026",
    client: "RH Connect",
    product: "Mochila personalizada",
    quantity: 80,
    material: "Nylon",
    color: "Azul marinho",
    customization: "Bordado",
    deadline: "2026-07-20",
    status: "Produção",
    notes: "Pedido para kit boas-vindas."
  },
  {
    id: "SN-1027",
    client: "Supermercado Norte",
    product: "Sacola retornável",
    quantity: 1000,
    material: "Tecido ecológico",
    color: "Branco",
    customization: "Logo colorida",
    deadline: "2026-07-24",
    status: "Entrega",
    notes: "Separar lote por unidade."
  }
];

let demands = loadDemands();

const menuButton = document.getElementById("menuButton");
const header = document.querySelector(".header");
const navLinks = document.querySelectorAll(".nav-links a, .nav-cta");

const sideLinks = document.querySelectorAll(".side-link");
const screens = document.querySelectorAll(".screen");
const screenTitle = document.getElementById("screenTitle");
const quickNewButton = document.getElementById("quickNewButton");

const demandForm = document.getElementById("demandForm");
const editingId = document.getElementById("editingId");
const submitButton = document.getElementById("submitButton");
const clearFormButton = document.getElementById("clearFormButton");
const formMessage = document.getElementById("formMessage");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const toast = document.getElementById("toast");

const fields = {
  client: document.getElementById("client"),
  product: document.getElementById("product"),
  quantity: document.getElementById("quantity"),
  material: document.getElementById("material"),
  color: document.getElementById("color"),
  customization: document.getElementById("customization"),
  deadline: document.getElementById("deadline"),
  status: document.getElementById("status"),
  notes: document.getElementById("notes")
};

menuButton.addEventListener("click", () => {
  header.classList.toggle("open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("open");
  });
});

sideLinks.forEach((button) => {
  button.addEventListener("click", () => {
    openScreen(button.dataset.screen);
  });
});

quickNewButton.addEventListener("click", () => {
  openScreen("screen-form");
});

demandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const demand = getFormData();

  if (editingId.value) {
    demand.id = editingId.value;
    demands = demands.map((item) => item.id === editingId.value ? demand : item);
    showToast("Demanda atualizada com sucesso.");
    formMessage.textContent = "Demanda atualizada.";
  } else {
    demand.id = generateId();
    demands.unshift(demand);
    showToast("Demanda cadastrada com sucesso.");
    formMessage.textContent = "Demanda cadastrada e adicionada ao painel.";
  }

  saveDemands();
  resetForm();
  renderAll();
  openScreen("screen-board");
});

clearFormButton.addEventListener("click", resetForm);

searchInput.addEventListener("input", renderTable);
filterStatus.addEventListener("change", renderTable);

function openScreen(screenId) {
  screens.forEach((screen) => screen.classList.remove("active"));
  sideLinks.forEach((link) => link.classList.remove("active"));

  document.getElementById(screenId).classList.add("active");

  const activeButton = document.querySelector(`[data-screen="${screenId}"]`);
  if (activeButton) activeButton.classList.add("active");

  const titles = {
    "screen-dashboard": "Painel de demandas",
    "screen-form": editingId.value ? "Editar demanda" : "Nova demanda",
    "screen-board": "Acompanhamento por status",
    "screen-list": "Lista de demandas"
  };

  screenTitle.textContent = titles[screenId] || "SoftNorth";
}

function getFormData() {
  return {
    client: fields.client.value.trim(),
    product: fields.product.value,
    quantity: Number(fields.quantity.value),
    material: fields.material.value,
    color: fields.color.value.trim() || "Não informado",
    customization: fields.customization.value,
    deadline: fields.deadline.value,
    status: fields.status.value,
    notes: fields.notes.value.trim()
  };
}

function fillForm(demand) {
  editingId.value = demand.id;
  fields.client.value = demand.client;
  fields.product.value = demand.product;
  fields.quantity.value = demand.quantity;
  fields.material.value = demand.material;
  fields.color.value = demand.color;
  fields.customization.value = demand.customization;
  fields.deadline.value = demand.deadline;
  fields.status.value = demand.status;
  fields.notes.value = demand.notes;

  submitButton.textContent = "Salvar alterações";
  formMessage.textContent = `Editando demanda ${demand.id}`;
  openScreen("screen-form");
}

function resetForm() {
  editingId.value = "";
  demandForm.reset();
  submitButton.textContent = "Salvar demanda";
  formMessage.textContent = "";
}

function generateId() {
  const highest = demands
    .map((item) => Number(String(item.id).replace("SN-", "")))
    .filter((number) => !Number.isNaN(number))
    .sort((a, b) => b - a)[0] || 1027;

  return `SN-${highest + 1}`;
}

function saveDemands() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demands));
}

function loadDemands() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoDemands));
    return [...demoDemands];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [...demoDemands];
  }
}

function renderAll() {
  renderStats();
  renderHero();
  renderBoard();
  renderTable();
  renderBars();
  renderDueList();
}

function countByStatus(status) {
  return demands.filter((demand) => demand.status === status).length;
}

function renderStats() {
  document.getElementById("totalCount").textContent = demands.length;
  document.getElementById("budgetCount").textContent = countByStatus("Orçamento");
  document.getElementById("artCount").textContent = countByStatus("Arte");
  document.getElementById("productionCount").textContent = countByStatus("Produção");

  document.getElementById("heroOpenCount").textContent = demands.length;
  document.getElementById("heroArtCount").textContent = countByStatus("Arte");
  document.getElementById("heroProductionCount").textContent = countByStatus("Produção");
}

function renderHero() {
  const list = document.getElementById("heroRecentList");
  const recent = demands.slice(0, 3);

  list.innerHTML = recent.map((demand) => `
    <div class="recent-item">
      <div>
        <strong>${escapeHTML(demand.product)}</strong>
        <span>${escapeHTML(demand.client)} • ${demand.quantity} un.</span>
      </div>
      <span class="pill">${escapeHTML(demand.status)}</span>
    </div>
  `).join("");
}

function renderBars() {
  const area = document.getElementById("statusBars");
  const max = Math.max(...statuses.map(countByStatus), 1);

  area.innerHTML = statuses.map((status) => {
    const count = countByStatus(status);
    const width = Math.max((count / max) * 100, count > 0 ? 12 : 0);

    return `
      <div class="bar-row">
        <strong>${statusLabels[status]} <span>${count}</span></strong>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderDueList() {
  const area = document.getElementById("dueList");

  const sorted = [...demands]
    .filter((item) => item.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  if (!sorted.length) {
    area.innerHTML = `<div class="empty-state">Nenhum prazo cadastrado.</div>`;
    return;
  }

  area.innerHTML = sorted.map((demand) => `
    <div class="due-item">
      <div>
        <strong>${escapeHTML(demand.product)}</strong>
        <span>${escapeHTML(demand.client)} • ${escapeHTML(demand.status)}</span>
      </div>
      <span>${formatDate(demand.deadline)}</span>
    </div>
  `).join("");
}

function renderBoard() {
  const board = document.getElementById("board");

  board.innerHTML = statuses.map((status) => {
    const items = demands.filter((demand) => demand.status === status);

    return `
      <section class="board-column">
        <div class="board-title">
          <strong>${statusLabels[status]}</strong>
          <span>${items.length}</span>
        </div>

        ${items.length ? items.map(renderDemandCard).join("") : `<div class="empty-state">Sem demandas.</div>`}
      </section>
    `;
  }).join("");

  board.querySelectorAll("[data-change-status]").forEach((select) => {
    select.addEventListener("change", () => {
      updateStatus(select.dataset.changeStatus, select.value);
    });
  });

  board.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteDemand(button.dataset.delete);
    });
  });
}

function renderDemandCard(demand) {
  return `
    <article class="demand-card">
      <strong>${escapeHTML(demand.product)}</strong>
      <p>${escapeHTML(demand.client)} • ${demand.quantity} un.</p>

      <div class="card-meta">
        <span class="pill">${escapeHTML(demand.id)}</span>
        <span class="pill">${escapeHTML(demand.material)}</span>
        <span class="pill">${formatDate(demand.deadline)}</span>
      </div>

      <div class="card-actions">
        <select data-change-status="${escapeHTML(demand.id)}" aria-label="Alterar status">
          ${statuses.map((status) => `
            <option ${status === demand.status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>

        <button class="icon-button" data-delete="${escapeHTML(demand.id)}" type="button">Excluir</button>
      </div>
    </article>
  `;
}

function renderTable() {
  const tbody = document.getElementById("demandTable");
  const term = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;

  let filtered = [...demands];

  if (status !== "Todos") {
    filtered = filtered.filter((demand) => demand.status === status);
  }

  if (term) {
    filtered = filtered.filter((demand) => {
      const text = `${demand.id} ${demand.client} ${demand.product} ${demand.material}`.toLowerCase();
      return text.includes(term);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma demanda encontrada.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((demand) => `
    <tr>
      <td><strong>${escapeHTML(demand.id)}</strong></td>
      <td>${escapeHTML(demand.client)}</td>
      <td>${escapeHTML(demand.product)}</td>
      <td>${demand.quantity}</td>
      <td><span class="pill">${escapeHTML(demand.status)}</span></td>
      <td>${formatDate(demand.deadline)}</td>
      <td>
        <div class="table-actions">
          <button class="edit-button" data-edit="${escapeHTML(demand.id)}" type="button">Editar</button>
          <button class="delete-button" data-delete="${escapeHTML(demand.id)}" type="button">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const demand = demands.find((item) => item.id === button.dataset.edit);
      if (demand) fillForm(demand);
    });
  });

  tbody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteDemand(button.dataset.delete);
    });
  });
}

function updateStatus(id, status) {
  demands = demands.map((demand) => {
    if (demand.id === id) {
      return { ...demand, status };
    }

    return demand;
  });

  saveDemands();
  renderAll();
  showToast(`Status da demanda ${id} atualizado para ${status}.`);
}

function deleteDemand(id) {
  const confirmed = confirm(`Excluir a demanda ${id}?`);

  if (!confirmed) return;

  demands = demands.filter((demand) => demand.id !== id);
  saveDemands();
  renderAll();
  showToast(`Demanda ${id} excluída.`);
}

function formatDate(value) {
  if (!value) return "Sem prazo";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

renderAll();
