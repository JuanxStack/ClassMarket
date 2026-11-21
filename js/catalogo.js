(async function () {
    const catalog = document.getElementById("catalogo");
    try {
        await window.ClassMarketDB.openDatabase();
        const products = await window.ClassMarketDB.getAll("products");
        catalog.innerHTML = products.length ? products.map((product) => `
            <article class="produto">
                ${product.imagem ? `<img src="${product.imagem}" alt="${window.ClassMarketDB.escapeHtml(product.nome)}">` : `<div class="produto-sem-foto">Sem foto</div>`}
                <div class="info">
                    <h2>${window.ClassMarketDB.escapeHtml(product.nome)}</h2>
                    <p class="preco">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.preco))}</p>
                    <a href="./informacaoDoProduto.html?id=${encodeURIComponent(product.id)}"><button>Ver detalhes</button></a>
                </div>
            </article>
        `).join("") : '<p class="catalogo-vazio">Ainda não há produtos cadastrados. <a href="./cad.html">Adicionar produto</a></p>';
    } catch (error) {
        catalog.innerHTML = `<p class="catalogo-vazio">${error.message}. Confira se o servidor Node.js e o MySQL estão ativos.</p>`;
    }
})();
