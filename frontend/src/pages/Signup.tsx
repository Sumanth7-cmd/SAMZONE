import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Password strength indicators
    const isMinLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isMatching = password && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!isMinLength) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (!isMatching) {
            setError('Passwords do not match.');
            return;
        }

        if (!acceptTerms) {
            setError('You must accept the Terms of Service and Privacy Policy.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error: err } = await signUp(email, password, fullName);
        setIsLoading(false);

        if (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } else {
            navigate('/', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans">
            {/* Left Side Branding */}
            <div className="lg:w-1/2 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 group inline-flex">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
                                SAMZONE
                            </span>
                            <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase leading-none mt-1">
                                AI SHOPPING STUDIO
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="my-12 lg:my-0 relative z-10 max-w-lg">
                    <span className="px-4 py-1.5 rounded-full bg-white/10 text-purple-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-md inline-block mb-6 border border-white/10">
                        Join the Community
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
                        Start Your Personal <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">Style Journey</span>
                    </h1>
                    <p className="text-purple-200 text-lg mb-8 leading-relaxed font-normal">
                        Create an account to unlock AI outfit recommendations, saved style preferences, and real-time order tracking.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-purple-300/60">
                    © {new Date().getFullYear()} SAMZONE Studio Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side Form */}
            <div className="lg:w-1/2 bg-slate-900 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-100 relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Account</h2>
                        <p className="text-slate-500 text-sm mt-1">Free membership with instant AI stylist access</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

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
                                    placeholder="alex@example.com"
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create password"
                                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Indicators */}
                            {password && (
                                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                                    <div className={`flex items-center gap-1 font-medium ${isMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>6+ chars</span>
                                    </div>
                                    <div className={`flex items-center gap-1 font-medium ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Uppercase</span>
                                    </div>
                                    <div className={`flex items-center gap-1 font-medium ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Number</span>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                    placeholder="Repeat password"
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5"
                            />
                            <span className="text-xs text-slate-600 leading-normal">
                                I agree to the <span className="font-semibold text-purple-600">Terms of Service</span> and <span className="font-semibold text-purple-600">Privacy Policy</span>
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-purple-600 hover:text-purple-700 transition">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
