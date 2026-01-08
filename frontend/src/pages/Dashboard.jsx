import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import ClienteCard from '../components/ClienteCard';
import { clienteService } from '../services/api';
import '../index.css';
import '../App.css';

function Dashboard() {
    const { logout, user } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para controlar qual card está expandido (apenas um por vez)
    const [expandedId, setExpandedId] = useState(null);

    const handleToggleExpand = (id) => {
        setExpandedId(prevId => prevId === id ? null : id);
    };

    // Estado para filtros
    const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, janela_sim, janela_nao
    const [filtroPeriodo, setFiltroPeriodo] = useState('todos'); // todos, 7dias, 14dias, mes_atual, personalizado
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Estado para busca

    const filtrosOpcoes = [
        { valor: 'todos', label: '🌟 Todos' },
        { valor: 'clientes_reais', label: '✅ Clientes Reais' },
        { valor: 'cadastro_incompleto', label: '📝 Cadastro Incompleto' },
        { valor: 'cadastro_completo', label: '✅ Cadastro Completo' },
        { valor: 'janela_24h_sim', label: '⏰ Janela 24H Ativa' },
        { valor: 'mapa_pronto', label: '📄 Mapa Gerado' },
        { valor: 'mapa_entregue', label: '📨 Mapa Entregue' },
        { valor: 'mapa_atrasado', label: '⚠️ Atrasados (>2h)' },
        { valor: 'janela_24h_nao', label: '⏱️ Fora da Janela 24H' }
    ];

    const periodoOpcoes = [
        { valor: 'todos', label: '📅 Todo Período' },
        { valor: 'hoje', label: '📆 Hoje' },
        { valor: '7dias', label: '7 Dias' },
        { valor: '14dias', label: '14 Dias' },
        { valor: 'mes_atual', label: 'Mês Atual' },
        { valor: 'personalizado', label: 'Personalizado' }
    ];

    useEffect(() => {
        // Carrega forçando atualização do cache (skipCache = true) ao montar o componente (F5/Reload)
        carregarClientes(false, true);

        // Configura Polling de 10 segundos para atualização automática sem recarregar
        const intervalId = setInterval(() => {
            // silent=true (sem spinner), skipCache=true (dados frescos)
            carregarClientes(true, true);
        }, 10000);

        // Limpa o intervalo ao desmontar
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [clientes, filtroTipo, filtroPeriodo, dataInicio, dataFim, searchTerm]); // Adicionado searchTerm

    const carregarClientes = async (silent = false, skipCache = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);
            const data = await clienteService.listarTodos(skipCache);
            // Inverter a ordem para mostrar o último adicionado primeiro (ordem decrescente de ID)
            setClientes(data.reverse());
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao carregar clientes');
            console.error('Erro ao carregar clientes:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const parseData = (dataStr) => {
        if (!dataStr) return null;
        try {
            let date;

            // Verifica se é formato brasileiro com barra (DD/MM/YYYY ou DD/MM/YY)
            if (dataStr.includes('/')) {
                const parts = dataStr.split('/');
                // Se tiver 3 partes (dia, mes, ano)
                if (parts.length === 3) {
                    let [dia, mes, ano] = parts;

                    // Ajusta ano de 2 dígitos (ex: 26 -> 2026)
                    if (ano.length === 2) {
                        ano = '20' + ano;
                    }

                    // Cria a data no formato ISO para garantir o parse correto (YYYY-MM-DD)
                    date = new Date(`${ano}-${mes}-${dia}T00:00:00`);
                }
            } else {
                // Tenta formato ISO padrão (YYYY-MM-DD)
                date = new Date(dataStr.includes('T') ? dataStr : `${dataStr}T00:00:00`);
            }

            if (!date || isNaN(date.getTime())) return null;

            // Remove horas para comparação apenas de data
            date.setHours(0, 0, 0, 0);
            return date;
        } catch (e) {
            console.error("Erro ao converter data:", dataStr, e);
            return null;
        }
    };

    const aplicarFiltros = () => {
        let resultado = [...clientes];

        // 0. Filtro de Busca (Nome e Telefone)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            resultado = resultado.filter(c =>
                (c.nome && c.nome.toLowerCase().includes(term)) ||
                (c.numero && c.numero.includes(term))
            );
        }

        // 1. Filtro de Tipo (Janela 24h e Mapas)
        if (filtroTipo === 'clientes_reais') {
            resultado = resultado.filter(c => c.e_um_cliente_real === true);
        } else if (filtroTipo === 'janela_24h_sim') {
            resultado = resultado.filter(c => c.janela_24_horas === true);
        } else if (filtroTipo === 'janela_24h_nao') {
            resultado = resultado.filter(c => c.janela_24_horas === false);
        } else if (filtroTipo === 'mapa_pronto') {
            resultado = resultado.filter(c => c.link_pdf_mapa_astral);
        } else if (filtroTipo === 'mapa_entregue') {
            resultado = resultado.filter(c => c.ja_entregou_mapa === true);
        } else if (filtroTipo === 'cadastro_incompleto') {
            resultado = resultado.filter(c => {
                // Se já tem mapa ou já foi entregue, não conta como incompleto
                if (c.link_pdf_mapa_astral || c.ja_entregou_mapa) return false;

                // Verifica se falta algum campo obrigatório
                return !c.area_foco || !c.data_nascimento || !c.horario_nascimento ||
                    !c.cidade || !c.estado || !c.pais ||
                    !c.motivacao || !c.mudanca_vida || !c.expectativa;
            });
        } else if (filtroTipo === 'mapa_atrasado') {
            resultado = resultado.filter(c => {
                // Regra: "todos os leadss que ainda não receberam o mapa, mas já passou das 2 horas"
                // No backend, o worker marca 'nao_entregou_e_passou_2_horas' = True
                // Vamos usar essa flag que vem do Baserow
                // E garantimos que apenas CLIENTES REAIS apareçam aqui, conforme regra de negocio
                return c.nao_entregou_e_passou_2_horas === true && !c.ja_entregou_mapa && c.e_um_cliente_real;
            });
        } else if (filtroTipo === 'cadastro_completo') {
            resultado = resultado.filter(c => {
                // Considera completo se:
                // 1. Já tem o mapa gerado ou entregue (status resolvido)
                // OU
                // 2. Tem todos os dados obrigatórios preenchidos
                const temMapa = c.link_pdf_mapa_astral || c.ja_entregou_mapa;
                const temDados = c.area_foco && c.data_nascimento && c.horario_nascimento &&
                    c.cidade && c.estado && c.pais &&
                    c.motivacao && c.mudanca_vida && c.expectativa;

                return temMapa || temDados;
            });
        }

        // 2. Filtro de Período
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (filtroPeriodo !== 'todos') {
            resultado = resultado.filter(c => {
                const dataContato = parseData(c.data_entrou_contato);
                if (!dataContato) return false;

                if (filtroPeriodo === 'hoje') {
                    return dataContato.getTime() === hoje.getTime();
                }

                if (filtroPeriodo === '7dias') {
                    const limite = new Date(hoje);
                    limite.setDate(hoje.getDate() - 7);
                    return dataContato >= limite && dataContato <= hoje;
                }

                if (filtroPeriodo === '14dias') {
                    const limite = new Date(hoje);
                    limite.setDate(hoje.getDate() - 14);
                    return dataContato >= limite && dataContato <= hoje;
                }

                if (filtroPeriodo === 'mes_atual') {
                    return dataContato.getMonth() === hoje.getMonth() &&
                        dataContato.getFullYear() === hoje.getFullYear();
                }

                if (filtroPeriodo === 'personalizado') {
                    if (!dataInicio && !dataFim) return true;

                    // Parse das datas dos inputs (que vêm sempre YYYY-MM-DD do HTML)
                    let inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
                    let fim = dataFim ? new Date(`${dataFim}T23:59:59`) : null;

                    if (inicio) inicio.setHours(0, 0, 0, 0);
                    if (fim) fim.setHours(23, 59, 59, 999);

                    // Comparação
                    if (inicio && dataContato < inicio) return false;
                    if (fim && dataContato > fim) return false;

                    return true;
                }

                return true;
            });
        }

        setFilteredClientes(resultado);
    };

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <h1>
                        <span className="header-icon">✨</span>
                        Gerenciador de Clientes - Mapa Astral
                    </h1>
                    <div className="header-actions">
                        <span className="user-welcome">Olá, {user?.name || 'Admin'}</span>
                        <button onClick={logout} className="btn-logout" title="Sair">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Painel de Filtros */}
                <div className="filters-panel">

                    {/* Busca */}
                    <div className="filter-group full-width" style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nome ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 36px',
                                    borderRadius: '12px',
                                    border: '1px solid #334155', // slate-700
                                    backgroundColor: '#1e293b', // slate-800
                                    color: '#f8fafc', // slate-50
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#818cf8'; // indigo-400
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155';
                                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                            />
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
                                🔍
                            </div>
                        </div>
                    </div>

                    {/* Categoria */}
                    <div className="filter-group">
                        <span className="filter-label">Status:</span>
                        <div className="filter-buttons">
                            {filtrosOpcoes.map(opt => (
                                <button
                                    key={opt.valor}
                                    className={`filter-btn ${filtroTipo === opt.valor ? 'active' : ''}`}
                                    onClick={() => setFiltroTipo(opt.valor)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Período */}
                    <div className="filter-group">
                        <span className="filter-label">Período:</span>
                        <div className="filter-buttons">
                            {periodoOpcoes.map(opt => (
                                <button
                                    key={opt.valor}
                                    className={`filter-btn ${filtroPeriodo === opt.valor ? 'active' : ''}`}
                                    onClick={() => setFiltroPeriodo(opt.valor)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Datas Personalizadas */}
                    {filtroPeriodo === 'personalizado' && (
                        <div className="filter-dates user-message">
                            <div className="date-input-group">
                                <label>De:</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                            <div className="date-input-group">
                                <label>Até:</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-value">{filteredClientes.length}</div>
                        <div className="stat-label">Clientes Filtrados</div>
                    </div>
                    {filtroTipo !== 'janela_24h_sim' && filtroTipo !== 'janela_24h_nao' && (
                        <>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {filteredClientes.filter(c => c.janela_24_horas === true).length}
                                </div>
                                <div className="stat-label">Na Janela 24H</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {filteredClientes.filter(c => c.janela_24_horas === false).length}
                                </div>
                                <div className="stat-label">Fora da Janela 24H</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Carregando clientes...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="alert alert-error">
                        <p>❌ {error}</p>
                        <button className="btn btn-secondary" onClick={carregarClientes}>
                            🔄 Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Clientes Grid */}
                {!loading && !error && (
                    <>
                        {filteredClientes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <h3>Nenhum cliente encontrado</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                    Tente ajustar os filtros para ver mais resultados.
                                </p>
                            </div>
                        ) : (
                            <div className="clientes-grid">
                                {filteredClientes.map(cliente => (
                                    <ClienteCard
                                        key={cliente.id}
                                        cliente={cliente}
                                        isExpanded={expandedId === cliente.id}
                                        onToggle={() => handleToggleExpand(cliente.id)}
                                        onRefresh={() => carregarClientes(true, true)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
