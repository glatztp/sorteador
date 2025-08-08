import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Estrutura para armazenar dados (em produção, usar banco de dados)
const dataFile = path.join(__dirname, "data.json");

// Inicializar arquivo de dados se não existir
const initializeData = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      const initialData = {
        apiKeys: {},
        participants: {},
        results: {},
        meta: {
          created: new Date().toISOString(),
          version: "1.0.0",
        },
      };
      fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
      console.log("✅ Arquivo de dados inicializado:", dataFile);
    } else {
      console.log("📁 Arquivo de dados existente encontrado:", dataFile);
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar dados:", error);
  }
};

// Ler dados do arquivo
const readData = () => {
  try {
    const data = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler dados:", error);
    return { apiKeys: {}, participants: {}, results: {} };
  }
};

// Salvar dados no arquivo
const saveData = (data) => {
  try {
    // Criar backup antes de salvar
    if (fs.existsSync(dataFile)) {
      const backupFile = dataFile.replace(
        ".json",
        `.backup.${Date.now()}.json`
      );
      fs.copyFileSync(dataFile, backupFile);

      // Manter apenas os 5 backups mais recentes
      const backupFiles = fs
        .readdirSync(__dirname)
        .filter((file) => file.includes(".backup.") && file.endsWith(".json"))
        .sort()
        .reverse();

      if (backupFiles.length > 5) {
        backupFiles.slice(5).forEach((file) => {
          fs.unlinkSync(path.join(__dirname, file));
        });
      }
    }

    // Adicionar timestamp da última atualização
    data.meta = data.meta || {};
    data.meta.lastUpdated = new Date().toISOString();

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log("💾 Dados salvos com sucesso");
  } catch (error) {
    console.error("❌ Erro ao salvar dados:", error);
  }
};

// Inicializar dados
initializeData();

// ROTA: Gerar nova chave API
app.post("/api/generate-key", (req, res) => {
  try {
    const { projectName, description } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório" });
    }

    const data = readData();
    const apiKey = uuidv4();

    data.apiKeys[apiKey] = {
      projectName,
      description: description || "",
      createdAt: new Date().toISOString(),
      isActive: true,
      usage: 0,
    };

    data.participants[apiKey] = [];

    saveData(data);

    res.json({
      success: true,
      apiKey,
      message: "Chave API gerada com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Validar chave API
app.get("/api/validate-key/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const data = readData();

    if (data.apiKeys[apiKey] && data.apiKeys[apiKey].isActive) {
      res.json({ valid: true, project: data.apiKeys[apiKey] });
    } else {
      res.json({ valid: false, error: "Chave API inválida ou inativa" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Receber dados do formulário
app.post("/api/submit/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const formData = req.body;

    const data = readData();

    if (!data.apiKeys[apiKey] || !data.apiKeys[apiKey].isActive) {
      return res.status(401).json({ error: "Chave API inválida ou inativa" });
    }

    // Incrementar uso da chave
    data.apiKeys[apiKey].usage += 1;

    // Adicionar participante
    const participant = {
      id: uuidv4(),
      ...formData,
      submittedAt: new Date().toISOString(),
    };

    data.participants[apiKey].push(participant);

    saveData(data);

    res.json({
      success: true,
      participantId: participant.id,
      message: "Dados recebidos com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Listar participantes de uma chave API
app.get("/api/participants/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const data = readData();

    if (!data.apiKeys[apiKey]) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    res.json({
      success: true,
      participants: data.participants[apiKey] || [],
      total: (data.participants[apiKey] || []).length,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Fazer sorteio
app.post("/api/draw/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const { quantity = 1, field = null } = req.body;

    const data = readData();

    if (!data.apiKeys[apiKey]) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    const participants = data.participants[apiKey] || [];

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
      apiKey,
      winners,
      totalParticipants: participants.length,
      quantity,
      field,
      drawnAt: new Date().toISOString(),
    };

    if (!data.results[apiKey]) {
      data.results[apiKey] = [];
    }

    data.results[apiKey].push(result);

    saveData(data);

    res.json({
      success: true,
      result: {
        winners,
        totalParticipants: participants.length,
        drawnAt: result.drawnAt,
        resultId: result.id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Histórico de sorteios
app.get("/api/results/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const data = readData();

    if (!data.apiKeys[apiKey]) {
      return res.status(401).json({ error: "Chave API inválida" });
    }

    res.json({
      success: true,
      results: data.results[apiKey] || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Dashboard - listar todas as chaves
app.get("/api/dashboard", (req, res) => {
  try {
    const data = readData();

    const dashboard = Object.entries(data.apiKeys).map(([key, info]) => ({
      apiKey: key,
      projectName: info.projectName,
      description: info.description,
      createdAt: info.createdAt,
      isActive: info.isActive,
      usage: info.usage,
      participants: (data.participants[key] || []).length,
      results: (data.results[key] || []).length,
    }));

    res.json({
      success: true,
      projects: dashboard,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Deletar chave API
app.delete("/api/delete-key/:apiKey", (req, res) => {
  try {
    const { apiKey } = req.params;
    const data = readData();

    if (!data.apiKeys[apiKey]) {
      return res.status(404).json({ error: "Chave API não encontrada" });
    }

    delete data.apiKeys[apiKey];
    delete data.participants[apiKey];
    delete data.results[apiKey];

    saveData(data);

    res.json({
      success: true,
      message: "Chave API deletada com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA: Servir dashboard HTML
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ROTA: Dashboard completo (mostra todos os dados)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard-completo.html"));
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`🚀 API do Sorteador rodando em http://localhost:${port}`);
  console.log(`📊 Dashboard disponível em http://localhost:${port}/dashboard`);
  console.log(`📝 Documentação da API: API-INTEGRATION.md`);
  console.log(`📁 Dados salvos em: ${dataFile}`);
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Tratamento gracioso de encerramento
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM recebido. Encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT recebido. Encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Erro não capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promise rejeitada não tratada:", reason);
  process.exit(1);
});
