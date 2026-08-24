================================================================================
                         ASKLYTIX - DATA ANALYST AI
              FULL PROJECT DOCUMENTATION & DEPLOYMENT GUIDE
================================================================================

--------------------------------------------------------------------------------
SECTION 1: DEPENDENCIES & REQUIREMENTS
--------------------------------------------------------------------------------
When you copy or clone this project folder to another location or repository,
the following directories and files are ignored / automatically omitted to save
space and prevent committing secrets. They MUST be restored in local development:

1. PYTHON VIRTUAL ENVIRONMENT (backend/venv/)
   - Why it's missing: Virtual environments are machine/path specific and excluded via .gitignore.
   - How to restore in local development:
     cd backend
     python -m venv venv
     .\venv\Scripts\activate
     pip install -r requirements.txt

   Key Python Packages Required:
   - fastapi (0.110+) & uvicorn (0.30+) -> Web framework & production ASGI server
   - pandas (2.0+) & numpy (1.24+)      -> Data processing & manipulation
   - plotly (5.20+)                     -> Interactive chart JSON generation
   - python-dotenv (1.0+)              -> Loads environment variables from .env
   - requests (2.31+)                  -> Groq API HTTP client
   - openpyxl (3.1+)                   -> Excel (.xlsx/.xls) file reader
   - python-multipart (0.0.9)          -> Multipart file upload support
   - supabase (2.4.0+)                 -> Supabase Admin & Storage Python client

2. NODE.JS DEPENDENCIES (frontend/node_modules/)
   - Why it's missing: npm packages take 200MB+ and are excluded via .gitignore.
   - How to restore in local development:
     cd frontend
     npm install

   Key Frontend NPM Packages Required:
   - react (19.2+) & react-dom         -> Core UI library
   - vite (8.0+)                       -> Frontend dev server & production bundler
   - @supabase/supabase-js (2.48+)     -> Supabase Auth & Session management
   - axios (1.14+)                     -> HTTP client with JWT interceptor for FastAPI endpoints
   - lucide-react (1.7+)               -> Icon set
   - tailwindcss (4.2+)                -> Modern UI styling

3. ENVIRONMENT VARIABLES & SECRETS
   - Why it's missing: .env files are excluded via .gitignore for security.
   - Production Environment Setup:
     a. Render Backend Dashboard:
        GROQ_API_KEY=gsk_YourActualGroqApiKeyHere
        SUPABASE_URL=https://your-project.supabase.co
        SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
        SUPABASE_STORAGE_BUCKET=datasets
        ALLOWED_ORIGINS=https://your-frontend.netlify.app,http://localhost:5173
     b. Netlify Frontend Dashboard:
        VITE_API_URL=https://your-backend.onrender.com
        VITE_SUPABASE_URL=https://your-project.supabase.co
        VITE_SUPABASE_ANON_KEY=your-supabase-anon-key


--------------------------------------------------------------------------------
SECTION 2: CURRENT PROJECT ARCHITECTURE & FILE MAP
--------------------------------------------------------------------------------
[PROJECT ROOT]
 ├── netlify.toml                -> Root Netlify build & SPA routing configuration
 ├── readme.txt                  -> (This full project documentation file)
 ├── .gitignore                  -> Git exclusions (.env, venv, node_modules, temp_storage, etc.)
 ├── .env.example                -> Environment variable template
 │
 ├── backend/                    -> FastAPI Python Backend Service
 │    ├── main.py                -> REST API Endpoints & JWT Auth Verification (Upload, Health, Clean, Chat, Report, Download, Delete)
 │    ├── ai_agent.py            -> Groq LLM integration & Prompt Engineering
 │    ├── sandbox.py             -> Safe Python code execution & Plotly JSON sanitizer
 │    ├── test_sandbox.py        -> Backend unit & integration test suite
 │    ├── requirements.txt       -> Python package list
 │    ├── .env.example           -> Backend env template
 │    └── .gitignore             -> Backend git exclusions
 │
 └── frontend/                   -> React 19 + Vite + Tailwind Responsive Frontend
      ├── public/
      │    └── _redirects        -> Netlify SPA 200 rewrite rule (/* /index.html 200)
      ├── src/
      │    ├── App.jsx           -> Main Application Container, Sidebar & Session Protection
      │    ├── api.js            -> Centralized Axios client with VITE_API_URL & auto JWT token header injection
      │    ├── supabaseClient.js -> Supabase Auth client initialization
      │    ├── components/
      │    │    ├── Auth.jsx                   -> Supabase Login & Register pages (Email/Password Auth)
      │    │    ├── UploadZone.jsx              -> Drag-and-drop file upload zone (5MB Limit)
      │    │    ├── DataPreview.jsx             -> Data reference table (whitespace-pre & space badges)
      │    │    ├── DataCleaningAssistant.jsx   -> Health score (0-100), Clean Data trigger & Blob Download
      │    │    ├── ChatInterface.jsx           -> AI chat UI & smart visual suggestions popover
      │    │    ├── Visualizer.jsx              -> Fullscreen Plotly canvas renderer
      │    │    └── ReportGenerator.jsx         -> Generate & download executive PDF reports
      │    ├── index.css         -> Global responsive styling & scrollbars
      │    └── main.jsx          -> React DOM entrypoint
      ├── package.json           -> Frontend dependencies & scripts
      └── vite.config.js         -> Vite bundler configuration


--------------------------------------------------------------------------------
SECTION 3: COMPLETE PROJECT WORKFLOW & WORKING MECHANICS
--------------------------------------------------------------------------------

1. AUTHENTICATION & SESSION PROTECTION
   - Supabase Auth handles email/password registration and login.
   - Frontend App.jsx listens to onAuthStateChange and restricts unauthenticated users to Auth.jsx.
   - Incoming API requests automatically attach the user's Supabase JWT access token via Authorization: Bearer <token> in api.js.
   - Backend get_current_user_id security dependency verifies incoming JWTs using supabase_admin.auth.get_user(token).

2. FILE UPLOAD & PER-USER STORAGE WORKFLOW (5MB Limit)
   - Max file size limit enforced: 5 MB (5,242,880 bytes).
   - Valid formats: .csv, .xlsx, .xls.
   - When user uploads a file via UploadZone.jsx -> POST /api/upload:
     a. Verifies user authentication and 5MB size limit.
     b. Reads CSV/Excel using Pandas and normalizes column names.
     c. Uploads copy to Supabase Storage bucket at datasets/<user_id>/current_data.csv.
     d. Saves local temp processing cache at temp_storage/<user_id>/current_data.csv.
     e. Returns dataset preview records and metadata.

3. DATA HEALTH & AUTO-CLEANING WORKFLOW
   - GET /api/data-health calculates health score (100 max) by checking:
     - Missing values across columns (-10 score)
     - Duplicate rows (-10 score)
     - Uncleaned leading/trailing whitespaces in text cells (-10 score)
     - Unstandardized person name casing (-10 score)
     - Uppercase characters in email columns (-10 score)
   - POST /api/clean-data ("Clean Data" button) executes 5-step pipeline:
     Step 1: Drop duplicate rows.
     Step 2: Fill missing numeric values with column mean.
     Step 3: Strip whitespaces & impute missing text values with "Unknown".
     Step 4: Name Formatting -> Standardize person name columns to Title Case (e.g., "sahil bhirud" -> "Sahil Bhirud").
     Step 5: Email Formatting -> Standardize email columns to Lowercase (e.g., "USER@GMAIL.COM" -> "user@gmail.com").
     Re-uploads updated CSV to Supabase Storage and updates local temp cache.

4. AI CHAT & VISUALIZATION WORKFLOW
   - User enters prompt or clicks "Suggest Visuals" -> POST /api/chat.
   - ai_agent.py constructs system prompt with dataset schema summary and calls Groq LLM API.
   - Generated Python code is executed by sandbox.py on user's isolated dataset:
     - Executes df = pd.read_csv("temp_storage/<user_id>/current_data.csv")
     - Generates Plotly figure object (fig).
     - Converts numpy arrays to lists before JSON serialization for clean legends.
     - Maps numeric category codes (0/1) to human labels ('Female'/'Male').
     - Formats donut/pie chart slices with textinfo='percent+label' inside slices.
   - Frontend renders chart on Visualization Canvas.

5. DATASET DELETION & DOWNLOAD WORKFLOW
   - DELETE /api/delete-data: Permanently removes dataset from Supabase Storage and local temp cache.
   - GET /api/download-data: Initiates authenticated blob download of user's cleaned dataset.


--------------------------------------------------------------------------------
SECTION 4: LOCAL DEVELOPMENT & DEPLOYMENT INSTRUCTIONS
--------------------------------------------------------------------------------

LOCAL DEVELOPMENT RUNTIME:

STEP 1: Run Backend (Terminal 1)
  cd backend
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000

STEP 2: Run Frontend (Terminal 2)
  cd frontend
  npm install
  npm run dev

STEP 3: Open Browser
  Navigate to: http://localhost:5173

--------------------------------------------------------------------------------
PRODUCTION DEPLOYMENT SETUP:

1. RENDER (Backend Hosting):
   - Build Command: pip install -r requirements.txt
   - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   - Environment Variables: GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET=datasets, ALLOWED_ORIGINS=https://your-netlify-app.netlify.app

2. NETLIFY (Frontend Hosting):
   - Base Directory: frontend
   - Build Command: npm run build
   - Publish Directory: dist
   - Environment Variables: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

3. SUPABASE:
   - Create bucket named "datasets" in Supabase Storage.
