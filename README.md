# Smart Inventory & Warehouse Management System

An AI and Machine Learning Based Platform for Intelligent Inventory, Demand Prediction, and Warehouse Management

## 📋 Project Overview

This is a comprehensive inventory and warehouse management platform that leverages AI and Machine Learning to provide intelligent inventory control, demand forecasting, and automated restocking recommendations.

## 🎯 Problem Statement

Traditional inventory management systems lack:
- Predictive analytics for demand forecasting
- Intelligent restocking recommendations
- Real-time AI-powered insights
- Mobile-first warehouse operations
- Automated stock risk detection

## 🚀 Objectives

- Build an intelligent inventory management platform
- Implement ML-based demand prediction
- Provide AI-powered inventory insights using Gemini
- Enable mobile barcode/QR scanning for warehouse operations
- Automate restock recommendations
- Real-time inventory tracking across multiple warehouses

## ✨ Features

### Current (Phase 1 - Frontend Demo)
- ✅ Professional dashboard with key metrics
- ✅ Product management interface
- ✅ Multi-warehouse inventory tracking
- ✅ Stock movement history
- ✅ Supplier management
- ✅ Order tracking
- ✅ AI Assistant demo interface
- ✅ Demand prediction visualization
- ✅ Smart restock recommendations
- ✅ Mobile scanner workflow preview
- ✅ Responsive design

### Upcoming Features
- 🔄 Backend API (Node.js + Express)
- 🔄 PostgreSQL database integration
- 🔄 Python ML service for demand prediction
- 🔄 Gemini AI integration
- 🔄 React Native mobile application
- 🔄 Barcode/QR scanning
- 🔄 Real-time notifications
- 🔄 Advanced analytics

## 🛠️ Technology Stack

### Frontend (Current Phase)
- **React** - UI library
- **Vite** - Build tool
- **JavaScript** - Programming language
- **CSS** - Styling
- **React Router** - Navigation

### Backend (Upcoming)
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication

### ML Service (Upcoming)
- **Python** - Programming language
- **FastAPI** - API framework
- **scikit-learn** - ML library
- **pandas** - Data processing

### Mobile (Upcoming)
- **React Native** - Mobile framework
- **Expo** - Development platform

### AI Integration (Upcoming)
- **Google Gemini API** - AI assistant

## 🏗️ System Architecture

```mermaid
graph TB
    A[Web Application<br/>React] --> B[Backend API<br/>Node.js + Express]
    C[Mobile Application<br/>React Native] --> B
    B --> D[PostgreSQL<br/>Database]
    B --> E[ML Service<br/>Python + FastAPI]
    B --> F[Gemini API<br/>AI Assistant]
    E --> G[ML Models<br/>Demand Prediction]
```

### Architecture Principles

1. **Web & Mobile** communicate with Backend API only
2. **Backend API** handles all business logic
3. **Backend API** communicates with Database, ML Service, and Gemini
4. **ML Service** is isolated and serves predictions via API
5. **No direct database access** from frontend applications
6. **API-first design** for scalability

## 📁 Repository Structure

```
smart-inventory-warehouse-management/
│
├── frontend/              # React web application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   ├── data/         # Demo data (temporary)
│   │   ├── services/     # API service layer
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json      # Dependencies
│
├── backend/              # Node.js + Express API (upcoming)
│   └── README.md
│
├── mobile/               # React Native app (upcoming)
│   └── README.md
│
├── ml-service/           # Python ML service (upcoming)
│   └── README.md
│
├── database/             # Database schemas (upcoming)
│   └── README.md
│
├── docs/                 # Documentation
│   ├── architecture.md
│   └── development-guide.md
│
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-inventory-warehouse-management
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📱 Application Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with key metrics and insights |
| `/products` | Product listing and management |
| `/products/:id` | Product details with AI insights |
| `/inventory` | Inventory tracking across warehouses |
| `/warehouses` | Warehouse management |
| `/warehouses/:id` | Warehouse details |
| `/suppliers` | Supplier management |
| `/orders` | Purchase and sales orders |
| `/stock-movements` | Stock movement history |
| `/ai-assistant` | AI-powered chat assistant |
| `/predictions` | Demand prediction analytics |
| `/restock` | Smart restock recommendations |

## 🗺️ Development Roadmap

### Phase 1: Frontend Foundation ✅ (Current)
- Professional dashboard UI
- All core pages and components
- Demo data and mock functionality
- Responsive design

### Phase 2: Backend API (Next)
- Express REST API
- PostgreSQL database setup
- Authentication & authorization
- CRUD operations for all entities
- API documentation

### Phase 3: ML Service
- Demand prediction model
- Training pipeline
- FastAPI service
- Integration with backend

### Phase 4: AI Integration
- Gemini API integration
- Natural language queries
- Intelligent recommendations
- Contextual insights

### Phase 5: Mobile Application
- React Native setup
- Barcode/QR scanner
- Warehouse operations interface
- Offline support

### Phase 6: Advanced Features
- Real-time notifications
- Advanced analytics
- Report generation
- Multi-role access control

## 👥 Team Collaboration Guidelines

### Git Workflow

```mermaid
gitGraph
    commit id: "Initial setup"
    branch feature/frontend-dashboard
    checkout feature/frontend-dashboard
    commit id: "Add dashboard"
    checkout main
    merge feature/frontend-dashboard
    branch feature/backend-api
    checkout feature/backend-api
    commit id: "Setup Express"
    checkout main
    branch feature/ml-model
    checkout feature/ml-model
    commit id: "Add prediction model"
```

### Branch Strategy

- `main` - Production-ready code
- `feature/feature-name` - New features
- `bugfix/bug-name` - Bug fixes
- `hotfix/issue-name` - Urgent fixes

### Development Workflow

1. **Pull latest main**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

4. **Push branch**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to repository on GitHub/GitLab
   - Create PR from your branch to main
   - Request review from teammates

6. **Code Review & Merge**
   - Address review comments
   - Merge after approval

### Commit Message Guidelines

- Use clear, descriptive messages
- Start with verb (Add, Update, Fix, Remove)
- Examples:
  - ✅ "Add product detail page"
  - ✅ "Fix inventory filter bug"
  - ✅ "Update dashboard charts"
  - ❌ "changes"
  - ❌ "updated stuff"

## 🎨 Code Quality Standards

- **Component Structure**: Keep components small and focused
- **Naming**: Use descriptive variable and function names
- **Reusability**: Extract common UI patterns into components
- **Comments**: Add comments for complex logic only
- **Consistency**: Follow existing code patterns
- **Responsive**: Test on multiple screen sizes
- **No Secrets**: Never commit API keys or passwords

## 📚 Future ML Architecture

The ML service will use:

- **Historical sales data** for training
- **Time series forecasting** (ARIMA, Prophet)
- **Regression models** for demand prediction
- **Classification models** for risk detection
- **Feature engineering**: seasonality, trends, promotions

```
Data Collection → Feature Engineering → Model Training → 
API Deployment → Prediction → Feedback Loop
```

## 📱 Future Mobile Architecture

The mobile app will include:

- **Barcode/QR Scanner** using device camera
- **Offline-first** architecture with local storage
- **Stock Operations**: Stock in, stock out, transfer
- **Real-time Sync** with backend
- **Push Notifications** for low stock alerts
- **Role-based Access**: Different views for different roles

## 🤖 Future Gemini Integration

The AI assistant will:

- Answer natural language inventory queries
- Provide contextual recommendations
- Explain predictions and risks
- Suggest optimization strategies
- Generate reports and summaries

**Security**: Gemini API calls will be made from backend only, never from frontend.

## 📊 Current Demo Data

The frontend currently uses static demo data for:
- 50+ products across multiple categories
- 3 warehouses with rack organization
- Inventory across all locations
- Stock movement history
- Demand predictions
- Restock recommendations
- Order history

**Note**: All data is currently static. Backend integration will replace this with real database queries.

## 🔐 Environment Variables (Future)

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/inventory
JWT_SECRET=your-secret-key
PORT=3000

# ML Service
ML_API_URL=http://localhost:8000
PYTHON_ENV=production

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

## 🤝 Contributing

We welcome contributions! Please follow:
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Write/update tests (when applicable)
5. Submit pull request

## 👨‍💻 Contributors

- Bhagya Singh Rathore - Project Lead
- Bhagya Singh Rathore - Frontend Developer
- Anushka Pandey & Bhagya Singh Rathore - Backend Developer
- Bhawi Sharma & Bhawna Soni- ML Engineer

## 📄 License

This project is developed as a final-year college project.

## 📞 Contact

For questions or suggestions, please open an issue or contact the project team.

---

**Status**: Phase 1 (Frontend Demo) - Completed ✅

**Next Steps**: Backend API development with Node.js + Express + PostgreSQL
