import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Sparkle,
  Timer,
  ArrowLeft,
  Crown,
  Shuffle,
  Play,
  Pause,
  ChartLine,
  Key,
  CheckCircle,
  X,
  Phone,
  MapPin,
} from "phosphor-react";
import { useNavigate } from "react-router-dom";

interface Participant {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  submittedAt: string;
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

interface SorteioLiveProps {
  apiKey?: string;
  projectInfo?: ProjectInfo;
}

const API_URL = "http://localhost:3001/api";

function SorteioLive({
  apiKey: initialApiKey,
  projectInfo: initialProjectInfo,
}: SorteioLiveProps) {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(
    initialProjectInfo || null
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [winnersCount, setWinnersCount] = useState(1);
  const [currentAnimation, setCurrentAnimation] = useState<Participant | null>(
    null
  );
  const [animationStep, setAnimationStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const makeRequest = async (endpoint: string, options?: RequestInit) => {
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
    } catch (error) {
      console.error("Erro na requisição:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadProjectInfo = useCallback(async () => {
    if (!apiKey) return;
    try {
      const result = await makeRequest(`/validate-key/${apiKey}`);
      if (result.valid && result.project) {
        setProjectInfo(result.project);
      }
    } catch (error) {
      console.error("Erro ao carregar info do projeto:", error);
    }
  }, [apiKey]);

  const loadParticipants = useCallback(async () => {
    if (!apiKey) return;
    try {
      const result = await makeRequest(`/participants/${apiKey}`);
      if (result.success) {
        setParticipants(result.participants || []);
      }
    } catch (error) {
      console.error("Erro ao carregar participantes:", error);
    }
  }, [apiKey]);

  // Auto-refresh dos participantes
  useEffect(() => {
    if (!apiKey || !autoRefresh) return;

    const interval = setInterval(() => {
      loadParticipants();
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [apiKey, autoRefresh, loadParticipants]);

  // Carregar dados iniciais
  useEffect(() => {
    if (apiKey) {
      loadProjectInfo();
      loadParticipants();
    }
  }, [apiKey, loadProjectInfo, loadParticipants]);

  const performDraw = async () => {
    if (participants.length === 0) return;

    setIsDrawing(true);
    setDrawComplete(false);
    setWinners([]);
    setCurrentAnimation(null);
    setAnimationStep(0);

    // Animação de embaralhamento
    const shuffleSteps = 20;
    for (let i = 0; i < shuffleSteps; i++) {
      const randomParticipant =
        participants[Math.floor(Math.random() * participants.length)];
      setCurrentAnimation(randomParticipant);
      setAnimationStep(i);
      await new Promise((resolve) => setTimeout(resolve, 150 - i * 5)); // Acelera gradualmente
    }

    try {
      // Fazer o sorteio real
      const result = await makeRequest(`/draw/${apiKey}`, {
        method: "POST",
        body: JSON.stringify({ quantity: winnersCount }),
      });

      if (result.success && result.result) {
        // Animar a revelação dos ganhadores
        const drawWinners = result.result.winners;
        setWinners([]);

        for (let i = 0; i < drawWinners.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setWinners((prev) => [...prev, drawWinners[i]]);
        }

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error("Erro no sorteio:", error);
    } finally {
      setIsDrawing(false);
      setDrawComplete(true);
      setCurrentAnimation(null);
    }
  };

  const resetDraw = () => {
    setWinners([]);
    setDrawComplete(false);
    setCurrentAnimation(null);
    setAnimationStep(0);
    setShowConfetti(false);
  };

  const handleApiKeySubmit = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setTempApiKey("");
      setShowApiKeyInput(false);
    }
  };

  const handleLogout = () => {
    setApiKey("");
    setProjectInfo(null);
    setParticipants([]);
    setWinners([]);
    setDrawComplete(false);
    setShowApiKeyInput(false);
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto"
        >
          <Trophy size={64} className="corporate-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold corporate-primary mb-4">
            Sorteio ao Vivo
          </h2>
          <p className="corporate-secondary mb-6">
            Insira sua chave API para acessar o sorteio em tempo real
          </p>

          <div className="space-y-4">
            {!showApiKeyInput ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowApiKeyInput(true)}
                className="w-full modern-btn justify-center text-lg py-4"
              >
                🔑 Inserir Chave API
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Key
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 corporate-accent z-10"
                  />
                  <input
                    type="text"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Cole sua chave API aqui..."
                    className="custom-input pl-12 text-center font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleApiKeySubmit()}
                  />
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApiKeySubmit}
                    disabled={!tempApiKey.trim()}
                    className="flex-1 modern-btn-enhanced justify-center disabled:opacity-50"
                  >
                    <CheckCircle size={20} />
                    Conectar
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowApiKeyInput(false);
                      setTempApiKey("");
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            )}

            <div className="pt-4 border-t border-primary/20">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/teste")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-semibold transition-colors"
              >
                <ArrowLeft size={20} />
                Voltar para Teste API
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  x: Math.random() * window.innerWidth,
                }}
                transition={{
                  duration: Math.random() * 2 + 3,
                  ease: "easeOut",
                  delay: Math.random() * 0.5,
                }}
                className="absolute w-3 h-3 bg-gradient-to-r from-accent via-secondary to-primary rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/teste")}
              className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
            >
              <ArrowLeft size={24} />
            </motion.button>

            <div>
              <h1 className="text-3xl font-bold corporate-primary flex items-center gap-3">
                <Trophy size={32} className="corporate-accent" />
                Sorteio ao Vivo
              </h1>
              {projectInfo && (
                <p className="corporate-secondary">
                  {projectInfo.projectName} - {projectInfo.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-3 rounded-xl border transition-colors ${
                autoRefresh
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
              title={
                autoRefresh ? "Auto-refresh ativo" : "Auto-refresh pausado"
              }
            >
              {autoRefresh ? <Play size={20} /> : <Pause size={20} />}
            </motion.button>

            {/* Botão discreto para gerenciar chave API */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
              title="Desconectar chave API"
            >
              <Key size={16} />
              <X size={12} />
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel Principal - Sorteio */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="corporate-bg rounded-3xl p-8 text-center relative overflow-hidden"
              style={{ minHeight: "500px" }}
            >
              {/* Background Animation */}
              <div className="absolute inset-0 opacity-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-96 h-96 mx-auto mt-16"
                >
                  <Sparkle size={384} className="corporate-accent" />
                </motion.div>
              </div>

              <div className="relative z-10">
                {!drawComplete && !isDrawing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Trophy
                          size={80}
                          className="corporate-accent mx-auto mb-4"
                        />
                      </motion.div>
                      <h2 className="text-4xl font-bold corporate-primary mb-2">
                        Pronto para Sortear!
                      </h2>
                      <p className="corporate-secondary text-lg">
                        {participants.length} participantes inscritos
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <label className="flex items-center justify-center gap-2 corporate-secondary font-semibold mb-3">
                        <Trophy size={20} className="corporate-accent" />
                        Quantidade de Ganhadores:
                      </label>
                      <div className="custom-select">
                        <select
                          value={winnersCount}
                          onChange={(e) =>
                            setWinnersCount(Number(e.target.value))
                          }
                          className="text-lg font-semibold text-center"
                          disabled={participants.length === 0}
                        >
                          {[1, 2, 3, 5, 10]
                            .filter((num) => num <= participants.length)
                            .map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? "Ganhador" : "Ganhadores"}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={performDraw}
                      disabled={participants.length === 0 || loading}
                      className="text-2xl font-bold px-12 py-6 bg-gradient-to-r from-accent via-secondary to-primary text-black rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                      <motion.div
                        className="flex items-center gap-4"
                        animate={!loading ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {participants.length === 0
                          ? "Sem Participantes"
                          : "INICIAR SORTEIO"}
                      </motion.div>
                    </motion.button>
                  </motion.div>
                )}

                {isDrawing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    <div>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Timer
                          size={80}
                          className="corporate-accent mx-auto mb-4"
                        />
                      </motion.div>
                      <h2 className="text-4xl font-bold corporate-primary mb-4">
                        Sorteando...
                      </h2>
                    </div>

                    {currentAnimation && (
                      <motion.div
                        key={`${currentAnimation.id}-${animationStep}`}
                        initial={{ scale: 0.8, opacity: 0.7 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0.7 }}
                        className="bg-accent/20 border-2 border-accent rounded-2xl p-6 max-w-md mx-auto"
                      >
                        <p className="text-2xl font-bold corporate-primary">
                          {currentAnimation.nome}
                        </p>
                        <p className="corporate-secondary">
                          {currentAnimation.email}
                        </p>
                        {currentAnimation.cidade && (
                          <p className="text-sm corporate-secondary/70">
                            {currentAnimation.cidade}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {drawComplete && winners.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Crown
                          size={80}
                          className="text-yellow-400 mx-auto mb-4"
                        />
                      </motion.div>
                      <h2 className="text-4xl font-bold corporate-primary mb-4">
                        Parabéns aos Ganhadores!
                      </h2>
                    </div>

                    <div className="space-y-4 max-w-2xl mx-auto">
                      <AnimatePresence>
                        {winners.map((winner, index) => (
                          <motion.div
                            key={winner.id}
                            initial={{ opacity: 0, x: -50, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: index * 0.3 }}
                            className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-2 border-yellow-400/50 rounded-2xl p-6 text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-yellow-400 text-black font-bold text-xl flex items-center justify-center">
                                {index + 1}º
                              </div>
                              <div className="flex-1">
                                <p className="text-2xl font-bold corporate-primary">
                                  {winner.nome}
                                </p>
                                <p className="corporate-secondary">
                                  {winner.email}
                                </p>
                                {winner.telefone && (
                                  <p className="text-sm corporate-secondary/70">
                                    <Phone size={14} className="inline mr-1" />{" "}
                                    {winner.telefone}
                                  </p>
                                )}
                                {winner.cidade && (
                                  <p className="text-sm corporate-secondary/70">
                                    <MapPin size={14} className="inline mr-1" />{" "}
                                    {winner.cidade}
                                  </p>
                                )}
                              </div>
                              <Crown size={32} className="text-yellow-400" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetDraw}
                      className="modern-btn text-lg px-8 py-4"
                    >
                      <Shuffle size={24} />
                      Novo Sorteio
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Painel Lateral - Participantes e Estatísticas */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="corporate-bg rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold corporate-primary mb-4 flex items-center gap-2">
                <ChartLine size={24} className="corporate-accent" />
                Estatísticas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-3xl font-bold corporate-accent mb-1">
                    {participants.length}
                  </div>
                  <div className="text-sm corporate-secondary">
                    Participantes
                  </div>
                </div>

                <div className="text-center p-4 bg-black/20 rounded-xl">
                  <div className="text-3xl font-bold corporate-accent mb-1">
                    {projectInfo?.results || 0}
                  </div>
                  <div className="text-sm corporate-secondary">Sorteios</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-black/20 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold corporate-accent mb-1">
                    {projectInfo?.usage || 0}
                  </div>
                  <div className="text-sm corporate-secondary">
                    Total de Usos da API
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lista de Participantes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="corporate-bg rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold corporate-primary flex items-center gap-2">
                  <Users size={24} className="corporate-accent" />
                  Participantes
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      autoRefresh ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs corporate-secondary">
                    {autoRefresh ? "Atualizando" : "Pausado"}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                <AnimatePresence>
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                    >
                      <p className="font-semibold text-sm corporate-primary">
                        {participant.nome}
                      </p>
                      <p className="text-xs corporate-secondary truncate">
                        {participant.email}
                      </p>
                      {participant.cidade && (
                        <p className="text-xs corporate-secondary/60">
                          <MapPin size={12} className="inline mr-1" />{" "}
                          {participant.cidade}
                        </p>
                      )}
                      <p className="text-xs corporate-secondary/50 mt-1">
                        {new Date(participant.submittedAt).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {participants.length === 0 && (
                  <div className="text-center py-8">
                    <Users
                      size={48}
                      className="corporate-secondary/50 mx-auto mb-3"
                    />
                    <p className="corporate-secondary">
                      Nenhum participante ainda
                    </p>
                    <p className="text-xs corporate-secondary/70 mt-1">
                      Os participantes aparecerão aqui em tempo real
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SorteioLive;
