(function () {
    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        })[character]);
    }

    async function request(url, options) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options && options.headers)
            }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || `A solicitação falhou (${response.status}).`);
        }
        return result;
    }

    window.ClassMarketDB = {
        openDatabase: () => request("/api/health"),
        getAll: (storeName) => {
            if (storeName !== "products") throw new Error("Consulta não disponível.");
            return request("/api/products");
        },
        getById: (storeName, id) => {
            if (storeName !== "products") throw new Error("Consulta não disponível.");
            return request(`/api/products/${encodeURIComponent(id)}`);
        },
        add: (storeName, value) => {
            if (storeName !== "products") throw new Error("Cadastro não disponível.");
            return request("/api/products", {
                method: "POST",
                body: JSON.stringify(value)
            });
        },
        register: (value) => request("/api/users", {
            method: "POST",
            body: JSON.stringify(value)
        }),
        login: (credentials) => request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        }),
        escapeHtml
    };
})();
