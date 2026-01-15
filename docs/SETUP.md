# Setup Guide

This document provides detailed setup instructions for the WellBank CRM system.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Anthropic API key (optional, for AI features)

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

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

## Frontend Setup

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

## Verification

1. Check backend health:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check API documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

3. Verify frontend is running:
   - Open `http://localhost:5173` in your browser

## Troubleshooting

### Backend Issues

- **Port already in use:**
  - Change port in uvicorn command: `--port 8001`
  - Or kill the process using port 8000

- **Database errors:**
  - Delete `wellbank.db` and run `init_db.py` again
  - Check database migrations in `backend/migrations/`

- **Import errors:**
  - Ensure virtual environment is activated
  - Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

- **Port already in use:**
  - Vite will automatically use the next available port
  - Check console for the actual port number

- **API connection errors:**
  - Ensure backend is running on port 8000
  - Check CORS settings in `backend/app/main.py`

- **Build errors:**
  - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Production Deployment

For production deployment, refer to the main README.md for additional configuration options.

