require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const pages = [
    "home.html",
    "cad.html",
    "CadastroUsuario.html",
    "loginUsuario.html",
    "informacaoDoProduto.html",
    "telaDoCATALOGO.html",
    "telaDoAdm.html",
    "avaliaçao.html"
];
const categories = new Set(["doces", "salgados", "bebidas"]);
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "classmarket",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: false
});

app.use(express.json({ limit: "12mb" }));

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function publicUser(user) {
    return {
        id: user.id,
        nome: user.nome,
        email: user.email
    };
}

function mapProduct(row) {
    return {
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        preco: row.preco,
        estoque: row.estoque,
        categoria: row.categoria,
        imagem: row.imagem,
        bloco: row.bloco,
        sala: row.sala,
        createdAt: row.created_at
    };
}

app.get("/api/health", asyncRoute(async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "mysql" });
}));

app.get("/api/products", asyncRoute(async (req, res) => {
    const [rows] = await pool.execute(
        "SELECT id, nome, descricao, preco, estoque, categoria, imagem, bloco, sala, created_at FROM products ORDER BY created_at DESC, id DESC"
    );
    res.json(rows.map(mapProduct));
}));

app.get("/api/products/:id", asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        throw httpError(400, "Identificador de produto inválido.");
    }

    const [rows] = await pool.execute(
        "SELECT id, nome, descricao, preco, estoque, categoria, imagem, bloco, sala, created_at FROM products WHERE id = ?",
        [id]
    );
    if (!rows.length) throw httpError(404, "Produto não encontrado.");
    res.json(mapProduct(rows[0]));
}));

app.post("/api/products", asyncRoute(async (req, res) => {
    const body = req.body || {};
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
    const preco = Number(String(body.preco || "").replace(",", "."));
    const estoque = Number(body.estoque);
    const categoria = body.categoria;
    const imagem = body.imagem || null;

    if (!nome || nome.length > 120 || !Number.isFinite(preco) || preco <= 0 ||
        !Number.isInteger(estoque) || estoque < 0 || !categories.has(categoria) ||
        descricao.length > 3000) {
        throw httpError(400, "Confira nome, preço, estoque e categoria do produto.");
    }
    if (imagem !== null && (typeof imagem !== "string" ||
        imagem.length > 10000000 ||
        !/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(imagem))) {
        throw httpError(400, "A imagem deve ser JPEG, PNG, WEBP ou GIF e ter até 7 MB.");
    }

    const [result] = await pool.execute(
        `INSERT INTO products (nome, descricao, preco, estoque, categoria, imagem, bloco, sala)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            nome,
            descricao || null,
            preco.toFixed(2),
            estoque,
            categoria,
            imagem,
            typeof body.bloco === "string" ? body.bloco.trim().slice(0, 80) || null : null,
            typeof body.sala === "string" ? body.sala.trim().slice(0, 80) || null : null
        ]
    );

    const [rows] = await pool.execute(
        "SELECT id, nome, descricao, preco, estoque, categoria, imagem, bloco, sala, created_at FROM products WHERE id = ?",
        [result.insertId]
    );
    res.status(201).json(mapProduct(rows[0]));
}));

app.post("/api/users", asyncRoute(async (req, res) => {
    const body = req.body || {};
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body.senha === "string" ? body.senha : "";

    if (!nome || nome.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 190 || senha.length < 8 || senha.length > 128) {
        throw httpError(400, "Informe nome, e-mail válido e senha com pelo menos 8 caracteres.");
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    try {
        const [result] = await pool.execute(
            "INSERT INTO users (nome, email, telefone, curso, senha_hash) VALUES (?, ?, ?, ?, ?)",
            [
                nome,
                email,
                typeof body.telefone === "string" ? body.telefone.trim().slice(0, 30) || null : null,
                typeof body.curso === "string" ? body.curso.trim().slice(0, 120) || null : null,
                senhaHash
            ]
        );
        res.status(201).json({ user: publicUser({ id: result.insertId, nome, email }) });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw httpError(409, "Este e-mail já está cadastrado.");
        }
        throw error;
    }
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
    const [rows] = await pool.execute(
        "SELECT id, nome, email, senha_hash FROM users WHERE email = ?",
        [email]
    );

    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
        throw httpError(401, "E-mail ou senha incorretos.");
    }
    res.json({ user: publicUser(rows[0]) });
}));

app.get("/", (req, res) => res.redirect("/home.html"));
for (const page of pages) {
    app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, page)));
}
app.use("/css", express.static(path.join(__dirname, "css"), { fallthrough: true }));
app.use("/js", express.static(path.join(__dirname, "js"), { fallthrough: true }));

app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
});

app.use((error, req, res, next) => {
    console.error(error);
    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = status >= 500 ? "Erro no servidor ou na conexão com o MySQL." : error.message;
    res.status(status).json({ error: message });
});

app.listen(port, host, () => {
    console.log(`Class Market disponível em http://${host}:${port}`);
    console.log("Banco configurado por .env; /api/health verifica a conexão MySQL.");
});
