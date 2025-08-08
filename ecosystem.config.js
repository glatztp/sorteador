export default {
  apps: [
    {
      name: "sorteador-api",
      script: "./server/api.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Configurações de log
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Reiniciar automaticamente em caso de erro
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
