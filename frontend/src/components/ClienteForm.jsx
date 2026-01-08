import React, { useState, useEffect } from 'react';
import { clienteService } from '../services/api';

function ClienteForm({ cliente, onClose, onSave }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        numero: '',
        data_entrou_contato: '',
        horario_entrou_contato: '',
        janela_24_horas: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cliente) {
            setFormData({
                nome: cliente.nome || '',
                email: cliente.email || '',
                numero: cliente.numero || '',
                data_entrou_contato: cliente.data_entrou_contato || '',
                horario_entrou_contato: cliente.horario_entrou_contato || '',
                janela_24_horas: cliente.janela_24_horas || false
            });
        }
    }, [cliente]);

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

        // Preparar dados para envio (converter strings vazias em null/undefined se necessário)
        const dadosParaEnviar = { ...formData };
        if (!dadosParaEnviar.email) delete dadosParaEnviar.email;
        if (!dadosParaEnviar.numero) delete dadosParaEnviar.numero;

        try {
            let resultado;
            if (cliente) {
                // Atualizar
                resultado = await clienteService.atualizar(cliente.id, dadosParaEnviar);
            } else {
                // Criar
                resultado = await clienteService.criar(dadosParaEnviar);
            }

            onSave(resultado);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao salvar cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{cliente ? '✏️ Editar Cliente' : '➕ Novo Cliente'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="nome">Nome Completo *</label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            className="form-input"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Maria Silva"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ex: maria@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="numero">Número (WhatsApp)</label>
                        <input
                            type="tel"
                            id="numero"
                            name="numero"
                            className="form-input"
                            value={formData.numero}
                            onChange={handleChange}
                            placeholder="Ex: 11999999999"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="data_entrou_contato">Data do Contato</label>
                            <input
                                type="date"
                                id="data_entrou_contato"
                                name="data_entrou_contato"
                                className="form-input"
                                value={formData.data_entrou_contato}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="horario_entrou_contato">Horário do Contato</label>
                            <input
                                type="time"
                                id="horario_entrou_contato"
                                name="horario_entrou_contato"
                                className="form-input"
                                value={formData.horario_entrou_contato}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                name="janela_24_horas"
                                checked={formData.janela_24_horas}
                                onChange={handleChange}
                            />
                            <span>⏰ Dentro da janela de 24 horas</span>
                        </label>
                    </div>

                    <div className="flex gap-2" style={{ marginTop: '2rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? '⏳ Salvando...' : '💾 Salvar'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClienteForm;
