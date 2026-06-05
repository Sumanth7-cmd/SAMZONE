import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Facebook, 
    Twitter, 
    Instagram, 
    Youtube, 
    Phone, 
    CreditCard,
    Shield,
    Truck,
    RefreshCw,
    HeadphonesIcon,
    Star
} from 'lucide-react';

const PremiumFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const customerServices = [
        { name: 'Contact Us', icon: Phone, description: 'Mon-Sat: 9AM-9PM' },
        { name: 'Track Order', icon: Truck, description: 'Real-time tracking' },
        { name: 'Returns & Refunds', icon: RefreshCw, description: '30-day return policy' },
        { name: 'Customer Support', icon: HeadphonesIcon, description: '24/7 assistance' }
    ];

    const paymentMethods = [
        { name: 'Credit/Debit Cards', supported: ['Visa', 'Mastercard', 'Amex'] },
        { name: 'Net Banking', supported: ['All major banks'] },
        { name: 'UPI', supported: ['GPay', 'PhonePe', 'Paytm'] },
        { name: 'COD', supported: ['Cash on Delivery'] }
    ];

    const socialLinks = [
        { name: 'Facebook', icon: Facebook, href: '#' },
        { name: 'Twitter', icon: Twitter, href: '#' },
        { name: 'Instagram', icon: Instagram, href: '#' },
        { name: 'YouTube', icon: Youtube, href: '#' }
    ];

    const companyLinks = [
        'About Us',
        'Careers',
        'Press',
        'Investor Relations',
        'Sustainability',
        'Terms & Conditions',
        'Privacy Policy'
    ];

    const helpLinks = [
        'Help Center',
        'Size Guide',
        'Shipping Info',
        'Returns',
        'FAQ',
        'Contact Us',
        'Track Order'
    ];

    const shoppingLinks = [
        'Men',
        'Women',
        'Kids',
        'Home & Living',
        'Electronics',
        'Accessories',
        'Sale',
        'Gift Cards'
    ];

    return (
        <footer className="bg-gray-900 text-white">
            {/* Top Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
                        <p className="text-purple-100 mb-6">Get exclusive offers, new product alerts, and style tips</p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                            />
                            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <span className="text-xl font-bold">SAMZONE</span>
                            </div>
                            <p className="text-gray-300 mb-4">
                                Your AI-powered shopping destination with 1000+ products, personalized recommendations, and virtual try-on experiences.
                            </p>
                            <div className="flex gap-3">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                                        aria-label={social.name}
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Shopping Categories */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Shop by Category</h3>
                            <ul className="space-y-2">
                                {shoppingLinks.map((link) => (
                                    <li key={link}>
                                        <Link
                                            to={`/shop?category=${link.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                                            className="text-gray-300 hover:text-purple-400 transition-colors"
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Customer Service */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
                            <ul className="space-y-2">
                                {helpLinks.map((link) => (
                                    <li key={link}>
                                        <Link
                                            to={`/${link.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                                            className="text-gray-300 hover:text-purple-400 transition-colors"
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                {companyLinks.map((link) => (
                                    <li key={link}>
                                        <Link
                                            to={`/${link.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                                            className="text-gray-300 hover:text-purple-400 transition-colors"
                                        >
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Customer Services Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-gray-800">
                        {customerServices.map((service) => (
                            <div key={service.name} className="text-center">
                                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <service.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-semibold mb-1">{service.name}</h4>
                                <p className="text-sm text-gray-400">{service.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payment Methods */}
                    <div className="mt-12 pt-8 border-t border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 text-center">We Accept</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {paymentMethods.map((method) => (
                                <div key={method.name} className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="w-5 h-5 text-purple-400" />
                                        <span className="font-medium">{method.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {method.supported.slice(0, 2).join(', ')}
                                        {method.supported.length > 2 && ' + more'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 pt-8 border-t border-gray-800">
                        <div className="flex flex-wrap justify-center gap-8">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                <span className="text-sm">Secure Shopping</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-purple-400" />
                                <span className="text-sm">Fast Delivery</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-purple-400" />
                                <span className="text-sm">Easy Returns</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-purple-400" />
                                <span className="text-sm">Premium Quality</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bg-gray-950 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400">
                                © {currentYear} SAMZONE. All rights reserved.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <Link to="/terms" className="text-gray-400 hover:text-purple-400 transition-colors">
                                Terms & Conditions
                            </Link>
                            <Link to="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/cookies" className="text-gray-400 hover:text-purple-400 transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PremiumFooter;
