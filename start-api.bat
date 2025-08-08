@echo off
echo.
echo ========================================
echo   INICIALIZANDO SORTEADOR API
echo ========================================
echo.

cd /d "c:\Users\glatzz\sorteador"

echo [1/3] Verificando se a API está rodando...
pm2 describe sorteador-api >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ API já está rodando
    pm2 status sorteador-api
) else (
    echo [2/3] Iniciando API em background...
    npm run api:start
    echo ✅ API iniciada com sucesso!
)

echo.
echo [3/3] Informações importantes:
echo 📡 API rodando em: http://localhost:3001
echo 📊 Dashboard disponível em: http://localhost:3001/dashboard
echo 📂 Dados salvos em: server/data.json
echo 📝 Logs disponíveis em: logs/
echo.

echo ========================================
echo   COMANDOS ÚTEIS
echo ========================================
echo npm run api:status  - Ver status da API
echo npm run api:logs    - Ver logs em tempo real
echo npm run api:stop    - Parar a API
echo npm run api:restart - Reiniciar a API
echo.

pause
