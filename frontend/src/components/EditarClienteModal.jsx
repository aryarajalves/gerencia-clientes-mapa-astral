import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Clock, FileText, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { clienteService } from '../services/api';

export default function EditarClienteModal({ cliente, onClose, onSuccess }) {
    // Bloquear Scroll Background
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const [formData, setFormData] = useState({
        nome: cliente.nome || '',
        email: cliente.email || '',
        numero: cliente.numero || '',
        data_entrou_contato: cliente.data_entrou_contato || '',
        horario_entrou_contato: cliente.horario_entrou_contato || '',
        link_pdf_mapa_astral: cliente.link_pdf_mapa_astral || '',
        janela_24_horas: cliente.janela_24_horas || false,
        ja_entregou_mapa: cliente.ja_entregou_mapa || false,
        e_um_cliente_real: cliente.e_um_cliente_real !== undefined ? cliente.e_um_cliente_real : true,
        // Campos Extras
        area_foco: cliente.area_foco ? cliente.area_foco.replace(/[\[\]"]/g, '').replace(/,/g, ', ') : '',
        data_nascimento: cliente.data_nascimento || '',
        horario_nascimento: cliente.horario_nascimento || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        pais: cliente.pais || '',
        motivacao: cliente.motivacao || '',
        mudanca_vida: cliente.mudanca_vida || '',
        expectativa: cliente.expectativa || ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await clienteService.atualizar(cliente.id, formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar cliente. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header-modern">
                    <div>
                        <h2 className="modal-title">Editar Cliente</h2>
                        <p className="modal-subtitle">Atualize as informações de {cliente.nome}</p>
                    </div>
                    <button className="btn-close" onClick={handleClose} disabled={loading} style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="modal-form-content"
                    style={{ overflowY: loading ? 'hidden' : 'auto' }}
                >

                    {/* Grid Principal */}
                    <div className="form-grid">

                        {/* Nome Completo (Full Width) */}
                        <div className="form-group full-width">
                            <label>Nome Completo</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                    className="modern-input"
                                    placeholder="Nome do cliente"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="modern-input"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="form-group">
                            <label>WhatsApp</label>
                            <div className="input-wrapper">
                                <Phone className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    placeholder="55..."
                                    className="modern-input"
                                />
                            </div>
                        </div>

                        {/* Data */}
                        <div className="form-group">
                            <label>Data Contato</label>
                            <div className="input-wrapper">
                                <Calendar className="input-icon" size={18} />
                                <input
                                    type="date"
                                    name="data_entrou_contato"
                                    value={formData.data_entrou_contato}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>
                        </div>

                        {/* Horário */}
                        <div className="form-group">
                            <label>Horário</label>
                            <div className="input-wrapper">
                                <Clock className="input-icon" size={18} />
                                <input
                                    type="time"
                                    name="horario_entrou_contato"
                                    value={formData.horario_entrou_contato}
                                    onChange={handleChange}
                                    className="modern-input"
                                />
                            </div>
                        </div>

                        {/* Link PDF (Full Width) */}
                        <div className="form-group full-width">
                            <label>Link PDF Mapa Astral</label>
                            <div className="input-wrapper">
                                <FileText className="input-icon" size={18} />
                                <input
                                    type="url"
                                    name="link_pdf_mapa_astral"
                                    value={formData.link_pdf_mapa_astral}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="modern-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informações Extras (Editável) */}
                    <div className="extra-info-section">
                        <h3 className="section-title">Informações Adicionais</h3>
                        <div className="form-grid">

                            {/* Área de Foco */}
                            <div className="form-group full-width">
                                <label>Área de Foco</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="area_foco"
                                        value={formData.area_foco}
                                        onChange={handleChange}
                                        className="modern-input"
                                        placeholder="Ex: Amor, Dinheiro, Carreira"
                                    />
                                </div>
                            </div>

                            {/* Nascimento */}
                            <div className="form-group">
                                <label>Data Nascimento</label>
                                <div className="input-wrapper">
                                    <input
                                        type="date"
                                        name="data_nascimento"
                                        value={formData.data_nascimento}
                                        onChange={handleChange}
                                        className="modern-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Horário Nascimento</label>
                                <div className="input-wrapper">
                                    <input
                                        type="time"
                                        name="horario_nascimento"
                                        value={formData.horario_nascimento}
                                        onChange={handleChange}
                                        className="modern-input"
                                    />
                                </div>
                            </div>

                            {/* Localidade */}
                            <div className="form-group">
                                <label>Cidade</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="cidade"
                                        value={formData.cidade}
                                        onChange={handleChange}
                                        className="modern-input"
                                        placeholder="Cidade"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Estado</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className="modern-input"
                                        placeholder="UF"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>País</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="pais"
                                        value={formData.pais}
                                        onChange={handleChange}
                                        className="modern-input"
                                        placeholder="País"
                                    />
                                </div>
                            </div>

                            {/* Textareas */}
                            <div className="form-group full-width">
                                <label>Motivação</label>
                                <div className="input-wrapper">
                                    <textarea
                                        name="motivacao"
                                        value={formData.motivacao}
                                        onChange={handleChange}
                                        className="modern-input modern-textarea"
                                        rows="3"
                                        placeholder="O que motivou..."
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Mudança Desejada</label>
                                <div className="input-wrapper">
                                    <textarea
                                        name="mudanca_vida"
                                        value={formData.mudanca_vida}
                                        onChange={handleChange}
                                        className="modern-input modern-textarea"
                                        rows="3"
                                        placeholder="Se pudesse mudar algo..."
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Expectativa</label>
                                <div className="input-wrapper">
                                    <textarea
                                        name="expectativa"
                                        value={formData.expectativa}
                                        onChange={handleChange}
                                        className="modern-input modern-textarea"
                                        rows="3"
                                        placeholder="O que espera descobrir..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="toggles-section">
                        <label className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-title">Cliente Real / Qualificado</span>
                                <span className="toggle-desc">Marque se este é um cliente real (não teste/lead frio)</span>
                            </div>
                            <div className="toggle-switch-wrapper">
                                <input
                                    type="checkbox"
                                    name="e_um_cliente_real"
                                    checked={formData.e_um_cliente_real}
                                    onChange={handleChange}
                                    className="toggle-input"
                                />
                                <div className="toggle-slider slider-success"></div>
                            </div>
                        </label>


                        <label className="toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-title">Mapa Entregue</span>
                                <span className="toggle-desc">Marcar como concluído/enviado</span>
                            </div>
                            <div className="toggle-switch-wrapper">
                                <input
                                    type="checkbox"
                                    name="ja_entregou_mapa"
                                    checked={formData.ja_entregou_mapa}
                                    onChange={handleChange}
                                    className="toggle-input"
                                />
                                <div className="toggle-slider slider-success"></div>
                            </div>
                        </label>
                    </div>

                    {error && <div className="error-banner">{error}</div>}

                    {/* Footer Actions */}
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-cancel" onClick={handleClose} disabled={loading} style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-modern-save" disabled={loading}>
                            {loading ? (
                                <span className="loading-dots">Salvando...</span>
                            ) : (
                                <>
                                    <Save size={18} /> Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                /* Container e Overlay */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }

                .modal-container {
                    background: var(--bg-card); /* ou #151520 se não tiver var */
                    width: 95%;
                    max-width: 700px;
                    border-radius: 16px;
                    border: 1px solid var(--border-light);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    max-height: 90vh;
                }

                /* Header */
                .modal-header-modern {
                    padding: 1.5rem 2rem;
                    background: linear-gradient(to right, rgba(255,255,255,0.03), transparent);
                    border-bottom: 1px solid var(--border-light);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(135deg, var(--primary-light), var(--secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .modal-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-top: 4px;
                }

                /* Scroll Content */
                .modal-form-content {
                    padding: 2rem;
                    overflow-y: auto;
                }

                /* Form Grid */
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    margin-left: 4px;
                }

                /* Inputs Modernos */
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 14px;
                    color: var(--text-muted);
                    pointer-events: none;
                    transition: color 0.3s;
                }

                .modern-input {
                    width: 100%;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 12px 16px 12px 42px; /* Espaço para o ícone */
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                }

                .modern-textarea {
                    padding-left: 16px; /* Sem ícone */
                    resize: vertical;
                    min-height: 80px;
                }

                .modern-input:focus {
                    background: var(--bg-card);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15); /* Cor primária com alpha */
                    outline: none;
                }

                .modern-input:focus + .input-icon,
                .input-wrapper:focus-within .input-icon {
                    color: var(--primary);
                }

                /* Toggles */
                .toggles-section {
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    border: 1px solid var(--border-light);
                }

                .toggle-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }

                .toggle-title {
                    display: block;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 2px;
                }

                .toggle-desc {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                /* Custom Toggle Switch */
                .toggle-switch-wrapper {
                    position: relative;
                    width: 50px;
                    height: 28px;
                }

                .toggle-input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--bg-input);
                    border: 1px solid var(--border);
                    transition: .4s;
                    border-radius: 34px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background-color: var(--text-muted);
                    transition: .4s;
                    border-radius: 50%;
                }

                .toggle-input:checked + .toggle-slider {
                    background-color: var(--primary-dark);
                    border-color: var(--primary);
                }
                
                .toggle-input:checked + .slider-success {
                    background-color: #10b981; /* Verde esmeralda */
                    border-color: #059669;
                }

                .toggle-input:checked + .toggle-slider:before {
                    transform: translateX(22px);
                    background-color: #fff;
                }

                /* Footer */
                .modal-footer-modern {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--border-light);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .btn-modern-cancel {
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text-secondary);
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-modern-cancel:hover {
                    background: rgba(255,255,255,0.05);
                    color: var(--text-primary);
                }

                .btn-modern-save {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    border: none;
                    color: white;
                    padding: 10px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                    transition: all 0.2s;
                }

                .btn-modern-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5);
                }
                
                .btn-close {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: flex;
                }
                
                .btn-close:hover {
                    background: rgba(255,255,255,0.1);
                    color: var(--text-primary);
                }
                
                .error-banner {
                    margin-top: 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    text-align: center;
                }

                /* Responsividade */
                @media (max-width: 640px) {
                    .form-grid {
                        grid-template-columns: 1fr; /* Empilha tudo */
                        gap: 1rem;
                    }
                    
                    .modal-container {
                        width: 100%;
                        height: 100%;
                        max-height: 100vh;
                        border-radius: 0;
                    }
                    
                    .modal-form-content {
                        padding: 1.5rem;
                    }
                }

                /* Extra Info Section */
                .extra-info-section {
                    margin-bottom: 2rem;
                    background: rgba(255,255,255,0.02);
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 1px dashed var(--border-light);
                }

                .section-title {
                    font-size: 1rem;
                    color: var(--primary-light);
                    margin-bottom: 1rem;
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-light);
                    padding-bottom: 0.5rem;
                }

                .info-grid-readonly {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .info-box {
                    background: var(--bg-input);
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-light);
                }

                .full-box {
                    grid-column: 1 / -1;
                }

                .info-label-sm {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.25rem;
                    font-weight: 600;
                }

                .info-text {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .info-text-long {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    white-space: pre-wrap; /* Mantém quebras de linha */
                    line-height: 1.5;
                }

                /* Animações */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div >
    );
}
