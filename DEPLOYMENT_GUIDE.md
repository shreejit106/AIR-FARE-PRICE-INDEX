# 🌐 APIx Cloud Deployment Guide (Vercel + Render)

Follow these exact steps to get your project live on the internet with a public HTTPS link.

---

## ⚡ Architecture
* **Frontend:** Deployed to **Vercel** (Global Edge CDN, auto-builds on push).
* **Backend:** Deployed to **Render** (FastAPI + Uvicorn web service).

---

## Step 1: Deploy Backend to Render (3 Minutes)

1. Open **[render.com](https://render.com)** and Sign in with your **GitHub** account.
2. Click **New +** (top right) $\to$ **Web Service**.
3. Select your repository: **`AIR-FARE-PRICE-INDEX`**.
4. Fill in the deployment settings:
   * **Name:** `apix-backend`
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** `Free`
5. Click **Create Web Service**.
6. Wait 1–2 minutes for the build to finish. Copy your live backend URL (e.g. `https://apix-backend.onrender.com`).
   * *Verify by opening `https://apix-backend.onrender.com/docs` in your browser.*

---

## Step 2: Deploy Frontend to Vercel (2 Minutes)

1. Open **[vercel.com](https://vercel.com)** and Sign in with **GitHub**.
2. Click **Add New...** $\to$ **Project**.
3. Import **`AIR-FARE-PRICE-INDEX`**.
4. Configure the Project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click *Edit* and select **`frontend`**
   * **Build Command:** `npm run build` (default)
   * **Output Directory:** `dist` (default)
5. Expand **Environment Variables** and add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://apix-backend.onrender.com` *(use your Render URL from Step 1, with NO trailing slash)*
6. Click **Deploy**.

---

## ✅ You're Live!
Vercel will give you a public URL like:
👉 **`https://air-fare-price-index.vercel.app`**

Anyone, including SIH judges and evaluators anywhere in the world, can access your platform with zero local setup.
