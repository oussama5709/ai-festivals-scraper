# 🎨 Phase 9+ Dashboard Platform Guide

## 🏗️ Platform Architecture
Transforming the scraper output into a premium SaaS dashboard.

### **Tech Stack**
- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion (for cinematic animations).
- **Backend:** Next.js Server Actions or Node.js/Express.
- **Database:** MongoDB (Scalability) or PostgreSQL (Relational integrity).
- **Data Sync:** Daily cron job fetching results from Apify via `Actor.openDataset().getData()`.

### **MongoDB Schema Design**
```javascript
const EventSchema = {
  title: String,             // Index for search
  status: Enum,              // Upcoming, Live, Closed
  category: String,          // Categorized by Scraper
  source: String,
  location: {
    address: String,
    region: String,          // Global, MENA, Africa
    isOnline: Boolean
  },
  metrics: {
    price: Number,
    attendees: Number,
    ai_score: Number
  },
  urls: {
    website: String,
    registration: String
  }
};
```

### **Premium Features to Implement**
1. **Interactive Map:** Visualize AI events globally using Mapbox or Google Maps.
2. **Smart Filtering:** Filter by "AI Confidence > 90%" or "Free Entry".
3. **Submissions Portal:** Allow organizers to manually "Claim" their event and add verified banners.
4. **Subscription API:** Provide a paid `/api/v1/events` endpoint for corporate users.

## 🚀 Getting Started with Next.js
1. `npx create-next-app@latest ai-events-dashboard`
2. Configure `mongodb` client.
3. Use `fetch` to grab current Apify results on the server-side.
