import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Clientes
export const clienteService = {
    listarTodos: async (skipCache = false) => {
        const url = skipCache
            ? `/clientes?_t=${new Date().getTime()}&skip_cache=true`
            : `/clientes?_t=${new Date().getTime()}`;
        const response = await api.get(url);
        return response.data;
    },

    buscarPorId: async (id) => {
        const response = await api.get(`/clientes/${id}`);
        return response.data;
    },

    criar: async (cliente) => {
        const response = await api.post('/clientes', cliente);
        return response.data;
    },

    atualizar: async (id, cliente) => {
        const response = await api.put(`/clientes/${id}`, cliente);
        return response.data;
    },

    deletar: async (id) => {
        const response = await api.delete(`/clientes/${id}`);
        return response.data;
    },

    gerarMapa: async (id) => {
        const response = await api.post(`/clientes/${id}/gerar-mapa`, {}, {
            timeout: 600000 // 10 minutos
        });
        return response.data;
    },

    filtrarPorStatus: async (status) => {
        const response = await api.get(`/clientes/status/${status}`);
        return response.data;
    },

    listarStatusOpcoes: async () => {
        const response = await api.get('/status-opcoes');
        return response.data;
    },

    listarTemplates: async () => {
        const response = await api.get('/whatsapp/templates');
        return response.data;
    },
};

// Health Check
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
