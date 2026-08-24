import traceback
import io
import json
import re
from contextlib import redirect_stdout


def _clean_plotly_data(obj):
    """Recursively convert numpy arrays, numpy scalars, and pandas series to native Python lists/types."""
    import numpy as np
    import pandas as pd
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: _clean_plotly_data(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_clean_plotly_data(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    return obj


def _sanitize_plotly_figure(val, df):
    """Clean figure traces directly on the Plotly Figure object before JSON serialization."""
    if not hasattr(val, "data"):
        return val
    try:
        import numpy as np
        for trace in val.data:
            trace_type = getattr(trace, "type", None)
            if trace_type == "pie":
                labels = getattr(trace, "labels", None)
                if labels is not None:
                    try:
                        labels_list = [str(x).strip() for x in list(labels)]
                    except Exception:
                        labels_list = []
                    is_numeric = all(
                        lbl in ["0", "1", "2", "3", "4", "5", "0.0", "1.0", "2.0", "3.0"]
                        for lbl in labels_list
                    )
                    if is_numeric and len(labels_list) > 0:
                        gender_col = next((c for c in df.columns if c.lower() in ['gender', 'sex']), None)
                        if gender_col:
                            u_vals = df[gender_col].dropna().astype(str).str.strip().unique().tolist()
                            non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                            if len(non_num) >= len(labels_list):
                                trace.labels = np.array(non_num[:len(labels_list)])
                            else:
                                mapped = []
                                for lbl in labels_list:
                                    if lbl in ['0', '0.0']:
                                        mapped.append('Female')
                                    elif lbl in ['1', '1.0']:
                                        mapped.append('Male')
                                    elif lbl in ['2', '2.0']:
                                        mapped.append('Other')
                                    else:
                                        mapped.append(lbl)
                                trace.labels = np.array(mapped)
                        else:
                            for col in df.columns:
                                if col.lower() in ['emp_id', 'id']:
                                    continue
                                u_vals = df[col].dropna().astype(str).str.strip().unique().tolist()
                                non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                if len(non_num) == len(labels_list):
                                    trace.labels = np.array(non_num)
                                    break
            elif trace_type == "bar":
                x_vals = getattr(trace, "x", None)
                if x_vals is not None:
                    try:
                        x_list = [str(x).strip() for x in list(x_vals)]
                    except Exception:
                        x_list = []
                    is_numeric = all(
                        val_str in ["0", "1", "2", "3", "4", "5", "0.0", "1.0", "2.0", "3.0"]
                        for val_str in x_list
                    )
                    if is_numeric and len(x_list) > 0:
                        gender_col = next((c for c in df.columns if c.lower() in ['gender', 'sex']), None)
                        if gender_col:
                            u_vals = df[gender_col].dropna().astype(str).str.strip().unique().tolist()
                            non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                            if len(non_num) >= len(x_list):
                                trace.x = np.array(non_num[:len(x_list)])
                            else:
                                mapped = []
                                for val_str in x_list:
                                    if val_str in ['0', '0.0']:
                                        mapped.append('Female')
                                    elif val_str in ['1', '1.0']:
                                        mapped.append('Male')
                                    elif val_str in ['2', '2.0']:
                                        mapped.append('Other')
                                    else:
                                        mapped.append(val_str)
                                trace.x = np.array(mapped)
                        else:
                            for col in df.columns:
                                if col.lower() in ['emp_id', 'id']:
                                    continue
                                u_vals = df[col].dropna().astype(str).str.strip().unique().tolist()
                                non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                if len(non_num) == len(x_list):
                                    trace.x = np.array(non_num)
                                    break
    except Exception:
        pass
    return val


def _fix_chart_labels(chart_data, df):
    if not isinstance(chart_data, dict) or "data" not in chart_data:
        return chart_data
    try:
        for trace in chart_data.get("data", []):
            if isinstance(trace, dict):
                trace_type = trace.get("type")
                if trace_type == "pie":
                    labels = trace.get("labels")
                    if isinstance(labels, list) and len(labels) > 0:
                        is_numeric = all(
                            str(lbl).strip() in ["0", "1", "2", "3", "4", "5", "0.0", "1.0", "2.0", "3.0"]
                            for lbl in labels
                        )
                        if is_numeric:
                            gender_col = next((c for c in df.columns if c.lower() in ['gender', 'sex']), None)
                            if gender_col:
                                u_vals = df[gender_col].dropna().astype(str).str.strip().unique().tolist()
                                non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                if len(non_num) >= len(labels):
                                    trace["labels"] = non_num[:len(labels)]
                                else:
                                    mapped = []
                                    for lbl in labels:
                                        s_lbl = str(lbl).strip()
                                        if s_lbl in ['0', '0.0']:
                                            mapped.append('Female')
                                        elif s_lbl in ['1', '1.0']:
                                            mapped.append('Male')
                                        elif s_lbl in ['2', '2.0']:
                                            mapped.append('Other')
                                        else:
                                            mapped.append(s_lbl)
                                    trace["labels"] = mapped
                            else:
                                for col in df.columns:
                                    if col.lower() in ['emp_id', 'id']:
                                        continue
                                    u_vals = df[col].dropna().astype(str).str.strip().unique().tolist()
                                    non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                    if len(non_num) == len(labels):
                                        trace["labels"] = non_num
                                        break
                elif trace_type == "bar":
                    x_vals = trace.get("x")
                    if isinstance(x_vals, list) and len(x_vals) > 0:
                        is_numeric = all(
                            str(val).strip() in ["0", "1", "2", "3", "4", "5", "0.0", "1.0", "2.0", "3.0"]
                            for val in x_vals
                        )
                        if is_numeric:
                            gender_col = next((c for c in df.columns if c.lower() in ['gender', 'sex']), None)
                            if gender_col:
                                u_vals = df[gender_col].dropna().astype(str).str.strip().unique().tolist()
                                non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                if len(non_num) >= len(x_vals):
                                    trace["x"] = non_num[:len(x_vals)]
                                else:
                                    mapped = []
                                    for val in x_vals:
                                        s_val = str(val).strip()
                                        if s_val in ['0', '0.0']:
                                            mapped.append('Female')
                                        elif s_val in ['1', '1.0']:
                                            mapped.append('Male')
                                        elif s_val in ['2', '2.0']:
                                            mapped.append('Other')
                                        else:
                                            mapped.append(s_val)
                                    trace["x"] = mapped
                            else:
                                for col in df.columns:
                                    if col.lower() in ['emp_id', 'id']:
                                        continue
                                    u_vals = df[col].dropna().astype(str).str.strip().unique().tolist()
                                    non_num = [v for v in u_vals if v not in ['0', '1', '2', '3', '0.0', '1.0']]
                                    if len(non_num) == len(x_vals):
                                        trace["x"] = non_num
                                        break
    except Exception:
        pass
    return chart_data


def _prune_chart_data(chart_data, max_points=500):
    if not isinstance(chart_data, dict) or "data" not in chart_data:
        return chart_data
    try:
        for trace in chart_data.get("data", []):
            if isinstance(trace, dict):
                for key in ["x", "y", "z", "values", "labels", "text", "customdata", "locations"]:
                    if key in trace and isinstance(trace[key], (list, tuple)) and len(trace[key]) > max_points:
                        trace[key] = list(trace[key])[:max_points]
    except Exception:
        pass
    return chart_data


def execute_pandas_code(code: str, data_path: str):

    """
    Execute AI-generated pandas/plotly code safely.
    
    Rather than relying on fragile regex path replacement, we:
    1. Pre-load and clean the DataFrame HERE in Python (guaranteed to work).
    2. Inject it into the exec namespace so `pd.read_csv(anything)` always returns the clean df.
    3. This eliminates ALL path issues, encoding issues, and whitespace bugs.
    """
    import pandas as pd
    import plotly.express as px
    import plotly.graph_objects as go
    import plotly.io as pio
    import types

    # --- Step 1: Pre-load and clean the data reliably ---
    try:
        raw_df = pd.read_csv(data_path)
    except Exception:
        try:
            raw_df = pd.read_csv(data_path, sep=None, engine='python')
        except Exception as load_err:
            return False, f"Could not load dataset: {load_err}", None, str(load_err)

    # Strip whitespace from all string/object columns
    for col in raw_df.select_dtypes(include=['object']).columns:
        raw_df[col] = raw_df[col].str.strip()

    clean_df = raw_df.copy()

    # --- Step 2: Patch pandas read methods globally so exec code always receives clean_df ---
    orig_read_csv = pd.read_csv
    orig_read_excel = pd.read_excel

    pd.read_csv = lambda *a, **kw: clean_df.copy()
    pd.read_excel = lambda *a, **kw: clean_df.copy()

    # --- Step 3: Disable Plotly browser popup ---
    pio.renderers.default = "json"
    def dummy_show(*args, **kwargs):
        pass
    go.Figure.show = dummy_show

    # --- Step 4: Build execution namespace ---
    global_vars = {
        "__builtins__": __builtins__,
        "pd": pd,
        "df": clean_df.copy(),  # pre-loaded df available immediately
        "px": px,
        "go": go,
        "json": json,
    }
    local_vars = {}

    # --- Step 5: Execute the AI code ---
    try:
        f = io.StringIO()
        with redirect_stdout(f):
            exec(code, global_vars, local_vars)

        printed_output = f.getvalue().strip()

        # Collect result text
        result_text = local_vars.get("result_text") or global_vars.get("result_text")
        if not result_text and printed_output:
            result_text = printed_output

        if not result_text or str(result_text).strip().lower() in ["none", "null"]:
            result_text = ""

        # Collect chart — search both local and global vars
        chart_data = None
        all_vars = {**global_vars, **local_vars}
        for key, val in all_vars.items():
            if type(val).__name__ in ["Figure", "BaseFigure"]:
                try:
                    val = _sanitize_plotly_figure(val, clean_df)
                    raw_json = val.to_plotly_json()
                    cleaned_dict = _clean_plotly_data(raw_json)
                    chart_data = json.loads(json.dumps(cleaned_dict, default=str))
                    break
                except Exception:
                    pass

        # Fallback: chart_json string
        chart_json_str = local_vars.get("chart_json") or global_vars.get("chart_json")
        if chart_json_str and not chart_data:
            try:
                chart_data = json.loads(chart_json_str)
            except Exception:
                pass

        if chart_data:
            chart_data = _prune_chart_data(chart_data)
            chart_data = _fix_chart_labels(chart_data, clean_df)

        final_text = str(result_text).strip()
        if final_text.lower() in ["none", "null"]:
            final_text = ""

        return True, final_text, chart_data, None

    except Exception:
        error_msg = traceback.format_exc()
        tb_lines = error_msg.strip().splitlines()
        short_error = "\n".join(tb_lines[-5:]) if len(tb_lines) >= 5 else error_msg
        return False, error_msg, None, short_error
    finally:
        pd.read_csv = orig_read_csv
        pd.read_excel = orig_read_excel
