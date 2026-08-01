import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';

export interface CategoryTile {
  id: string;
  name: string;
  categoryParam: string;
  itemCount: string;
  imageUrl: string;
  subtitle: string;
  accentGradient: string;
}

export const MAIN_CATEGORIES: CategoryTile[] = [
  {
    id: 'men',
    name: "Men's Fashion",
    categoryParam: 'men',
    itemCount: '170+ Items',
    imageUrl: 'http://img5a.flixcart.com/image/jean/w/q/s/rac-combo4set-2-reckler-34-original-imaecjywvrjtqsuy.jpeg',
    subtitle: 'Shirts, Jeans, Suits & Ethnic Wear',
    accentGradient: 'from-blue-600/80 via-indigo-900/80 to-slate-900/90',
  },
  {
    id: 'women',
    name: "Women's Fashion",
    categoryParam: 'women',
    itemCount: '11,800+ Items',
    imageUrl: 'http://img6a.flixcart.com/image/dress/v/6/2/1-1-hd034-harpa-s-original-imaegch2bvyyr7v8.jpeg',
    subtitle: 'Dresses, Kurtas, Tops & Western Wear',
    accentGradient: 'from-pink-600/80 via-rose-900/80 to-purple-950/90',
  },
  {
    id: 'jewellery',
    name: 'Jewellery & Accessories',
    categoryParam: 'jewellery',
    itemCount: '3,100+ Items',
    imageUrl: 'http://img6a.flixcart.com/image/bangle-bracelet-armlet/6/6/9/1109986-free-size-bgs-1-1100x1100-imae66spvychx95q.jpeg',
    subtitle: 'Bracelets, Necklaces, Rings & Kadas',
    accentGradient: 'from-amber-600/80 via-yellow-900/80 to-stone-900/90',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    categoryParam: 'footwear',
    itemCount: '340+ Items',
    imageUrl: 'http://img6a.flixcart.com/image/shoe/h/z/7/black-franco-3051-franco-40-1100x1100-imaeg35e2z4373yf.jpeg',
    subtitle: 'Heels, Loafers, Boots & Casual Shoes',
    accentGradient: 'from-emerald-600/80 via-teal-900/80 to-slate-950/90',
  },
  {
    id: 'home',
    name: 'Home & Living',
    categoryParam: 'home',
    itemCount: '1,400+ Items',
    imageUrl: 'http://img6a.flixcart.com/image/showpiece-figurine/c/z/g/xu42-exotic-india-original-imae3d2qjdtyxz5h.jpeg',
    subtitle: 'Decor, Showpieces, Curtains & Blankets',
    accentGradient: 'from-purple-600/80 via-fuchsia-900/80 to-slate-900/90',
  },
  {
    id: 'electronics',
    name: 'Electronics & Accessories',
    categoryParam: 'electronics',
    itemCount: '50+ Items',
    imageUrl: 'http://img5a.flixcart.com/image/cases-covers/book-cover/y/k/j/rock-rock665-original-imae3n4xghthrghs.jpeg',
    subtitle: 'Mounts, Mobile Holders & Gear',
    accentGradient: 'from-cyan-600/80 via-blue-900/80 to-slate-950/90',
  },
];

const CategoryGrid: React.FC = () => {
  const navigate = useNavigate();

  const handleTileClick = (param: string) => {
    navigate(`/shop?category=${encodeURIComponent(param)}`);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Explore Collections
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="mt-2 text-base text-gray-600 max-w-xl">
              Browse top fashion, jewellery, footwear, and lifestyle collections backed by real catalog items.
            </p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors group"
          >
            Explore All Categories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {MAIN_CATEGORIES.map((tile) => (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile.categoryParam)}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gray-900 border border-gray-800 flex flex-col justify-end"
            >
              {/* Background Product Image */}
              <img
                src={tile.imageUrl}
                alt={tile.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-80"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600';
                  e.currentTarget.onerror = null;
                }}
              />

              {/* Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${tile.accentGradient} opacity-75 group-hover:opacity-85 transition-opacity duration-300`}
              />

              {/* Top Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white border border-white/20">
                  <ShoppingBag className="w-3 h-3 text-indigo-300" />
                  {tile.itemCount}
                </span>
              </div>

              {/* Content Box */}
              <div className="relative z-10 p-6 flex flex-col">
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors drop-shadow-sm">
                  {tile.name}
                </h3>
                <p className="text-xs text-gray-200 mt-1 line-clamp-1 opacity-90 font-medium">
                  {tile.subtitle}
                </p>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:underline flex items-center gap-1">
                    Explore Collection
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-indigo-900 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
