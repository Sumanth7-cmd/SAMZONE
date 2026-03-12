import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                                <img
                                    src="file:///home/rishi/.gemini/antigravity/brain/ddea068b-e842-4889-9787-0972efac6f18/samzone_logo_1770818879096.png"
                                    alt="SAMZONE Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tighter gradient-text">SAMZONE</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Redefining the digital shopping experience with AI-powered virtual try-ons and personalized styling assistance.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Experience</h4>
                        <ul className="space-y-4">
                            <li><Link to="/shop" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Digital Boutique</Link></li>
                            <li><Link to="/try-on" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">AI Try-On Studio</Link></li>
                            <li><Link to="/chat" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Style Concierge</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Our Vision</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Stay Connected</h4>
                        <p className="text-gray-500 text-sm mb-4">Join our community for exclusive style drops.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                            />
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-xs">
                    <p>&copy; {new Date().getFullYear()} SAMZONE AI. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-indigo-600 transition-colors">Instagram</Link>
                        <Link to="#" className="hover:text-indigo-600 transition-colors">Twitter</Link>
                        <Link to="#" className="hover:text-indigo-600 transition-colors">Pinterest</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
