import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tenta recuperar sessão salva
        const savedUser = localStorage.getItem('@App:user');
        const savedToken = localStorage.getItem('@App:token');

        if (savedUser && savedToken) {
            api.defaults.headers.Authorization = `Bearer ${savedToken}`;
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });

            if (response.data && response.data.access_token) {
                const { access_token } = response.data;

                // Salva Token
                localStorage.setItem('@App:token', access_token);
                api.defaults.headers.Authorization = `Bearer ${access_token}`;

                // Busca Dados do Usuário
                const userResponse = await api.get('/users/me');
                const userData = userResponse.data.data;

                localStorage.setItem('@App:user', JSON.stringify(userData));
                setUser(userData);

                return userData;
            }
        } catch (error) {
            console.error("Erro no login:", error);
            const message = error.response?.data?.detail || 'Falha ao realizar login';
            throw new Error(message);
        }
    };

    const logout = () => {
        localStorage.removeItem('@App:user');
        localStorage.removeItem('@App:token');
        api.defaults.headers.Authorization = undefined;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ signed: !!user, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
