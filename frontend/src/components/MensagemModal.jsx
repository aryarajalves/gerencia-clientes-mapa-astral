import React, { useState } from 'react';
import api from '../services/api';
import './MensagemModal.css';

function MensagemModal({ cliente, onClose, onSend }) {
    // Bloquear Scroll Background
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const [mensagem, setMensagem] = useState(`Olá ${cliente.nome}, tudo bem? Aqui é do Mapa Astral!`);
    const [arquivo, setArquivo] = useState(null);
    const [delay, setDelay] = useState(3);
    const [usarLinkExistente, setUsarLinkExistente] = useState(false);
    // enviando agora é controlado pelo pai, mas mantemos o estado local para desabilitar o botão
    // Na verdade, ao chamarmos onSend, fecharemos o modal imediatamente, entao não precisa de estado complexo
    const [erro, setErro] = useState(null);

    const [template, setTemplate] = useState('');

    const [templatesDisponiveis, setTemplatesDisponiveis] = useState([]);

    React.useEffect(() => {
        if (!cliente.janela_24_horas) {
            carregarTemplates();
        }
    }, [cliente.janela_24_horas]);

    const carregarTemplates = async () => {
        try {
            const temps = await api.get('/whatsapp/templates');
            const data = temps.data;
            if (Array.isArray(data)) {
                setTemplatesDisponiveis(data.map(t => ({
                    value: t.name,
                    label: t.name.replace(/_/g, ' ').toUpperCase()
                })));
            }
        } catch (e) {
            console.error("Erro ao carregar templates", e);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErro(null);

        // Validações
        if (!cliente.janela_24_horas && !template) {
            setErro("Selecione um template para enviar.");
            return;
        }

        const formData = new FormData();
        formData.append('nome', cliente.nome);
        formData.append('numero', cliente.numero);

        // Lógica de Janela 24h
        if (cliente.janela_24_horas) {
            // Janela Aberta: Mensagem Livre
            formData.append('mensagem', mensagem);

            if (usarLinkExistente && cliente.link_pdf_mapa_astral) {
                formData.append('link_pdf', cliente.link_pdf_mapa_astral);
                formData.append('delay', delay);
            } else if (arquivo) {
                formData.append('arquivo', arquivo);
                formData.append('delay', delay);
            }
        } else {
            // Janela Fechada: Template
            formData.append('template', template);
        }

        // Delega o envio (fechamos o modal para a animação aparecer no card)
        if (onSend) {
            onSend(formData);
        }
        onClose();
    };

    if (!cliente) return null;

    const janelaAberta = cliente.janela_24_horas;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>
                        {janelaAberta ? '💬 Enviar Mensagem Livre' : '📢 Enviar Template (Janela Fechada)'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <p className="modal-cliente-info">
                        Para: <strong>{cliente.nome}</strong> ({cliente.numero})
                        {!janelaAberta && (
                            <span style={{ display: 'block', color: '#fbbf24', fontSize: '0.85rem', marginTop: '4px' }}>
                                ⚠️ Fora da janela de 24h. Apenas templates aprovados pelo Facebook permitidos.
                            </span>
                        )}
                    </p>

                    <form onSubmit={handleSubmit}>

                        {janelaAberta ? (
                            // --- MODO MENSAGEM LIVRE ---
                            <>
                                <div className="form-group">
                                    <label>Mensagem:</label>
                                    <textarea
                                        className="form-control"
                                        rows="5"
                                        value={mensagem}
                                        onChange={(e) => setMensagem(e.target.value)}
                                        placeholder="Escreva sua mensagem aqui..."
                                    />
                                </div>

                                {/* Opção de Link Existente */}
                                {cliente.link_pdf_mapa_astral && (
                                    <div className="form-group checkbox-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={usarLinkExistente}
                                                onChange={(e) => {
                                                    setUsarLinkExistente(e.target.checked);
                                                    if (e.target.checked) setArquivo(null);
                                                }}
                                                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                                            />
                                            <span style={{ fontWeight: 500 }}>Usar PDF do Mapa Astral cadastrado</span>
                                        </label>
                                        {usarLinkExistente && (
                                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                🔗 {cliente.link_pdf_mapa_astral}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!usarLinkExistente && (
                                    <div className="form-group">
                                        <label>Anexar PDF (Opcional):</label>
                                        <div className="file-input-wrapper">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setArquivo(e.target.files[0])}
                                                className="file-input"
                                            />
                                            {arquivo && <span className="file-name">📎 {arquivo.name}</span>}
                                        </div>
                                    </div>
                                )}

                                {(arquivo || usarLinkExistente) && (
                                    <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>⏳ Intervalo de envio</span>
                                            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{delay} seg</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="15"
                                            value={delay}
                                            onChange={(e) => setDelay(e.target.value)}
                                            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)', marginBottom: '5px' }}
                                        />
                                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>
                                            Tempo de espera para enviar o PDF após a mensagem de texto inicial.
                                        </small>
                                    </div>
                                )}
                            </>
                        ) : (
                            // --- MODO TEMPLATE ---
                            <div className="form-group">
                                <label>Selecione um Template:</label>
                                {templatesDisponiveis.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                        <div className="spin-anim" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>🔄</div>
                                        <div>Carregando templates do WhatsApp...</div>
                                    </div>
                                ) : (
                                    <select
                                        className="form-control"
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#0f172a',
                                            color: 'white',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">-- Escolha um template --</option>
                                        {templatesDisponiveis.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {erro && <div className="alert-error">{erro}</div>}

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">
                                {janelaAberta ? '🚀 Enviar Agora' : '📢 Disparar Template'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MensagemModal;
