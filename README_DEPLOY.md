# ML Lab — GitHub + Render + Vercel Deployment

This project is prepared as a public web application:

- **Frontend:** React + Vite → Vercel
- **Backend:** Flask + scikit-learn → Render
- **Source code:** GitHub

## 1. Local development

### Backend
```bash
cd backend
py -m pip install -r requirements.txt
py app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_URL`. If it is not set, it defaults to `http://127.0.0.1:5000`.

## 2. Push to GitHub
Create a GitHub repository and push the contents of this folder. Do not upload `.env` files or secrets.

## 3. Deploy the backend to Render

Create a **Web Service** from the GitHub repository. You can also use the included `render.yaml`.

Backend settings if entered manually:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
- Health Check Path: `/api/health`

Set this environment variable in Render:
```text
CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app
```

Render will provide a URL similar to:
```text
https://ml-lab-api.onrender.com
```

## 4. Deploy the frontend to Vercel

Import the same GitHub repository into Vercel and set the **Root Directory** to `frontend`.

Build settings:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Add the environment variable:
```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Then redeploy. Vercel will provide a URL similar to:
```text
https://ml-lab.vercel.app
```

## 5. Final CORS update
Once the Vercel URL is known, update the Render `CORS_ORIGINS` variable to the exact Vercel URL and redeploy/restart the Render service.

## 6. Test
Open the Vercel URL. The dashboard should show **API Online**. Upload a CSV/XLSX, choose features and target, select an implemented algorithm, and run it.

## Important
The current ML Lab is an educational prototype. Uploaded files are processed by the Flask service and are not intended for sensitive or clinical data.
