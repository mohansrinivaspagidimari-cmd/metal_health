import csv
import os
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

app = Flask(__name__)
allowed_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

CLASSIFIERS = {
    "Logistic Regression": LogisticRegression(max_iter=2000),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
}

# The latest trained models stay in memory only while Flask is running.
MODEL_STATE = None


def get_dataset_payload(payload):
    """Return unencoded features so each fold learns preprocessing from its training rows only."""
    rows = payload.get("rows")
    if not isinstance(rows, list) or not rows:
        raise ValueError("No dataset rows were provided.")

    df = pd.DataFrame(rows)
    requested_targets = payload.get("targets") or payload.get("target")
    if isinstance(requested_targets, str):
        requested_targets = [requested_targets]
    targets = list(dict.fromkeys(target for target in (requested_targets or []) if target))
    if not targets:
        raise ValueError("Select at least one target column to predict.")

    missing_targets = [target for target in targets if target not in df.columns]
    if missing_targets:
        raise ValueError("Target column(s) not found: " + ", ".join(missing_targets))

    features = payload.get("features") or [column for column in df.columns if column not in targets]
    if not features:
        raise ValueError("Select at least one feature column.")
    missing_features = [feature for feature in features if feature not in df.columns]
    if missing_features:
        raise ValueError("Feature column(s) not found: " + ", ".join(missing_features))
    overlap = [target for target in targets if target in features]
    if overlap:
        raise ValueError("Target columns cannot also be selected as features: " + ", ".join(overlap))

    # A row without its requested label cannot be used for supervised training.
    df = df.dropna(subset=targets).copy()
    if len(df) < 4:
        raise ValueError("Provide at least 4 rows with complete target labels.")

    X = df[features].replace([np.inf, -np.inf], np.nan).copy()
    target_values = {}
    for target in targets:
        raw_y = df[target]
        numeric_y = pd.to_numeric(raw_y, errors="coerce")
        target_values[target] = numeric_y.to_numpy() if numeric_y.notna().all() else raw_y.astype(str).to_numpy()

    return X, target_values, targets, len(df), features


def make_pipeline(algorithm, X):
    """Build preprocessing and classifier together to prevent train/test leakage."""
    numeric_features = X.select_dtypes(include=[np.number, "bool"]).columns.tolist()
    categorical_features = [column for column in X.columns if column not in numeric_features]
    transformers = []

    if numeric_features:
        numeric_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ])
        transformers.append(("numeric", numeric_pipeline, numeric_features))

    if categorical_features:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encode", OneHotEncoder(handle_unknown="ignore")),
        ])
        transformers.append(("categorical", categorical_pipeline, categorical_features))

    if not transformers:
        raise ValueError("Select at least one usable feature column.")

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    return Pipeline([
        ("preprocess", preprocessor),
        ("classifier", clone(CLASSIFIERS[algorithm])),
    ]), numeric_features


@app.get("/api/health")
def health():
    return jsonify({"status": "online", "message": "ML Lab API is running"})


@app.post("/api/upload-dataset")
def upload_dataset():
    """Read a CSV or XLSX selected in the browser and return a preview."""
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "Please choose a CSV or Excel file."}), 400

    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            sample = file.stream.read(65536).decode("utf-8-sig", errors="replace")
            file.stream.seek(0)
            try:
                delimiter = csv.Sniffer().sniff(sample, delimiters=",\t;|").delimiter
            except csv.Error:
                first_line = sample.splitlines()[0] if sample.splitlines() else ""
                delimiter = max((",", "\t", ";", "|"), key=first_line.count)
            df = pd.read_csv(file, sep=delimiter)
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(BytesIO(file.read()), engine="openpyxl")
        else:
            return jsonify({"error": "Supported files: .csv and .xlsx"}), 400

        df = df.dropna(how="all").copy()
        df.columns = [str(column).strip() for column in df.columns]
        df = df.loc[:, ~df.columns.duplicated()]
        if df.empty or len(df.columns) < 2:
            return jsonify({"error": "Dataset must contain at least 2 columns and 1 data row."}), 400

        df = df.replace({np.nan: None})
        rows = df.to_dict(orient="records")
        return jsonify({
            "filename": file.filename,
            "rows": rows,
            "row_count": len(rows),
            "columns": list(df.columns),
            "preview": rows[:8],
        })
    except Exception as exc:
        return jsonify({"error": f"Could not read dataset: {exc}"}), 400


@app.post("/api/train")
def train():
    global MODEL_STATE
    MODEL_STATE = None
    try:
        payload = request.get_json(force=True)
        algorithm = payload.get("algorithm")
        if algorithm not in CLASSIFIERS:
            return jsonify({"error": "Choose Logistic Regression or Random Forest."}), 400

        X, target_values, targets, row_count, features = get_dataset_payload(payload)
        if len(X) < 4:
            return jsonify({"error": "Provide at least 4 rows of data."}), 400

        fitted_models = {}
        target_results = []
        numeric_features = X.select_dtypes(include=[np.number, "bool"]).columns.tolist()

        for target in targets:
            y = np.asarray(target_values[target])
            unique_targets = len(np.unique(y))
            if unique_targets < 2:
                return jsonify({"error": f"{target} requires at least two target classes."}), 400
            if pd.api.types.is_numeric_dtype(y) and unique_targets > 20:
                return jsonify({"error": f"{target} looks like a continuous score. Choose a categorical level/class column instead."}), 400

            counts = pd.Series(y).value_counts()
            n_classes = len(counts)
            test_count = max(n_classes, int(np.ceil(len(y) * 0.2)))
            if test_count >= len(y):
                return jsonify({"error": f"There are too few rows to evaluate {target}."}), 400

            can_stratify = counts.min() >= 2 and (len(y) - test_count) >= n_classes and test_count >= n_classes
            stratify = y if can_stratify else None
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_count, random_state=42, stratify=stratify
            )

            model, _ = make_pipeline(algorithm, X_train)
            # Fit once per target; holdout metrics remain independent of training.
            model.fit(X_train, y_train)
            predictions = model.predict(X_test)
            metrics = {
                "Accuracy": round(float(accuracy_score(y_test, predictions)), 4),
                "Precision": round(float(precision_score(y_test, predictions, average="weighted", zero_division=0)), 4),
                "Recall": round(float(recall_score(y_test, predictions, average="weighted", zero_division=0)), 4),
                "F1 Score": round(float(f1_score(y_test, predictions, average="weighted", zero_division=0)), 4),
            }
            fitted_models[target] = model
            target_results.append({"target": target, "metrics": metrics})

        MODEL_STATE = {
            "models": fitted_models,
            "features": list(features),
            "numeric_features": numeric_features,
            "targets": targets,
            "algorithm": algorithm,
        }
        return jsonify({
            "algorithm": algorithm,
            "targets": target_results,
            "metrics": target_results[0]["metrics"],
            "target": targets[0],
            "rows": row_count,
            "features_used": list(features),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/predict")
def predict():
    if MODEL_STATE is None:
        return jsonify({"error": "Train a model first, then enter feature values to predict."}), 400
    try:
        payload = request.get_json(force=True)
        row = payload.get("row") if isinstance(payload, dict) else None
        if not isinstance(row, dict):
            return jsonify({"error": "Provide one input row with values for the selected features."}), 400
        if not any(value is not None and str(value).strip() for value in row.values()):
            return jsonify({"error": "Enter at least one feature value."}), 400

        model_input = pd.DataFrame([row], columns=MODEL_STATE["features"])
        for column in MODEL_STATE["numeric_features"]:
            model_input[column] = pd.to_numeric(model_input[column], errors="coerce")
        predictions = []
        for target, model in MODEL_STATE["models"].items():
            predicted = model.predict(model_input)[0]
            if hasattr(predicted, "item"):
                predicted = predicted.item()
            predictions.append({"target": target, "prediction": predicted})

        return jsonify({
            "predictions": predictions,
            "targets": MODEL_STATE["targets"],
            "algorithm": MODEL_STATE["algorithm"],
            "features": MODEL_STATE["features"],
            "type": "screening estimate",
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)



