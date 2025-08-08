import { MongoClient } from "mongodb";

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    // URL do MongoDB Atlas - você precisará configurar no .env
    this.uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    this.dbName = process.env.DB_NAME || "sorteador";
  }

  async connect() {
    try {
      if (!this.client) {
        this.client = new MongoClient(this.uri);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        console.log("✅ Conectado ao MongoDB");
      }
      return this.db;
    } catch (error) {
      console.error("❌ Erro ao conectar no MongoDB:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("🔌 Desconectado do MongoDB");
    }
  }

  // API Keys
  async createApiKey(apiKey, data) {
    const db = await this.connect();
    const result = await db.collection("apiKeys").insertOne({
      _id: apiKey,
      ...data,
      createdAt: new Date(),
    });
    return result;
  }

  async getApiKey(apiKey) {
    const db = await this.connect();
    return await db.collection("apiKeys").findOne({ _id: apiKey });
  }

  async updateApiKeyUsage(apiKey) {
    const db = await this.connect();
    return await db
      .collection("apiKeys")
      .updateOne({ _id: apiKey }, { $inc: { usage: 1 } });
  }

  async deleteApiKey(apiKey) {
    const db = await this.connect();
    // Deletar chave e todos os dados relacionados
    await Promise.all([
      db.collection("apiKeys").deleteOne({ _id: apiKey }),
      db.collection("participants").deleteMany({ apiKey }),
      db.collection("results").deleteMany({ apiKey }),
    ]);
  }

  async getAllApiKeys() {
    const db = await this.connect();
    return await db.collection("apiKeys").find({}).toArray();
  }

  // Participantes
  async addParticipant(apiKey, participantData) {
    const db = await this.connect();
    const participant = {
      id: participantData.id,
      apiKey,
      ...participantData,
      submittedAt: new Date(),
    };
    return await db.collection("participants").insertOne(participant);
  }

  async getParticipants(apiKey) {
    const db = await this.connect();
    return await db.collection("participants").find({ apiKey }).toArray();
  }

  // Resultados
  async saveResult(apiKey, resultData) {
    const db = await this.connect();
    const result = {
      ...resultData,
      apiKey,
      drawnAt: new Date(),
    };
    return await db.collection("results").insertOne(result);
  }

  async getResults(apiKey) {
    const db = await this.connect();
    return await db.collection("results").find({ apiKey }).toArray();
  }

  // Dashboard
  async getDashboardData() {
    const db = await this.connect();

    const apiKeys = await db.collection("apiKeys").find({}).toArray();
    const dashboard = [];

    for (const apiKeyData of apiKeys) {
      const participantsCount = await db
        .collection("participants")
        .countDocuments({ apiKey: apiKeyData._id });
      const resultsCount = await db
        .collection("results")
        .countDocuments({ apiKey: apiKeyData._id });

      dashboard.push({
        apiKey: apiKeyData._id,
        projectName: apiKeyData.projectName,
        description: apiKeyData.description,
        createdAt: apiKeyData.createdAt,
        isActive: apiKeyData.isActive,
        usage: apiKeyData.usage || 0,
        participants: participantsCount,
        results: resultsCount,
      });
    }

    return dashboard;
  }
}

// Instância singleton
const database = new Database();

export default database;
