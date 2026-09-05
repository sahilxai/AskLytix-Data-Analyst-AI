import requests
import json
import re
import os
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
load_dotenv(find_dotenv())

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are a world-class, expert Data Analyst AI and Plotly Master.

CRITICAL RULES — READ ALL CAREFULLY:
1. ALWAYS load data first: `df = pd.read_csv("current_data.csv")`
2. Use ONLY the EXACT column names from the Dataset Info. Never invent or guess names.
3. Strip whitespace from string columns before filtering/grouping: `df['col'] = df['col'].astype(str).str.strip()`
4. ABSOLUTELY NEVER USE MATPLOTLIB OR SEABORN. YOU MUST ONLY USE PLOTLY (`import plotly.express as px` or `import plotly.graph_objects as go`).
5. Assign your Plotly figure to variable `fig`. Do NOT call `.show()`.
6. Apply modern dark theme styling to EVERY figure (`template="plotly_dark"`, paper/plot background `#0d1117`).
7. ALWAYS state short direct text facts or a clean summary using `print()`. Never print raw DataFrame tables or leave `print()` empty.
8. ALWAYS format your response strictly into [SUGGESTION], [PLAN], and [CODE] sections.
9. ALWAYS wrap python code inside ```python ... ``` blocks.
10. ALWAYS generate a complete, working Plotly figure (`fig = ...`) inside the [CODE] section whenever the user asks for a chart, visualization, distribution, histogram, breakdown, trend, or plot.
11. LEGENDS & LABELS MUST ALWAYS SHOW HUMAN-READABLE TEXT (e.g. 'Male', 'Female'). ABSOLUTELY NEVER allow numeric category codes like 0, 1, 2 or integer indices in chart legends, slice labels, or axis ticks.
12. If a categorical column (such as 'gender' or 'sex') contains numeric codes (e.g. 0/1 or 1/2), ALWAYS map them to clear descriptive names before plotting: `df['gender'] = df['gender'].replace({0: 'Female', 1: 'Male', '0': 'Female', '1': 'Male', 2: 'Male', '2': 'Male'})` (or 1='Male', 2='Female').
13. ABSOLUTELY NEVER convert categorical string columns (e.g. 'gender', 'name', 'status') into numeric binary values (0/1) or integer codes using `.map()`, `.astype(int)`, or `pd.factorize()`. Keep string values intact so Plotly displays real text names like 'Male' and 'Female'!
14. FOR DONUT / PIE CHARTS: ALWAYS set `fig.update_traces(textinfo='percent+label', textposition='inside')` so that the slice names ('Male', 'Female') and percentages appear directly inside the pie slices alongside the legend.

CHART TYPE SPECIFIC INSTRUCTIONS — CHOOSE THE RIGHT CHART TYPE FOR THE QUESTION:

1. HISTOGRAM (Distribution of a single numeric column like salary, age, price, amount):
   - CRITICAL: MUST use `px.histogram(df, x='numeric_col', title='...')` directly on the raw numeric column!
   - ABSOLUTELY NEVER use `pd.cut()`, `pd.qcut()`, `.groupby()`, or `px.bar()` for histograms!
   - If bin size is specified (e.g. 5000): set `fig.update_traces(xbins=dict(size=5000))` or `nbins=...`.
   - Set bargap for visual spacing: `fig.update_layout(bargap=0.08)`.
   - Example:
     ```python
     fig = px.histogram(df, x='salary', title='Employee Salary Distribution (Bin size = 5,000)', color_discrete_sequence=['#6366f1'])
     fig.update_traces(xbins=dict(size=5000))
     fig.update_layout(bargap=0.08)
     ```

2. BAR CHART (Single Categorical Column Aggregation / Comparison):
   - Aggregate first: `counts = df.groupby('cat_col')['num_col'].sum().reset_index()` OR `counts = df.groupby('cat_col').size().reset_index(name='count')`
   - `fig = px.bar(counts, x='cat_col', y='count', title='...', text_auto=True, color_discrete_sequence=['#6366f1'])`
   - For Horizontal Bar: `px.bar(counts, x='count', y='cat_col', orientation='h', text_auto=True)`

3. GROUPED / STACKED BAR CHART (Comparing across two categories):
   - Aggregate: `agg = df.groupby(['cat1', 'cat2']).size().reset_index(name='count')`
   - Grouped Bar: `fig = px.bar(agg, x='cat1', y='count', color='cat2', barmode='group', title='...', text_auto=True)`
   - Stacked Bar: `fig = px.bar(agg, x='cat1', y='count', color='cat2', barmode='stack', title='...', text_auto=True)`

4. DONUT / PIE CHART (Proportions & Percentage Distribution):
   - Aggregate: `counts = df.groupby('cat_col').size().reset_index(name='count')`
   - CRITICAL: MUST pass the actual string category column name for `names` (e.g. `names='gender'`), NEVER use `.index` or integer columns!
   - ALWAYS PREFER DONUT CHART: `fig = px.pie(counts, names='cat_col', values='count', hole=0.45, title='...', color_discrete_sequence=['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'])`
   - `fig.update_traces(textinfo='percent+label', textposition='inside')`

5. LINE CHART (Time-series / Sequential Trends / Index Trends):
   - ALWAYS generate code when requested for line/trend chart.
   - MUST sort by date/time or sequence/index column first: `df = df.sort_values('emp_id')` (or date column)
   - If user asks for trend by ID or index, plot `px.line(df, x='emp_id', y='salary', markers=True, title='...')`
   - `fig.update_traces(line=dict(width=3))`

6. BOX PLOT (Distribution / Spread / Outliers across categories or overall):
   - `fig = px.box(df, x='category_col', y='numeric_col', points='outliers', title='...', color='category_col')`
   - If no category specified: `fig = px.box(df, y='numeric_col', points='outliers', title='...')`

7. SCATTER PLOT (Relationship / Correlation between 2 numeric variables):
   - `fig = px.scatter(df, x='num1', y='num2', color='cat_col', title='...', hover_data=df.columns)`

8. HEATMAP / CORRELATION MATRIX (Matrix of 2 categories or correlation matrix):
   - For 2 categorical columns: `pivot = pd.crosstab(df['cat1'], df['cat2'])`
   - For correlation: `pivot = df.select_dtypes(include='number').corr()`
   - `fig = px.imshow(pivot, text_auto='.2f', color_continuous_scale='Viridis', title='...')`

LAYOUT STYLING — APPLY TO EVERY CHART:
```python
fig.update_layout(
    template="plotly_dark",
    paper_bgcolor="#0d1117",
    plot_bgcolor="#0d1117",
    font=dict(family="Inter, sans-serif", color="#f8fafc", size=12),
    title=dict(font=dict(size=16, color="#ffffff", family="Inter, sans-serif")),
    margin=dict(l=40, r=40, t=60, b=40),
    hoverlabel=dict(bgcolor="#1e293b", font_size=13, font_family="Inter, sans-serif")
)
```

OUTPUT FORMAT:

[SUGGESTION]
One sentence explaining the chart choice, or "No visualization required."

[PLAN]
1. Short step
2. Short step

[CODE]
```python
# your code here
```
"""

FIX_PROMPT_TEMPLATE = """You are an expert Python and Pandas developer.

The following code was generated to answer a user's data question, but it failed with an error.
Your job is to REWRITE the code to fix the error. Return ONLY the corrected code in a ```python ... ``` block.

DATASET COLUMN NAMES: {columns}
DATASET SAMPLE VALUES: {sample_values}

ORIGINAL CODE:
{code}

ERROR MESSAGE:
{error}

IMPORTANT FIXES TO APPLY:
- ABSOLUTELY NEVER USE MATPLOTLIB OR SEABORN. Use ONLY Plotly (`import plotly.express as px` or `import plotly.graph_objects as go`).
- Assign your Plotly figure to variable `fig`.
- If fixing a histogram: ALWAYS use `px.histogram(df, x='numeric_col')` directly. NEVER use `pd.cut()` or `px.bar()`.
- If error is a KeyError, the column name is wrong. Use ONLY the exact column names listed above.
- Strip whitespace from ALL string columns you access: `df['col'] = df['col'].astype(str).str.strip()`
- Make sure `df = pd.read_csv("current_data.csv")` is the first line.
- Print your final text answer using `print()`.

Rewrite the complete fixed code now:
"""

FALLBACK_PROMPT_TEMPLATE = """You are a Data Analyst AI with access to a dataset.

The user asked: {question}

Here is the FULL dataset info including sample values and statistics:
{dataset_info}

Using the statistics and sample values above, give a SHORT, DIRECT answer of 1-2 sentences.
State the actual number or fact immediately. Do NOT say "we cannot access" or hedge.
If you can calculate it from the stats provided, do so.
Example good answer: "There are 8 males out of 12 total employees in the dataset."
"""


def extract_code(text):
    if not text:
        return ""
    # 1. Try standard markdown fenced python block
    match = re.search(r'```(?:python)?\s*\n?(.*?)```', text, re.DOTALL | re.IGNORECASE)
    if match and match.group(1).strip():
        return match.group(1).strip()

    # 2. Try extracting content after [CODE] tag
    code_match = re.search(r'\[CODE\]\s*\n?(.*)', text, re.DOTALL | re.IGNORECASE)
    if code_match:
        code_str = code_match.group(1).strip()
        # Remove any trailing code block fences
        code_str = re.sub(r'```$', '', code_str).strip()
        if code_str and ("import " in code_str or "df" in code_str or "px." in code_str or "fig" in code_str):
            return code_str

    # 3. Fallback: line-by-line check if text starts directly with code
    if "import plotly" in text or "import pandas" in text or "px.histogram" in text or "px.bar" in text:
        lines = [line for line in text.splitlines() if not line.strip().startswith('[')]
        candidate = "\n".join(lines).strip()
        if candidate:
            return candidate

    return ""


def _call_groq(messages, temperature=0.1, json_mode=False, retries=3):
    """Helper to call Groq API with retries for rate limits and network drops."""
    import time
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    for attempt in range(retries):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            if response.status_code == 429 and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            return content
        except (requests.exceptions.RequestException, Exception) as err:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise err


def build_rich_dataset_info(df):
    """Build a comprehensive dataset context string for the AI."""
    info_parts = []

    # Basic info
    info_parts.append(f"Rows: {len(df)}, Columns: {len(df.columns)}")
    info_parts.append(f"\nColumn names (EXACT, case-sensitive): {df.columns.tolist()}")

    # Column types and sample values
    info_parts.append("\nColumn details:")
    for col in df.columns:
        dtype = str(df[col].dtype)
        non_null = df[col].dropna()
        # Get 3 unique sample values
        samples = non_null.unique()[:3].tolist()
        samples_str = ", ".join([repr(str(s).strip()) for s in samples])
        info_parts.append(f"  - '{col}' (type: {dtype}) | sample values: [{samples_str}]")

    # Numeric statistics
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    if numeric_cols:
        info_parts.append("\nNumeric column statistics:")
        for col in numeric_cols:
            col_data = df[col].dropna()
            if len(col_data) > 0:
                info_parts.append(
                    f"  - '{col}': min={col_data.min():.2f}, max={col_data.max():.2f}, "
                    f"mean={col_data.mean():.2f}, median={col_data.median():.2f}"
                )

    return "\n".join(info_parts)


def generate_analysis_code(user_query, dataset_info, history):
    if not GROQ_API_KEY:
        return {
            "raw": "",
            "plan": "🔑 **API Key Required**: Please configure GROQ_API_KEY in backend/.env file.",
            "code": "",
            "suggestion": ""
        }

    prompt = f"{SYSTEM_PROMPT}\n\nDataset Info:\n{dataset_info}\n\nUser Question:\n{user_query}\n"

    try:
        output_text = _call_groq([{"role": "user", "content": prompt}], temperature=0.05)

        suggestion_match = re.search(r'\[SUGGESTION\](.*?)(?:\[PLAN\]|\[CODE\]|$)', output_text, re.DOTALL | re.IGNORECASE)
        suggestion = suggestion_match.group(1).strip() if suggestion_match else ""

        plan_match = re.search(r'\[PLAN\](.*?)(?:\[CODE\]|$)', output_text, re.DOTALL | re.IGNORECASE)
        plan = plan_match.group(1).strip() if plan_match else ""

        code = extract_code(output_text)

        return {
            "raw": output_text,
            "suggestion": suggestion,
            "plan": plan,
            "code": code
        }
    except Exception as e:
        error_details = ""
        try:
            error_details = e.response.text
        except:
            error_details = str(e)
        return {
            "raw": "",
            "suggestion": "",
            "plan": f"API Error: {error_details}",
            "code": ""
        }


def fix_code_with_ai(original_code, error_msg, columns, sample_values):
    """Ask AI to fix broken code. Returns new code string or empty string on failure."""
    fix_prompt = FIX_PROMPT_TEMPLATE.format(
        columns=columns,
        sample_values=sample_values,
        code=original_code,
        error=error_msg[:2000]  # Truncate very long tracebacks
    )
    try:
        output = _call_groq([{"role": "user", "content": fix_prompt}], temperature=0.1)
        return extract_code(output)
    except Exception:
        return ""


def get_natural_language_fallback(user_question, dataset_info):
    """When all code execution fails, ask AI to answer in plain text from schema."""
    fallback_prompt = FALLBACK_PROMPT_TEMPLATE.format(
        question=user_question,
        dataset_info=dataset_info
    )
    try:
        return _call_groq([{"role": "user", "content": fallback_prompt}], temperature=0.3)
    except Exception:
        return "I was unable to analyze this data at the moment. Please try rephrasing your question."


def generate_report_insights(dataset_info):
    prompt = f"""You are an expert Data Analyst AI.

Please provide a concise but impactful business report based on the following dataset schema.
Even though you only have the schema/preview, make reasonable and strictly structured analytical potential to provide:
1. A short generic summary (max 3 sentences) of what this data is about.
2. Three key actionable insights or analytical angles (as a list of strings).
3. One clear business recommendation.

Format the response explicitly as JSON with these exact keys:
{{
  "summary": "...",
  "insights": ["...", "...", "..."],
  "recommendation": "..."
}}

Dataset Info:
{dataset_info}
"""

    try:
        output_text = _call_groq(
            [{"role": "user", "content": prompt}],
            temperature=0.2,
            json_mode=True
        )
        output_text = output_text.strip()
        if output_text.startswith("```json"):
            output_text = output_text[7:]
        elif output_text.startswith("```"):
            output_text = output_text[3:]
        if output_text.endswith("```"):
            output_text = output_text[:-3]

        return json.loads(output_text.strip())

    except json.JSONDecodeError:
        return {
            "summary": "Failed to parse AI response. Please try again.",
            "insights": ["The AI returned an unexpected format."],
            "recommendation": "Try generating the report again."
        }
    except Exception as e:
        return {
            "summary": "API Error",
            "insights": [f"Error: {str(e)}"],
            "recommendation": "Check API Key and network, then retry."
        }


def _infer_chart_type(title, prompt):
    text = f"{title} {prompt}".lower()
    if "pie" in text or "donut" in text or "share" in text or "proportion" in text:
        return "pie"
    if "horizontal" in text and "bar" in text or "horizontal" in text:
        return "horizontal_bar"
    if "line" in text or "trend" in text or "over time" in text or "timeline" in text:
        return "line"
    if "area" in text:
        return "area"
    if "scatter" in text or "correlation" in text or "bubble" in text:
        return "scatter"
    if "heatmap" in text or "matrix" in text:
        return "heatmap"
    if "histogram" in text or "distribution" in text or "box" in text:
        return "histogram"
    return "bar"


def generate_visualization_suggestions(dataset_info):
    """Generate 6 dataset-specific visualization prompt recommendations."""
    prompt = f"""You are an expert Data Analyst AI.
Analyze the dataset schema below and generate 6 highly relevant, specific visualization prompt suggestions tailored to this exact dataset.

Dataset Schema:
{dataset_info}

Return JSON with key "suggestions" containing a list of 6 objects, each having:
- "id": integer 1-6
- "title": Short catchy title (2-3 words, e.g. "Coffee popularity", "Sales trend", "Payment method")
- "prompt": Clear, explicit user prompt instruction for generating a Plotly chart (e.g. "Create a bar chart showing the number of sales for each coffee type. Sort the coffee types from highest to lowest sales.")
- "chart_type": One of "pie", "donut", "bar", "horizontal_bar", "line", "area", "scatter", "box", "histogram", "heatmap"

Format JSON strictly like this:
{{
  "suggestions": [
    {{
      "id": 1,
      "title": "Coffee popularity",
      "prompt": "Create a bar chart showing the number of sales for each coffee type. Sort the coffee types from highest to lowest sales.",
      "chart_type": "bar"
    }}
  ]
}}
"""

    try:
        output_text = _call_groq(
            [{"role": "user", "content": prompt}],
            temperature=0.2,
            json_mode=True
        )
        output_text = output_text.strip()
        if output_text.startswith("```json"):
            output_text = output_text[7:]
        elif output_text.startswith("```"):
            output_text = output_text[3:]
        if output_text.endswith("```"):
            output_text = output_text[:-3]

        data = json.loads(output_text.strip())
        suggestions = data.get("suggestions", [])
        for s in suggestions:
            if not s.get("chart_type"):
                s["chart_type"] = _infer_chart_type(s.get("title", ""), s.get("prompt", ""))
            else:
                s["chart_type"] = s["chart_type"].lower().strip()
        return suggestions
    except Exception:
        return [
            {
                "id": 1,
                "title": "Category Distribution",
                "prompt": "Create a bar chart showing the breakdown of records across categorical columns.",
                "chart_type": "bar"
            },
            {
                "id": 2,
                "title": "Trend Over Time",
                "prompt": "Create a line chart showing the trend of records over time.",
                "chart_type": "line"
            },
            {
                "id": 3,
                "title": "Proportion Breakdown",
                "prompt": "Create a donut chart showing the percentage distribution of top categories.",
                "chart_type": "pie"
            }
        ]

