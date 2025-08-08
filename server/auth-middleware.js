// Middleware de autenticação simples
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  next();
}

// Proteger rota admin
app.get("/admin", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard-completo.html"));
});
