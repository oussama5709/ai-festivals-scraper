# 🎨 AI Festivals Explorer - Premium Dashboard

[![Framework](https://img.shields.io/badge/Framework-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Design](https://img.shields.io/badge/Design-Tailwind%204-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

A high-performance, cinematic visualization dashboard for the AI Festivals Scraper ecosystem.

---

## ✨ Features

-   **🌌 Cinematic UI**: Dark-mode primary design with glassmorphism and micro-animations.
-   **⚡ Live Synchronicity**: Fetches real-time data directly from your MongoDB Atlas instance.
-   **🔍 Smart Discovery**: Instant search and regional filtering (Worldwide, MEA, etc.).
-   **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile viewing.

---

## 🚀 Setup & Launch

### 1. Requirements
- Node.js 18+
- A running MongoDB Atlas cluster containing the `ai-festivals` database.

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your `MONGODB_URI`.

### 3. Development Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment (Vercel / Netlify)

This dashboard is ready for 1-click deployment:

1.  **Push** this folder to a GitHub repository.
2.  **Connect** the repo to [Vercel](https://vercel.com).
3.  **Add Environment Variables**: Ensure `MONGODB_URI` is set in the Vercel dashboard.
4.  **Deploy**!

---

## 🛠️ Architecture

-   **App Router**: Modern navigation and server-side rendering.
-   **API Routes**: Serverless endpoint at `/api/events` for secure DB access.
-   **State Management**: React `useState` and `useEffect` for fluid interactions.

---

**AI Festivals Scraper Ecosystem © 2026**
