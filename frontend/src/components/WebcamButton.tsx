import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import WebcamTryOn from './WebcamTryOn';

const WebcamButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Webcam Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-20 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center gap-2"
            >
                <Camera className="w-6 h-6" />
                <span className="font-medium">Try On</span>
            </button>

            {/* Webcam Try-On Modal */}
            {isOpen && (
                <WebcamTryOn
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default WebcamButton;
