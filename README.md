# Gerenciador de Clientes - Mapa Astral

Um sistema completo para gerenciamento de clientes, geração de Mapas Astrais (PDF) e automação de mensagens via WhatsApp/Chatwoot.

---

## 🚀 Funcionalidades

### Backend (FastAPI + Python)
- **API RESTful** documentada com Swagger/OpenAPI.
- **Integração com Baserow:** Funciona como banco de dados No-Code.
- **Cache com Redis:** Performance otimizada para listagem de clientes.
- **Autenticação JWT:** Login seguro e proteção de rotas.
- **Integração com Chatwoot e WhatsApp:** Envio automatizado de mensagens e templates.
- **Rate Limiting:** Proteção contra abuso da API.
- **Monitoramento de Erros:** Integração nativa com Sentry.

### Frontend (React + Vite)
- **Dashboard Interativa:** Visualização em Cards com status (Real/Lead) e Janela de 24h.
- **Filtros Avançados:** Filtre por status do mapa, janela de 24h, datas e busca textual.
- **Modais Dinâmicos:** Envio de mensagens e edição de dados sem recarregar a página.
- **Testes E2E:** Cobertura de testes com Cypress.
- **Design Moderno:** Interface limpa e responsiva.

---

## 🛠️ Tecnologias

- **Backend:** Python 3.11, FastAPI, Pydantic, Redis, Uvicorn.
- **Frontend:** React, Vite, Axios, Lucide Icons.
- **Infraestrutura:** Docker, Docker Swarm, Traefik (Reverse Proxy).
- **Dados:** Baserow (Database), Redis (Cache).
- **Qualidade:** Pytest (Unitários), Cypress (E2E), Sentry (Observabilidade).

---

## 🏁 Como Rodar Localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- Docker (opcional, para Redis)

### 1. Configurar Backend

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie um ambiente virtual e ative:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Crie um arquivo `.env` na pasta `backend` com suas configurações (veja `.env.example` se houver, ou use suas credenciais do Baserow/Sentry).
5. Inicie o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```
   O backend rodará em: `http://localhost:8000` (Docs em `/docs`).

### 2. Configurar Frontend

1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na pasta `frontend` com:
   ```ini
   VITE_API_URL=http://localhost:8000/api
   VITE_SENTRY_DSN=sua_dsn_aqui
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O frontend rodará em: `http://localhost:5173`.

### 3. Executar Testes

- **Backend (Unitários):**
  ```bash
  cd backend
  pytest
  ```
- **Frontend (E2E):**
  ```bash
  cd frontend
  npm run test:e2e
  ```

---

## 🐳 Como Rodar com Docker (Produção)

Este projeto está configurado para rodar em **Docker Swarm** com **Traefik** como Reverse Proxy.

1. Instale o Docker e inicialize o Swarm no servidor:
   ```bash
   docker swarm init
   ```
2. Configure as variáveis de ambiente no servidor (arquivo `.env` na raiz ou exportando variáveis).
3. Faça o deploy da stack:
   ```bash
   docker stack deploy -c docker-compose.yml mapa_astral
   ```

### 🔒 Variáveis de Ambiente Necessárias (Produção)

O arquivo `docker-compose.yml` espera as seguintes variáveis:
- `BASEROW_API_TOKEN`, `BASEROW_TABLE_ID`...
- `CHATWOOT_API_TOKEN`, `CHATWOOT_ACCOUNT_ID`...
- `WHATSAPP_API_TOKEN`...
- `SENTRY_DSN`
- `VITE_SENTRY_DSN` (Build Argument)

---

## 🔒 Segurança

- Arquivos `.env` contendo senhas **nunca** devem ser commitados (já configurado no `.gitignore`).
- A autenticação JWT protege rotas sensíveis de escrita/leitura.
- Rate Limiting (`slowapi`) impede ataques de força bruta.

---

Desenvolvido para gestão eficiente de mapas astrais. ✨
