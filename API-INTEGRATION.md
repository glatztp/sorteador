# 🎲 Sorteador API - Guia de Integração

## Como conectar seu projeto ao Sorteador via API

### 1. Gerar Chave API

Primeiro, acesse o dashboard e gere uma chave API:

```
http://localhost:3001/server/dashboard.html
```

### 2. Enviar dados do formulário para o Sorteador

```javascript
// Exemplo de envio de dados do formulário
async function enviarParticipante(apiKey, dadosParticipante) {
  try {
    const response = await fetch(`http://localhost:3001/api/submit/${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosParticipante),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Participante cadastrado:", result.participantId);
      return result;
    } else {
      console.error("Erro:", result.error);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

// Exemplo de uso
const minhachaveAPI = "sua-chave-api-aqui";
const participante = {
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-9999",
  cidade: "São Paulo",
};

enviarParticipante(minhachaveAPI, participante);
```

### 3. Fazer Sorteio

```javascript
async function fazerSorteio(apiKey, quantidade = 1) {
  try {
    const response = await fetch(`http://localhost:3001/api/draw/${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity: quantidade,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Sorteio realizado!");
      console.log("Ganhadores:", result.result.winners);
      return result.result;
    } else {
      console.error("Erro no sorteio:", result.error);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

// Exemplo de sorteio com 3 ganhadores
fazerSorteio(minhachaveAPI, 3);
```

### 4. Listar Participantes

```javascript
async function listarParticipantes(apiKey) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/participants/${apiKey}`
    );
    const result = await response.json();

    if (result.success) {
      console.log(`Total de participantes: ${result.total}`);
      console.log("Participantes:", result.participants);
      return result.participants;
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}
```

### 5. Ver Histórico de Sorteios

```javascript
async function historicoSorteios(apiKey) {
  try {
    const response = await fetch(`http://localhost:3001/api/results/${apiKey}`);
    const result = await response.json();

    if (result.success) {
      console.log("Histórico de sorteios:", result.results);
      return result.results;
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}
```

## Exemplo Prático - Formulário HTML

```html
<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cadastro para Sorteio</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #f5f5f5;
      }

      .form-container {
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #333;
      }

      .form-group input {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        box-sizing: border-box;
      }

      .form-group input:focus {
        border-color: #4caf50;
        outline: none;
      }

      .btn {
        background: linear-gradient(45deg, #4caf50, #45a049);
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        width: 100%;
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .message {
        margin-top: 20px;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
      }

      .success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
    </style>
  </head>
  <body>
    <div class="form-container">
      <h1>🎯 Cadastro para Sorteio</h1>
      <p>Preencha os dados abaixo para participar do sorteio!</p>

      <form id="cadastroForm">
        <div class="form-group">
          <label for="nome">Nome Completo *</label>
          <input type="text" id="nome" name="nome" required />
        </div>

        <div class="form-group">
          <label for="email">E-mail *</label>
          <input type="email" id="email" name="email" required />
        </div>

        <div class="form-group">
          <label for="telefone">Telefone</label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div class="form-group">
          <label for="cidade">Cidade</label>
          <input type="text" id="cidade" name="cidade" />
        </div>

        <button type="submit" class="btn">🚀 Participar do Sorteio</button>
      </form>

      <div id="message"></div>
    </div>

    <script>
      // SUBSTITUA PELA SUA CHAVE API GERADA NO DASHBOARD
      const API_KEY = "SUA_CHAVE_API_AQUI";
      const API_URL = "http://localhost:3001/api";

      function showMessage(text, type) {
        const messageDiv = document.getElementById("message");
        messageDiv.innerHTML = `<div class="message ${type}">${text}</div>`;

        // Remover mensagem após 5 segundos
        setTimeout(() => {
          messageDiv.innerHTML = "";
        }, 5000);
      }

      document
        .getElementById("cadastroForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          // Coletar dados do formulário
          const formData = new FormData(e.target);
          const participante = {
            nome: formData.get("nome"),
            email: formData.get("email"),
            telefone: formData.get("telefone"),
            cidade: formData.get("cidade"),
          };

          // Enviar para a API
          try {
            showMessage("⏳ Enviando dados...", "success");

            const response = await fetch(`${API_URL}/submit/${API_KEY}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(participante),
            });

            const result = await response.json();

            if (result.success) {
              showMessage(
                "✅ Cadastro realizado com sucesso! Você está participando do sorteio!",
                "success"
              );
              e.target.reset(); // Limpar formulário
            } else {
              showMessage(`❌ Erro: ${result.error}`, "error");
            }
          } catch (error) {
            showMessage("❌ Erro de conexão. Tente novamente.", "error");
            console.error("Erro:", error);
          }
        });
    </script>
  </body>
</html>
```

## Endpoints da API

| Endpoint                    | Método | Descrição                     |
| --------------------------- | ------ | ----------------------------- |
| `/api/generate-key`         | POST   | Gerar nova chave API          |
| `/api/validate-key/:apiKey` | GET    | Validar chave API             |
| `/api/submit/:apiKey`       | POST   | Enviar dados de participante  |
| `/api/participants/:apiKey` | GET    | Listar participantes          |
| `/api/draw/:apiKey`         | POST   | Fazer sorteio                 |
| `/api/results/:apiKey`      | GET    | Histórico de sorteios         |
| `/api/dashboard`            | GET    | Dashboard com todas as chaves |
| `/api/delete-key/:apiKey`   | DELETE | Deletar chave API             |

## Scripts do package.json

Adicione estes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "api": "node server/api.js",
    "dashboard": "start http://localhost:3001/server/dashboard.html"
  }
}
```
