describe('Fluxo Login e Dashboard', () => {

    beforeEach(() => {
        cy.viewport(1920, 1080); // Garantir desktop

        // Mock da API de Login
        cy.intercept('POST', '/api/login', {
            statusCode: 200,
            body: {
                access_token: 'fake-jwt-token',
                token_type: 'bearer'
            }
        }).as('loginRequest');

        // Mock dos Dados do Usuário
        cy.intercept('GET', '/api/users/me', {
            statusCode: 200,
            body: {
                message: "Dados do usuário recuperados",
                data: {
                    id: 1,
                    email: "teste@teste.com",
                    name: "Usuário Teste"
                }
            }
        }).as('userMeRequest');

        // Mock da Lista de Clientes
        cy.intercept('GET', '/api/clientes?*', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    nome: "Cliente Teste 1",
                    numero: "5511999999999",
                    email: "cliente@teste.com",
                    status: "Novo",
                    e_um_cliente_real: true
                },
                {
                    id: 2,
                    nome: "Cliente Teste 2",
                    numero: "5511888888888",
                    email: "cliente2@teste.com",
                    status: "Em Atendimento",
                    e_um_cliente_real: false
                }
            ]
        }).as('clientesRequest');

        // Mock das Opções de Status (se houver essa chamada)
        cy.intercept('GET', '/api/status-opcoes', {
            statusCode: 200,
            body: ["Novo", "Em Atendimento", "Concluído"]
        });
    });

    it('Deve carregar a página de Login', () => {
        cy.visit('/');
        cy.contains('Bem-vindo').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
    });

    it('Deve fazer login e redirecionar para dashboard', () => {
        cy.visit('/');

        // Preencher formulário
        cy.get('input[type="email"]').type('teste@teste.com');
        cy.get('input[type="password"]').type('123456');
        cy.get('button').contains('Entrar').click();

        // Aguardar requisição
        cy.wait('@loginRequest');
        cy.wait('@userMeRequest');

        // Verificar sucesso do login
        cy.contains('Gerenciador de Clientes').should('exist');
        cy.contains('Usuário Teste').should('exist');
    });

    it('Deve abrir o modal ao clicar em um cliente', () => {
        // Simular usuário já logado via onBeforeLoad
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('@App:token', 'fake-jwt-token');
                win.localStorage.setItem('@App:user', JSON.stringify({ id: 1, name: 'Usuário Teste' }));
            }
        });

        // Aguardar carregamento dos clientes
        cy.wait('@clientesRequest');

        // Verificar se cliente aparece na lista
        cy.contains('Cliente Teste 1').should('be.visible');

        // 1. Expandir o Card do Cliente (Clicando no Header do Card)
        cy.contains('Cliente Teste 1').click();

        // Pequena pausa para animação
        cy.wait(1000);

        // 2. Clicar no botão 'Enviar Mensagem' pela classe CSS (mais robusto)
        cy.get('.btn-whatsapp-action').should('be.visible').click();

        // 3. Verificar se modal abriu pela classe e conteúdo
        cy.get('.modal-content').should('be.visible');
        cy.contains('Enviar Mensagem Livre').should('be.visible');
    });
});
