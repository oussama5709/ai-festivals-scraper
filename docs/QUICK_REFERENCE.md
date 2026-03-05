# ⚡ Quick Reference Guide

## 🛠️ Essential Commands
```bash
# Test scraper locally
node main.js

# Backup current results
cp ai-festivals-results.csv backup.csv

# Deploy to Apify
apify push
```

## 🔐 Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `APIFY_TOKEN` | Yes | Operations on Apify |
| `ANTHROPIC_API_KEY` | No (Phase 8) | AI Content Validation |
| `WEBHOOK_URL` | No | n8n/Automation |
| `LINKEDIN_API_KEY` | No | Official LinkedIn API |

## ✅ Pre-Deployment Checklist
- [ ] Verify `REGION_CONFIG` matches target markets.
- [ ] Test `maxResults` limit (default 100).
- [ ] Ensure `EXCEL` support is on (UTF-8 BOM enabled).
- [ ] Check webhook URL (if using n8n).

## 📊 Output Format Reference (CSV)
1. **Title:** Event name (En/Ar support).
2. **Status:** Open/Upcoming/Live/Closed.
3. **Price:** Extracted (e.g. $49) or "Check Website".
4. **Deadline:** YYYY-MM-DD.
5. **Score:** Enrichment data points count (0-100).

## 🚨 Troubleshooting
- **Arabic display issues?** Ensure you are using Excel's "Import Data from Text/CSV" with File Origin 65001 (UTF-8).
- **LinkedIn data missing?** This usually means LinkedIn's UI changed; check `linkedinEventSearch` selectors.
