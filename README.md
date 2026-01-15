# WellBank CRM System

A banking customer relationship management platform that uses AI to analyze customer data and provide product recommendations. Built with FastAPI (Python) and React.

## What This Does

This system helps bank advisors understand their customers better by:
- Grouping customers into clusters based on their behavior and spending patterns
- Recommending banking products that match each customer's profile
- Generating personalized messages for customer outreach
- Processing large batches of customer data efficiently

The system is designed to keep working even if the AI service is down - it falls back to rule-based recommendations so advisors can always do their job.

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLite database
- scikit-learn for customer clustering
- Anthropic Claude API for AI features (optional)

**Frontend:**
- React 19
- Vite for building
- Modern UI with glassmorphism design

## Getting Started

### Prerequisites

You'll need:
- Python 3.8 or higher
- Node.js 18 or higher
- An Anthropic API key (optional - the system works without it, just with less AI features)

### Backend Setup

1. Go to the backend folder:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install the dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the `backend` folder:
```env
ANTHROPIC_API_KEY=your_key_here
ENVIRONMENT=development
```

6. Set up the database:
```bash
python init_db.py
```

7. Start the server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be running at `http://localhost:8000`

### Frontend Setup

1. Go to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the dev server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Project Structure

```
backend/
  app/              # Main application code
    api/v1/        # API endpoints
    core/          # Configuration
    services/      # Business logic (AI agents, recommendations)
  migrations/      # Database migrations
  models/          # ML model files
  scripts/         # Utility scripts (not in git)

frontend/
  src/
    api/           # API client functions
    components/    # React components
```

## How It Works

1. **Data Upload**: Upload customer data (demographics, transactions, product holdings) through the web interface
2. **Clustering**: The system groups customers into 6 different personas (like "Silver Savers", "Digital Nomads", etc.)
3. **Recommendations**: For each customer, it suggests banking products with a match score and expected revenue
4. **AI Enhancement**: If the AI service is available, it generates personalized explanations. If not, it uses fallback templates
5. **Advisor Tools**: Advisors can review, edit, and send recommendations to customers

## Configuration

The main config is in `backend/app/core/config.py`. You can set:
- Database path
- Upload directory
- API keys

Environment variables go in `backend/.env` (this file is gitignored, so your keys stay safe).

## Data Format

The system expects three CSV files:

1. **Anagrafiche** (Customer info): customer_id, first_name, last_name, birth_date, profession, etc.
2. **Possesso Prodotti** (Product holdings): customer_id, product_code, product_name, balance, etc.
3. **Movimenti** (Transactions): customer_id, tx_date, amount, currency, merchant, etc.

You can upload these through the web interface. The system is flexible with column names - it tries to map common variations automatically.

## API Documentation

Once the backend is running, you can see the API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Main endpoints:
- `GET /health` - Check if server is running
- `POST /api/v1/datasets/upload` - Upload customer data
- `POST /api/v1/batch/run` - Run clustering and recommendations
- `GET /api/v1/clusters/runs` - See batch processing results
- `GET /api/v1/offers/recommendations` - Get product recommendations

## Troubleshooting

**Backend won't start:**
- Make sure your virtual environment is activated
- Check if port 8000 is already in use
- Try running `python init_db.py` again if you see database errors

**Frontend can't connect:**
- Make sure the backend is running on port 8000
- Check the browser console for CORS errors

**AI features not working:**
- The system will use fallback data automatically, so it still works
- To enable AI features, make sure `ANTHROPIC_API_KEY` is set in your `.env` file
- You can test the API key with: `python backend/scripts/test_api_key.py`

**404 errors in console:**
- This is normal - the system tries AI first, then falls back automatically
- The dashboard will work fine even with these errors

## Development

The code follows standard practices:
- Python: PEP 8 style guide
- JavaScript: ESLint configured
- Error handling: Try-catch blocks with proper fallbacks

There are some utility scripts in `backend/scripts/` for development, but they're not included in the repository.

## Security Notes

- Never commit `.env` files or API keys
- The debug endpoint only works in development mode
- In production, you'd want to add authentication, use HTTPS, and maybe switch to PostgreSQL instead of SQLite

## License

This is proprietary software for WellBank.

---

Built for WellBank
