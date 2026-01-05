# How to Run the WellBank Application

## Prerequisites
- Node.js and npm installed
- Python 3.x installed
- Virtual environment activated (for backend)

## Step 1: Start the Backend Server

Open a terminal/command prompt and navigate to the backend directory:

```bash
cd backend
```

If you haven't activated your virtual environment yet:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

Then start the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Step 2: Start the Frontend Server

Open a **new** terminal/command prompt and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies (if not already installed):
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

## Step 3: View the Dashboard

1. Open your browser and go to: **http://localhost:5173**
2. The app will start in the Advisor area by default
3. To see the new Employee Dashboard, you need to switch to the employee area:
   - Look for a button/link to switch to "Employee Area" in the UI
   - OR modify `App.jsx` line 59 to change: `const [area, setArea] = useState("employee");`

## Quick Test

To quickly test the dashboard, you can temporarily change the default area in `frontend/src/App.jsx`:

Change line 59 from:
```javascript
const [area, setArea] = useState("advisor");
```

To:
```javascript
const [area, setArea] = useState("employee");
```

Then refresh your browser - you should see the new bank employee dashboard!

## Troubleshooting

- **Port already in use**: Change the port in the uvicorn command or vite config
- **CORS errors**: Make sure backend is running on port 8000 and frontend on 5173
- **Module not found**: Run `npm install` in the frontend directory
- **Python import errors**: Make sure virtual environment is activated and dependencies are installed

