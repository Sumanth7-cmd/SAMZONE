import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PremiumNavbar from './components/PremiumNavbar';
import PremiumFooter from './components/PremiumFooter';
import ComprehensiveErrorBoundary from './components/ComprehensiveErrorBoundary';
import CompareFloatingButton from './components/CompareFloatingButton';
import { CompareProvider } from './context/CompareContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader } from 'lucide-react';

// Lazy load pages for optimal performance
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Compare = lazy(() => import('./pages/Compare'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const VisualSearch = lazy(() => import('./pages/VisualSearch'));
const Stylist = lazy(() => import('./pages/Stylist'));
const StyleDna = lazy(() => import('./pages/StyleDna'));
const CleanProductGrid = lazy(() => import('./components/CleanProductGrid'));
const FixedWebcamTryOn = lazy(() => import('./components/FixedWebcamTryOn'));
const SkinToneAnalysis = lazy(() => import('./components/SkinToneAnalysis'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const HumanlikeAIChatbot = lazy(() => import('./components/HumanlikeAIChatbot'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-semibold text-sm">Loading SAMZONE AI Commerce...</p>
        </div>
    </div>
);

function App() {
    return (
        <ComprehensiveErrorBoundary>
            <AuthProvider>
                <CompareProvider>
                    <Router>
                        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                            <PremiumNavbar />

                            <main className="flex-grow">
                                <ErrorBoundary>
                                    <Suspense fallback={<PageLoader />}>
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/" element={<Home />} />
                                            <Route path="/shop" element={<CleanProductGrid />} />
                                            <Route path="/skin-tone" element={<SkinToneAnalysis />} />
                                            <Route path="/product/:id" element={<ProductDetails />} />
                                            <Route path="/try-on" element={<FixedWebcamTryOn />} />
                                            <Route path="/visual-search" element={<VisualSearch />} />
                                            <Route path="/stylist" element={<Stylist />} />
                                            <Route path="/style-dna" element={<StyleDna />} />

                                            {/* Authentication Routes */}
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/signup" element={<Signup />} />
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/reset-password" element={<ResetPassword />} />

                                            {/* Protected Customer Routes */}
                                            <Route
                                                path="/cart"
                                                element={
                                                    <ProtectedRoute>
                                                        <Cart />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/wishlist"
                                                element={
                                                    <ProtectedRoute>
                                                        <Wishlist />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/compare"
                                                element={
                                                    <ProtectedRoute>
                                                        <Compare />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/profile"
                                                element={
                                                    <ProtectedRoute>
                                                        <Profile />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin"
                                                element={
                                                    <ProtectedRoute>
                                                        <Admin />
                                                    </ProtectedRoute>
                                                }
                                            />
                                        </Routes>
                                    </Suspense>
                                </ErrorBoundary>
                            </main>

                            <PremiumFooter />

                            <Suspense fallback={null}>
                                <HumanlikeAIChatbot />
                            </Suspense>

                            <CompareFloatingButton />
                        </div>
                    </Router>
                </CompareProvider>
            </AuthProvider>
        </ComprehensiveErrorBoundary>
    );
}

export default App;
