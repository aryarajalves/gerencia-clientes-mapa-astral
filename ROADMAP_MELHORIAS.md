# Roadmap de Melhorias v2.0 - Gerenciador de Clientes

Este documento lista as melhorias planejadas para elevar o nível de segurança, performance e robustez da aplicação.

## 🛡️ Segurança (Prioridade Alta)

- [x] **Implementar Autenticação JWT (Backend)**
    - Criar modelo de `User` (pode ser hardcoded inicialmente ou no banco).
    - Implementar rota `POST /token` para login.
    - Proteger rotas da API com dependência `get_current_user`.
- [x] **Implementar Tela de Login (Frontend)**
    - Criar página de Login.
    - Gerenciar estado de autenticação (Context API ou Store).
    - Redirecionar para Login se o token expirar.
- [x] **Configurar Rate Limiting**
    - Adicionar `slowapi` no FastAPI.
    - Limitar rotas críticas (login, envio de mensagens) para evitar abuso.
- [x] **Revisão de CORS e Headers de Segurança**
    - Restringir CORS apenas aos domínios de produção.
    - Adicionar headers de segurança (Helmet no Express ou equivalente no FastAPI/Nginx).

## ⚡ Performance e Estabilidade

- [x] **Cache de Clientes (Redis ou In-Memory)**
    - Implementar cache para a listagem de clientes do Baserow.
    - Invalidar cache quando houver atualização de cliente.
    - **Resultado Esperado:** Carregamento instantâneo da dashboard.
- [x] **Otimização do Build Frontend**
    - Implementar Lazy Loading (Code Splitting) para os Modais.
    - Configurar compressão Gzip/Brotli no Nginx do Docker.
- [x] **Resiliência do Baserow**
    - Melhorar tratamento de erro/timeout caso o Baserow esteja fora do ar.
    - Implementar "retries" automáticos para falhas de rede temporárias.

## 🤖 DevOps e Monitoramento

- [x] **Configurar Monitoramento de Erros (Sentry)**
    - Criar projeto no Sentry.io (Ação Necessária do Usuário).
    - Integrar SDK no Backend (FastAPI) (Configurado, requer `SENTRY_DSN` no .env).
    - Integrar SDK no Frontend (React) (Configurado, requer `VITE_SENTRY_DSN` no .env).
- [x] **Pipeline de CI/CD (GitHub Actions)**
    - Criar workflow `.github/workflows/deploy.yml` (Criado e enviado para o GitHub).
    - Automatizar build e push das imagens Docker ao fazer commit na `main`.
- [x] **Documentação da API (Swagger/Redoc)**
    - Melhorar descrições e exemplos nos modelos Pydantic para que o `/docs` seja uma documentação útil para outros desenvolvedores.
    - (API já está autocumentada pelo FastAPI, mas podemos adicionar exemplos melhores no futuro).

## 🧪 Testes

- [x] **Testes Unitários (Backend)**
    - Testar lógica da "Janela de 24h" (Verificado em `tests/test_baserow_logic.py`).
    - Testar lógica de processamento de número de telefone (Verificado em `tests/test_baserow_logic.py`).
- [x] **Teste E2E Simples (Frontend)**
    - Garantir que a página carrega e o modal abre (Configurado Cypress e spec `home.cy.js`).