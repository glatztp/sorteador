import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import database from "./database.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ROTA: Gerar nova chave API
app.post("/api/generate-key", async (req, res) => {
  try {
    const { projectName, description } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório" });
    }

    const apiKey = uuidv4();

    await database.createApiKey(apiKey, {
      projectName,
      description: description || "",
      isActive: true,
      usage: 0,
    });

    res.json({
      success: true,
      apiKey,
      message: "Chave API gerada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao gerar chave:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Validar chave API
app.get("/api/validate-key/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;
    const apiKeyData = await database.getApiKey(apiKey);

    if (apiKeyData && apiKeyData.isActive) {
      res.json({ valid: true, project: apiKeyData });
    } else {
      res.json({ valid: false, error: "Chave API inválida ou inativa" });
    }
  } catch (error) {
    console.error("Erro ao validar chave:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Receber dados do formulário
app.post("/api/submit/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;
    const formData = req.body;

    const apiKeyData = await database.getApiKey(apiKey);

    if (!apiKeyData || !apiKeyData.isActive) {
      return res.status(401).json({ error: "Chave API inválida ou inativa" });
    }

    // Incrementar uso da chave
    await database.updateApiKeyUsage(apiKey);

    // Adicionar participante
    const participant = {
      id: uuidv4(),
      ...formData,
    };

    await database.addParticipant(apiKey, participant);

    res.json({
      success: true,
      participantId: participant.id,
      message: "Dados recebidos com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao submeter dados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Listar participantes de uma chave API
app.get("/api/participants/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;

    const apiKeyData = await database.getApiKey(apiKey);
    if (!apiKeyData) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    const participants = await database.getParticipants(apiKey);

    res.json({
      success: true,
      participants,
      total: participants.length,
    });
  } catch (error) {
    console.error("Erro ao listar participantes:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Fazer sorteio
app.post("/api/draw/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;
    const { quantity = 1, field = null } = req.body;

    const apiKeyData = await database.getApiKey(apiKey);
    if (!apiKeyData) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    const participants = await database.getParticipants(apiKey);

    if (participants.length === 0) {
      return res.status(400).json({ error: "Nenhum participante encontrado" });
    }

    if (quantity > participants.length) {
      return res
        .status(400)
        .json({ error: "Quantidade maior que o número de participantes" });
    }

    // Fazer sorteio
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, quantity);

    // Salvar resultado do sorteio
    const result = {
      id: uuidv4(),
      winners,
      totalParticipants: participants.length,
      quantity,
      field,
    };

    await database.saveResult(apiKey, result);

    res.json({
      success: true,
      result: {
        winners,
        totalParticipants: participants.length,
        drawnAt: new Date().toISOString(),
        resultId: result.id,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer sorteio:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Histórico de sorteios
app.get("/api/results/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;

    const apiKeyData = await database.getApiKey(apiKey);
    if (!apiKeyData) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    const results = await database.getResults(apiKey);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Erro ao buscar resultados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Dashboard - listar todas as chaves
app.get("/api/dashboard", async (req, res) => {
  try {
    const dashboard = await database.getDashboardData();

    res.json({
      success: true,
      projects: dashboard,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Deletar chave API
app.delete("/api/delete-key/:apiKey", async (req, res) => {
  try {
    const { apiKey } = req.params;

    const apiKeyData = await database.getApiKey(apiKey);
    if (!apiKeyData) {
      return res.status(404).json({ error: "Chave API não encontrada" });
    }

    await database.deleteApiKey(apiKey);

    res.json({
      success: true,
      message: "Chave API deletada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao deletar chave:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Dashboard completo (mostra todos os dados)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard-completo.html"));
});

// Para Vercel, exportar como função serverless
export default app;

// Para desenvolvimento local
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 API rodando em http://localhost:${port}`);
  });
}
