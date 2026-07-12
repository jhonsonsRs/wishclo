const API_URL = "http://localhost:8000";

const listaItensEl = document.getElementById("lista-itens");
const estadoVazioEl = document.getElementById("estado-vazio");
const totalValorEl = document.getElementById("total-valor");
const totalItensEl = document.getElementById("total-itens");
const buscaEl = document.getElementById("busca");
const filtroStatusEl = document.getElementById("filtro-status");

const modalBackdrop = document.getElementById("modal-backdrop");
const formItem = document.getElementById("form-item");
const formErro = document.getElementById("form-erro");

let itensCache = [];

const STATUS_LABEL = {
  quero_comprar: "Quero comprar",
  comprado: "Comprado",
  fora_de_estoque: "Fora de estoque",
};

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function abrirModal() {
  modalBackdrop.hidden = false;
}

function fecharModal() {
  modalBackdrop.hidden = true;
  formItem.reset();
  formErro.hidden = true;
}

document.getElementById("btn-abrir-modal").addEventListener("click", abrirModal);
document.getElementById("btn-vazio-adicionar").addEventListener("click", abrirModal);
document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);
document.getElementById("btn-cancelar").addEventListener("click", fecharModal);

async function carregarItens() {
  try {
    const resposta = await fetch(`${API_URL}/itens`);
    if (!resposta.ok) throw new Error("Falha ao buscar itens");
    itensCache = await resposta.json();
    renderizar();
  } catch (erro) {
    console.error(erro);
    listaItensEl.innerHTML = `<p>Não foi possível conectar na API. Confira se o backend está rodando em ${API_URL}.</p>`;
  }
}

function aplicarFiltros(itens) {
  const termo = buscaEl.value.trim().toLowerCase();
  const status = filtroStatusEl.value;

  return itens.filter((item) => {
    const bateBusca = !termo || item.name.toLowerCase().includes(termo) || item.store.toLowerCase().includes(termo);
    const bateStatus = !status || item.status === status;
    return bateBusca && bateStatus;
  });
}

function renderizar() {
  const itensFiltrados = aplicarFiltros(itensCache);

  const itensQueroComprar = itensCache.filter((i) => i.status === "quero_comprar");
  const total = itensQueroComprar.reduce((soma, item) => {
    const preco = parseFloat(item.price) || 0;
    const frete = parseFloat(item.freight) || 0;
    return soma + preco + frete;
  }, 0);

  totalValorEl.textContent = formatarMoeda(total);
  totalItensEl.textContent = itensQueroComprar.length;

  if (itensCache.length === 0) {
    listaItensEl.hidden = true;
    estadoVazioEl.hidden = false;
    return;
  }

  listaItensEl.hidden = false;
  estadoVazioEl.hidden = true;

  listaItensEl.innerHTML = itensFiltrados.map(renderizarCard).join("");

  itensFiltrados.forEach((item) => {
    const selectStatus = document.getElementById(`status-${item.id}`);
    if (selectStatus) {
      selectStatus.addEventListener("change", (e) => atualizarStatus(item.id, e.target.value));
    }

    const botaoRemover = document.getElementById(`remover-${item.id}`);
    if (botaoRemover) {
      botaoRemover.addEventListener("click", () => removerItem(item.id));
    }
  });
}

function renderizarCard(item) {
  const imagem = item.image_url
    ? `<img class="card__imagem" src="${item.image_url}" alt="${item.name}" />`
    : `<div class="card__imagem"></div>`;

  const preco = parseFloat(item.price) || 0;

  return `
    <div class="card">
      ${imagem}
      <div class="card__corpo">
        <span class="card__loja">${item.store}</span>
        <p class="card__nome">${item.name}</p>
        <span class="card__detalhe">${[item.color, item.size].filter(Boolean).join(" · ")}</span>
        <div class="card__rodape">
          <span class="card__preco">${formatarMoeda(preco)}</span>
        </div>
        <select id="status-${item.id}" class="card__status">
          ${Object.entries(STATUS_LABEL)
            .map(([valor, label]) => `<option value="${valor}" ${item.status === valor ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
        <button class="card__remover" id="remover-${item.id}">Remover</button>
      </div>
    </div>
  `;
}

async function atualizarStatus(itemId, novoStatus) {
  try {
    await fetch(`${API_URL}/itens/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    await carregarItens();
  } catch (erro) {
    console.error(erro);
  }
}

async function removerItem(itemId) {
  const confirmar = confirm("Remover esse item do carrinho?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/itens/${itemId}`, { method: "DELETE" });
    await carregarItens();
  } catch (erro) {
    console.error(erro);
  }
}

formItem.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErro.hidden = true;

  const novoItem = {
    name: document.getElementById("input-nome").value,
    store: document.getElementById("input-loja").value,
    color: document.getElementById("input-cor").value || null,
    size: document.getElementById("input-tamanho").value || null,
    category: document.getElementById("input-categoria").value || null,
    price: parseFloat(document.getElementById("input-preco").value),
    freight: document.getElementById("input-frete").value ? parseFloat(document.getElementById("input-frete").value) : null,
    image_url: document.getElementById("input-imagem").value || null,
    link: document.getElementById("input-link").value || null,
  };

  try {
    const resposta = await fetch(`${API_URL}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoItem),
    });

    if (!resposta.ok) throw new Error("Erro ao salvar item");

    fecharModal();
    await carregarItens();
  } catch (erro) {
    formErro.textContent = "Não foi possível salvar o item. Confira os campos e tente de novo.";
    formErro.hidden = false;
  }
});

buscaEl.addEventListener("input", renderizar);
filtroStatusEl.addEventListener("change", renderizar);

carregarItens();