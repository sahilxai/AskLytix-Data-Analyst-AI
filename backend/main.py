from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import io
import json
import os
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

from ai_agent import (
    generate_analysis_code,
    generate_report_insights,
    generate_visualization_suggestions,
    fix_code_with_ai,
    get_natural_language_fallback,
    build_rich_dataset_info
)
from sandbox import execute_pandas_code

app = FastAPI(title="AskLytix Data Analyst AI API")

# --- Configurable CORS ---
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase Admin & Storage Config ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY", "")
)
SUPABASE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "datasets")

supabase_admin: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase admin client: {e}")

security = HTTPBearer(auto_error=False)

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """Verify Supabase JWT access token and return authenticated user ID."""
    if not credentials:
        if not SUPABASE_URL or not SUPABASE_KEY:
            return "default_dev_user"
        raise HTTPException(status_code=401, detail="Authentication token missing. Please sign in.")

    token = credentials.credentials
    if not supabase_admin:
        return "default_dev_user"

    try:
        user_res = supabase_admin.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")
        return user_res.user.id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# --- Local & Supabase Storage Helpers ---
TEMP_DIR = "temp_storage"

def get_user_storage_path(user_id: str) -> str:
    return f"{user_id}/current_data.csv"

def get_user_local_path(user_id: str) -> str:
    user_dir = os.path.join(TEMP_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "current_data.csv")

def upload_dataset_to_supabase(user_id: str, csv_bytes: bytes):
    """Upload or update user dataset in Supabase Storage."""
    if not supabase_admin:
        return
    storage_path = get_user_storage_path(user_id)
    try:
        supabase_admin.storage.from_(SUPABASE_BUCKET).upload(
            path=storage_path,
            file=csv_bytes,
            file_options={"content-type": "text/csv", "upsert": "true"}
        )
    except Exception as e:
        print(f"Warning: Failed to upload dataset to Supabase Storage: {e}")

def ensure_user_dataset_local(user_id: str) -> str:
    """Ensure user dataset exists locally. If missing, download from Supabase Storage."""
    local_path = get_user_local_path(user_id)
    if os.path.exists(local_path):
        return local_path

    if supabase_admin:
        try:
            storage_path = get_user_storage_path(user_id)
            res = supabase_admin.storage.from_(SUPABASE_BUCKET).download(storage_path)
            if res:
                with open(local_path, "wb") as f:
                    f.write(res)
                return local_path
        except Exception as e:
            print(f"Note: Could not download dataset from Supabase Storage: {e}")

    if not os.path.exists(local_path):
        raise HTTPException(status_code=400, detail="No dataset uploaded yet.")
    return local_path

def delete_user_dataset(user_id: str):
    """Delete user dataset from local temp storage and Supabase Storage."""
    local_path = get_user_local_path(user_id)
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass

    if supabase_admin:
        try:
            storage_path = get_user_storage_path(user_id)
            supabase_admin.storage.from_(SUPABASE_BUCKET).remove([storage_path])
        except Exception:
            pass

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    try:
        contents = await file.read()

        # Enforce 5MB maximum file size limit
        MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the 5 MB limit. Please upload a dataset smaller than 5 MB."
            )
        if file.filename.endswith(".csv"):
            try:
                # Auto-detect delimiter using python engine
                decoded = contents.decode('utf-8')
                df = pd.read_csv(io.StringIO(decoded), sep=None, engine='python')
            except Exception:
                try:
                    decoded = contents.decode('latin-1')
                    df = pd.read_csv(io.StringIO(decoded), sep=None, engine='python')
                except Exception:
                    df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Clean column names to make them robust for the AI (lowercase, no spaces)
        df.columns = df.columns.astype(str).str.strip().str.lower().str.replace(' ', '_')

        # Convert to CSV bytes and save to local user path
        local_path = get_user_local_path(user_id)
        df.to_csv(local_path, index=False)

        # Upload to Supabase Storage for persistent storage
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        upload_dataset_to_supabase(user_id, csv_buffer.getvalue().encode('utf-8'))

        # Get metadata
        columns = df.columns.tolist()
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Get preview of full dataset records (cast to object first so numeric NaNs become Python None / valid JSON null)
        preview_data = df.astype(object).where(pd.notnull(df), None).to_dict(orient="records")
        
        return {
            "columns": columns,
            "dtypes": dtypes,
            "preview": preview_data,
            "filename": file.filename,
            "row_count": len(df)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def is_person_name_column(col_name: str) -> bool:
    col = str(col_name).lower().strip()
    exclude_keywords = [
        'company', 'org', 'organization', 'file', 'filename', 'db', 'database', 
        'table', 'host', 'hostname', 'domain', 'type', 'status', 'id', 'code', 
        'number', 'enum', 'path', 'url', 'uri', 'email', 'mail'
    ]
    if any(k in col for k in exclude_keywords):
        return False
    name_keywords = [
        'name', 'author', 'manager', 'person', 'client', 'customer', 
        'employee', 'student', 'patient', 'user', 'owner', 'contact', 'lead'
    ]
    return any(k in col for k in name_keywords)

def is_email_column(col_name: str, series=None) -> bool:
    col = str(col_name).lower().strip()
    if any(k in col for k in ['email', 'e_mail', 'mail_id', 'email_address']):
        return True
    if series is not None and len(series.dropna()) > 0:
        sample = series.dropna().astype(str).head(20)
        if len(sample) > 0 and sample.str.contains('@', regex=False).any():
            return True
    return False

@app.get("/api/data-health")
async def get_data_health(user_id: str = Depends(get_current_user_id)):
    try:
        local_path = ensure_user_dataset_local(user_id)
        df = pd.read_csv(local_path)
        missing_values = df.isnull().sum().to_dict()
        total_missing = int(df.isnull().sum().sum())
        total_duplicates = int(df.duplicated().sum())
        
        whitespace_issues = 0
        name_casing_issues = 0
        email_casing_issues = 0
        string_cols = df.select_dtypes(include=['object', 'string']).columns

        for col in string_cols:
            if df[col].dropna().astype(str).str.contains(r'^\s+|\s+$', regex=True).any():
                whitespace_issues += 1
            if is_person_name_column(col):
                non_null_str = df[col].dropna().astype(str)
                non_null_str = non_null_str[non_null_str.str.strip().str.lower() != 'unknown']
                if len(non_null_str) > 0 and (non_null_str != non_null_str.str.title()).any():
                    name_casing_issues += 1
            if is_email_column(col, df[col]):
                non_null_str = df[col].dropna().astype(str)
                non_null_str = non_null_str[non_null_str.str.strip().str.lower() != 'unknown']
                if len(non_null_str) > 0 and (non_null_str != non_null_str.str.lower()).any():
                    email_casing_issues += 1
        
        issues = []
        if total_missing > 0:
            issues.append(f"Found {total_missing} missing values across columns.")
        if total_duplicates > 0:
            issues.append(f"Found {total_duplicates} duplicate rows.")
        if whitespace_issues > 0:
            issues.append(f"Found {whitespace_issues} column(s) with leading or trailing whitespaces.")
        if name_casing_issues > 0:
            issues.append(f"Found {name_casing_issues} person name column(s) with unstandardized casing.")
        if email_casing_issues > 0:
            issues.append(f"Found {email_casing_issues} email column(s) with uppercase characters.")
            
        health_score = 100
        if total_missing > 0: health_score -= 10
        if total_duplicates > 0: health_score -= 10
        if whitespace_issues > 0: health_score -= 10
        if name_casing_issues > 0: health_score -= 10
        if email_casing_issues > 0: health_score -= 10
            
        return {
            "total_missing": total_missing,
            "missing_by_column": {k: int(v) for k, v in missing_values.items() if v > 0},
            "total_duplicates": total_duplicates,
            "issues": issues,
            "health_score": max(0, health_score)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CleanDataRequest(BaseModel):
    action: str = "auto"

@app.post("/api/clean-data")
async def clean_data(request: CleanDataRequest, user_id: str = Depends(get_current_user_id)):
    try:
        import numpy as np
        local_path = ensure_user_dataset_local(user_id)
        df = pd.read_csv(local_path)
        
        if request.action == "auto":
            # 1. Drop duplicates
            df = df.drop_duplicates()
            
            # 2. Fill missing numeric values with mean
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if df[col].isnull().any():
                    df[col] = df[col].fillna(df[col].mean())
                
            # 3. Strip whitespaces and fill missing categorical values with "Unknown"
            categorical_cols = df.select_dtypes(exclude=[np.number]).columns
            for col in categorical_cols:
                df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
                if df[col].isnull().any():
                    df[col] = df[col].fillna("Unknown")

            # 4. Name Formatting (Title Case for person name columns)
            for col in categorical_cols:
                if is_person_name_column(col):
                    df[col] = df[col].apply(
                        lambda x: x.title() if isinstance(x, str) and x.lower() != 'unknown' else x
                    )

            # 5. Email Formatting (Lowercase for email columns)
            for col in categorical_cols:
                if is_email_column(col, df[col]):
                    df[col] = df[col].apply(
                        lambda x: x.lower() if isinstance(x, str) and x.lower() != 'unknown' else x
                    )
                
            df.to_csv(local_path, index=False)

            # Re-upload cleaned dataset to Supabase Storage
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            upload_dataset_to_supabase(user_id, csv_buffer.getvalue().encode('utf-8'))
            
            return {
                "message": "Data cleaned successfully",
                "columns": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "preview": df.astype(object).where(pd.notnull(df), None).to_dict(orient="records"),
                "filename": "cleaned_data.csv",
                "row_count": len(df)
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported clean action.")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    message = request.message
    try:
        local_path = ensure_user_dataset_local(user_id)
        df = pd.read_csv(local_path)
        dataset_info = build_rich_dataset_info(df)
        columns_list = df.columns.tolist()
        sample_values = {col: df[col].dropna().unique()[:3].tolist() for col in df.columns}

        # --- Step 1: Generate initial code from AI ---
        ai_response = generate_analysis_code(message, dataset_info, request.history)

        suggestion = ai_response.get("suggestion", "")
        plan = ai_response.get("plan", "")
        code = ai_response.get("code", "")

        result_text = ""
        chart_data = None
        used_fallback = False

        if code:
            # --- Step 2: Execute code ---
            success, output, local_chart, short_error = execute_pandas_code(code, local_path)

            if success:
                result_text = output
                chart_data = local_chart
            else:
                # --- Step 3: Self-fix retry loop (up to 2 attempts) ---
                last_error = short_error or output
                fixed = False

                for attempt in range(2):
                    fixed_code = fix_code_with_ai(code, last_error, columns_list, sample_values)
                    if not fixed_code:
                        break
                    code = fixed_code
                    success2, output2, chart2, short_error2 = execute_pandas_code(fixed_code, local_path)
                    if success2:
                        result_text = output2
                        chart_data = chart2
                        fixed = True
                        break
                    last_error = short_error2 or output2

                if not fixed:
                    # --- Step 4: Natural language fallback ---
                    result_text = get_natural_language_fallback(message, dataset_info)
                    used_fallback = True

        if not result_text or str(result_text).strip().lower() in ["none", "null", ""]:
            if suggestion and str(suggestion).strip().lower() not in ["none", "null", ""]:
                result_text = suggestion
            else:
                result_text = "Here is the interactive visualization generated from your data."

        return {
            "suggestion": suggestion,
            "plan": plan,
            "code": code,
            "result": result_text,
            "error": None,
            "chart": chart_data,
            "ai_raw": ai_response.get("raw", ""),
            "used_fallback": used_fallback
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate-insights")
async def get_report_insights(user_id: str = Depends(get_current_user_id)):
    try:
        local_path = ensure_user_dataset_local(user_id)
        df = pd.read_csv(local_path)
        dataset_info = f"Columns: {', '.join(df.columns)}. Types: {df.dtypes.to_dict()}\n"
        
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            dataset_info += f"Stats:\n{df[numeric_cols].describe().to_string()}\n"
            
        insights = generate_report_insights(dataset_info)
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/delete-data")
async def delete_data(user_id: str = Depends(get_current_user_id)):
    try:
        delete_user_dataset(user_id)
        return {"message": "Dataset deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download-data")
async def download_data(user_id: str = Depends(get_current_user_id)):
    try:
        local_path = ensure_user_dataset_local(user_id)
        return FileResponse(
            path=local_path,
            media_type="text/csv",
            filename="cleaned_data.csv"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/suggest-visualizations")
async def suggest_visualizations(user_id: str = Depends(get_current_user_id)):
    try:
        local_path = ensure_user_dataset_local(user_id)
        df = pd.read_csv(local_path)
        dataset_info = build_rich_dataset_info(df)
        suggestions = generate_visualization_suggestions(dataset_info)
        return {"suggestions": suggestions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
