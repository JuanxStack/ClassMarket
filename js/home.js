let produtos = [];
let filtroAtual = "todos";
let buscaAtual = "";

const grid = document.getElementById("carrosselProdutos");

function formatCategory(category) {
    return { doces: "Doces", salgados: "Salgados", bebidas: "Bebidas" }[category] || "Produto";
}

function formatPrice(price) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function cardTemplate(product) {
    const nome = window.ClassMarketDB.escapeHtml(product.nome);
    const bloco = window.ClassMarketDB.escapeHtml(product.bloco || "Local não informado");
    const sala = window.ClassMarketDB.escapeHtml(product.sala || "");
    const image = product.imagem
        ? `<img src="${product.imagem}" alt="${nome}">`
        : `<div class="placeholder-icon"><i class="${product.categoria === "bebidas" ? "fa-solid fa-mug-hot" : product.categoria === "salgados" ? "fa-solid fa-burger" : "fa-solid fa-cookie-bite"}"></i></div>`;

    return `
        <article class="card">
            <div class="card-media">${image}</div>
            <div class="card-body">
                <span class="card-category">${formatCategory(product.categoria)}</span>
                <h3>${nome}</h3>
                <p class="card-meta">${product.estoque || 0} disponíveis<br>${bloco} ${sala ? "• " + sala : ""}</p>
                <div class="card-footer">
                    <span class="card-price">${formatPrice(product.preco)}</span>
                    <a class="card-link" href="./informacaoDoProduto.html?id=${encodeURIComponent(product.id)}" aria-label="Ver ${nome}">
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>`;
}

function render() {
    const filtrados = produtos.filter((product) => {
        const categoriaOk = filtroAtual === "todos" || product.categoria === filtroAtual;
        const buscaOk = !buscaAtual || `${product.nome} ${product.categoria} ${product.descricao || ""}`.toLowerCase().includes(buscaAtual);
        return categoriaOk && buscaOk;
    });

    grid.innerHTML = filtrados.length
        ? filtrados.map(cardTemplate).join("")
        : `<div class="empty-state"><i class="fa-solid fa-store"></i><p>Ainda não há produtos cadastrados.</p><a href="./cad.html">Adicionar primeiro produto</a></div>`;
}

async function init() {
    try {
        await window.ClassMarketDB.openDatabase();
        produtos = await window.ClassMarketDB.getAll("products");
        render();
    } catch (error) {
        grid.innerHTML = `<div class="empty-state"><p>${error.message}</p><small>Confira se o servidor Node.js e o MySQL estão ativos.</small></div>`;
    }
}

document.getElementById("categoryTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    document.querySelectorAll("#categoryTabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filtroAtual = button.dataset.category;
    render();
});

document.getElementById("searchForm").addEventListener("submit", (event) => event.preventDefault());
document.getElementById("searchInput").addEventListener("input", (event) => {
    buscaAtual = event.target.value.trim().toLowerCase();
    render();
});

init();
