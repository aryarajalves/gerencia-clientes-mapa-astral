import React, { useState, Suspense } from 'react';
import { Edit, Clock, Check, X, FileText, AlarmClock, Sparkles, Loader2 } from 'lucide-react';
import { clienteService } from '../services/api';

// Lazy Load Modals
const MensagemModal = React.lazy(() => import('./MensagemModal'));
const EditarClienteModal = React.lazy(() => import('./EditarClienteModal'));

function ClienteCard({ cliente, isExpanded, onToggle, onRefresh }) {
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loadingMapa, setLoadingMapa] = useState(false);
    const [enviandoMensagem, setEnviandoMensagem] = useState(false);

    // Persistência da animação ao recarregar a página e Polling
    React.useEffect(() => {
        const queue = JSON.parse(localStorage.getItem('map_generation_queue') || '[]');
        if (queue.includes(cliente.id)) {
            // Se já tem link, remove da fila (acabou enquanto estava off/refresh/polling)
            if (cliente.link_pdf_mapa_astral) {
                const newQueue = queue.filter(id => id !== cliente.id);
                localStorage.setItem('map_generation_queue', JSON.stringify(newQueue));
                setLoadingMapa(false);
            } else {
                setLoadingMapa(true);
            }
        }
    }, [cliente.id, cliente.link_pdf_mapa_astral]);

    // Polling para atualizar status se estiver carregando
    React.useEffect(() => {
        let interval;
        if (loadingMapa && !cliente.link_pdf_mapa_astral) {
            interval = setInterval(() => {
                if (onRefresh) onRefresh();
            }, 5000); // Verifica a cada 5 segundos
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loadingMapa, cliente.link_pdf_mapa_astral, onRefresh]);

    const addToQueue = () => {
        const queue = JSON.parse(localStorage.getItem('map_generation_queue') || '[]');
        if (!queue.includes(cliente.id)) {
            queue.push(cliente.id);
            localStorage.setItem('map_generation_queue', JSON.stringify(queue));
        }
    };

    const removeFromQueue = () => {
        const queue = JSON.parse(localStorage.getItem('map_generation_queue') || '[]');
        const newQueue = queue.filter(id => id !== cliente.id);
        localStorage.setItem('map_generation_queue', JSON.stringify(newQueue));
    };

    const handleGerarMapa = async () => {
        setLoadingMapa(true);
        addToQueue();
        try {
            await clienteService.gerarMapa(cliente.id);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            alert('Interferência Cósmica: ' + (error.response?.data?.detail || 'Erro ao conectar.'));
            setLoadingMapa(false);
            removeFromQueue();
        }
    };

    const handleEnviarMensagem = async (formData) => {
        setEnviandoMensagem(true);
        try {
            await clienteService.enviarMensagem(formData);
            // Mensagem enviada com sucesso (após o delay do backend)
            // Atualiza status se necessário
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar mensagem: ' + (err.response?.data?.detail || err.message));
        } finally {
            setEnviandoMensagem(false);
        }
    };

    const formatNumero = (numero) => {
        if (!numero) return '';
        const cleaned = numero.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return numero;
    };

    const formatData = (dataStr) => {
        if (!dataStr) return '-';
        try {
            if (dataStr.includes('/')) return dataStr;
            const [ano, mes, dia] = dataStr.split('-');
            if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
            return dataStr;
        } catch { return dataStr; }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const getJanelaCountdown = (dateStr) => {
        if (!dateStr) return null;
        try {
            const lastMsgDate = new Date(dateStr);
            if (isNaN(lastMsgDate.getTime())) return null;

            const now = new Date();
            // Adiciona 24h
            const expiration = new Date(lastMsgDate.getTime() + 24 * 60 * 60 * 1000);

            const diffMs = expiration - now;

            if (diffMs <= 0) return 'Expirou ⌛';

            const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            return `${diffHrs}h ${diffMins}m restantes ⏳`;
        } catch { return null; }
    };

    return (
        <>
            <div className={`card cliente-card ${isExpanded ? 'expanded' : ''}`}>
                {/* Header Compacto - Clicável */}
                <div className="cliente-card-header" onClick={onToggle}>
                    <div className="cliente-avatar">
                        {getInitials(cliente.nome)}
                    </div>

                    <div className="cliente-card-info">
                        <h3 className="cliente-nome">
                            {cliente.nome}

                            {/* Etiqueta Visual Cliente Real (Read-only) */}
                            <div
                                className={`real-client-badge ${cliente.e_um_cliente_real ? 'real' : 'lead'}`}
                                title={cliente.e_um_cliente_real ? "Cliente Real / Qualificado" : "Lead / Em Teste"}
                            >
                                <div className={`status-dot ${cliente.e_um_cliente_real ? 'real' : 'lead'}`}></div>
                                <span className="badge-text">
                                    {cliente.e_um_cliente_real ? 'REAL' : 'LEAD'}
                                </span>
                            </div>
                        </h3>

                        <div className="cliente-preview-info">
                            {/* Linha 1: Contatos */}
                            <div className="cliente-preview-row">
                                {cliente.email && (
                                    <span className="cliente-preview-item" title={cliente.email}>
                                        📧 {cliente.email}
                                    </span>
                                )}
                                {cliente.numero && (
                                    <span className="cliente-preview-item" title={formatNumero(cliente.numero)}>
                                        📱 {formatNumero(cliente.numero)}
                                    </span>
                                )}
                            </div>

                            {/* Linha 2: Datas (Agora Visível no Header) */}
                            <div className="cliente-preview-row secondary-info">
                                {cliente.data_entrou_contato && (
                                    <span className="cliente-preview-item">
                                        📅 {formatData(cliente.data_entrou_contato)}
                                    </span>
                                )}
                                {cliente.horario_entrou_contato && (
                                    <span className="cliente-preview-item">
                                        🕐 {cliente.horario_entrou_contato}
                                    </span>
                                )}
                                {cliente.janela_24_horas !== null && (
                                    <span className="cliente-preview-item janela-badge">
                                        ⏰ 24H {cliente.janela_24_horas ? '✅' : '❌'}
                                    </span>
                                )}
                                {loadingMapa ? (
                                    <span className="cliente-preview-item mapa-badge" title="Gerando Mapa Astral..." style={{ color: '#a855f7', borderColor: '#a855f7' }}>
                                        ⏳ GERANDO MAPA <Loader2 size={12} className="spin-anim" style={{ marginLeft: 4 }} />
                                    </span>
                                ) : (
                                    <span className="cliente-preview-item mapa-badge" title={cliente.link_pdf_mapa_astral ? "Mapa Astral Disponível" : "Mapa Astral Pendente"}>
                                        📄 MAPA {cliente.link_pdf_mapa_astral ? '✅' : '❌'}
                                    </span>
                                )}
                                <span className="cliente-preview-item entrega-badge" title={cliente.ja_entregou_mapa ? "Mapa JÁ Entregue" : "Mapa AINDA NÃO Entregue"}>
                                    📨 ENTREGUE {cliente.ja_entregou_mapa ? '✅' : '❌'}
                                </span>
                                {cliente.nao_entregou_e_passou_2_horas && !cliente.ja_entregou_mapa && (
                                    <span className="cliente-preview-item" title="Atrasado há mais de 2 horas" style={{
                                        color: '#ef4444',
                                        borderColor: 'rgba(239, 68, 68, 0.3)',
                                        background: 'rgba(239, 68, 68, 0.1)'
                                    }}>
                                        ⚠️ ATRASADO
                                    </span>
                                )}
                                {enviandoMensagem && (
                                    <span className="cliente-preview-item" title="Enviando mensagem..." style={{
                                        color: '#3b82f6',
                                        borderColor: '#3b82f6',
                                        background: 'rgba(59, 130, 246, 0.1)'
                                    }}>
                                        🚀 ENVIANDO <Loader2 size={12} className="spin-anim" style={{ marginLeft: 4 }} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        className={`cliente-expand-btn ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        aria-label={isExpanded ? "Recolher" : "Expandir"}
                    >
                        ▼
                    </button>
                </div>

                {/* Conteúdo Expandido */}
                <div className={`cliente-expanded-content ${isExpanded ? 'show' : ''}`}>
                    {/* Detalhes Completos */}
                    <div className="cliente-details-grid">
                        {cliente.email && (
                            <div className="info-item">
                                <span className="info-label">📧 EMAIL</span>
                                <span className="info-value">{cliente.email}</span>
                            </div>
                        )}

                        {cliente.numero && (
                            <div className="info-item">
                                <span className="info-label">📱 NÚMERO</span>
                                <span className="info-value">{formatNumero(cliente.numero)}</span>
                            </div>
                        )}

                        <div className="info-item">
                            <span className="info-label">📅 DATA DO CONTATO</span>
                            <span className="info-value">{formatData(cliente.data_entrou_contato)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">🕐 HORÁRIO DO CONTATO</span>
                            <span className="info-value">{cliente.horario_entrou_contato}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">⏰ JANELA DE 24 HORAS</span>
                            <span className="info-value">{cliente.janela_24_horas ? '✅ Sim' : '❌ Não'}</span>
                            {cliente.ultimo_horario_mensagens && cliente.janela_24_horas && (
                                <span className="info-subvalue" style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                                    {getJanelaCountdown(cliente.ultimo_horario_mensagens)}
                                </span>
                            )}
                        </div>

                        {/* Dados adicionais da tabela Info */}
                        {cliente.area_foco && (
                            <div className="info-item">
                                <span className="info-label">🎯 ÁREA DE FOCO</span>
                                <span className="info-value">
                                    {cliente.area_foco.replace(/[\[\]"]/g, '').replace(/,/g, ', ')}
                                </span>
                            </div>
                        )}
                        {cliente.data_nascimento && (
                            <div className="info-item">
                                <span className="info-label">🎂 NASCIMENTO</span>
                                <span className="info-value">{cliente.data_nascimento} {cliente.horario_nascimento ? `- ${cliente.horario_nascimento}` : ''}</span>
                            </div>
                        )}
                        {cliente.cidade && (
                            <div className="info-item">
                                <span className="info-label">📍 LOCALIDADE</span>
                                <span className="info-value">{cliente.cidade} - {cliente.estado} ({cliente.pais})</span>
                            </div>
                        )}
                        {cliente.motivacao && (
                            <div className="info-item">
                                <span className="info-label">💡 MOTIVAÇÃO</span>
                                <span className="info-value">{cliente.motivacao}</span>
                            </div>
                        )}
                        {cliente.mudanca_vida && (
                            <div className="info-item">
                                <span className="info-label">🦋 MUDANÇA DESEJADA</span>
                                <span className="info-value">{cliente.mudanca_vida}</span>
                            </div>
                        )}
                        {cliente.expectativa && (
                            <div className="info-item">
                                <span className="info-label">🔮 EXPECTATIVA</span>
                                <span className="info-value">{cliente.expectativa}</span>
                            </div>
                        )}

                        {/* Área de Ações Modernas */}
                        <div className="card-actions-row">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                                className="btn-action btn-edit-action"
                                title="Editar"
                            >
                                <Edit size={16} /> Editar
                            </button>

                            {!cliente.link_pdf_mapa_astral && !cliente.ja_entregou_mapa && !loadingMapa && (
                                <>
                                    {cliente.area_foco && cliente.data_nascimento && cliente.horario_nascimento &&
                                        cliente.cidade && cliente.estado && cliente.pais &&
                                        cliente.motivacao && cliente.mudanca_vida && cliente.expectativa ? (
                                        <button
                                            onClick={handleGerarMapa}
                                            className="btn-action btn-magic-action"
                                            title="Gerar Mapa com IA"
                                        >
                                            <Sparkles size={16} /> Criar Mapa
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                                            className="btn-action btn-edit-action"
                                            style={{ borderColor: 'var(--primary)', color: 'var(--primary-light)' }}
                                            title="Faltam informações para gerar o mapa"
                                        >
                                            <Sparkles size={16} /> Completar Cadastro
                                        </button>
                                    )}
                                </>
                            )}
                            {cliente.numero && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn-action btn-whatsapp-action"
                                >
                                    💬 Enviar Mensagem
                                </button>
                            )}

                            {cliente.link_pdf_mapa_astral && (
                                <a
                                    href={cliente.link_pdf_mapa_astral}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-action btn-pdf-action"
                                >
                                    📥 Baixar PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <Suspense fallback={<div className="modal-overlay"><div className="modal-content loading"><Loader2 className="spin-anim" /></div></div>}>
                    <MensagemModal
                        cliente={cliente}
                        onClose={() => setShowModal(false)}
                        onSend={handleEnviarMensagem}
                    />
                </Suspense>
            )}

            {showEditModal && (
                <Suspense fallback={<div className="modal-overlay"><div className="modal-content loading"><Loader2 className="spin-anim" /></div></div>}>
                    <EditarClienteModal
                        cliente={cliente}
                        onClose={() => setShowEditModal(false)}
                        onSuccess={onRefresh}
                    />
                </Suspense>
            )}


        </>
    );
}

const styles = `
    .real-client-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 12px;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 700;
        cursor: default;
        border: 1px solid transparent;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        user-select: none;
    }

    .real-client-badge.lead {
        background: rgba(30, 41, 59, 0.4);
        border-color: rgba(148, 163, 184, 0.2);
        color: #94a3b8;
    }

    .real-client-badge.real {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
        color: #34d399;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }
    
    .status-dot.lead { 
        background-color: #64748b; 
    }
    
    .status-dot.real { 
        background-color: #34d399; 
        box-shadow: 0 0 6px rgba(52, 211, 153, 0.4); 
    }
`;

// Inject styles (Simple way for this component context)
if (typeof document !== 'undefined') {
    const styleId = 'cliente-card-styles';
    // Remove old styles if exists to update
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
}

export default ClienteCard;
