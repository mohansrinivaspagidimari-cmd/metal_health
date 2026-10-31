# ML Lab

A React + Flask Machine Learning playground.

## New dataset features
- Choose a CSV file from the Windows file manager.
- Drag and drop CSV/XLSX files into the dataset box.
- Paste CSV data directly into the app.
- Preview uploaded data.
- Select one or more condition-level targets.
- Select feature columns; questionnaire/symptom columns can be selected together.
- Train and compare Logistic Regression and Random Forest classifiers.
- Enter feature values for one new person and predict the selected category.
- Numeric and categorical feature columns are encoded consistently between training and prediction.
- CSV delimiter detection supports comma, tab, semicolon and pipe separated files.

## Supported file types
- `.csv`
- `.xlsx`

Maximum upload size is 50 MB.

## Start
Open two PowerShell windows in the `ML_Lab_Project` folder.

In the first window, start the backend:

```cmd
py -m pip install -r backend\requirements.txt
```

Then start Flask:

```cmd
cd backend
py app.py
```

In the second PowerShell window, start the frontend:

```cmd
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Prediction workflow
1. Upload a labeled dataset, or click **Load Synthetic Mental-Health Data** for an artificial example containing depression, anxiety, stress, PTSD-like, and overall screening labels.
2. Click **Add detected condition targets** and **Select symptom inputs** on the synthetic example. For other datasets, select target and feature columns manually. Exclude IDs and any scores or labels derived from the target.
3. Train Logistic Regression or Random Forest and review each target's held-out metrics.
4. Enter the same feature values for one new person. The model predicts one class for each selected target and displays general wellbeing ideas.

The app trains one classifier per selected target. Models stay in memory only while Flask is running; restarting Flask clears them. The provided synthetic file has no real participants or clinical labels. Its PTSD-like targets are fabricated for software demonstration and are not a PTSD assessment. Your DASS-42 file supports depression, anxiety and stress targets, but has no PTSD label. A real PTSD model requires an appropriately labeled dataset. Choose categorical targets, not continuous score columns. CSV files can be comma-, tab-, semicolon- or pipe-delimited; XLSX files are also supported.

Predictions are educational screening estimates, not a mental-health diagnosis. The generated data and model do not establish whether someone is well, and results should not guide treatment. For general support ideas, see [NIMH guidance](https://www.nimh.nih.gov/health/publications/my-mental-health-do-i-need-help).


This is an educational ML playground and is not a clinical diagnostic system.
