import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Falha ao realizar login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <Sparkles size={32} color="#a855f7" />
                    </div>
                    <h1>Bem-vindo de volta</h1>
                    <p>Acesse o painel do Mapa Astral</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>E-mail</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="modern-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="modern-input with-eye"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabindex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? (
                            <Loader2 className="spin-anim" size={20} />
                        ) : (
                            <>
                                Entrar <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {/* Rodapé removido conforme solicitado */}
                </form>
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
                    padding: 20px;
                }

                .login-card {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 2.5rem;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: fadeInUp 0.5s ease-out;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .logo-icon {
                    background: rgba(168, 85, 247, 0.1);
                    width: 64px;
                    height: 64px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    border: 1px solid rgba(168, 85, 247, 0.2);
                }

                .login-header h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #fff, #cbd5e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-header p {
                    color: #94a3b8;
                    font-size: 0.95rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    color: #cbd5e1;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-left: 4px;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    pointer-events: none;
                    transition: color 0.3s;
                }

                .modern-input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 14px 16px 14px 48px;
                    color: #fff;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                
                .modern-input.with-eye {
                    padding-right: 48px; /* Espaço para o ícone do olho */
                }

                .modern-input:focus {
                    outline: none;
                    border-color: #a855f7;
                    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
                    background: rgba(15, 23, 42, 0.8);
                }

                .modern-input:focus + .input-icon {
                    color: #a855f7;
                }
                
                /* Estilo do botão de olho */
                .toggle-password {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #64748b; /* Mesmo slate do outro ícone */
                    cursor: pointer;
                    display: flex;
                    padding: 0;
                    transition: color 0.2s;
                    z-index: 10;
                }
                
                .toggle-password:hover {
                    color: #a855f7;
                }
                
                .toggle-password:focus {
                    outline: none;
                    color: #a855f7;
                }

                .btn-login {
                    width: 100%;
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s;
                    margin-top: 1rem;
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                }

                .btn-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
                }

                .btn-login:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
}
