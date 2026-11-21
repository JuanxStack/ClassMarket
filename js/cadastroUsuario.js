document.getElementById("cadastroForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = {
        nome: document.getElementById("nome").value.trim(),
        email: document.getElementById("email").value.trim().toLowerCase(),
        telefone: document.getElementById("telefone").value.trim(),
        curso: document.getElementById("curso").value.trim(),
        senha: document.getElementById("senha").value
    };
    const confirmar = document.getElementById("confirmar").value;

    if (!user.nome || !user.email || user.senha.length < 8) {
        alert("Preencha nome, e-mail válido e senha com pelo menos 8 caracteres.");
        return;
    }
    if (user.senha !== confirmar) {
        alert("As senhas não conferem.");
        return;
    }

    try {
        const result = await window.ClassMarketDB.register(user);
        localStorage.setItem("classmarket_usuario", JSON.stringify(result.user));
        window.location.href = "./home.html";
    } catch (error) {
        alert(error.message);
    }
});
