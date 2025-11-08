class AuthSystem {
    constructor() {
        this.apiBaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://n8n.grupoom.com.br/webhook/';
    }

    async login(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Por favor, preencha todos os campos.');
            }

            console.log("Tentando login (Modo No-Preflight) em:", `${this.apiBaseUrl}login-rh`);

            // --- TRUQUE: Content-Type text/plain para tentar evitar o 'preflight' ---
            const response = await fetch(`${this.apiBaseUrl}login-rh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain' // Isso às vezes engana o navegador
                },
                body: JSON.stringify({
                    username: username.trim().toLowerCase(),
                    password: password
                })
            });

            if (!response.ok) {
                throw new Error(`Erro do Servidor (Status: ${response.status})`);
            }

            const data = await response.json();

            if (data.ok) {
                const sessionData = {
                    token: data.token,
                    user: {
                        nome: data.usuario || username.split('@')[0],
                        email: username
                    },
                    loginTime: Date.now()
                };
                sessionStorage.setItem('session', JSON.stringify(sessionData));
                sessionStorage.setItem('rh-token', data.token);
                
                window.location.href = 'painel.html';
                return { success: true };
            } else {
                throw new Error(data.error || 'Usuário ou senha inválidos.');
            }

        } catch (error) {
            console.error('Erro detalhado:', error);
            if (error.message.includes('Failed to fetch')) {
                 throw new Error('Bloqueio de segurança (CORS). O servidor recusou a conexão local.');
            }
            throw error;
        }
    }

    logout() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        const session = sessionStorage.getItem('session');
        return !!session;
    }
}

const Auth = new AuthSystem();

function protectPage() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}