import { useState } from "react";
import { motion } from "framer-motion";
import {
  DiceFive,
  ArrowsClockwise,
  ClipboardText,
  Trash,
  CheckCircle,
} from "phosphor-react";

function App() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [noRepeat, setNoRepeat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [excluded, setExcluded] = useState<number[]>([]);

  // Correções de limites
  const safeMin = Math.max(1, Math.min(min, max - 1));
  const safeMax = Math.max(safeMin + 1, max);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMin(value < 1 ? 1 : value);
    if (value >= max) setMax(value + 1);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMax(value <= min ? min + 1 : value);
  };

  const availableNumbers = Array.from(
    { length: safeMax - safeMin + 1 },
    (_, i) => i + safeMin
  ).filter((n) => !excluded.includes(n));

  const handleSort = () => {
    setIsRolling(true);
    setTimeout(() => {
      let n: number;
      if (noRepeat && availableNumbers.length > 0) {
        n =
          availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        setExcluded((prev) => [...prev, n]);
      } else {
        n = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
      }
      setResult(n);
      setHistory((prev) => [n, ...prev.slice(0, 9)]);
      setIsRolling(false);
      setCopied(false);
    }, 500);
  };

  const handleCopy = () => {
    if (result !== null) {
      navigator.clipboard.writeText(result.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setExcluded([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="corporate-bg rounded-3xl p-8 max-w-md w-full flex flex-col items-center gap-8"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold corporate-primary flex items-center gap-3"
        >
          <DiceFive size={40} weight="fill" className="corporate-gold" />
          Sorteador Pro
        </motion.h1>

        <div className="flex gap-6 w-full justify-center">
          <motion.div
            className="flex flex-col items-center flex-1"
            whileHover={{ scale: 1.02 }}
          >
            <label className="corporate-secondary font-semibold mb-2 text-sm uppercase tracking-wider">
              Mínimo
            </label>
            <input
              type="number"
              min={1}
              max={safeMax - 1}
              value={safeMin}
              onChange={handleMinChange}
              className="w-20 text-center font-bold text-lg"
            />
          </motion.div>

          <motion.div
            className="flex flex-col items-center flex-1"
            whileHover={{ scale: 1.02 }}
          >
            <label className="corporate-secondary font-semibold mb-2 text-sm uppercase tracking-wider">
              Máximo
            </label>
            <input
              type="number"
              min={safeMin + 1}
              value={safeMax}
              onChange={handleMaxChange}
              className="w-20 text-center font-bold text-lg"
            />
          </motion.div>
        </div>

        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <input
            type="checkbox"
            id="noRepeat"
            checked={noRepeat}
            onChange={() => setNoRepeat((v) => !v)}
            className="w-5 h-5"
          />
          <label
            htmlFor="noRepeat"
            className="corporate-secondary font-medium cursor-pointer select-none"
          >
            Evitar repetições
          </label>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleSort}
          disabled={
            isRolling ||
            safeMin >= safeMax ||
            (noRepeat && availableNumbers.length === 0)
          }
          className="modern-btn w-full justify-center"
        >
          <ArrowsClockwise
            size={24}
            weight="bold"
            className={isRolling ? "animate-spin" : ""}
          />
          {isRolling ? "Sorteando..." : "Sortear"}
        </motion.button>

        <motion.div
          className="min-h-[100px] flex items-center justify-center w-full"
          animate={result !== null ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {result !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              key={result}
              className="result-display text-5xl font-black px-8 py-6 flex items-center gap-4"
            >
              {result}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="p-3 rounded-full bg-accent/20 hover:bg-accent/30 transition-colors"
                title="Copiar resultado"
              >
                {copied ? (
                  <CheckCircle size={24} className="text-green-400" />
                ) : (
                  <ClipboardText size={24} className="corporate-accent" />
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="corporate-secondary font-semibold text-sm uppercase tracking-wider">
                Histórico
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearHistory}
                className="flex items-center gap-2 text-xs corporate-secondary hover:text-red-400 font-medium px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Limpar histórico"
              >
                <Trash size={14} /> Limpar
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((n, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="history-item px-3 py-2 text-sm"
                >
                  {n}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center corporate-secondary/70 text-xs mt-2"
        >
          Escolha o intervalo e faça seu sorteio!
        </motion.p>
      </motion.div>
    </div>
  );
}

export default App;
