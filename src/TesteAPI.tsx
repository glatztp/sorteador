import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Users,
  Trophy,
  Copy,
  Plus,
  CheckCircle,
  Warning,
  Info,
  Flask,
  Lightbulb,
  Play,
  Trash,
  Eye,
  EyeSlash,
  ArrowRight,
  ChartLine,
  X,
} from "phosphor-react";
import { useNavigate } from "react-router-dom";

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

interface CreatedApiKey {
  apiKey: string;
  projectName: string;
  description: string;
  createdAt: string;
  usage?: number;
  participants?: number;
  results?: number;
}

const API_URL = "http://localhost:3001/api";

function TesteAPI() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);

  // Estados para painel principal
  const [activeView, setActiveView] = useState<"create" | "manage" | "test">(
    "create"
  );

  // Estados para criação de chaves
  const [createdKeys, setCreatedKeys] = useState<CreatedApiKey[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Estados para gerenciamento de chaves
  const [selectedKey, setSelectedKey] = useState<CreatedApiKey | null>(null);
  const [showKeyValues, setShowKeyValues] = useState<{
    [key: string]: boolean;
  }>({});

  // Estados para teste de funcionalidades (quando uma chave for selecionada)
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantName, setParticipantName] = useState("João Silva");
  const [participantEmail, setParticipantEmail] = useState("joao@email.com");
  const [participantPhone, setParticipantPhone] = useState("(11) 99999-9999");
  const [participantCity, setParticipantCity] = useState("São Paulo");
  const [winnersCount, setWinnersCount] = useState(1);
  const [lastDrawResult, setLastDrawResult] = useState<DrawResult | null>(null);

  // Estados para pop-up de estatísticas
  const [showStatsPopup, setShowStatsPopup] = useState(false);
  const [statsData, setStatsData] = useState<ApiResponse | null>(null);

  // Estados para participantes de teste
  const [testParticipantsCount, setTestParticipantsCount] = useState(5);

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
    if (!newProjectName.trim()) {
      showNotification("Nome do projeto é obrigatório!", "error");
      return;
    }

    const result = await makeRequest("/generate-key", {
      method: "POST",
      body: JSON.stringify({
        projectName: newProjectName,
        description: newDescription || "Projeto criado via painel de API",
      }),
    });

    if (result.success && result.apiKey) {
      const newKey: CreatedApiKey = {
        apiKey: result.apiKey,
        projectName: newProjectName,
        description: newDescription || "Projeto criado via painel de API",
        createdAt: new Date().toISOString(),
      };

      setCreatedKeys((prev) => [newKey, ...prev]);
      setNewProjectName("");
      setNewDescription("");
      showNotification("Chave API gerada com sucesso!", "success");
      setActiveView("manage");
    }
  };

  const selectKeyForTesting = (key: CreatedApiKey) => {
    setSelectedKey(key);
    setActiveView("test");
    loadParticipants(key.apiKey);
    showNotification(`Chave selecionada: ${key.projectName}`, "info");
  };

  const loadParticipants = async (apiKey: string) => {
    const result = await makeRequest(`/participants/${apiKey}`);
    if (result.success) {
      setParticipants(result.participants || []);
    }
  };

  const addParticipant = async () => {
    if (!selectedKey) {
      showNotification("Selecione uma chave API primeiro!", "error");
      return;
    }

    if (!participantName.trim() || !participantEmail.trim()) {
      showNotification("Nome e email são obrigatórios!", "error");
      return;
    }

    const result = await makeRequest(`/submit/${selectedKey.apiKey}`, {
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
      loadParticipants(selectedKey.apiKey);
    }
  };

  const performDraw = async () => {
    if (!selectedKey) {
      showNotification("Selecione uma chave API primeiro!", "error");
      return;
    }

    const result = await makeRequest(`/draw/${selectedKey.apiKey}`, {
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

  const deleteKey = (keyToDelete: string) => {
    setCreatedKeys((prev) => prev.filter((key) => key.apiKey !== keyToDelete));
    if (selectedKey?.apiKey === keyToDelete) {
      setSelectedKey(null);
      setParticipants([]);
      setLastDrawResult(null);
    }
    showNotification("Chave API removida!", "info");
  };

  const toggleKeyVisibility = (apiKey: string) => {
    setShowKeyValues((prev) => ({
      ...prev,
      [apiKey]: !prev[apiKey],
    }));
  };

  const goToLiveRaffleWithKey = (key: CreatedApiKey) => {
    navigate("/sorteio-live", {
      state: {
        apiKey: key.apiKey,
        projectInfo: {
          projectName: key.projectName,
          description: key.description,
          apiKey: key.apiKey,
          createdAt: key.createdAt,
          isActive: true,
          usage: key.usage || 0,
          participants: key.participants || 0,
          results: key.results || 0,
        },
      },
    });
  };

  // Função para carregar estatísticas
  const loadStats = async () => {
    const result = await makeRequest("/dashboard");
    if (result.success) {
      setStatsData(result);
      setShowStatsPopup(true);
    }
  };

  // Função para gerar participantes de teste com dados aleatórios
  const generateTestParticipants = async () => {
    if (!selectedKey) {
      showNotification("Selecione uma chave API primeiro!", "error");
      return;
    }

    // Validar limite de 5000 participantes
    if (testParticipantsCount > 5000) {
      showNotification(
        "Limite máximo de 5000 participantes de teste!",
        "error"
      );
      return;
    }

    if (testParticipantsCount < 1) {
      showNotification(
        "Quantidade deve ser pelo menos 1 participante!",
        "error"
      );
      return;
    }

    const nomes = [
      "Ana",
      "Bruno",
      "Carlos",
      "Diana",
      "Eduardo",
      "Fernanda",
      "Gabriel",
      "Helena",
      "Igor",
      "Julia",
      "Leonardo",
      "Maria",
      "Nicolas",
      "Olivia",
      "Paulo",
      "Quitéria",
      "Rafael",
      "Sofia",
      "Thiago",
      "Ursula",
      "Vicente",
      "Wanda",
      "Xavier",
      "Yasmin",
      "Zeca",
    ];

    const sobrenomes = [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Rodrigues",
      "Ferreira",
      "Alves",
      "Pereira",
      "Lima",
      "Gomes",
      "Costa",
      "Ribeiro",
      "Martins",
      "Carvalho",
      "Almeida",
      "Lopes",
      "Soares",
      "Fernandes",
      "Vieira",
      "Barbosa",
      "Rocha",
      "Dias",
      "Monteiro",
      "Cardoso",
    ];

    const cidades = [
      "São Paulo",
      "Rio de Janeiro",
      "Belo Horizonte",
      "Salvador",
      "Brasília",
      "Fortaleza",
      "Curitiba",
      "Recife",
      "Porto Alegre",
      "Manaus",
      "Belém",
      "Goiânia",
      "Guarulhos",
      "Campinas",
      "São Luis",
      "São Gonçalo",
      "Maceió",
      "Duque de Caxias",
      "Natal",
      "Teresina",
      "Campo Grande",
      "Nova Iguaçu",
    ];

    const dominios = [
      "gmail.com",
      "hotmail.com",
      "yahoo.com.br",
      "outlook.com",
      "uol.com.br",
    ];

    let added = 0;
    const promises = [];

    for (let i = 0; i < testParticipantsCount; i++) {
      const nome = nomes[Math.floor(Math.random() * nomes.length)];
      const sobrenome =
        sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
      const nomeCompleto = `${nome} ${sobrenome}`;
      const dominio = dominios[Math.floor(Math.random() * dominios.length)];
      const email = `${nome.toLowerCase()}.${sobrenome.toLowerCase()}${Math.floor(
        Math.random() * 999
      )}@${dominio}`;
      const cidade = cidades[Math.floor(Math.random() * cidades.length)];
      const ddd = Math.floor(Math.random() * 90) + 11; // DDD entre 11 e 99
      const telefone = `(${ddd}) 9${Math.floor(
        Math.random() * 9000 + 1000
      )}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const participantData = {
        nome: nomeCompleto,
        email: email,
        telefone: telefone,
        cidade: cidade,
      };

      promises.push(
        makeRequest(`/submit/${selectedKey.apiKey}`, {
          method: "POST",
          body: JSON.stringify(participantData),
        }).then((result) => {
          if (result.success) added++;
        })
      );
    }

    await Promise.all(promises);

    showNotification(`${added} participantes de teste adicionados!`, "success");
    loadParticipants(selectedKey.apiKey);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Notifications */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
        </AnimatePresence>
      </div>

      {/* Pop-up de Estatísticas */}
      <AnimatePresence>
        {showStatsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowStatsPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="corporate-bg rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ChartLine size={24} className="corporate-accent" />
                  <h2 className="text-2xl font-bold corporate-primary">
                    Estatísticas Gerais
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowStatsPopup(false)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {statsData && (
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold corporate-accent mb-2">
                      {statsData.projects?.length || 0}
                    </div>
                    <div className="corporate-secondary">Total de Projetos</div>
                  </div>

                  {statsData.projects && statsData.projects.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold corporate-primary mb-4">
                        Projetos Ativos
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {statsData.projects.map((project: ProjectInfo) => (
                          <div
                            key={project.apiKey}
                            className="bg-black/20 rounded-lg p-4"
                          >
                            <p className="font-semibold text-lg corporate-primary mb-2">
                              {project.projectName}
                            </p>
                            <p className="text-sm corporate-secondary mb-3">
                              {project.description}
                            </p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-xl font-bold corporate-accent">
                                  {project.participants}
                                </div>
                                <div className="text-xs corporate-secondary">
                                  Participantes
                                </div>
                              </div>
                              <div>
                                <div className="text-xl font-bold corporate-accent">
                                  {project.results}
                                </div>
                                <div className="text-xs corporate-secondary">
                                  Sorteios
                                </div>
                              </div>
                              <div>
                                <div className="text-xl font-bold corporate-accent">
                                  {project.usage}
                                </div>
                                <div className="text-xs corporate-secondary">
                                  Usos da API
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!statsData && (
                <div className="text-center py-8">
                  <ChartLine
                    size={64}
                    className="corporate-secondary/50 mx-auto mb-4"
                  />
                  <p className="corporate-secondary">Nenhum dado encontrado</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold corporate-primary mb-3 flex items-center justify-center gap-3">
            <Key size={40} className="corporate-accent" />
            Painel de API
          </h1>
          <p className="corporate-secondary">
            Crie e gerencie suas chaves de API para o sistema de sorteios
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="flex flex-wrap bg-black/20 rounded-xl p-1 gap-1 sm:gap-0">
            {[
              { id: "create", label: "Criar Chave", icon: Plus },
              { id: "manage", label: "Gerenciar", icon: Key },
              {
                id: "test",
                label: "Testar",
                icon: Flask,
                disabled: !selectedKey,
              },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView(tab.id as typeof activeView)}
                disabled={tab.disabled}
                className={`px-4 sm:px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm sm:text-base ${
                  activeView === tab.id
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : tab.disabled
                    ? "corporate-secondary/50 cursor-not-allowed"
                    : "corporate-secondary hover:bg-white/5"
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Create API Key View */}
        {activeView === "create" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="corporate-bg rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Plus size={24} className="corporate-accent" />
                <h2 className="text-xl sm:text-2xl font-bold corporate-primary">
                  Criar Nova Chave API
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block corporate-secondary font-semibold mb-3 text-lg">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-lg"
                    placeholder="Ex: Sorteio Halloween 2024"
                  />
                </div>

                <div>
                  <label className="block corporate-secondary font-semibold mb-3 text-lg">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full h-24 resize-none"
                    placeholder="Descreva o propósito do projeto..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateApiKey}
                  disabled={loading || !newProjectName.trim()}
                  className="modern-btn-enhanced w-full justify-center text-xl py-4 disabled:opacity-50"
                >
                  <Key size={24} />
                  {loading ? "Gerando..." : "Criar Chave API"}
                </motion.button>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-semibold mb-2">Dica</p>
                      <p className="text-blue-300/80 text-sm">
                        Após criar sua chave, você poderá gerenciá-la na aba
                        "Gerenciar" e testá-la na aba "Testar". Você também pode
                        usar a chave diretamente no Sorteio ao Vivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Manage API Keys View */}
        {activeView === "manage" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="corporate-bg rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <Key size={24} className="corporate-accent" />
                  <h2 className="text-xl sm:text-2xl font-bold corporate-primary">
                    Minhas Chaves API
                  </h2>
                </div>
                <div className="text-sm corporate-secondary">
                  {createdKeys.length} chave
                  {createdKeys.length !== 1 ? "s" : ""} criada
                  {createdKeys.length !== 1 ? "s" : ""}
                </div>
              </div>

              {createdKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key
                    size={64}
                    className="corporate-secondary/50 mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold corporate-primary mb-2">
                    Nenhuma chave criada ainda
                  </h3>
                  <p className="corporate-secondary mb-6">
                    Crie sua primeira chave API para começar a usar o sistema de
                    sorteios
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveView("create")}
                    className="modern-btn-enhanced"
                  >
                    <Plus size={20} />
                    Criar Primeira Chave
                  </motion.button>
                </div>
              ) : (
                <div className="grid gap-4">
                  <AnimatePresence>
                    {createdKeys.map((key, index) => (
                      <motion.div
                        key={key.apiKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/20 border border-white/10 rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold corporate-primary mb-1">
                              {key.projectName}
                            </h3>
                            <p className="corporate-secondary text-sm mb-3">
                              {key.description}
                            </p>
                            <p className="text-xs corporate-secondary/60">
                              Criada em:{" "}
                              {new Date(key.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-semibold corporate-secondary mb-2">
                            Chave API:
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/40 px-3 py-2 rounded text-xs font-mono break-all">
                              {showKeyValues[key.apiKey]
                                ? key.apiKey
                                : "•".repeat(40) + key.apiKey.slice(-8)}
                            </code>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleKeyVisibility(key.apiKey)}
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                              title={
                                showKeyValues[key.apiKey]
                                  ? "Ocultar"
                                  : "Mostrar"
                              }
                            >
                              {showKeyValues[key.apiKey] ? (
                                <EyeSlash size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(key.apiKey)}
                              className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                              title="Copiar chave"
                            >
                              <Copy size={16} className="corporate-accent" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectKeyForTesting(key)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg font-semibold transition-colors"
                          >
                            <Play size={16} />
                            Testar
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => goToLiveRaffleWithKey(key)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 rounded-lg font-semibold transition-colors"
                          >
                            <ArrowRight size={16} />
                            Sorteio ao Vivo
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => deleteKey(key.apiKey)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors"
                            title="Remover chave"
                          >
                            <Trash size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Test API Key View */}
        {activeView === "test" && selectedKey && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-6xl mx-auto"
          >
            <div className="mb-6 corporate-bg rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flask size={20} className="corporate-accent" />
                  <span className="font-semibold corporate-primary">
                    Testando: {selectedKey.projectName}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView("manage")}
                  className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ← Voltar
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Add Participants */}
              <div className="corporate-bg rounded-2xl p-4 sm:p-6 order-1">
                <div className="flex items-center gap-3 mb-6">
                  <Users size={24} className="corporate-accent" />
                  <h3 className="text-lg sm:text-xl font-bold corporate-primary">
                    Adicionar Participantes
                  </h3>
                </div>

                <div className="space-y-4">
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addParticipant}
                    disabled={
                      loading ||
                      !participantName.trim() ||
                      !participantEmail.trim()
                    }
                    className="modern-btn w-full justify-center text-sm disabled:opacity-50"
                  >
                    <Plus size={18} />
                    {loading ? "Enviando..." : "Adicionar Participante"}
                  </motion.button>

                  {/* Seção de Participantes de Teste */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Flask size={20} className="text-blue-400" />
                        <p className="text-blue-400 font-semibold">
                          Participantes de Teste
                        </p>
                      </div>
                      <p className="text-blue-300/80 text-sm mb-3">
                        Gere participantes com dados aleatórios para testar o
                        sorteio
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-blue-300 mb-2">
                            Quantidade:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5000"
                            value={testParticipantsCount}
                            onChange={(e) =>
                              setTestParticipantsCount(
                                Math.max(
                                  1,
                                  Math.min(5000, Number(e.target.value))
                                )
                              )
                            }
                            className="w-full text-sm bg-blue-500/10 border border-blue-400/30 rounded-lg px-3 py-2"
                          />
                          <p className="text-xs text-blue-400/70 mt-1">
                            Máximo: 5000 participantes
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={generateTestParticipants}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
                        >
                          {loading ? "Gerando..." : "Gerar"}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center flex gap-2">
                    <div className="flex-1">
                      <p className="text-sm corporate-secondary mb-2">
                        Participantes: {participants.length}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => loadParticipants(selectedKey.apiKey)}
                        disabled={loading}
                        className="w-full text-sm px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        <Users size={16} className="inline mr-2" />
                        Atualizar
                      </motion.button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm corporate-secondary mb-2">
                        Estatísticas Gerais
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={loadStats}
                        disabled={loading}
                        className="w-full text-sm px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        <ChartLine size={16} className="inline mr-2" />
                        Ver Stats
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Make Draw */}
              <div className="corporate-bg rounded-2xl p-4 sm:p-6 order-2">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy size={24} className="corporate-accent" />
                  <h3 className="text-lg sm:text-xl font-bold corporate-primary">
                    Fazer Sorteio
                  </h3>
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
                      disabled={participants.length === 0}
                    >
                      {[1, 2, 3, 5, 10]
                        .filter((num) => num <= participants.length)
                        .map((num) => (
                          <option key={num} value={num}>
                            {num} Ganhador{num !== 1 ? "es" : ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={performDraw}
                    disabled={loading || participants.length === 0}
                    className="modern-btn w-full justify-center disabled:opacity-50"
                  >
                    <Trophy size={20} />
                    {loading ? "Sorteando..." : "Fazer Sorteio"}
                  </motion.button>

                  {participants.length === 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                        <Warning size={16} />
                        Adicione participantes primeiro
                      </p>
                    </div>
                  )}
                </div>

                {lastDrawResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 bg-accent/10 border border-accent/20 rounded-lg p-4"
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
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center"
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
