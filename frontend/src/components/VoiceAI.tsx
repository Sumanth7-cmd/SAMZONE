import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceAIProps {
    onTranscript: (transcript: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

const VoiceAI: React.FC<VoiceAIProps> = ({
    onTranscript,
    onListeningChange,
    language = 'en-US',
    continuous = false,
    interimResults = true
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);
    
    const recognitionRef = useRef<any>(null);
    const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
        
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            setupRecognition();
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
            }
        };
    }, []);

    // Setup speech recognition
    const setupRecognition = useCallback(() => {
        if (!recognitionRef.current) return;

        const recognition = recognitionRef.current;
        
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        // Handle results
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setInterimTranscript(interimTranscript);
            
            if (finalTranscript) {
                const newTranscript = transcript + finalTranscript;
                setTranscript(newTranscript);
                onTranscript(newTranscript);
            }
        };

        // Handle errors
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(getErrorMessage(event.error));
            setIsListening(false);
            onListeningChange?.(false);
            
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
                setVolume(0);
            }
        };

        // Handle end
        recognition.onend = () => {
            setIsListening(false);
            onListeningChange?.(false);
            
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
                setVolume(0);
            }
        };

        // Handle start
        recognition.onstart = () => {
            setIsListening(true);
            onListeningChange?.(true);
            setError(null);
            startVolumeMonitoring();
        };

        // Handle audio start/stop for volume indication
        recognition.onaudiostart = () => {
            startVolumeMonitoring();
        };

        recognition.onaudioend = () => {
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
                setVolume(0);
            }
        };

        // Handle sound start/stop
        recognition.onsoundstart = () => {
            setVolume(0.5);
        };

        recognition.onsoundend = () => {
            setVolume(0);
        };

        // Handle speech start/stop
        recognition.onspeechstart = () => {
            setVolume(0.8);
        };

        recognition.onspeechend = () => {
            setVolume(0.2);
        };
    }, [language, continuous, interimResults, onTranscript, onListeningChange, transcript]);

    // Start volume monitoring
    const startVolumeMonitoring = useCallback(() => {
        if (volumeIntervalRef.current) {
            clearInterval(volumeIntervalRef.current);
        }

        volumeIntervalRef.current = setInterval(() => {
            // Simulate volume changes (in real implementation, you'd use Web Audio API)
            if (isListening) {
                setVolume(prev => {
                    const change = (Math.random() - 0.5) * 0.3;
                    const newVolume = Math.max(0, Math.min(1, prev + change));
                    return newVolume;
                });
            }
        }, 100);
    }, [isListening]);

    // Get error message
    const getErrorMessage = (error: string): string => {
        const errorMessages: Record<string, string> = {
            'no-speech': 'No speech was detected. Please try again.',
            'audio-capture': 'Microphone not available. Please check your permissions.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Network error. Please check your connection.',
            'service-not-allowed': 'Speech recognition service not allowed.',
            'bad-grammar': 'Grammar error in speech recognition.',
            'language-not-supported': 'Language not supported.'
        };
        
        return errorMessages[error] || 'Speech recognition error occurred.';
    };

    // Start listening
    const startListening = useCallback(() => {
        if (!recognitionRef.current || !isSupported) return;
        
        try {
            setError(null);
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setError('Failed to start speech recognition.');
        }
    }, [isSupported]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        if (volumeIntervalRef.current) {
            clearInterval(volumeIntervalRef.current);
            setVolume(0);
        }
    }, []);

    // Clear transcript
    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Render volume bars
    const renderVolumeBars = () => {
        const bars = 5;
        return Array.from({ length: bars }, (_, i) => (
            <div
                key={i}
                className={`w-1 bg-gray-300 rounded-full transition-all duration-100 ${
                    i < Math.floor(volume * bars) ? 'bg-green-500' : ''
                }`}
                style={{
                    height: `${4 + i * 2}px`,
                    opacity: i < Math.floor(volume * bars) ? 1 : 0.3
                }}
            />
        ));
    };

    if (!isSupported) {
        return (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <VolumeX className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">
                    Speech recognition not supported in this browser
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Voice Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleListening}
                    disabled={!isSupported}
                    className={`p-3 rounded-full transition-all duration-200 ${
                        isListening
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isListening ? (
                        <MicOff className="w-5 h-5" />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>

                {/* Volume Indicator */}
                {isListening && (
                    <div className="flex items-center gap-1 p-2 bg-gray-100 rounded-lg">
                        <Volume2 className="w-4 h-4 text-gray-600" />
                        <div className="flex items-end gap-1 h-6">
                            {renderVolumeBars()}
                        </div>
                    </div>
                )}

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                    {isListening && (
                        <>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Listening...</span>
                        </>
                    )}
                </div>

                {/* Clear Button */}
                {transcript && (
                    <button
                        onClick={clearTranscript}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Transcript Display */}
            {(transcript || interimTranscript) && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="space-y-1">
                        {transcript && (
                            <p className="text-gray-900">{transcript}</p>
                        )}
                        {interimTranscript && (
                            <p className="text-gray-500 italic">{interimTranscript}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!transcript && !isListening && (
                <div className="text-center text-gray-500 text-sm">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Click the microphone to start speaking</p>
                    <p className="text-xs mt-1">Works best in Chrome or Edge</p>
                </div>
            )}
        </div>
    );
};

export default VoiceAI;
