import { useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Users,
  Trophy,
  ChartLine,
  Copy,
  Plus,
  CheckCircle,
  Warning,
  Info,
  Flask,
  Lightbulb,
} from "phosphor-react";

interface ApiResponse {
  success: boolean;
  error?: string;
  apiKey?: string;
  participants?: Participant[];
  total?: number;
  result?: DrawResult;
  results?: DrawResult[];
  projects?: ProjectInfo[];
  message?: string;
  participantId?: string;
  valid?: boolean;
  project?: ProjectInfo;
}

interface DrawResult {
  winners: Participant[];
  totalParticipants: number;
  drawnAt: string;
  resultId: string;
}

interface ProjectInfo {
  apiKey: string;
  projectName: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  usage: number;
  participants: number;
  results: number;
}

interface Participant {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  submittedAt: string;
}

const API_URL = "http://localhost:3001/api";

function TesteAPI() {
  const [currentApiKey, setCurrentApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);

  // Estados para criação de chave
  const [projectName, setProjectName] = useState("Teste React");
  const [description, setDescription] = useState("Teste da API via React");

  // Estados para participantes
  const [participantName, setParticipantName] = useState("João Silva");
  const [participantEmail, setParticipantEmail] = useState("joao@email.com");
  const [participantPhone, setParticipantPhone] = useState("(11) 99999-9999");
  const [participantCity, setParticipantCity] = useState("São Paulo");
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Estados para sorteio
  const [winnersCount, setWinnersCount] = useState(1);
  const [lastDrawResult, setLastDrawResult] = useState<DrawResult | null>(null);

  // Estados para dashboard
  const [dashboardData, setDashboardData] = useState<ApiResponse | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [keyValidationLoading, setKeyValidationLoading] = useState(false);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification("Copiado para a área de transferência!", "success");
  };

  const makeRequest = async (
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }

      return data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      showNotification(errorMessage || "Erro de conexão", "error");
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!projectName.trim()) {
      showNotification("Nome do projeto é obrigatório!", "error");
      return;
    }

    const result = await makeRequest("/generate-key", {
      method: "POST",
      body: JSON.stringify({ projectName, description }),
    });

    if (result.success) {
      setCurrentApiKey(result.apiKey || "");
      showNotification("Chave API gerada com sucesso!", "success");
    }
  };

  const addParticipant = async () => {
    if (!currentApiKey) {
      showNotification("Gere uma chave API primeiro!", "error");
      return;
    }

    if (!participantName.trim() || !participantEmail.trim()) {
      showNotification("Nome e email são obrigatórios!", "error");
      return;
    }

    const result = await makeRequest(`/submit/${currentApiKey}`, {
      method: "POST",
      body: JSON.stringify({
        nome: participantName,
        email: participantEmail,
        telefone: participantPhone,
        cidade: participantCity,
      }),
    });

    if (result.success) {
      showNotification("Participante adicionado com sucesso!", "success");
      loadParticipants();
    }
  };

  const addSampleParticipants = async () => {
    if (!currentApiKey) {
      showNotification("Gere uma chave API primeiro!", "error");
      return;
    }

    const sampleParticipants = [
      {
        nome: "Maria Santos",
        email: "maria@email.com",
        telefone: "(11) 99999-1111",
        cidade: "São Paulo",
      },
      {
        nome: "Pedro Silva",
        email: "pedro@email.com",
        telefone: "(11) 99999-2222",
        cidade: "Rio de Janeiro",
      },
      {
        nome: "Ana Costa",
        email: "ana@email.com",
        telefone: "(11) 99999-3333",
        cidade: "Belo Horizonte",
      },
      {
        nome: "Carlos Lima",
        email: "carlos@email.com",
        telefone: "(11) 99999-4444",
        cidade: "Salvador",
      },
      {
        nome: "Julia Ferreira",
        email: "julia@email.com",
        telefone: "(11) 99999-5555",
        cidade: "Curitiba",
      },
    ];

    let added = 0;
    for (const participant of sampleParticipants) {
      const result = await makeRequest(`/submit/${currentApiKey}`, {
        method: "POST",
        body: JSON.stringify(participant),
      });

      if (result.success) added++;
    }

    showNotification(
      `${added} participantes de exemplo adicionados!`,
      "success"
    );
    loadParticipants();
  };

  const loadParticipants = async () => {
    if (!currentApiKey) return;

    const result = await makeRequest(`/participants/${currentApiKey}`);

    if (result.success) {
      setParticipants(result.participants || []);
    }
  };

  const performDraw = async () => {
    if (!currentApiKey) {
      showNotification("Gere uma chave API primeiro!", "error");
      return;
    }

    const result = await makeRequest(`/draw/${currentApiKey}`, {
      method: "POST",
      body: JSON.stringify({ quantity: winnersCount }),
    });

    if (result.success && result.result) {
      setLastDrawResult(result.result);
      showNotification(
        `Sorteio realizado! ${result.result.winners.length} ganhador(es) selecionado(s)`,
        "success"
      );
    }
  };

  const loadDashboard = async () => {
    const result = await makeRequest("/dashboard");

    if (result.success) {
      setDashboardData(result);
      showNotification("Dashboard carregado!", "info");
    }
  };

  const validateApiKey = async (apiKey: string) => {
    if (!apiKey.trim()) {
      setApiKeyValid(null);
      return;
    }

    setKeyValidationLoading(true);
    try {
      const result = await makeRequest(`/validate-key/${apiKey}`);
      setApiKeyValid(result.valid || false);

      if (result.valid) {
        showNotification("Chave API válida!", "success");
        loadParticipants();
      } else {
        showNotification("Chave API inválida", "error");
      }
    } catch {
      setApiKeyValid(false);
    } finally {
      setKeyValidationLoading(false);
    }
  };

  const handleApiKeyChange = (newKey: string) => {
    setCurrentApiKey(newKey);
    if (newKey !== currentApiKey) {
      setApiKeyValid(null);
      setParticipants([]);
      setLastDrawResult(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm ${
              notification.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-100"
                : notification.type === "error"
                ? "bg-red-500/20 border border-red-500/30 text-red-100"
                : "bg-blue-500/20 border border-blue-500/30 text-blue-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" && <CheckCircle size={20} />}
              {notification.type === "error" && <Warning size={20} />}
              {notification.type === "info" && <Info size={20} />}
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold corporate-primary mb-3 flex items-center justify-center gap-3">
            <Flask size={40} className="corporate-accent" />
            Teste da API do Sorteador
          </h1>
          <p className="corporate-secondary">
            Interface React para testar todas as funcionalidades da API
          </p>

          {/* Campo para colar chave API existente */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-2xl mx-auto"
          >
            <div className="corporate-bg rounded-xl p-4">
              <label className="flex items-center gap-2 corporate-secondary font-semibold mb-2 text-sm">
                <Lightbulb size={16} className="corporate-accent" />
                Já tem uma chave API? Cole aqui para testar:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={currentApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className={`w-full text-sm font-mono pr-8 ${
                      apiKeyValid === true
                        ? "border-green-500/50 bg-green-500/5"
                        : apiKeyValid === false
                        ? "border-red-500/50 bg-red-500/5"
                        : ""
                    }`}
                    placeholder="Cole sua chave API aqui..."
                  />
                  {currentApiKey && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      {keyValidationLoading ? (
                        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      ) : apiKeyValid === true ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : apiKeyValid === false ? (
                        <Warning size={16} className="text-red-400" />
                      ) : null}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => validateApiKey(currentApiKey)}
                  disabled={!currentApiKey.trim() || keyValidationLoading}
                  className="px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {keyValidationLoading ? "Validando..." : "Validar"}
                </motion.button>
              </div>

              {apiKeyValid === true && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle size={16} />
                      Chave API válida! Pronto para testar.
                    </span>
                  </div>
                </motion.div>
              )}

              {apiKeyValid === false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Warning size={16} className="text-red-400" />
                    <span className="text-red-400 text-sm font-semibold">
                      Chave API inválida. Verifique se está correta.
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção 1: Gerar Chave API */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="corporate-bg rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Key size={24} className="corporate-accent" />
              <h2 className="text-xl font-bold corporate-primary">
                1. Gerar Chave API
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block corporate-secondary font-semibold mb-2">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full"
                  placeholder="Ex: Sorteio Halloween 2024"
                />
              </div>

              <div>
                <label className="block corporate-secondary font-semibold mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full"
                  placeholder="Descrição do projeto"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateApiKey}
                disabled={loading}
                className="modern-btn w-full justify-center"
              >
                <Key size={20} />
                {loading ? "Gerando..." : "Gerar Chave API"}
              </motion.button>

              {currentApiKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
                >
                  <p className="corporate-secondary text-sm mb-2 font-semibold">
                    🔑 Sua Chave API:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-black/30 px-3 py-2 rounded text-xs font-mono break-all">
                      {currentApiKey}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(currentApiKey)}
                      className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                      title="Copiar chave"
                    >
                      <Copy size={16} className="corporate-accent" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Seção 2: Gerenciar Participantes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="corporate-bg rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users size={24} className="corporate-accent" />
              <h2 className="text-xl font-bold corporate-primary">
                2. Participantes
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-blue-400 text-sm font-semibold flex items-center gap-2">
                  <Info size={16} />
                  Simule um formulário de cadastro
                </p>
                <p className="text-blue-300/70 text-xs mt-1">
                  Preencha os dados abaixo como se fosse um participante se
                  inscrevendo para o sorteio
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block corporate-secondary font-semibold mb-1 text-sm">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full text-sm"
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block corporate-secondary font-semibold mb-1 text-sm">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    className="w-full text-sm"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="block corporate-secondary font-semibold mb-1 text-sm">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={participantPhone}
                    onChange={(e) => setParticipantPhone(e.target.value)}
                    className="w-full text-sm"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block corporate-secondary font-semibold mb-1 text-sm">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={participantCity}
                    onChange={(e) => setParticipantCity(e.target.value)}
                    className="w-full text-sm"
                    placeholder="Cidade"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addParticipant}
                  disabled={
                    loading ||
                    !currentApiKey ||
                    !participantName.trim() ||
                    !participantEmail.trim()
                  }
                  className="modern-btn flex-1 justify-center text-sm disabled:opacity-50"
                >
                  <Plus size={18} />
                  {loading ? "Enviando..." : "Enviar Inscrição"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addSampleParticipants}
                  disabled={loading || !currentApiKey}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  title="Adiciona 5 participantes de exemplo"
                >
                  <Users size={18} />
                  Demo
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadParticipants}
                disabled={loading || !currentApiKey}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Users size={18} />
                🔄 Atualizar Lista ({participants.length} participantes)
              </motion.button>

              {!currentApiKey && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                    <Warning size={16} />
                    Chave API necessária
                  </p>
                  <p className="text-yellow-300/70 text-xs mt-1">
                    Gere uma chave API primeiro ou cole uma existente para
                    testar o formulário
                  </p>
                </div>
              )}

              {participants.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-primary/20 pt-4"
                >
                  <p className="corporate-secondary text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users size={16} />
                    Participantes Inscritos:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {participants.map((participant) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-black/20 rounded-lg p-3 hover:bg-black/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm corporate-primary truncate">
                            {participant.nome}
                          </p>
                          <p className="text-xs corporate-secondary truncate">
                            {participant.email}
                          </p>
                          {participant.telefone && (
                            <p className="text-xs corporate-secondary/60">
                              {participant.telefone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs corporate-secondary/60">
                            {participant.cidade || "N/A"}
                          </div>
                          <div className="text-xs corporate-secondary/40">
                            {new Date(participant.submittedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Seção 3: Fazer Sorteio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="corporate-bg rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Trophy size={24} className="corporate-accent" />
              <h2 className="text-xl font-bold corporate-primary">
                3. Fazer Sorteio
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block corporate-secondary font-semibold mb-2">
                  Quantidade de Ganhadores
                </label>
                <select
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(Number(e.target.value))}
                  className="w-full"
                >
                  <option value={1}>1 Ganhador</option>
                  <option value={2}>2 Ganhadores</option>
                  <option value={3}>3 Ganhadores</option>
                  <option value={5}>5 Ganhadores</option>
                  <option value={10}>10 Ganhadores</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={performDraw}
                disabled={
                  loading || !currentApiKey || participants.length === 0
                }
                className="modern-btn w-full justify-center"
              >
                <Trophy size={20} />
                {loading ? "Sorteando..." : "Fazer Sorteio"}
              </motion.button>

              {lastDrawResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-accent/10 border border-accent/20 rounded-lg p-4"
                >
                  <p className="corporate-secondary text-sm mb-3 font-semibold">
                    🏆 Resultado do Sorteio:
                  </p>
                  <div className="space-y-2">
                    {lastDrawResult.winners.map(
                      (winner: Participant, index: number) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between bg-black/30 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-black text-xs font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-sm corporate-primary">
                                {winner.nome}
                              </p>
                              <p className="text-xs corporate-secondary">
                                {winner.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <p className="text-xs corporate-secondary/60 mt-3 text-center">
                    Total de participantes: {lastDrawResult.totalParticipants}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Seção 4: Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="corporate-bg rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ChartLine size={24} className="corporate-accent" />
              <h2 className="text-xl font-bold corporate-primary">
                4. Dashboard
              </h2>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadDashboard}
                disabled={loading}
                className="modern-btn w-full justify-center"
              >
                <ChartLine size={20} />
                {loading ? "Carregando..." : "Carregar Dashboard"}
              </motion.button>

              {dashboardData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <p className="corporate-secondary text-sm font-semibold">
                    📊 Projetos Ativos: {dashboardData.projects?.length || 0}
                  </p>

                  {dashboardData.projects
                    ?.slice(0, 3)
                    .map((project: ProjectInfo) => (
                      <div
                        key={project.apiKey}
                        className="bg-black/20 rounded-lg p-3"
                      >
                        <p className="font-semibold text-sm corporate-primary">
                          {project.projectName}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-xs">
                          <div className="text-center">
                            <p className="corporate-accent font-bold">
                              {project.participants}
                            </p>
                            <p className="corporate-secondary/60">
                              Participantes
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="corporate-accent font-bold">
                              {project.results}
                            </p>
                            <p className="corporate-secondary/60">Sorteios</p>
                          </div>
                          <div className="text-center">
                            <p className="corporate-accent font-bold">
                              {project.usage}
                            </p>
                            <p className="corporate-secondary/60">Usos</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="corporate-secondary/70 text-sm">
            API rodando em:{" "}
            <code className="bg-black/20 px-2 py-1 rounded">
              http://localhost:3001
            </code>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default TesteAPI;
