import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './index.css';
import './App.css';

function Routes() {
    const { signed, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return signed ? <Dashboard /> : <Login />;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes />
        </AuthProvider>
    );
}
