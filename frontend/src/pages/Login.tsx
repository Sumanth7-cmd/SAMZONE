import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    UserPlus,
    Sparkles,
    ShieldCheck,
    Bot,
    Camera,
    Wand2,
    AlertCircle,
    User,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
    initialMode?: 'login' | 'signup';
}

const Login: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
    const { signIn, signUp, signInWithOAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from || '/';

    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup' || location.pathname === '/signup');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsSignUp(initialMode === 'signup' || location.pathname === '/signup');
        setError(null);
    }, [location.pathname, initialMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        if (isSignUp) {
            if (!fullName.trim()) {
                setError('Please enter your full name.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }

        setIsLoading(true);

        if (isSignUp) {
            const { error: err } = await signUp(email, password, fullName);
            setIsLoading(false);
            if (err) {
                setError(err.message || 'Failed to create account.');
            } else {
                navigate(from, { replace: true });
            }
        } else {
            const { error: err } = await signIn(email, password, rememberMe);
            setIsLoading(false);
            if (err) {
                setError(err.message || 'Invalid email or password.');
            } else {
                navigate(from, { replace: true });
            }
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        setError(null);
        const { error: err } = await signInWithOAuth(provider);
        setIsLoading(false);
        if (err) {
            setError(err.message);
        } else {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
            {/* LEFT PANEL - Luxury Hero & Feature Highlights */}
            <div className="lg:w-7/12 bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                {/* Floating Animated Background Blobs */}
                <div className="absolute -right-10 -top-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
                <div className="absolute right-1/3 top-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Logo Header */}
                <div className="relative z-10 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group inline-flex">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent leading-none">
                                SAMZONE
                            </span>
                            <span className="text-[10px] font-extrabold tracking-widest text-purple-300 uppercase leading-none mt-1">
                                AI SHOPPING STUDIO
                            </span>
                        </div>
                    </Link>

                    {/* Mode Toggle Button in Header */}
                    <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-semibold">
                        <span className="text-purple-200">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white hover:text-purple-300 font-bold underline transition cursor-pointer"
                        >
                            {isSignUp ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>
                </div>

                {/* Main Hero Content & 5 Feature Highlights */}
                <div className="my-10 lg:my-0 relative z-10 max-w-xl">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md inline-flex items-center gap-2 mb-6 border border-purple-400/30 shadow-inner">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>AI Shopping Experience</span>
                    </span>

                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
                        Welcome to <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">SAMZONE</span>
                    </h1>

                    <p className="text-indigo-200/90 text-base lg:text-lg mb-8 leading-relaxed font-normal">
                        Shop smarter with AI-powered recommendations.
                    </p>

                    {/* 5 Feature Highlights with Icons */}
                    <div className="space-y-3.5">
                        <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300">
                            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> AI Shopping Assistant
                                </h4>
                                <p className="text-xs text-indigo-200/80 mt-0.5">Conversational shopping companion to answer style queries and recommend items.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Visual Search
                                </h4>
                                <p className="text-xs text-indigo-200/80 mt-0.5">Upload photo inspiration to find matching apparel from our catalog.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300">
                            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-300 shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Outfit Stylist
                                </h4>
                                <p className="text-xs text-indigo-200/80 mt-0.5">Generate complete, occasion-specific outfits coordinated automatically.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                                <Wand2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Smart Recommendations
                                </h4>
                                <p className="text-xs text-indigo-200/80 mt-0.5">Tailored recommendations matching your personal skin tone & style DNA.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition duration-300">
                            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span> Secure Authentication
                                </h4>
                                <p className="text-xs text-indigo-200/80 mt-0.5">Enterprise-grade security protecting your user profile and saved items.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Copyright & Quick Switch */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs text-indigo-300/60">
                    <span>© {new Date().getFullYear()} SAMZONE Studio Inc. All rights reserved.</span>
                    <div className="sm:hidden flex items-center gap-2">
                        <span>{isSignUp ? 'Already registered?' : 'New to SAMZONE?'}</span>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white font-bold underline"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Glassmorphic Authentication Card */}
            <div className="lg:w-5/12 bg-slate-900 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 shadow-2xl border border-slate-100 relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {isSignUp ? 'Join SAMZONE to unlock personalized AI fashion' : 'Enter your credentials to access saved preferences'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name (SignUp Only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Alex Morgan"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Address */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Password
                                </label>
                                {!isSignUp && (
                                    <Link to="/forgot-password" className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (SignUp Only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Remember Me Checkbox */}
                        {!isSignUp && (
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                    />
                                    <span className="text-xs font-medium text-slate-600">Remember me</span>
                                </label>
                            </div>
                        )}

                        {/* Primary Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <span className="relative bg-white px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            OR
                        </span>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleOAuth('google')}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>Google</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOAuth('github')}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                            <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span>GitHub</span>
                        </button>
                    </div>

                    {/* Mode Toggle Link */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="font-bold text-purple-600 hover:text-purple-700 transition cursor-pointer"
                            >
                                {isSignUp ? 'Sign in' : 'Create an account'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
