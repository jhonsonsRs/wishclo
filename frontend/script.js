const API_URL = "https://wishclo.onrender.com";

let tokenAcesso = null;

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

async function protegerPagina() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return false;
  }

  tokenAcesso = data.session.access_token;
  return true;
}

function headersAutenticados(extras = {}) {
  return {
    Authorization: `Bearer ${tokenAcesso}`,
    ...extras,
  };
}

document.getElementById("btn-sair").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
});

const listaItensEl = document.getElementById("lista-itens");
const estadoVazioEl = document.getElementById("estado-vazio");
const totalValorEl = document.getElementById("total-valor");
const totalItensEl = document.getElementById("total-itens");
const buscaEl = document.getElementById("busca");
const filtroStatusEl = document.getElementById("filtro-status");
const filtroLojaEl = document.getElementById("filtro-loja");

const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitulo = document.querySelector(".modal__header h2");
const formItem = document.getElementById("form-item");
const formErro = document.getElementById("form-erro");

let itensCache = [];
let itemEditandoId = null; 

const STATUS_LABEL = {
  quero_comprar: "Quero comprar",
  talvez: "Talvez",
  comprado: "Comprado",
  fora_de_estoque: "Fora de estoque",
};

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function abrirModalCriar() {
  itemEditandoId = null;
  modalTitulo.textContent = "Adicionar item";
  formItem.reset();
  modalBackdrop.hidden = false;
}

function abrirModalEditar(item) {
  itemEditandoId = item.id;
  modalTitulo.textContent = "Editar item";

  document.getElementById("input-link").value = item.link || "";
  document.getElementById("input-nome").value = item.name || "";
  document.getElementById("input-loja").value = item.store || "";
  document.getElementById("input-cor").value = item.color || "";
  document.getElementById("input-tamanho").value = item.size || "";
  document.getElementById("input-categoria").value = item.category || "";
  document.getElementById("input-preco").value = item.price || "";
  document.getElementById("input-frete").value = item.freight || "";
  document.getElementById("input-imagem").value = item.image_url || "";

  modalBackdrop.hidden = false;
}

function fecharModal() {
  modalBackdrop.hidden = true;
  formItem.reset();
  formErro.hidden = true;
  itemEditandoId = null;
}

document.getElementById("btn-abrir-modal").addEventListener("click", abrirModalCriar);
document.getElementById("btn-vazio-adicionar").addEventListener("click", abrirModalCriar);
document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);
document.getElementById("btn-cancelar").addEventListener("click", fecharModal);

async function carregarItens() {
  estadoVazioEl.hidden = true;
  listaItensEl.hidden = false;
  listaItensEl.innerHTML = `
    <div class="loading-estado">
      <div class="loading-spinner"></div>
      <p>Carregando seu carrinho...</p>
      <p class="loading-estado__dica">Pode levar até 1 minuto no primeiro acesso do dia.</p>
    </div>
  `;

  try {
    const resposta = await fetch(`${API_URL}/itens`, {
      headers: headersAutenticados(),
    });
    if (!resposta.ok) throw new Error("Falha ao buscar itens");
    itensCache = await resposta.json();
    atualizarFiltroLojas();
    renderizar();
  } catch (erro) {
    console.error(erro);
    listaItensEl.innerHTML = `<p>Não foi possível conectar na API. Confira se o backend está rodando em ${API_URL}.</p>`;
  }
}

function atualizarFiltroLojas() {
  const lojaSelecionada = filtroLojaEl.value;
  const lojas = [...new Set(itensCache.map((item) => item.store).filter(Boolean))].sort();

  filtroLojaEl.innerHTML =
    `<option value="">Todas as lojas</option>` +
    lojas.map((loja) => `<option value="${escapeHtml(loja)}">${escapeHtml(loja)}</option>`).join("");

  if (lojas.includes(lojaSelecionada)) {
    filtroLojaEl.value = lojaSelecionada;
  }
}

function aplicarFiltros(itens) {
  const termo = buscaEl.value.trim().toLowerCase();
  const status = filtroStatusEl.value;
  const loja = filtroLojaEl.value;

  return itens.filter((item) => {
    const bateBusca = !termo || item.name.toLowerCase().includes(termo) || item.store.toLowerCase().includes(termo);
    const bateStatus = !status || item.status === status;
    const bateLoja = !loja || item.store === loja;
    return bateBusca && bateStatus && bateLoja;
  });
}

function renderizar() {
  const itensFiltrados = aplicarFiltros(itensCache);

  // total considera sempre todos os itens "quero_comprar", independente do filtro visual
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

    const botaoEditar = document.getElementById(`editar-${item.id}`);
    if (botaoEditar) {
      botaoEditar.addEventListener("click", () => abrirModalEditar(item));
    }

    const botaoRemover = document.getElementById(`remover-${item.id}`);
    if (botaoRemover) {
      botaoRemover.addEventListener("click", () => removerItem(item.id));
    }
  });
}

function linkSeguro(link) {
  if (!link) return null;
  let candidato = link.trim();

  // Alguns sites retornam URL de imagem sem protocolo (ex: "//cdn.loja.com/foto.jpg").
  // Sem isso, o new URL() abaixo falha e a imagem simplesmente não aparece.
  if (candidato.startsWith("//")) {
    candidato = "https:" + candidato;
  }

  try {
    const url = new URL(candidato);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function renderizarCard(item) {
  const nome = escapeHtml(item.name);
  const loja = escapeHtml(item.store);
  const imagemUrl = linkSeguro(item.image_url);
  const linkProduto = linkSeguro(item.link);

  const imagemTag = imagemUrl
    ? `<img class="card__imagem" loading="lazy" src="${escapeHtml(imagemUrl)}" alt="${nome}" />`
    : `<div class="card__imagem"></div>`;

  const imagem = linkProduto
    ? `<a href="${escapeHtml(linkProduto)}" target="_blank" rel="noopener noreferrer">${imagemTag}</a>`
    : imagemTag;

  const preco = parseFloat(item.price) || 0;
  const detalhe = escapeHtml([item.color, item.size].filter(Boolean).join(" · "));

  return `
    <div class="card">
      ${imagem}
      <div class="card__corpo">
        <span class="card__loja">${loja}</span>
        <p class="card__nome">${nome}</p>
        <span class="card__detalhe">${detalhe}</span>
        <div class="card__rodape">
          <span class="card__preco">${formatarMoeda(preco)}</span>
        </div>
        <select id="status-${item.id}" class="card__status">
          ${Object.entries(STATUS_LABEL)
            .map(([valor, label]) => `<option value="${valor}" ${item.status === valor ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
        <div class="card__acoes">
          <button class="card__acao" id="editar-${item.id}">Editar</button>
          <button class="card__acao" id="remover-${item.id}">Remover</button>
        </div>
      </div>
    </div>
  `;
}

async function atualizarStatus(itemId, novoStatus) {
  try {
    await fetch(`${API_URL}/itens/${itemId}`, {
      method: "PUT",
      headers: headersAutenticados({ "Content-Type": "application/json" }),
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
    await fetch(`${API_URL}/itens/${itemId}`, {
      method: "DELETE",
      headers: headersAutenticados(),
    });
    await carregarItens();
  } catch (erro) {
    console.error(erro);
  }
}

document.getElementById("btn-buscar-link").addEventListener("click", async () => {
  const link = document.getElementById("input-link").value.trim();
  const buscaStatusEl = document.getElementById("busca-status");

  if (!link) {
    buscaStatusEl.textContent = "Cole um link primeiro.";
    buscaStatusEl.hidden = false;
    return;
  }

  buscaStatusEl.textContent = "Buscando...";
  buscaStatusEl.hidden = false;
  buscaStatusEl.classList.remove("busca-status--erro");

  try {
    const resposta = await fetch(`${API_URL}/buscar-produto?url=${encodeURIComponent(link)}`, {
      headers: headersAutenticados(),
    });
    const dados = await resposta.json();

    if (!resposta.ok || !dados.encontrado) {
      buscaStatusEl.textContent = "Não encontramos os dados automaticamente. Preencha manualmente.";
      buscaStatusEl.classList.add("busca-status--erro");
      return;
    }

    if (dados.name) document.getElementById("input-nome").value = dados.name;
    if (dados.store) document.getElementById("input-loja").value = dados.store;
    if (dados.image_url) document.getElementById("input-imagem").value = dados.image_url;
    if (dados.price) document.getElementById("input-preco").value = dados.price;

    buscaStatusEl.textContent = "Dados encontrados! Confira e complete o que faltar.";
  } catch (erro) {
    buscaStatusEl.textContent = "Erro ao buscar. Confira se o backend está rodando.";
    buscaStatusEl.classList.add("busca-status--erro");
  }
});

formItem.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErro.hidden = true;

  const dadosItem = {
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

  const editando = itemEditandoId !== null;
  const url = editando ? `${API_URL}/itens/${itemEditandoId}` : `${API_URL}/itens`;
  const metodo = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: headersAutenticados({ "Content-Type": "application/json" }),
      body: JSON.stringify(dadosItem),
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
filtroLojaEl.addEventListener("change", renderizar);

protegerPagina().then((logado) => {
  if (logado) carregarItens();
});