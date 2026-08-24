# 🤖 AskLytix – AI Data Analyst Workspace

[![Live Demo](https://img.shields.io/badge/Live_Demo-https%3A%2F%2Fasklytix.netlify.app-blue?style=for-the-badge&logo=netlify)](https://asklytix.netlify.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_FastAPI_|_Groq_|_Plotly_|_Supabase-indigo?style=for-the-badge)](https://asklytix.netlify.app)

> **AskLytix** is an intelligent, full-stack AI Data Analytics platform that converts raw CSV and Excel datasets into interactive visualizations, data health insights, automated data cleaning pipelines, and executive analytical reports.

🌐 **Live Application**: [https://asklytix.netlify.app](https://asklytix.netlify.app)

---

## 🌟 Key Features

- 🔐 **Supabase Authentication**: Secure Email/Password registration, login, and user session protection.
- 📁 **Dataset Support**: Upload CSV, XLSX, and XLS datasets up to **5 MB**.
- 🛡️ **Multi-Tenant User Isolation**: Datasets are stored in user-isolated folders (`datasets/<user_id>/current_data.csv`) using **Supabase Storage**.
- 📊 **Interactive Plotly Visualizations**: Fullscreen rendering canvas supporting bar, line, scatter, pie, donut, and distribution charts with sanitized human-readable category labels.
- 🧹 **Automated Data Cleaning Engine**: 5-step automated cleaning pipeline (duplicates removal, numerical mean imputation, string trimming, person name Title-Casing, email Lower-Casing).
- 💬 **AI Conversational Analytics**: Interactive LLM chat powered by Groq API (`openai/gpt-oss-120b`) with self-fixing execution sandboxing.
- 📄 **Executive Report Generator**: AI-generated executive summaries, key business insights, and downloadable PDF reports.

---

## 🏗️ Architecture & Stack

```text
[ React 19 Frontend ]  <--->  [ FastAPI Python Backend ]  <--->  [ Groq LLM API ]
    (Hosted on Netlify)            (Hosted on Render)          (Data Insights Engine)
             │                             │
             └───────────────┬─────────────┘
                             ▼
                   [ Supabase Auth & Storage ]
                   (User Accounts & Dataset Persistence)
```

- **Frontend**: React 19, Vite 8, TailwindCSS 4, Lucide Icons, Axios (with JWT interceptor)
- **Backend**: FastAPI 0.110+, Python 3.10+, Pandas, Plotly, Supabase Python Client
- **AI Model**: Groq LLM API (`openai/gpt-oss-120b`)
- **Storage & Auth**: Supabase Auth & Supabase Storage Bucket (`datasets`)

---

## ⚙️ Environment Configuration

### Backend Environment Variables (`backend/.env` / Render)
```env
GROQ_API_KEY=gsk_your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret
SUPABASE_STORAGE_BUCKET=datasets
ALLOWED_ORIGINS=https://asklytix.netlify.app,http://localhost:5173
```

### Frontend Environment Variables (`frontend/.env` / Netlify)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

---

## 🚀 Quickstart (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 📄 License & Attribution

Developed & Maintained by **Sahil Bhirud**  
- **GitHub**: [github.com/sahilxai](https://github.com/sahilxai)  
- **LinkedIn**: [linkedin.com/in/sahilbhirud2005](https://www.linkedin.com/in/sahilbhirud2005/)
