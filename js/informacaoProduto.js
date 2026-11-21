(async function () {
    const container = document.querySelector(".produto");
    try {
        await window.ClassMarketDB.openDatabase();
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("Produto não encontrado.");
        const product = await window.ClassMarketDB.getById("products", id);

        document.getElementById("produtoImagem").src = product.imagem || "";
        document.getElementById("produtoNome").textContent = product.nome;
        document.getElementById("produtoPreco").textContent = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(Number(product.preco));
        document.getElementById("produtoDescricao").textContent = product.descricao || "Produto artesanal feito por um aluno da comunidade.";
        document.getElementById("produtoLocal").textContent = [product.bloco, product.sala].filter(Boolean).join(" - ") || "Local não informado";
        document.getElementById("produtoEstoque").textContent = `${product.estoque || 0} unidades disponíveis`;
        document.getElementById("contatoButton").addEventListener("click", () => {
            alert("Contato enviado ao vendedor!");
        });
    } catch (error) {
        container.innerHTML = `<p>${error.message}</p>`;
    }
})();
