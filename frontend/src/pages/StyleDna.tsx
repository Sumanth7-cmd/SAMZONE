import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Sparkles, ArrowLeft, ArrowRight, Download, ShoppingCart, Eye, RefreshCw } from 'lucide-react';
import { styleDnaApi } from '../services/api';
import type { StyleDnaAnswers, StyleDnaResult, Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';

type OptionQuestion = {
    key: keyof StyleDnaAnswers;
    type: 'options';
    title: string;
    subtitle: string;
    options: { value: string; label: string; emoji: string; swatch?: string[] }[];
};
type TextQuestion = {
    key: keyof StyleDnaAnswers;
    type: 'text';
    title: string;
    subtitle: string;
    placeholder: string;
};
type Question = OptionQuestion | TextQuestion;

const QUESTIONS: Question[] = [
    {
        key: 'gender',
        type: 'options',
        title: 'Who are we styling?',
        subtitle: 'This shapes which products show up in your mood board.',
        options: [
            { value: 'women', label: 'Women', emoji: '👗' },
            { value: 'men', label: 'Men', emoji: '👔' },
        ],
    },
    {
        key: 'colorPreference',
        type: 'options',
        title: 'Which colors speak to you?',
        subtitle: 'Pick the palette that feels most like you.',
        options: [
            { value: 'bold', label: 'Bold & Vibrant', emoji: '🔴', swatch: ['#DC2626', '#F59E0B', '#111827'] },
            { value: 'neutral', label: 'Neutral & Earthy', emoji: '🟤', swatch: ['#D2B48C', '#9CA3AF', '#FFFFFF'] },
            { value: 'pastel', label: 'Soft & Pastel', emoji: '🩷', swatch: ['#FBCFE8', '#BFDBFE', '#FEF3C7'] },
            { value: 'monochrome', label: 'Monochrome', emoji: '⚫', swatch: ['#000000', '#6B7280', '#FFFFFF'] },
        ],
    },
    {
        key: 'fitPreference',
        type: 'options',
        title: 'How do you like your fit?',
        subtitle: 'Silhouette says a lot about your everyday comfort zone.',
        options: [
            { value: 'relaxed/oversized', label: 'Relaxed & Oversized', emoji: '👕' },
            { value: 'fitted/tailored', label: 'Fitted & Tailored', emoji: '🧥' },
            { value: 'mixed', label: 'A Mix of Both', emoji: '🔀' },
        ],
    },
    {
        key: 'occasionFocus',
        type: 'options',
        title: 'What do you dress for most?',
        subtitle: "We'll lean the mood board toward this occasion.",
        options: [
            { value: 'casual-everyday', label: 'Casual Everyday', emoji: '☕' },
            { value: 'office/formal', label: 'Office & Formal', emoji: '💼' },
            { value: 'party/going-out', label: 'Party & Going Out', emoji: '🎉' },
            { value: 'ethnic/festive', label: 'Ethnic & Festive', emoji: '🪔' },
        ],
    },
    {
        key: 'styleIcon',
        type: 'text',
        title: 'Describe your style in your own words',
        subtitle: 'Streetwear? Old money? Minimalist? Boho? There are no wrong answers.',
        placeholder: 'e.g. streetwear, old money, minimalist, boho...',
    },
    {
        key: 'budgetRange',
        type: 'options',
        title: "What's your budget range?",
        subtitle: "We'll keep your mood board within reach.",
        options: [
            { value: 'budget', label: 'Budget-Friendly', emoji: '💰' },
            { value: 'mid-range', label: 'Mid-Range', emoji: '💳' },
            { value: 'premium', label: 'Premium', emoji: '💎' },
        ],
    },
];

const DEFAULT_ANSWERS: StyleDnaAnswers = {
    colorPreference: 'neutral',
    fitPreference: 'mixed',
    occasionFocus: 'casual-everyday',
    styleIcon: '',
    budgetRange: 'mid-range',
    gender: 'women',
};

const COLOR_HEX_MAP: Record<string, string> = {
    black: '#111827', white: '#FFFFFF', red: '#DC2626', blue: '#2563EB', green: '#16A34A',
    yellow: '#EAB308', purple: '#9333EA', pink: '#EC4899', orange: '#F97316', brown: '#92400E',
    grey: '#6B7280', gray: '#6B7280', navy: '#1E3A5F', maroon: '#7F1D1D', beige: '#E5D3B3', teal: '#0D9488',
    coral: '#FF6B6B', mustard: '#D4A017', charcoal: '#374151', olive: '#6B8E23', emerald: '#10B981',
    cream: '#FFF8DC', tan: '#D2B48C', burgundy: '#7F1D1D', khaki: '#C3B091', gold: '#D4AF37', lavender: '#C4B5FD',
};

const colorToHex = (name: string): string => COLOR_HEX_MAP[name?.toLowerCase()?.trim()] ?? '#9CA3AF';

const showToast = (text: string, className: string) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${className} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
};

const StyleDna: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<StyleDnaAnswers>(DEFAULT_ANSWERS);
    const [phase, setPhase] = useState<'quiz' | 'loading' | 'results'>('quiz');
    const [result, setResult] = useState<StyleDnaResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const question = QUESTIONS[step];
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    const goNext = () => {
        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const selectOption = (key: keyof StyleDnaAnswers, value: string) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
        setTimeout(goNext, 150);
    };

    const handleSubmit = async () => {
        setPhase('loading');
        setError(null);
        try {
            const data = await styleDnaApi.buildProfile(answers);
            setResult(data);
            setPhase('results');
        } catch {
            setError("Couldn't analyze your style DNA right now. Please try again.");
            setPhase('quiz');
        }
    };

    const retakeQuiz = () => {
        setStep(0);
        setAnswers(DEFAULT_ANSWERS);
        setResult(null);
        setPhase('quiz');
    };

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: getProductImage(product),
            size: product.sizes?.[0],
            color: product.colors?.[0],
            stock: product.stock,
        });
        showToast('✅ Added to cart!', 'bg-green-500');
    };

    const downloadStyleCard = () => {
        if (!result) return;
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 800, 1000);
        gradient.addColorStop(0, '#4c1d95');
        gradient.addColorStop(1, '#db2777');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1000);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('🧬 SAMZONE Style DNA', 50, 80);

        ctx.font = 'bold 42px sans-serif';
        wrapText(ctx, result.profile.profileTitle, 50, 160, 700, 50);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#f3e8ff';
        wrapText(ctx, result.profile.description, 50, 250, 700, 30);

        let y = 430;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Style Breakdown', 50, y);
        y += 30;
        result.profile.archetypes.forEach((a) => {
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${a.name} — ${a.percentage}%`, 50, y);
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(50, y + 10, 700, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(50, y + 10, 700 * (a.percentage / 100), 10);
            y += 50;
        });

        y += 20;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Color Palette', 50, y);
        y += 30;
        result.profile.colorPalette.forEach((c, i) => {
            ctx.fillStyle = colorToHex(c);
            ctx.beginPath();
            ctx.arc(70 + i * 70, y + 20, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#f3e8ff';
        ctx.fillText('Discover your style DNA at SAMZONE', 50, 960);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'my-style-dna.png';
        link.click();
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let curY = y;
        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                ctx.fillText(line, x, curY);
                line = word + ' ';
                curY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, curY);
    };

    if (phase === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 px-4">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="w-16 h-16 mx-auto mb-6"
                    >
                        <Dna className="w-16 h-16 text-purple-300" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Analyzing your style DNA...</h2>
                    <p className="text-purple-200">Matching your answers to real products</p>
                </div>
            </div>
        );
    }

    if (phase === 'results' && result) {
        return (
            <div className="min-h-screen bg-gray-50 pb-16">
                <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 px-4 sm:px-6 py-12 sm:py-16">
                    <div ref={cardRef} className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-purple-100 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                            <Dna className="w-4 h-4" /> Your Style DNA Profile
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">{result.profile.profileTitle}</h1>
                        <p className="text-purple-100 text-base sm:text-lg max-w-2xl mx-auto mb-10">{result.profile.description}</p>

                        {/* Archetype bars */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 mb-6 text-left max-w-xl mx-auto">
                            <h3 className="text-white font-bold mb-4 text-center">Style Breakdown</h3>
                            <div className="space-y-4">
                                {result.profile.archetypes.map((a, i) => (
                                    <div key={a.name}>
                                        <div className="flex justify-between text-sm text-purple-100 mb-1">
                                            <span className="font-semibold">{a.name}</span>
                                            <span>{a.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${a.percentage}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Color palette */}
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Your Color Palette</h3>
                            <div className="flex gap-3 flex-wrap justify-center">
                                {result.profile.colorPalette.map((c) => (
                                    <div key={c} className="flex flex-col items-center gap-1">
                                        <div
                                            className="w-10 h-10 rounded-full border-2 border-white/60 shadow-lg"
                                            style={{ backgroundColor: colorToHex(c) }}
                                        />
                                        <span className="text-xs text-purple-100">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Keywords */}
                        <div className="flex gap-2 flex-wrap justify-center mb-8">
                            {result.profile.keywords.map((k) => (
                                <span key={k} className="bg-white/10 text-purple-100 text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                                    {k}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={downloadStyleCard}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" /> Download Style Card
                            </button>
                            <button
                                onClick={retakeQuiz}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors text-sm"
                            >
                                <RefreshCw className="w-4 h-4" /> Retake Quiz
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mood board */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Mood Board</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                        {result.moodBoard.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            >
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-36 sm:h-44 object-cover"
                                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                />
                                <div className="p-2.5">
                                    <p className="text-[10px] text-gray-500 uppercase truncate">{product.brand}</p>
                                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h4>
                                    <span className="text-xs font-bold text-gray-900">
                                        ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top picks */}
                {result.topPicks.length > 0 && (
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">✨ Top Picks For You</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {result.topPicks.map((product) => (
                                <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 w-48">
                                    <img
                                        src={getProductImage(product)}
                                        alt={product.name}
                                        className="w-full h-40 object-cover cursor-pointer"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                    />
                                    <div className="p-3">
                                        <p className="text-[10px] text-gray-500 uppercase truncate">{product.brand}</p>
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h4>
                                        <span className="text-sm font-bold text-gray-900 mb-2 block">
                                            ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/product/${product.id}`)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </button>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs transition-colors"
                                            >
                                                <ShoppingCart className="w-3 h-3" /> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Quiz phase
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center gap-2 mb-2">
                        <Dna className="w-7 h-7 text-purple-600" />
                        AI Style DNA
                    </h1>
                    <p className="text-gray-500 text-sm">Answer 6 quick questions to reveal your personalized style profile.</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                    <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
                    >
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">
                            Question {step + 1} of {QUESTIONS.length}
                        </p>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{question.title}</h2>
                        <p className="text-gray-500 text-sm mb-6">{question.subtitle}</p>

                        {question.type === 'options' ? (
                            <div className={`grid gap-3 ${question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                {question.options.map((opt) => {
                                    const selected = answers[question.key] === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => selectOption(question.key, opt.value)}
                                            className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all text-center ${
                                                selected
                                                    ? 'border-purple-600 bg-purple-50 shadow-md'
                                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-3xl">{opt.emoji}</span>
                                            <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                                            {opt.swatch && (
                                                <div className="flex gap-1">
                                                    {opt.swatch.map((c) => (
                                                        <div key={c} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={answers[question.key] as string}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.key]: e.target.value }))}
                                    placeholder={question.placeholder}
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    onKeyDown={(e) => { if (e.key === 'Enter') goNext(); }}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={goBack}
                                disabled={step === 0}
                                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-0 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            {question.type === 'text' && (
                                <button
                                    onClick={goNext}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors text-sm"
                                >
                                    {step === QUESTIONS.length - 1 ? (
                                        <>
                                            <Sparkles className="w-4 h-4" /> Reveal My Style DNA
                                        </>
                                    ) : (
                                        <>
                                            Next <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StyleDna;
