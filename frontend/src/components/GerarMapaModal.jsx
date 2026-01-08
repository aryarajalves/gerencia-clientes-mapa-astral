import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { clienteService } from '../services/api';

export default function GerarMapaModal({ cliente, onClose }) {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        iniciarGeracao();
    }, []);

    const iniciarGeracao = async () => {
        try {
            await clienteService.gerarMapa(cliente.id);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMensagem(error.response?.data?.detail || 'Erro ao conectar com o gerador de mapas.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-magic-container">

                {/* Fechar apenas se não estiver carregando ou se quiser abortar visual */}
                {status !== 'loading' && (
                    <button className="magic-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                )}

                <div className="magic-content">

                    {/* LOADING STATE */}
                    {status === 'loading' && (
                        <div className="magic-state">
                            <div className="crystal-ball-container">
                                <div className="crystal-ball">
                                    <div className="crystal-glow"></div>
                                </div>
                                <div className="magic-particles"></div>
                            </div>
                            <h2>Consultando os Astros...</h2>
                            <p>Enviando dados de <strong>{cliente.nome}</strong> para o oráculo.</p>
                            <p className="loading-subtext">Aguarde a resposta do universo...</p>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {status === 'success' && (
                        <div className="magic-state success">
                            <div className="icon-circle success-icon">
                                <Sparkles size={48} />
                            </div>
                            <h2>Ritual Iniciado!</h2>
                            <p>Os dados foram enviados com sucesso.</p>
                            <p>O mapa astral está sendo gerado e logo estará disponível.</p>

                            <button className="magic-btn" onClick={onClose}>
                                Concluir e Fechar
                            </button>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                        <div className="magic-state error">
                            <div className="icon-circle error-icon">
                                <AlertTriangle size={48} />
                            </div>
                            <h2>Interferência Cósmica</h2>
                            <p>Não foi possível iniciar a geração do mapa.</p>
                            <div className="error-box">{mensagem}</div>

                            <button className="magic-btn btn-retry" onClick={onClose}>
                                Fechar
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                .modal-magic-container {
                    background: linear-gradient(135deg, hsl(265, 40%, 15%), hsl(280, 50%, 10%));
                    width: 90%;
                    max-width: 450px;
                    border-radius: 24px;
                    padding: 2rem;
                    text-align: center;
                    position: relative;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    box-shadow: 0 0 50px rgba(139, 92, 246, 0.2);
                    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .magic-close-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .magic-close-btn:hover { color: white; }

                .magic-content h2 {
                    font-size: 1.5rem;
                    margin: 1.5rem 0 0.5rem;
                    background: linear-gradient(to right, #e9d5ff, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .magic-content p {
                    color: #d8b4fe;
                    font-size: 0.95rem;
                    margin-bottom: 0.5rem;
                }

                .loading-subtext {
                    font-size: 0.8rem !important;
                    opacity: 0.7;
                    margin-top: 1rem;
                    font-style: italic;
                }

                /* Crystal Ball Animation */
                .crystal-ball-container {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto;
                    position: relative;
                }

                .crystal-ball {
                    width: 80px;
                    height: 80px;
                    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(139, 92, 246, 0.4) 20%, rgba(88, 28, 135, 0.8) 60%, rgba(59, 7, 100, 1) 100%);
                    border-radius: 50%;
                    margin: 10px auto;
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
                    position: relative;
                    z-index: 2;
                    animation: floatBall 3s ease-in-out infinite;
                }

                .crystal-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 120%;
                    height: 120%;
                    background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
                    animation: pulseGlow 2s infinite alternate;
                }

                @keyframes floatBall {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes pulseGlow {
                    0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                }

                /* Icons */
                .icon-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                }
                
                .success-icon {
                    background: rgba(16, 185, 129, 0.1);
                    color: #34d399;
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
                }

                .error-icon {
                    background: rgba(239, 68, 68, 0.1);
                    color: #f87171;
                }

                .error-box {
                    background: rgba(0,0,0,0.2);
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: #fca5a5;
                    margin: 1rem 0;
                }

                /* Buttons */
                .magic-btn {
                    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                    border: none;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 12px rgba(109, 40, 217, 0.4);
                }

                .magic-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(109, 40, 217, 0.6);
                }

                .btn-retry {
                    background: rgba(255, 255, 255, 0.1);
                    box-shadow: none;
                }
                .btn-retry:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                @keyframes popIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
