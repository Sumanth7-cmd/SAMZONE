import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PremiumNavbar from './components/PremiumNavbar';
import CleanProductGrid from './components/CleanProductGrid';
import PremiumFooter from './components/PremiumFooter';
import HumanlikeAIChatbot from './components/HumanlikeAIChatbot';
import WorkingImageUpload from './components/WorkingImageUpload';
import FixedWebcamTryOn from './components/FixedWebcamTryOn';
import SimpleTryOnInteraction from './components/SimpleTryOnInteraction';
import SkinToneAnalysis from './components/SkinToneAnalysis';
import ComprehensiveErrorBoundary from './components/ComprehensiveErrorBoundary';
import SimpleLogin from './components/SimpleLogin';
import CompareFloatingButton from './components/CompareFloatingButton';
import { CompareProvider } from './context/CompareContext';
import { Loader, Brain, ShoppingBag, Camera, Shirt } from 'lucide-react';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Compare = lazy(() => import('./pages/Compare'));

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

                                    {/* Working Image Upload */}
                                    <Route path="/upload" element={<WorkingImageUpload />} />

                                    {/* Skin Tone Analysis */}
                                    <Route path="/skin-tone" element={<SkinToneAnalysis />} />

                                    {/* Login/Register */}
                                    <Route path="/login" element={<SimpleLogin />} />

                                    {/* Product Details */}
                                    <Route path="/product/:id" element={<ProductDetails />} />

                                    {/* Enhanced Try-On Studio */}
                                    <Route path="/try-on" element={<FixedWebcamTryOn />} />

                                    {/* Simple Try-On Interaction */}
                                    <Route path="/try-on-interaction" element={<SimpleTryOnInteraction />} />

                                    {/* Cart */}
                                    <Route path="/cart" element={<Cart />} />

                                    {/* Wishlist */}
                                    <Route path="/wishlist" element={<Wishlist />} />

                                    {/* Compare */}
                                    <Route path="/compare" element={<Compare />} />

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
                    <HumanlikeAIChatbot />

                    {/* Floating "Compare (N)" button */}
                    <CompareFloatingButton />
                </div>
            </Router>
            </CompareProvider>
        </ComprehensiveErrorBoundary>
    );
};

export default App;
