import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PremiumNavbar from './components/PremiumNavbar';
import PremiumFooter from './components/PremiumFooter';
import ComprehensiveErrorBoundary from './components/ComprehensiveErrorBoundary';
import CompareFloatingButton from './components/CompareFloatingButton';
import { CompareProvider } from './context/CompareContext';
import { Loader, Brain, ShoppingBag, Camera, Shirt } from 'lucide-react';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Compare = lazy(() => import('./pages/Compare'));
const Admin = lazy(() => import('./pages/Admin'));
const VisualSearch = lazy(() => import('./pages/VisualSearch'));
const Stylist = lazy(() => import('./pages/Stylist'));
const StyleDna = lazy(() => import('./pages/StyleDna'));
const CleanProductGrid = lazy(() => import('./components/CleanProductGrid'));
const FixedWebcamTryOn = lazy(() => import('./components/FixedWebcamTryOn'));
const SkinToneAnalysis = lazy(() => import('./components/SkinToneAnalysis'));
const SimpleLogin = lazy(() => import('./components/SimpleLogin'));
// The assistant is present on every page, but its implementation and catalog
// helpers do not need to block first paint. It is fetched immediately after
// the application shell commits and retains the same always-available UI.
const HumanlikeAIChatbot = lazy(() => import('./components/HumanlikeAIChatbot'));

// Loading component for lazy loaded routes
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading amazing products...</p>
        </div>
    </div>
);

function App() {
    return (
        <ComprehensiveErrorBoundary>
            <CompareProvider>
            <Router>
                <div className="flex flex-col min-h-screen">
                    {/* Premium Navigation */}
                    <PremiumNavbar />

                    <main className="flex-grow">
                        <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    {/* Home */}
                                    <Route path="/" element={<Home />} />

                                    {/* Shop with Clean Product Grid */}
                                    <Route path="/shop" element={<CleanProductGrid />} />

                                    {/* Skin Tone Analysis */}
                                    <Route path="/skin-tone" element={<SkinToneAnalysis />} />

                                    {/* Login/Register */}
                                    <Route path="/login" element={<SimpleLogin />} />

                                    {/* Product Details */}
                                    <Route path="/product/:id" element={<ProductDetails />} />

                                    {/* Enhanced Try-On Studio */}
                                    <Route path="/try-on" element={<FixedWebcamTryOn />} />

                                    {/* Visual Search */}
                                    <Route path="/visual-search" element={<VisualSearch />} />

                                    {/* AI Outfit Stylist */}
                                    <Route path="/stylist" element={<Stylist />} />

                                    {/* AI Style DNA */}
                                    <Route path="/style-dna" element={<StyleDna />} />

                                    {/* Cart */}
                                    <Route path="/cart" element={<Cart />} />

                                    {/* Wishlist */}
                                    <Route path="/wishlist" element={<Wishlist />} />

                                    {/* Compare */}
                                    <Route path="/compare" element={<Compare />} />

                                    {/* Admin Dashboard */}
                                    <Route path="/admin" element={<Admin />} />

                                    {/* Future routes */}
                                    <Route path="/profile" element={
                                        <div className="min-h-screen flex items-center justify-center bg-gray-50">
                                            <div className="text-center">
                                                <Shirt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
                                                <p className="text-gray-600 mb-4">Your personal style hub - coming soon!</p>
                                                <div className="flex gap-4 justify-center">
                                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                                        <h3 className="font-semibold text-gray-900 mb-2">What's coming:</h3>
                                                        <ul className="text-left text-gray-700 space-y-2">
                                                            <li className="flex items-center gap-2">
                                                                <Brain className="w-4 h-4 text-purple-600" />
                                                                <span>Personalized AI recommendations</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <ShoppingBag className="w-4 h-4 text-purple-600" />
                                                                <span>Style preferences saved</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <Camera className="w-4 h-4 text-purple-600" />
                                                                <span>Virtual try-on history</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    } />
                                </Routes>
                            </Suspense>
                        </ErrorBoundary>
                    </main>
                    
                    {/* Premium Footer */}
                    <PremiumFooter />

                    {/* Humanlike SAM AI Assistant - Always Available */}
                    <Suspense fallback={null}>
                        <HumanlikeAIChatbot />
                    </Suspense>

                    {/* Floating "Compare (N)" button */}
                    <CompareFloatingButton />
                </div>
            </Router>
            </CompareProvider>
        </ComprehensiveErrorBoundary>
    );
};

export default App;
