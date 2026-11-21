document.getElementById("formProduto").addEventListener("submit", async function (event) {
    event.preventDefault();

    const file = document.getElementById("foto").files[0];
    const nome = document.getElementById("nome-produto").value.trim();
    const preco = document.getElementById("preco").value;
    const estoque = document.getElementById("estoque").value;
    const categoria = document.getElementById("categoria").value;

    if (!nome || !preco || estoque === "" || !categoria) {
        alert("Preencha nome, preço, estoque e categoria.");
        return;
    }
    if (!file) {
        alert("Escolha uma imagem para o produto.");
        return;
    }
    if (file.size > 7 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 7 MB.");
        return;
    }

    try {
        const imagem = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
            reader.readAsDataURL(file);
        });

        await window.ClassMarketDB.add("products", {
            nome,
            descricao: document.getElementById("descricao").value.trim(),
            preco: Number(preco),
            estoque: Number(estoque),
            categoria,
            imagem,
            bloco: document.getElementById("bloco").value.trim(),
            sala: document.getElementById("sala").value.trim()
        });
        window.location.href = "./home.html";
    } catch (error) {
        alert(error.message);
    }
});