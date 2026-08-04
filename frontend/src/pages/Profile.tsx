import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Heart, ShoppingBag, LogOut, Sparkles, Brain, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 py-10 font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                {user?.fullName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white">{user?.fullName || 'User Profile'}</h1>
                                <p className="text-indigo-200 text-sm flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-indigo-300" />
                                    <span>{user?.email}</span>
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mt-3 border border-emerald-500/30">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Verified Account</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-200 border border-white/10 transition text-sm font-bold shrink-0 self-start md:self-auto cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">My Wishlist</h3>
                            <p className="text-slate-500 text-xs mt-1">Saved fashion picks & outfits</p>
                        </div>
                        <Link to="/wishlist" className="mt-6 flex items-center justify-between font-bold text-sm text-purple-600 hover:text-purple-700">
                            <span>View items</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit mb-4">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">My Orders</h3>
                            <p className="text-slate-500 text-xs mt-1">Track orders & purchase history</p>
                        </div>
                        <Link to="/orders" className="mt-6 flex items-center justify-between font-bold text-sm text-indigo-600 hover:text-indigo-700">
                            <span>Track status</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="p-3 rounded-2xl bg-pink-50 text-pink-600 w-fit mb-4">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Style DNA</h3>
                            <p className="text-slate-500 text-xs mt-1">AI style preferences & guide</p>
                        </div>
                        <Link to="/style-dna" className="mt-6 flex items-center justify-between font-bold text-sm text-pink-600 hover:text-pink-700">
                            <span>Manage preferences</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* AI Shopping History Section */}
                <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Personalized AI Features</h3>
                            <p className="text-slate-500 text-xs">AI Stylist & Skin Tone guide configuration</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/stylist" className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 transition flex items-center justify-between group">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-700">Outfit Stylist Recommendations</h4>
                                <p className="text-slate-500 text-xs mt-0.5">Generate occasion-based smart outfits</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                        </Link>

                        <Link to="/skin-tone" className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 transition flex items-center justify-between group">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-700">Skin Tone Color Matcher</h4>
                                <p className="text-slate-500 text-xs mt-0.5">Optimal wardrobe palette detection</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
