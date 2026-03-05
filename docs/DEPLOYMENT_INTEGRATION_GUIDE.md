# 🛠️ Deployment & Integration Guide (v2.0)

## 📅 Three-Week Action Plan

### **Week 1: Deploy v2.0**
- **Day 1-2: Environment Setup**
    - Set `ANTHROPIC_API_KEY` for AI validation.
    - Set `WEBHOOK_URL` to your n8n or Zapier instance.
- **Day 3-4: Local Stress Testing**
    - Run `node main.js` with `maxResults: 200`.
    - Verify `ai-festivals-results.csv` encoding and data quality.
- **Day 5: Apify Deployment**
    - Run `apify push` to deploy the Actor.
    - Set up a schedule (e.g., daily at 00:00 UTC).

### **Week 2: Production Hardening**
- **LinkedIn Stability:** Monitor search selectors (LinkedIn changes frequently). Update `linkedinEventSearch` if data drops.
- **Rate Limiting:** Adjust `delayMs` in `EventEnricher` if receiving HTTP 429 errors.
- **Error Recovery:** Verify that source-specific failures don't crash the entire run (handled by try-catch blocks in `main.js`).

### **Week 3: Plan Phase 9 (The Platform)**
- **Architecture Review:** Study `PHASE_9_PLUS_DASHBOARD.md`.
- **Project Skeleton:** Initialize a Next.js 14 project.
- **API Strategy:** Define endpoints for fetching the processed events from Apify Dataset API.

## 📋 Production Checklist
- [ ] Environment variables secured in Apify/Local `.env`.
- [ ] Regional configs (`REGION_CONFIG`) verified for current season.
- [ ] Webhook integration tested with mock data.
- [ ] CSV BOM encoding verified (Arabic displays correctly in Excel).
- [ ] AI Validation confidence threshold tuned (default 60%).

## 🚨 Maintenance Workflow
1. **Weekly:** Review `ai-festivals-results.csv` for any "N/A" metadata patterns.
2. **Monthly:** Update `LINKEDIN_COMPANIES` list with new AI startups.
3. **Emergency:** If LinkedIn scraping fails, switch to `Official API` mode if key is available.
