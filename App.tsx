import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Dashboard from './components/Dashboard';
import Community from './components/Community';
import Milestones from './components/Milestones';
import Profile from './components/Profile';
import TechSupport from './components/TechSupport';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { Login, Register } from './components/Auth';
import { PublicProfile } from './components/PublicProfile';
import Launches from './components/Launches';
import Rockets from './components/Rockets';
import Statistics from './components/Statistics';
import Chat from './components/Chat';
import { LandingPage } from './components/LandingPage';



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
        </Layout>
    );
};

// Wrapper was removed to allow LandingPage for all users
// Authenticated users will see a "Go to Dashboard" button in the LandingPage

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <HashRouter>
                    <NotificationProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />


                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/launches" element={<Launches />} />
                                <Route path="/rockets" element={<Rockets />} />
                                <Route path="/statistics" element={<Statistics />} />
                                <Route path="/community" element={<Community />} />
                                <Route path="/chat" element={<Chat />} />
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
