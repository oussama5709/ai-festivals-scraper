# 🤖 AI Festivals v2.2 - Hardened Production Edition

[![Scraper Status](https://img.shields.io/badge/Scraper-Hardened%20v2.2-blueviolet?style=for-the-badge&logo=apify)](https://console.apify.com)
[![Automation](https://img.shields.io/badge/Automation-GitHub%20Actions-blue?style=for-the-badge&logo=githubactions)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**An intelligent, resilient, and enterprise-grade ecosystem for discovering AI festivals, conferences, and summits worldwide.**

---

## 🌟 What's New in v2.2 (Hardened)

The v2.2 update transforms the scraper from a script into a robust production platform:

-   **🛡️ Resilient Architecture**: `LinkedInSelectorManager` with adaptive fallbacks for surviving DOM changes.
-   **⏳ Intelligent Anti-Blocking**: `AdaptiveRateLimiter` with source-specific delays and exponential backoff.
-   **📊 Metrics Engine**: Real-time tracking of success rates, speed (evt/sec), and memory usage.
-   **🔋 MongoDB persistence**: Automatic extraction, validation, and storage in MongoDB Atlas.
-   **🎨 Premium Dashboard**: Next.js 16 + Tailwind 4 visualization with glassmorphism design.

---

## 🛠️ Tech Stack

-   **Core**: Node.js, Cheerio, Got-Scraping
-   **Platform**: Apify (Cloud Actor)
-   **Database**: MongoDB Atlas
-   **Frontend**: Next.js 16 (App Router), Tailwind CSS 4
-   **Automation**: GitHub Actions

---

## 🚀 Deployment Guide

### 1. Cloud Scraper (Apify)
```bash
# Push to Apify
apify push
# Call the actor
apify call ai-festivals-scraper
```

### 2. Automation (GitHub)
- Create a repo on GitHub.
- Add `APIFY_TOKEN` and `APIFY_ACTOR_ID` (T4QEjwkFqTJTe0S4F) to **Settings > Secrets**.
- The workflow in `.github/workflows/daily-scrape.yml` triggers every day at 2:00 AM UTC.

### 3. Dashboard (Local/Vercel)
```bash
cd dashboard
npm install
npm run dev
```
*Access at [http://localhost:3000](http://localhost:3000)*

---

## 📖 Configuration (INPUT_SCHEMA)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `searchRegions` | Array | regions to search (middle-east, africa, worldwide) |
| `maxResults` | Number | limit of items per source |
| `enableEnrichment` | Boolean | fetch additional event details |
| `enableAIValidation` | Boolean | use AI to verify "AI relevancy" |

---

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:
```env
MONGODB_URI=your_mongodb_connection_string
APIFY_TOKEN=your_apify_api_token
ANTHROPIC_API_KEY=optional_for_advanced_validation
```

---

## 📝 License
MIT License - Copyright (c) 2026 AI Festivals Contributors

---

**Made with ❤️ for the Global AI Community**
