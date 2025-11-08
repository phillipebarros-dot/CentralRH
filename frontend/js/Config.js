/**
 * ═══════════════════════════════════════════════════════════
 * CENTRAL RH - GRUPO OM | SISTEMA DE AUTENTICAÇÃO
 * ═══════════════════════════════════════════════════════════
 */

class AuthSystem {
    constructor() {
        this.apiBaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'https://n8n.grupoom.com.br/webhook/';
    }

    async login(username, password) {
        try {
            // 1. Validação básica local
            if (!username || !password) {
                throw new Error('Por favor, preencha todos os campos.');
            }

            console.log("🔄 Tentando login em:", `${this.apiBaseUrl}login-rh`);

            // 2. Requisição ao N8N
            const response = await fetch(`${this.apiBaseUrl}login-rh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Não adicionamos headers customizados para evitar problemas extras de CORS
                },
                body: JSON.stringify({
                    username: username.trim().toLowerCase(),
                    password: password
                })
            });

            // 3. Verifica se o servidor respondeu (mesmo que com erro 4xx/5xx)
            if (!response.ok) {
                throw new Error(`O servidor respondeu com erro: ${response.status}`);
            }

            // 4. Processa a resposta JSON
            const data = await response.json();

            if (data.ok) {
                // --- LOGIN SUCESSO ---
                console.log("✅ Login autorizado!");
                const sessionData = {
                    token: data.token,
                    user: {
                        nome: data.usuario || username.split('@')[0],
                        email: username
                    },
                    loginTime: Date.now()
                };
                // Salva na sessão do navegador
                sessionStorage.setItem('session', JSON.stringify(sessionData));
                sessionStorage.setItem('rh-token', data.token);
                
                // Redireciona
                window.location.href = 'painel.html';
                return { success: true };

            } else {
                // --- LOGIN RECUSADO PELO N8N ---
                console.warn("❌ Login recusado:", data.error);
                throw new Error(data.error || 'Usuário ou senha inválidos.');
            }

        } catch (error) {
            console.error('🚨 Erro detalhado no login:', error);
            
            // Detecta erro de CORS/Rede especificamente
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                 throw new Error('⚠️ Erro de Conexão: O navegador bloqueou o acesso ao servidor (CORS). Verifique se a extensão "Allow CORS" está ATIVA e configurada corretamente.');
            }
            
            // Repassa outros erros para exibir na tela
            throw error;
        }
    }

    logout() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        // Verifica se existe uma sessão ativa
        return !!sessionStorage.getItem('session');
    }
}

// Inicializa
const Auth = new AuthSystem();

// Função global para proteger páginas internas (painel.html)
function protectPage() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
