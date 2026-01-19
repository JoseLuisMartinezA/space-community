import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Dashboard from './components/Dashboard';
import Community from './components/Community';
import Milestones from './components/Milestones';
import Profile from './components/Profile';
import TechSupport from './components/TechSupport';
import { AiAssistant } from './components/AiAssistant';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { Login, Register } from './components/Auth';
import { PublicProfile } from './components/PublicProfile';


import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

// Wrapper for protected routes
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen w-full flex items-center justify-center bg-background-dark text-primary font-mono animate-pulse">Iniciando Protocolos...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout>
            <Outlet />
            <AiAssistant />
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <HashRouter>
                    <NotificationProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/community" element={<Community />} />
                                <Route path="/milestones" element={<Milestones />} />
                                <Route path="/analysis" element={<MediaAnalyzer />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/profile/:userId" element={<PublicProfile />} />
                                <Route path="/support" element={<TechSupport />} />
                            </Route>
                        </Routes>
                    </NotificationProvider>
                </HashRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
