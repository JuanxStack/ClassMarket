document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;
    try {
        const result = await window.ClassMarketDB.login({ email, senha });
        localStorage.setItem("classmarket_usuario", JSON.stringify(result.user));
        window.location.href = "./home.html";
    } catch (error) {
        alert(error.message);
    }
});
