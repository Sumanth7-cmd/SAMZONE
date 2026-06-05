# 🛍️ SAMZONE - AI-Powered E-Commerce Platform

## 🚀 Live Demo
👉 **https://samzone.vercel.app** *(Deploying soon...)*

## 🎯 Project Overview

SAMZONE is a cutting-edge AI-powered e-commerce platform that combines the best features of Amazon, Myntra, and ChatGPT. Built with React, TypeScript, and advanced AI capabilities, it delivers a revolutionary shopping experience with virtual try-on, intelligent recommendations, and humanlike AI assistance.

### 🎯 Core Features
- **Virtual Try-On Studio**: Real-time pose tracking with TensorFlow MoveNet
- **AI Shopping Assistant (S.A.M.)**: OpenAI-powered conversational shopping helper
- **Smart Product Catalog**: 800+ products with advanced filtering
- **Skin Tone Analysis**: Personalized color recommendations
- **Body Size Estimation**: Dynamic size recommendations
- **Outfit Scoring**: AI-powered compatibility scoring (0-10)
- **Amazon-Level UI**: Professional e-commerce interface

### 🛍️ Shopping Features
- Product search with filters (category, price, rating, color)
- Wishlist functionality with heart icons
- Shopping cart with localStorage persistence
- Product recommendations based on AI analysis
- Outfit coordination suggestions

### 🤖 AI Features
- **S.A.M. Assistant**: GPT-3.5 powered shopping chatbot
- **Pose Detection**: Real-time body tracking for virtual try-on
- **Skin Analysis**: RGB-based skin tone classification
- **Smart Recommendations**: Personalized product suggestions

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SmartAssistant.tsx    # AI Chat Interface
│   │   ├── ProductCard.tsx       # Product display cards
│   │   ├── Navbar.tsx           # Navigation
│   │   └── Footer.tsx           # Footer
│   ├── pages/              # Main application pages
│   │   ├── Home.tsx             # Homepage with hero banners
│   │   ├── Shop.tsx             # Product catalog with filters
│   │   ├── TryOn.tsx            # Virtual try-on studio
│   │   ├── ProductDetails.tsx    # Individual product pages
│   │   ├── Cart.tsx             # Shopping cart
│   │   └── Chat.tsx             # Chat interface
│   └── services/           # API and utility services
│       ├── api.ts              # Product API client
│       └── events.ts            # Event bus system
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Backend (Spring Boot + Java)
```
backend/
├── src/main/java/com/samzone/backend/
│   ├── controller/         # REST API endpoints
│   │   ├── ProductController.java    # Product CRUD operations
│   │   ├── ChatController.java       # OpenAI integration
│   │   └── TryOnController.java     # Try-on features
│   ├── entity/            # JPA entities
│   │   └── Product.java              # Product model
│   ├── repository/        # Data access layer
│   │   └── ProductRepository.java    # Product queries
│   ├── service/           # Business logic
│   │   └── ProductSeeder.java        # 800 product seeder
│   └── config/            # Configuration
├── src/main/resources/
└── pom.xml
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **Lucide React** - Icon library
- **TensorFlow.js** - ML/AI capabilities

### Backend
- **Spring Boot 3** - Java web framework
- **H2 Database** - In-memory database
- **JPA/Hibernate** - ORM layer
- **OpenAI API** - GPT-3.5 integration
- **Maven** - Build and dependency management

### AI/ML
- **TensorFlow MoveNet** - Pose detection
- **OpenAI GPT-3.5** - Conversational AI
- **Canvas API** - Real-time overlay rendering
- **MediaDevices API** - Camera access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.8+

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd SAMZONE
   ```

2. **Backend Setup**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Environment Variables
Create `.env` file in backend:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 Usage

### Virtual Try-On Flow
1. Select a product from the catalog
2. Click "Webcam" to activate camera
3. AI analyzes body size and skin tone
4. Product overlays on your body in real-time
5. Receive size and color recommendations

### AI Assistant Flow
1. Click the chat button to open S.A.M.
2. Type natural language queries:
   - "Show black oversized tshirts under ₹1000"
   - "What pants go with this hoodie?"
   - "Best headphones under ₹5000"
3. Get personalized recommendations and outfit suggestions

## 📊 Product Catalog

### Categories (800 Products)
- **Shirts**: 200 items
- **Pants**: 200 items  
- **Shoes**: 150 items
- **Accessories**: 100 items
- **Gadgets**: 150 items

### Product Fields
- ID, Name, Brand, Category
- Price, Discount, Rating
- Colors, Sizes, Images
- Description, Stock

## 🔧 Development

### Git Repository
Properly configured Git tracking:
- `.gitignore` excludes node_modules, build files, env files
- Repository tracks only SAMZONE project files
- Clean commit history with meaningful messages

### VS Code Configuration
Optimized workspace settings:
- File watcher excludes large directories
- Search excludes build artifacts
- Improved performance and reduced CPU usage

### Performance Optimizations
- Lazy loading for React components
- Efficient state management
- Optimized bundle sizes
- Smooth 60fps pose detection

## 🎨 UI/UX Features

### Amazon-Level Design
- Hero banners with gradient backgrounds
- Advanced filtering sidebar
- Product cards with ratings, wishlist, quick actions
- Responsive grid layouts
- Smooth animations and transitions

### Accessibility
- Semantic HTML5 structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## 🔮 AI Capabilities

### Pose Detection
- Real-time body keypoint detection
- Shoulder width estimation
- Dynamic clothing positioning
- Smooth 60fps rendering

### Skin Tone Analysis
- RGB pixel sampling from face region
- Classification: Light/Medium/Dark
- Personalized color recommendations
- Warmth detection and matching

### Conversational AI
- Natural language understanding
- Context-aware responses
- Product search integration
- Outfit coordination suggestions

## 📱 Responsive Design

### Mobile Optimized
- Touch-friendly interfaces
- Optimized camera access
- Swipeable product galleries
- Mobile-first navigation

### Desktop Features
- Hover states and micro-interactions
- Keyboard shortcuts
- Multi-window support
- Advanced filtering options

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend  
cd backend
./mvnw clean package
```

### Environment Configuration
- **Development**: Local H2 database
- **Production**: PostgreSQL/MySQL support
- **API Keys**: Environment variable management
- **CORS**: Proper cross-origin configuration

## 🤝 Contributing

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

### Testing
- Unit tests for components
- Integration tests for APIs
- E2E tests for user flows

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

---

**SAMZONE** - Where AI meets fashion shopping! 🛍️✨
