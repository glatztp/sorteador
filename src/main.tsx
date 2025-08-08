import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { DiceFive, Trophy, Key } from "phosphor-react";
import "./index.css";
import App from "./App.tsx";
import TesteAPI from "./TesteAPI.tsx";
import SorteioLive from "./SorteioLive.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-corporate">
        {/* Menu de Navegação */}
        <nav className="p-4 bg-black/20 backdrop-blur-sm border-b border-primary/20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold corporate-primary">Sorteador</h1>
            <div className="flex gap-4">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors font-semibold flex items-center gap-2"
              >
                <DiceFive size={20} />
                Sorteador
              </Link>
              <Link
                to="/sorteio-live"
                className="px-4 py-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 transition-colors font-semibold flex items-center gap-2"
              >
                <Trophy size={20} />
                Sorteio Live
              </Link>{" "}
              <Link
                to="/teste"
                className="px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-yellow-500/30 transition-colors font-semibold flex items-center gap-2 "
              >
                <Key size={20} className="text-yellow-500" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Rotas */}
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/teste" element={<TesteAPI />} />
          <Route path="/sorteio-live" element={<SorteioLive />} />
        </Routes>
      </div>
    </BrowserRouter>
  </StrictMode>
);
