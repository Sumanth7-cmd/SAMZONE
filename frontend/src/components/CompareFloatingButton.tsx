import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useCompare } from '../context/CompareContext';

const CompareFloatingButton: React.FC = () => {
    const { compareItems } = useCompare();
    const navigate = useNavigate();
    const location = useLocation();

    if (compareItems.length < 2 || location.pathname === '/compare') return null;

    return (
        <button
            onClick={() => navigate('/compare')}
            className="fixed bottom-24 left-4 z-40 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium text-sm"
        >
            <Scale className="w-4 h-4" />
            Compare ({compareItems.length})
        </button>
    );
};

export default CompareFloatingButton;
