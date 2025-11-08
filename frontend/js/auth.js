/**
 * ═══════════════════════════════════════════════════════════
 * CENTRAL RH - GRUPO OM | SISTEMA DE AUTENTICAÇÃO SIMPLIFICADO
 * ═══════════════════════════════════════════════════════════
 */

class AuthSystem {
    constructor() {
        // Garante que está pegando a URL certa do Config.js
        this.apiBaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://n8n.grupoom.com.br/webhook/';
    }

    async login(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Por favor, preencha todos os campos.');
            }

            console.log("Tentando login em:", `${this.apiBaseUrl}login-rh`);

            // --- REQUISIÇÃO SIMPLIFICADA (SEM HEADERS EXTRAS PARA EVITAR ERRO DE CORS/500) ---
            const response = await fetch(`${this.apiBaseUrl}login-rh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // REMOVIDO: X-CSRF-Token e outros headers que o n8n não espera
                },
                body: JSON.stringify({
                    username: username.trim().toLowerCase(),
                    password: password // Envia a senha normal, pois é assim que está na planilha agora
                })
            });

            if (!response.ok) {
                throw new Error(`Erro do Servidor (Status: ${response.status})`);
            }

            const data = await response.json();

            if (data.ok) {
                // Login SUCESSO
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
                // Login FALHOU (senha errada, usuário não encontrado)
                throw new Error(data.error || 'Usuário ou senha inválidos.');
            }

        } catch (error) {
            console.error('Erro detalhado no login:', error);
            // Mensagem amigável se for erro de conexão/CORS
            if (error.message.includes('Failed to fetch')) {
                 throw new Error('Erro de conexão. Verifique se a extensão de CORS está ativa no navegador.');
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