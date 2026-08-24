================================================================================
                         ASKLYTIX - DATA ANALYST AI
             FULL PROJECT DOCUMENTATION & COPY RESTORATION GUIDE
================================================================================

--------------------------------------------------------------------------------
SECTION 1: DEPENDENCIES & REQUIREMENTS MISSING IN COPIED FOLDERS
--------------------------------------------------------------------------------
When you copy or clone this project folder to another location (like Desktop),
the following directories and files are ignored / automatically omitted to save
space and prevent committing secrets. They MUST be restored in the copied project:

1. PYTHON VIRTUAL ENVIRONMENT (backend/venv/)
   - Why it's missing: Virtual environments are machine/path specific and excluded via .gitignore.
   - How to restore in the copied folder:
     cd backend
     python -m venv venv
     .\venv\Scripts\activate
     pip install -r requirements.txt

   Key Python Packages Required:
   - fastapi (0.135+) & uvicorn (0.42+) -> Web framework & server
   - pandas (3.0+) & numpy (2.4+)      -> Data processing & manipulation
   - plotly (6.6+)                     -> Interactive chart JSON generation
   - python-dotenv (1.2+)              -> Loads environment variables from .env
   - requests (2.33+)                  -> Groq API HTTP client
   - openpyxl (3.1+)                   -> Excel (.xlsx/.xls) file reader
   - python-multipart (0.0.22)         -> Multipart file upload support

2. NODE.JS DEPENDENCIES (frontend/node_modules/)
   - Why it's missing: npm packages take 200MB+ and are excluded via .gitignore.
   - How to restore in the copied folder:
     cd frontend
     npm install

   Key Frontend NPM Packages Required:
   - react (19.2+) & react-dom         -> Core UI library
   - vite (8.0+)                       -> Frontend dev server & bundler
   - axios (1.14+)                     -> HTTP client for FastAPI endpoints
   - lucide-react (1.7+)               -> Icon set
   - tailwindcss (4.2+)                -> Modern UI styling

3. ENVIRONMENT VARIABLES & SECRETS (backend/.env)
   - Why it's missing: .env is excluded via .gitignore for security.
   - How to restore in the copied folder:
     Create file: backend/.env
     Add your Groq API key:
     GROQ_API_KEY=gsk_YourActualGroqApiKeyHere

4. TEMPORARY SESSION DATA (backend/current_data.csv)
   - Why it's missing: Excluded via .gitignore. Auto-generated when user uploads a file.


--------------------------------------------------------------------------------
SECTION 2: CURRENT PROJECT ARCHITECTURE & FILE MAP
--------------------------------------------------------------------------------
[PROJECT ROOT]
 ├── readme.txt                  -> (This documentation file)
 ├── .gitignore                  -> Git exclusions (.env, venv, node_modules, etc.)
 ├── .env.example                -> Environment variable template
 │
 ├── backend/                    -> FastAPI Python Service
 │    ├── main.py                -> REST API Endpoints (Upload, Health, Clean, Chat, Report, Download, Delete)
 │    ├── ai_agent.py            -> Groq LLM integration & Prompt Engineering
 │    ├── sandbox.py             -> Safe Python code execution & Plotly JSON sanitizer
 │    ├── test_sandbox.py        -> Backend unit/integration test suite
 │    ├── requirements.txt       -> Python package list
 │    ├── .env                   -> Local environment variables (GROQ_API_KEY)
 │    ├── .env.example           -> Backend env template
 │    └── .gitignore             -> Backend git exclusions
 │
 └── frontend/                   -> React 19 + Vite + Tailwind Web Application
      ├── src/
      │    ├── App.jsx           -> Main Application Container & Sidebar (with Sahil Bhirud Footer)
      │    ├── components/
      │    │    ├── UploadZone.jsx              -> Drag-and-drop file upload zone (5MB Limit)
      │    │    ├── DataPreview.jsx             -> Data reference table (whitespace-pre & space badges)
      │    │    ├── DataCleaningAssistant.jsx   -> Health score (0-100) & Clean Data trigger
      │    │    ├── ChatInterface.jsx           -> AI chat UI & smart visual suggestions popover
      │    │    ├── Visualizer.jsx              -> Fullscreen Plotly canvas renderer
      │    │    └── ReportGenerator.jsx         -> Generate & download executive PDF reports
      │    ├── index.css         -> Global styling & scrollbars
      │    └── main.jsx          -> React DOM entrypoint
      ├── package.json           -> Frontend dependencies & scripts
      └── vite.config.js         -> Vite configuration


--------------------------------------------------------------------------------
SECTION 3: COMPLETE PROJECT WORKFLOW & WORKING MECHANICS
--------------------------------------------------------------------------------

1. FILE UPLOAD WORKFLOW (5MB Limit)
   - Max file size limit enforced: 5 MB (5,242,880 bytes).
   - Valid formats: .csv, .xlsx, .xls.
   - When user uploads a file via UploadZone.jsx -> POST /api/upload:
     a. Checks file size <= 5MB.
     b. Reads CSV/Excel using Pandas.
     c. Normalizes column names (lowercased, spaces replaced with underscores).
     d. Saves to backend/current_data.csv.
     e. Returns dataset preview records and metadata.

2. DATA HEALTH & AUTO-CLEANING WORKFLOW
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
     Overwrites backend/current_data.csv with clean data.

3. AI CHAT & VISUALIZATION WORKFLOW
   - User enters prompt or clicks "Suggest Visuals" -> POST /api/chat.
   - ai_agent.py constructs system prompt with rich dataset schema summary and calls Groq API (openai/gpt-oss-120b).
   - Generated Python code is executed by sandbox.py:
     - Executes df = pd.read_csv("current_data.csv")
     - Generates Plotly figure object (fig).
     - Converts numpy arrays to lists before JSON serialization to ensure clean Plotly chart legends.
     - Maps numeric category codes (0/1) to human labels ('Female'/'Male').
     - Formats donut/pie chart slices with textinfo='percent+label' inside slices.
   - Frontend renders chart on Visualization Canvas.
   - Main page container maintains viewport scroll at top, while ChatInterface scrolls internally.

4. DATASET DELETION WORKFLOW
   - When user clicks "Delete" in UI -> DELETE /api/delete-data:
     - Permanently removes backend/current_data.csv from disk.
     - Clears React state (datasetContext, chatHistory, currentChart).


--------------------------------------------------------------------------------
SECTION 4: HOW TO RUN A COPIED VERSION FROM SCRATCH
--------------------------------------------------------------------------------
If you copy this folder to Desktop or a new machine, follow these steps:

STEP 1: Open Terminal in backend folder
  cd "backend"
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt

STEP 2: Create backend/.env file
  Create file: backend/.env
  Add content:
  GROQ_API_KEY=your_groq_api_key_here

STEP 3: Run Backend Server
  uvicorn main:app --reload --port 8000

STEP 4: Open Terminal in frontend folder (new tab/window)
  cd "frontend"
  npm install
  npm run dev

STEP 5: Open Browser
  Navigate to: http://localhost:5173
