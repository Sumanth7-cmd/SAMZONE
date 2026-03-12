
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmartAssistantNew from './components/SmartAssistantNew';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader } from 'lucide-react';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const TryOn = lazy(() => import('./pages/TryOn'));
const Chat = lazy(() => import('./pages/Chat'));

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/try-on" element={<TryOn />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/profile" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Profile - Coming Soon!</h1></div>} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
          <SmartAssistantNew />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

