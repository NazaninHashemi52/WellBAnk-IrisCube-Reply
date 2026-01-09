# WellBank - AI-Powered Customer Relationship Management System

A comprehensive banking CRM platform that leverages machine learning and AI to provide intelligent customer segmentation, product recommendations, and personalized advisor tools.

## 🎯 Features

### Core Capabilities
- **Customer Segmentation**: Advanced clustering algorithms to identify customer groups (Silver Savers, Digital Nomads, Business Prime, etc.)
- **Product Recommendations**: AI-powered recommendation engine that suggests banking products based on customer profiles
- **Batch Processing**: Process thousands of customer records simultaneously with progress tracking
- **Strategic Advisor Assistant**: Interactive tool for advisors to generate personalized customer pitches
- **Data Management**: Upload and manage customer datasets (demographics, transactions, product holdings)

### Technical Highlights
- **Backend**: FastAPI with SQLite database
- **Frontend**: React with Vite, modern UI with glassmorphism design
- **AI Integration**: Anthropic Claude API for intelligent message generation
- **Machine Learning**: Scikit-learn for customer clustering and recommendation scoring

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- Anthropic API key (for AI features)

## 🚀 Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the `backend` directory:
```env
ANTHROPIC_API_KEY=your_api_key_here
ENVIRONMENT=development
```

6. Initialize the database:
```bash
python init_db.py
```

7. Start the server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
Project/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/             # Configuration and core utilities
│   │   ├── models/           # Database models
│   │   └── services/         # Business logic services
│   ├── scripts/              # Utility scripts (development)
│   ├── migrations/           # Database migrations
│   ├── models/               # ML model files
│   └── uploads/              # Uploaded datasets
├── frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # React components
│   │   └── assets/           # Static assets
│   └── public/               # Public files
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
ENVIRONMENT=development  # or production
```

### Database

The application uses SQLite by default. The database file (`wellbank.db`) is created automatically on first run.

To reset the database:
```bash
cd backend
python init_db.py
```

## 📊 Data Format

The system expects three main datasets:

1. **Anagrafiche** (Customer Demographics): Customer personal and professional information
2. **Possesso Prodotti** (Product Holdings): Current banking products per customer
3. **Movimenti** (Transactions): Customer transaction history

See the main `README.md` for detailed dataset schema documentation.

## 🎨 Key Components

### Employee Dashboard
- Customer search and filtering
- Deep dive into individual customer profiles
- Strategic Advisor Assistant for generating personalized pitches
- Product recommendation visualization

### Batch Processing
- Upload and process customer datasets
- Track processing progress
- View batch results and statistics

### Service Suggestions
- View all customer recommendations
- Filter by cluster, status, or search terms
- Bulk actions and management tools

## 🔒 Security Notes

- Never commit API keys or `.env` files to version control
- The debug endpoint is only enabled in development mode
- All sensitive data should be handled according to banking regulations

## 🛠️ Development

### Running Tests

Utility scripts are available in `backend/scripts/` for development and debugging:
- `check_batch_results.py`: Verify batch processing results
- `check_schema.py`: Validate database schema
- `test_api_key.py`: Test Anthropic API configuration

### Code Style

- Backend: Follow PEP 8 Python style guide
- Frontend: ESLint configuration included

## 📝 API Documentation

Once the backend server is running, API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code follows project standards
4. Submit a pull request

## 📄 License

This project is proprietary software developed for WellBank.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Ensure virtual environment is activated
- Check that port 8000 is not in use
- Verify database file exists or run `init_db.py`

**Frontend connection errors:**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`

**AI features not working:**
- Verify `ANTHROPIC_API_KEY` is set in `.env`
- Test API key with `python scripts/test_api_key.py`

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for WellBank**
