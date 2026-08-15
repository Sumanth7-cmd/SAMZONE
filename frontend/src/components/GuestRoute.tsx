import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-600 text-sm font-medium">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    if (user) {
        const from = (location.state as any)?.from || '/';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export default GuestRoute;
