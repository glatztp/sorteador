#!/usr/bin/env node

const http = require("http");
const { spawn } = require("child_process");

const API_URL = "http://localhost:3001";
const CHECK_INTERVAL = 30000; // 30 segundos

console.log("🔍 Monitor da API iniciado...");

function checkAPI() {
  return new Promise((resolve) => {
    const req = http.get(API_URL + "/api/dashboard", (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.abort();
      resolve(false);
    });
  });
}

async function restartAPI() {
  console.log("🔄 Reiniciando API...");

  return new Promise((resolve) => {
    const restart = spawn("pm2", ["restart", "sorteador-api"], {
      stdio: "inherit",
    });

    restart.on("close", (code) => {
      if (code === 0) {
        console.log("✅ API reiniciada com sucesso");
      } else {
        console.log("❌ Erro ao reiniciar API");
      }
      resolve();
    });
  });
}

async function monitor() {
  console.log(`⏰ ${new Date().toISOString()} - Verificando API...`);

  const isRunning = await checkAPI();

  if (isRunning) {
    console.log("✅ API está funcionando normalmente");
  } else {
    console.log("❌ API não está respondendo");
    await restartAPI();
  }

  console.log(`⏰ Próxima verificação em ${CHECK_INTERVAL / 1000} segundos`);
}

// Verificação inicial
monitor();

// Verificação periódica
setInterval(monitor, CHECK_INTERVAL);

// Tratamento de sinais
process.on("SIGINT", () => {
  console.log("\n👋 Monitor encerrado");
  process.exit(0);
});

console.log(
  `📍 Monitor configurado para verificar a cada ${
    CHECK_INTERVAL / 1000
  } segundos`
);
console.log("Pressione Ctrl+C para parar o monitor");
