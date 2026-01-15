# WellBank - AI-Powered Customer Relationship Management System

<div align="center">

![WellBank CRM](https://img.shields.io/badge/WellBank-CRM-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![React](https://img.shields.io/badge/React-19.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.125-green)
![License](https://img.shields.io/badge/License-Proprietary-red)

**Production-grade banking platform with AI-powered customer insights and recommendations**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Docs](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Executive Summary](#executive-summary)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Data Format](#-data-format)
- [Key Components](#-key-components)
- [Security & Reliability](#-security--reliability)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## Executive Summary

WellBank CRM is a production-grade banking platform that transforms customer data into actionable insights through a **Fail-Safe Intelligence Pipeline**. The system ensures 100% uptime by implementing graceful degradation patterns that allow advisors to work seamlessly even when AI services are unavailable.

### Core Innovation: The 4-Step Intelligence Pipeline

1. **Context Extraction**: Identifies customer clusters (Silver Savers, Digital Nomads, Business Prime, etc.) from behavioral patterns
2. **Propensity Scoring**: Ranks 22+ banking services by match percentage and revenue potential
3. **Graceful Enrichment**: Attempts to fetch AI-driven product fit analysis and strategic recommendations
4. **Fallback Normalization**: Automatically generates synthetic profiles based on cluster averages when AI analysis is unavailable (404 errors), ensuring advisors never see blank screens

### Business Value

- **100% Uptime**: Dashboard never crashes, even if AI services are down
- **Data Integrity**: Clean ID extraction prevents broken links from malformed database records
- **Scalability**: Modular architecture allows easy extension by other developers
- **Security**: Production-level console hygiene prevents sensitive data leakage
- **AI-Powered**: Intelligent recommendations with graceful fallback mechanisms

---

## 🎯 Features

### Core Capabilities

- **Customer Segmentation**: Advanced clustering algorithms identify 6 distinct customer personas
- **Product Recommendations**: AI-powered engine suggests banking products with match scores and revenue projections
- **Batch Processing**: Process thousands of customer records simultaneously with real-time progress tracking
- **Strategic Advisor Assistant**: Interactive tool generates personalized customer pitches with tone customization
- **Data Management**: Upload and manage customer datasets (demographics, transactions, product holdings)
- **Real-time Analytics**: View cluster distributions, recommendation statistics, and revenue projections
- **Service Suggestions**: Filter and manage recommendations by status, cluster, or customer

### Technical Highlights

- **Backend**: FastAPI with SQLite database, production-ready error handling
- **Frontend**: React 19 with Vite, modern glassmorphism UI design
- **AI Integration**: Anthropic Claude API for intelligent message generation with fallback templates
- **Machine Learning**: Scikit-learn for customer clustering and recommendation scoring
- **Database**: SQLite with migrations support
- **API**: RESTful API with automatic OpenAPI documentation

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.125.0
- **Language**: Python 3.8+
- **Database**: SQLite (with migration support)
- **ML/AI**: 
  - scikit-learn 1.3.0 (clustering)
  - pandas 2.0.3 (data processing)
  - numpy 1.24.3 (numerical operations)
  - anthropic >= 0.34.0 (AI integration)
- **Server**: Uvicorn (ASGI server)

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **UI Components**: 
  - lucide-react (icons)
  - react-icons (additional icons)
- **Styling**: CSS with modern glassmorphism design

### Development Tools
- **Linting**: ESLint 9.39.1
- **Type Checking**: TypeScript types for React
- **Version Control**: Git with comprehensive .gitignore

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **Anthropic API key** (optional, for AI features - system works without it using fallbacks)

---

## 🚀 Quick Start

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create a `.env` file in the `backend` directory:**
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   ENVIRONMENT=development
   ```

6. **Initialize the database:**
   ```bash
   python init_db.py
   ```

7. **Start the server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Verify Installation

1. **Check backend health:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Access API documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

3. **Open the application:**
   - Navigate to `http://localhost:5173` in your browser

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md).

---

## 📁 Project Structure

```
Project/
├── backend/                    # Python FastAPI backend
│   ├── app/                    # Application code
│   │   ├── api/                # API endpoints
│   │   │   └── v1/            # API version 1
│   │   │       ├── batch.py   # Batch processing endpoints
│   │   │       ├── clients.py # Client management
│   │   │       ├── clusters.py # Clustering endpoints
│   │   │       ├── datasets.py # Dataset upload/management
│   │   │       ├── offers.py  # Recommendations/offers
│   │   │       └── debug.py   # Debug endpoints (dev only)
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py      # Application settings
│   │   │   └── service_catalog.py # Service definitions
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   │   ├── ai_profile_agent.py
│   │   │   ├── product_recommendation_engine.py
│   │   │   └── service_summary.py
│   │   ├── db.py              # Database connection
│   │   └── main.py            # FastAPI application
│   ├── migrations/            # Database migrations
│   │   └── add_summary_calculated.sql
│   ├── models/                # ML model files (.pkl)
│   ├── scripts/               # Utility scripts (dev only, gitignored)
│   ├── uploads/               # Uploaded datasets (gitignored)
│   ├── customer_clustering.py # Clustering implementation
│   ├── implement_best_clustering_categories.py
│   ├── init_db.py             # Database initialization
│   ├── main.py                # Entry point wrapper
│   ├── recommender.py         # Recommendation engine
│   ├── requirements.txt       # Python dependencies
│   └── schema_sqlite.sql      # Database schema
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # React components
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── BatchProcessingPage.jsx
│   │   │   ├── ClusterResultsPage.jsx
│   │   │   ├── ServiceSuggestionsPage.jsx
│   │   │   └── ...
│   │   ├── services/          # Frontend services
│   │   ├── App.jsx            # Main application
│   │   └── main.jsx           # Entry point
│   ├── public/                # Public files
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
├── docs/                      # Documentation
│   ├── SETUP.md               # Detailed setup guide
│   ├── REPOSITORY_PREPARATION.md
│   └── PROJECT_IMPROVEMENTS.md
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Anthropic API Key (optional - system works without it)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Environment (development or production)
ENVIRONMENT=development
```

**Note**: The system will function without the API key using fallback data structures, ensuring continuous operation.

### Database

The application uses SQLite by default. The database file (`wellbank.db`) is created automatically on first run.

**To reset the database:**
```bash
cd backend
python init_db.py
```

**To apply migrations:**
```bash
# Migrations are in backend/migrations/
# Run SQL files manually or integrate with your migration system
```

---

## 📊 Data Format

The system expects three main datasets:

1. **Anagrafiche** (Customer Demographics)
   - Customer personal and professional information
   - Required fields: `customer_id`, `first_name`, `last_name`, `birth_date`, etc.

2. **Possesso Prodotti** (Product Holdings)
   - Current banking products per customer
   - Required fields: `customer_id`, `product_code`, `product_name`, `balance`, etc.

3. **Movimenti** (Transactions)
   - Customer transaction history
   - Required fields: `customer_id`, `tx_date`, `amount`, `currency`, etc.

**Upload datasets** through the web interface or API endpoints. See API documentation for detailed schema requirements.

---

## 🎨 Key Components

### Employee Dashboard
- Customer search and filtering
- Deep dive into individual customer profiles
- Strategic Advisor Assistant for generating personalized pitches
- Product recommendation visualization with cluster-based fallbacks
- Real-time metrics and analytics

### Batch Processing
- Upload and process customer datasets
- Track processing progress in real-time
- View batch results and statistics
- Cluster analysis and distribution

### Service Suggestions
- View all customer recommendations
- Filter by cluster, status, or search terms
- Bulk actions and management tools
- Edit and customize recommendations
- Send recommendations to customers

### Cluster Results
- Visualize customer clusters
- View cluster statistics and distributions
- Compare batch runs
- Analyze cluster stability

---

## 🔒 Security & Reliability

### Fail-Safe Design

- **Graceful Degradation**: All API calls have structured fallback objects
- **Error Boundaries**: React components are wrapped to prevent cascading failures
- **Data Validation**: Clean ID extraction prevents URL encoding issues
- **Console Hygiene**: Production-level logging prevents sensitive data exposure
- **CORS Configuration**: Properly configured for production use

### Security Notes

- ⚠️ **Never commit API keys or `.env` files** to version control
- ⚠️ The debug endpoint is only enabled in development mode
- ⚠️ All sensitive data should be handled according to banking regulations
- ⚠️ Use HTTPS in production environments
- ⚠️ Implement authentication/authorization for production use

### Production Considerations

For production deployment, consider:
- Database migration to PostgreSQL or MySQL
- Authentication and authorization (OAuth2, JWT)
- Rate limiting
- API key management
- Monitoring and logging services
- HTTPS/TLS encryption
- Data backup and recovery

---

## 🛠️ Development

### Running Tests

Utility scripts are available in `backend/scripts/` for development and debugging:

- `check_batch_results.py`: Verify batch processing results
- `check_schema.py`: Validate database schema
- `test_api_key.py`: Test Anthropic API configuration
- `verify_setup.py`: Verify installation and configuration

**Note**: The `scripts/` directory is gitignored and not included in the repository.

### Code Style

- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: ESLint configuration included
- **Comments**: Focus on "why" rather than "what" for maintainability
- **Type Hints**: Use type hints in Python code where applicable

### Development Workflow

1. **Backend Development:**
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python -m uvicorn app.main:app --reload
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database Changes:**
   - Create migration SQL files in `backend/migrations/`
   - Update schema documentation

---

## 📝 API Documentation

Once the backend server is running, interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
  - Interactive API explorer
  - Test endpoints directly from the browser
  - View request/response schemas

- **ReDoc**: `http://localhost:8000/redoc`
  - Clean, readable API documentation
  - Searchable endpoint reference

### Main API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/v1/clients` - List clients
- `POST /api/v1/datasets/upload` - Upload datasets
- `POST /api/v1/batch/run` - Run batch processing
- `GET /api/v1/clusters/runs` - List batch runs
- `GET /api/v1/offers/recommendations` - Get recommendations
- `GET /api/v1/clusters/{run_id}/summary` - Get cluster summary

See the interactive documentation for complete API reference.

---

## 🆘 Troubleshooting

### Common Issues

#### Backend Issues

**Backend won't start:**
- Ensure virtual environment is activated
- Check that port 8000 is not in use
- Verify database file exists or run `init_db.py`
- Check Python version: `python --version` (should be 3.8+)

**Import errors:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Check that all required packages are installed

**Database errors:**
- Delete `wellbank.db` and run `init_db.py` again
- Check database migrations in `backend/migrations/`
- Verify database file permissions

#### Frontend Issues

**Frontend connection errors:**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify API base URL in `frontend/src/api/config.js`

**Build errors:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Check Node.js version: `node --version` (should be 18+)

**Port already in use:**
- Vite will automatically use the next available port
- Check console for the actual port number
- Or specify a different port: `npm run dev -- --port 3000`

#### AI Features

**AI features not working:**
- System will use fallback data automatically
- Verify `ANTHROPIC_API_KEY` is set in `.env` for full AI functionality
- Test API key with `python backend/scripts/test_api_key.py`
- Check API key format and permissions

**404 errors in console:**
- This is expected behavior - the system automatically uses fallback data
- The dashboard will continue to function normally
- These errors indicate AI service fallback is working correctly

### Getting Help

1. Check the [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions
2. Review API documentation at `http://localhost:8000/docs`
3. Check error logs in the browser console (F12) and backend terminal
4. Verify all prerequisites are installed correctly

---

## 🤝 Contributing

This is a proprietary project for WellBank. For internal contributions:

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Test your changes thoroughly
4. Update documentation as needed
5. Submit a pull request for review

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write clear commit messages
- Update documentation for new features
- Test all changes before submitting

---

## 📄 License

This project is proprietary software developed for WellBank. All rights reserved.

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- AI capabilities powered by [Anthropic Claude](https://www.anthropic.com/)
- Machine learning with [scikit-learn](https://scikit-learn.org/)

---

<div align="center">

**Built with ❤️ for WellBank**

[Back to Top](#wellbank---ai-powered-customer-relationship-management-system)

</div>
