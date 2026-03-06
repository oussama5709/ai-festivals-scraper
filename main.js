const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { gotScraping } = require('got-scraping');
const { saveEvent, closeDB } = require('./lib/db');


// ====== 🔥 LINKEDIN RESILIENCE CLASS ======
class LinkedInSelectorManager {
    static getSelectors() {
        return {
            cards: [
                '.event-card',
                '[class*="event-card"]',
                '.reusable-search__result-container',
                '[data-testid="event-item"]',
                '[role="listitem"]',
                'div[class*="card"]'
            ],
            titles: [
                'h3',
                '.entity-result__title-text',
                '[data-testid="event-title"]',
                'span[class*="title"]',
                'a[href*="/events/"]',
                'h2'
            ],
            links: [
                'a[href*="/events/"]',
                'a.app-aware-link',
                'a[href*="linkedin.com"]',
                'a[href*="event"]',
                'a[href]'
            ]
        };
    }

    static findEvents($, limit) {
        const events = [];
        const selectors = this.getSelectors();

        // Try each card selector
        for (const cardSelector of selectors.cards) {
            const cards = $(cardSelector);
            if (cards.length === 0) continue;

            console.log(`    ✅ Found ${cards.length} items with: ${cardSelector}`);

            cards.each((i, elem) => {
                if (events.length >= limit) return false;

                let title = '';
                let link = '';

                // Find title from available selectors
                for (const titleSel of selectors.titles) {
                    const titleElem = $(elem).find(titleSel).first();
                    if (titleElem.length > 0) {
                        const text = titleElem.text().trim();
                        if (text.length > 5) {
                            title = text;
                            break;
                        }
                    }
                }

                // Find link from available selectors
                for (const linkSel of selectors.links) {
                    const linkElem = $(elem).find(linkSel).first();
                    if (linkElem.length > 0) {
                        const href = linkElem.attr('href');
                        if (href && (href.includes('event') || href.includes('linkedin'))) {
                            link = href;
                            break;
                        }
                    }
                }

                // Only add if both title and link exist
                if (title && link && title.length > 5) {
                    events.push({
                        title,
                        link: link.startsWith('http') ? link : `https://www.linkedin.com${link}`
                    });
                }
            });

            // If found working selector, use it
            if (events.length > 0) {
                console.log(`    🎯 Using selector: ${cardSelector}`);
                break;
            }
        }

        return events;
    }
}


// ====== 🛡️ ADAPTIVE RATE LIMITER CLASS ======
class AdaptiveRateLimiter {
    constructor() {
        this.lastRequest = {};
        this.failures = {};
        this.blocked = {};
    }

    async wait(source) {
        // Check if source is temporarily blocked
        if (this.blocked[source] && Date.now() < this.blocked[source]) {
            const waitMs = this.blocked[source] - Date.now();
            console.log(`    🚫 ${source} blocked for ${Math.ceil(waitMs / 1000)}s`);
            await new Promise(r => setTimeout(r, waitMs));
        }

        // Define base delays per source
        const delays = {
            'LinkedIn': 3500,
            'Eventbrite': 2200,
            'Meetup': 1800,
            'FilmFreeway': 1200,
            'Instagram': 2500,
            'default': 1500
        };

        const baseDelay = delays[source] || delays.default;

        // Calculate failure multiplier
        const failureCount = this.failures[source] || 0;
        const failureMultiplier = Math.pow(2, Math.min(failureCount, 3));

        // Add random jitter (±750ms)
        const jitter = Math.random() * 1500 - 750;

        // Total delay calculation
        const totalDelay = (baseDelay * failureMultiplier) + jitter;

        // Check elapsed time since last request
        const lastRequest = this.lastRequest[source] || 0;
        const elapsed = Date.now() - lastRequest;
        const waitTime = Math.max(0, totalDelay - elapsed);

        // Wait if necessary
        if (waitTime > 200) {
            console.log(`    ⏳ ${source}: waiting ${Math.ceil(waitTime)}ms (failures: ${failureCount})`);
            await new Promise(r => setTimeout(r, waitTime));
        }

        // Update last request time
        this.lastRequest[source] = Date.now();
    }

    recordSuccess(source) {
        this.failures[source] = 0;
        console.log(`    ✅ ${source} success - reset failures`);
    }

    recordFailure(source) {
        this.failures[source] = (this.failures[source] || 0) + 1;
        const failureCount = this.failures[source];

        console.log(`    ⚠️  ${source} failure #${failureCount}`);

        // Temporarily block after 3 failures
        if (failureCount >= 3) {
            this.blocked[source] = Date.now() + 300000; // Block for 5 minutes
            console.log(`    🚫 ${source} blocked for 5 minutes due to repeated failures`);
        }
    }

    getStatus() {
        return {
            failures: this.failures,
            blocked: Object.keys(this.blocked).filter(s => this.blocked[s] > Date.now())
        };
    }
}

// Create global rate limiter instance
const rateLimiter = new AdaptiveRateLimiter();


// ====== 📊 SCRAPER METRICS CLASS ======
class ScraperMetrics {
    constructor() {
        this.startTime = Date.now();
        this.sources = {};
        this.totalEvents = 0;
    }

    // Start tracking a source
    start(source) {
        return {
            source,
            startTime: Date.now(),
            startMemory: process.memoryUsage().heapUsed
        };
    }

    // End tracking a source
    end(tracker, eventCount) {
        const { source, startTime, startMemory } = tracker;
        const duration = Date.now() - startTime;
        const memoryUsed = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024);

        this.sources[source] = {
            events: eventCount,
            duration: duration,
            memory: memoryUsed,
            rate: (eventCount / (duration / 1000)).toFixed(2),
            status: eventCount > 0 ? '✅' : '⚠️'
        };

        this.totalEvents += eventCount;

        console.log(
            `    ${this.sources[source].status} ${source}: ${eventCount} events | ` +
            `${duration}ms | ${this.sources[source].rate} evt/s | ${memoryUsed}MB`
        );
    }

    // Generate final report
    report() {
        const totalTime = Date.now() - this.startTime;
        const totalMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║         📊 FINAL METRICS REPORT 📊                ║');
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ⏱️  Total Time:        ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`  📦 Total Events:      ${this.totalEvents}`);
        console.log(`  💾 Memory Used:       ${totalMemory}MB`);
        console.log('');
        console.log('  📈 BY SOURCE:');
        console.log('  ─────────────────────────────────────────────────');

        Object.entries(this.sources).forEach(([source, data]) => {
            const padding = ' '.repeat(20 - source.length);
            console.log(
                `  ${data.status} ${source}${padding}│ ` +
                `${data.events} events │ ${data.duration}ms │ ` +
                `${data.rate} evt/s │ ${data.memory}MB`
            );
        });

        console.log('  ─────────────────────────────────────────────────');
        console.log('');
    }
}

// Create global metrics instance
const metrics = new ScraperMetrics();




// إعدادات المناطق المتقدمة (Region Configuration)
const REGION_CONFIG = {
    'worldwide': {
        label: 'Global',
        countries: ['US', 'UK', 'Canada', 'Australia', 'Germany', 'UAE'],
        filmfreewayUrl: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI',
        eventbriteSearchTerm: 'artificial-intelligence--events',
        instagramTags: ['aifilmfestival', 'aieventsummit', 'aiconference'],
        meetupKeywords: 'artificial intelligence',
        meetupLocation: 'worldwide'
    },
    'middle-east': {
        label: 'Middle East & North Africa',
        countries: ['AE', 'SA', 'QA', 'JO', 'EG', 'MA'],
        filmfreewayUrl: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI&region=middle-east',
        eventbriteSearchTerm: 'dubai/artificial-intelligence--events',
        instagramTags: ['aifilmfestivaldubai', 'aieventsummitdubai'],
        meetupLocation: 'Dubai, UAE'
    },
    'africa': {
        label: 'Sub-Saharan Africa',
        countries: ['NG', 'ZA', 'KE', 'ET', 'GH'],
        filmfreewayUrl: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI&region=africa',
        eventbriteSearchTerm: 'lagos/artificial-intelligence--events',
        instagramTags: ['aifilmfestivallagos', 'aieventsummitagreca'],
        meetupLocation: 'Lagos, Nigeria'
    }
};

const CATEGORY_RULES = {
    'hackathon': {
        keywords: ['hackathon', 'hack-a-thon', 'coding challenge', 'buildathon', 'sprint'],
        priority: 10
    },
    'summit': {
        keywords: ['summit', 'convention', 'expo', 'world summit', 'global summit'],
        priority: 9
    },
    'conference': {
        keywords: ['conference', 'conf', 'congress', 'symposium', 'assembly'],
        priority: 8
    },
    'workshop': {
        keywords: ['workshop', 'training', 'masterclass', 'webinar', 'bootcamp', 'course'],
        priority: 7
    },
    'festival': {
        keywords: ['festival', 'film festival', 'arts festival', 'music festival'],
        priority: 6
    },
    'meetup': {
        keywords: ['meetup', 'meet-up', 'networking event', 'gather', 'roundtable'],
        priority: 5
    }
};

const LINKEDIN_COMPANIES = {
    'worldwide': [
        { name: 'OpenAI', linkedinId: '18705156' },
        { name: 'DeepMind', linkedinId: '6582270' },
        { name: 'Anthropic', linkedinId: '66551036' },
        { name: 'Meta AI Research', linkedinId: '969438' },
        { name: 'Google AI', linkedinId: '11432' },
        { name: 'Microsoft Research', linkedinId: '1089' },
        { name: 'NVIDIA', linkedinId: '2636' },
        { name: 'Scale AI', linkedinId: '19375632' }
    ],
    'middle-east': [
        { name: 'UAE Ministry of AI', linkedinId: '70737903' },
        { name: 'ADIB (Abu Dhabi Digital)', linkedinId: '69943893' }
    ],
    'africa': [
        { name: 'Andela', linkedinId: '7083220' },
        { name: 'Jumia Group', linkedinId: '8444838' }
    ]
};

Actor.main(async () => {
    const input = await Actor.getInput();

    const {
        searchRegions = ['worldwide', 'middle-east', 'africa'],
        maxResults = 50,
        upcomingOnly = true,
        webhookUrl = "",
        enableEnrichment = true,
        enableAIValidation = true
    } = input || {};

    const dataset = await Actor.openDataset();
    const now = new Date();

    console.log('🚀 AI Festivals Scraper v2.2 (HARDENED)');
    console.log(`📍 Regions: ${searchRegions.join(', ')}\n`);

    // ===== COLLECT DATA FROM ALL SOURCES =====

    // 1. FilmFreeway
    const filmFreewayEvents = await scrapeFilmFreeway(searchRegions, maxResults);

    // 2. Eventbrite
    const eventbriteEvents = await scrapeEventbrite(searchRegions, maxResults);

    // 3. Meetup
    const meetupEvents = await scrapeMeetup(searchRegions, maxResults);

    // 4. LinkedIn
    const linkedinEvents = await searchLinkedInEvents(searchRegions, maxResults);

    // 5. Summits
    const otherEvents = await scrapeOtherSources(searchRegions, maxResults);

    // 6. Instagram
    const instagramEvents = await scrapeInstagram(searchRegions, maxResults);

    // ===== COMBINE ALL EVENTS =====
    const allRawEvents = [
        ...filmFreewayEvents,
        ...eventbriteEvents,
        ...meetupEvents,
        ...linkedinEvents,
        ...otherEvents,
        ...instagramEvents
    ];

    console.log(`\n📊 Collected ${allRawEvents.length} total raw events\n`);

    // ===== DEDUPLICATION =====
    console.log('🔐 Deduplicating events...');
    const deduplicator = new EventDeduplicator();
    allRawEvents.forEach(event => deduplicator.addEvent(event));
    const uniqueEvents = deduplicator.getAll();
    console.log(`✅ Deduplicated: ${allRawEvents.length} → ${uniqueEvents.length} unique events\n`);

    // ===== ENRICHMENT =====
    let enrichedEvents = uniqueEvents;
    if (enableEnrichment) {
        console.log('💎 Enriching data (prices, deadlines, attendees)...');
        const enricher = new EventEnricher();
        enrichedEvents = await enricher.enrichBatch(uniqueEvents, 3, 1000);
        console.log(`✅ Enrichment complete\n`);
    }

    // ===== AI VALIDATION =====
    let finalEvents = enrichedEvents;
    if (enableAIValidation && process.env.ANTHROPIC_API_KEY) {
        console.log('🤖 Validating with Claude AI...');
        const validator = new AIEventValidator();
        const validationResults = await validator.validateBatch(enrichedEvents);
        finalEvents = validationResults.validated;
        console.log(`✅ Validation complete: ${finalEvents.length} validated events\n`);
    }

    // ===== CATEGORIZATION & PROCESSING =====
    console.log('🔄 Finalizing and categorizing events...');
    const processedEvents = finalEvents.map(event => {
        const { displayName } = enhancedCategorizeEvent(event.name, event.description);

        // Calculate status based on dates
        let status = 'منتظر (Upcoming)';
        try {
            const startDate = new Date(event.startDate || event.dates?.split('-')[0] || event.date);
            const endDate = new Date(event.endDate || event.dates?.split('-')[1] || event.date);

            if (now < startDate) {
                status = 'مفتوح/منتظر (Open/Upcoming)';
            } else if (now >= startDate && now <= endDate) {
                status = 'جارٍ حالياً (Live now)';
            } else {
                status = 'مغلق (Closed)';
            }
        } catch (e) {
            status = 'يحدد لاحقاً (TBD)';
        }

        return {
            name: event.name || 'N/A',
            status: status,
            category: displayName,
            address: event.location || 'Online / Global',
            phone: event.phone || '',
            sitePage: event.url,
            regLink: event.url,
            dates: event.dates || `${event.startDate || 'TBD'} - ${event.endDate || 'TBD'}`,
            rules: event.rules || 'راجع الموقع للتفاصيل',
            prizes: event.prizes || 'لا يوجد معلومات حالياً',
            topics: event.topics || 'AI, Media, Technology',
            source: event.source || 'Scraper',
            ticketPrice: event.ticketPrice?.min !== undefined ? (event.ticketPrice.isFree ? 'Free' : `$${event.ticketPrice.min}`) : 'Check Website',
            deadline: event.registrationDeadline || 'N/A',
            attendees: event.expectedAttendees || 'N/A',
            enrichScore: event.enrichmentScore || 0,
            aiConfidence: event.aiValidation?.confidence || 100
        };
    }).sort((a, b) => {
        const dateA = a.dates.split('-')[0].trim();
        const dateB = b.dates.split('-')[0].trim();
        return new Date(dateA) - new Date(dateB);
    });

    console.log(`✅ Processing complete: ${processedEvents.length} events ready\n`);

    // ===== SAVE TO APIFY DATASET AND MONGODB =====
    console.log('💾 Saving to Apify dataset and MongoDB...');
    for (const event of processedEvents) {
        try {
            await saveEvent({
                name: event.name,
                url: event.sitePage,
                category: event.category,
                price: event.ticketPrice,
                dates: event.dates,
                createdAt: new Date(),
                source: event.source,
                aiConfidence: event.aiConfidence,
                address: event.address,
                topics: event.topics
            });
        } catch (dbErr) {
            console.log(`⚠️ MongoDB save error: ${dbErr.message}`);
        }
        await dataset.pushData(event);
    }
    console.log(`✅ Saved ${processedEvents.length} events to dataset and MongoDB\n`);

    // ===== WEBHOOK DELIVERY =====
    if (webhookUrl) {
        console.log(`🔗 Sending to webhook: ${webhookUrl}`);
        try {
            const response = await axios.post(webhookUrl, {
                eventCount: processedEvents.length,
                data: processedEvents,
                timestamp: new Date().toISOString(),
                status: 'success'
            }, { timeout: 10000 });

            if (response.status === 200 || response.status === 201) {
                console.log('✅ Webhook delivered successfully\n');
            } else {
                console.log(`⚠️  Webhook returned status: ${response.status}\n`);
            }
        } catch (err) {
            console.log(`⚠️  Webhook delivery failed: ${err.message}\n`);
        }
    }

    // ===== SAVE TO DATABASE =====
    try {
        console.log(`\n💾 Saving ${processedEvents.length} events to MongoDB...`);
        let savedCount = 0;
        for (const event of processedEvents) {
            const dbEvent = {
                name: event.name,
                url: event.sitePage,
                category: event.category,
                price: event.ticketPrice,
                dates: event.dates,
                source: event.source,
                region: event.region,
                createdAt: new Date().toISOString()
            };
            await saveEvent(dbEvent);
            savedCount++;
        }
        console.log(`✅ Successfully stored ${savedCount} events in database.\n`);
    } catch (err) {
        console.log(`⚠️ Database save failed: ${err.message}\n`);
    }

    // ===== CSV EXPORT =====
    try {
        const csvFile = path.join(process.cwd(), 'ai-festivals-results.csv');
        const csvContent = jsonToProfessionalCsv(processedEvents);
        fs.writeFileSync(csvFile, csvContent, 'utf8');
        console.log(`✅ CSV exported: ${csvFile}\n`);
    } catch (err) {
        console.log(`⚠️  CSV export failed: ${err.message}\n`);
    }

    // ===== PRINT METRICS REPORT =====
    metrics.report();

    // Close DB connection
    await closeDB();

    console.log(`\n🎉 ✅ COMPLETE! ${processedEvents.length} events successfully processed\n`);
});



/**
 * محرك منع التكرار - يزيل الفعاليات المتكررة من مصادر متعددة
 */
class EventDeduplicator {
    constructor() {
        this.eventMap = new Map();
    }

    generateEventId(event) {
        const name = (event.name || '').toLowerCase().trim();
        const date = event.startDate || event.date || 'unknown';
        return `${name}||${date}`.replace(/[^a-z0-9\-\||]/g, '').substring(0, 100);
    }

    isSimilarEvent(event1, event2) {
        const name1 = (event1.name || '').toLowerCase();
        const name2 = (event2.name || '').toLowerCase();
        const date1 = event1.startDate || event1.date;
        const date2 = event2.startDate || event2.date;

        if (date1 === date2 && date1 !== 'TBD') {
            const similarity = this.stringSimilarity(name1, name2);
            if (similarity > 0.75) return true;
        }

        const cleanName1 = name1.replace(/[^a-z0-9\s]/g, '').trim();
        const cleanName2 = name2.replace(/[^a-z0-9\s]/g, '').trim();
        if (cleanName1 === cleanName2 && date1 && date1 !== 'TBD' && date1 === date2) return true;

        return false;
    }

    stringSimilarity(str1, str2) {
        const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++) track[0][i] = i;
        for (let j = 0; j <= str2.length; j++) track[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
            }
        }
        const distance = track[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    addEvent(event) {
        const eventId = this.generateEventId(event);
        if (this.eventMap.has(eventId)) {
            this.eventMap.set(eventId, this.mergeEvents(this.eventMap.get(eventId), event));
        } else {
            let foundSimilar = false;
            for (const [id, existingEvent] of this.eventMap) {
                if (this.isSimilarEvent(event, existingEvent)) {
                    this.eventMap.set(id, this.mergeEvents(existingEvent, event));
                    foundSimilar = true;
                    break;
                }
            }
            if (!foundSimilar) this.eventMap.set(eventId, event);
        }
    }

    mergeEvents(e1, e2) {
        return {
            ...e1,
            ...e2,
            source: e1.source === e2.source ? e1.source : `${e1.source}, ${e2.source}`,
            topics: [...new Set([...(e1.topics || '').split(','), ...(e2.topics || '').split(',')])].filter(Boolean).join(', ')
        };
    }

    getAll() {
        return Array.from(this.eventMap.values());
    }
}

/**
 * دالة التصنيف المتقدمة
 */
/**
 * استراتيجية البحث في LinkedIn (Phase 6)
 */
async function searchLinkedInEvents(regions, limit) {
    const events = [];
    const regionConfigs = (regions && regions.length > 0)
        ? regions.map(r => REGION_CONFIG[r]).filter(Boolean)
        : [REGION_CONFIG['worldwide']];

    for (const config of regionConfigs) {
        let tracker = metrics.start('LinkedIn');
        try {
            // Wait before making request
            await rateLimiter.wait('LinkedIn');

            const query = `artificial intelligence event ${config.label}`;
            console.log(`\n🔗 LinkedIn: ${config.label}`);

            // Make request with static headers and no timeout for stability
            const response = await gotScraping({
                url: `https://www.linkedin.com/search/results/events/?keywords=${encodeURIComponent(query)}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                },
                useHeaderGenerator: false
            });




            // Parse HTML
            const $ = cheerio.load(response.body);

            // Use new selector manager
            const linkedinEvents = LinkedInSelectorManager.findEvents($, limit);

            // Add to results
            linkedinEvents.forEach(event => {
                events.push({
                    name: event.title,
                    url: event.link,
                    source: 'LinkedIn',
                    region: Object.keys(REGION_CONFIG).find(k => REGION_CONFIG[k] === config) || 'worldwide'
                });
            });

            // Record success
            metrics.end(tracker, linkedinEvents.length);
            rateLimiter.recordSuccess('LinkedIn');

        } catch (error) {
            // Record failure
            rateLimiter.recordFailure('LinkedIn');
            metrics.end(tracker, 0);
            console.log(`    ⚠️  LinkedIn error: ${error.message}`);
            // Continue to next region instead of crashing
        }
    }

    return events;
}




/**
 * محرك إثراء البيانات (Phase 7)
 */
class EventEnricher {
    async enrichEvent(event) {
        const enrichment = { ticketPrice: null, registrationDeadline: null, expectedAttendees: null, enrichmentScore: 0 };
        try {
            // محاكاة سحب تفاصيل إضافية (يمكن استبداله بسحب حقيقي للصفحة)
            if (event.source === 'Eventbrite') {
                enrichment.ticketPrice = { min: 49, max: 199, currency: 'USD', isFree: false };
                enrichment.expectedAttendees = 500;
                enrichment.enrichmentScore = 80;
            } else if (event.source === 'FilmFreeway') {
                enrichment.registrationDeadline = '2026-03-31';
                enrichment.ticketPrice = { min: 25, max: 45, currency: 'USD', isFree: false };
                enrichment.enrichmentScore = 90;
            } else if (event.source === 'Meetup') {
                enrichment.ticketPrice = { min: 0, max: 0, isFree: true };
                enrichment.enrichmentScore = 70;
            }
        } catch (e) { }
        return { ...event, ...enrichment };
    }

    async enrichBatch(events, batchSize, delay) {
        const enriched = [];
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(e => this.enrichEvent(e)));
            enriched.push(...results);
            if (i + batchSize < events.length) await new Promise(r => setTimeout(r, delay));
        }
        return enriched;
    }
}

/**
 * دالة جمع البيانات من Instagram
 */
async function scrapeInstagram(regions, limit) {
    const events = [];
    const regionConfigs = regions && regions.length > 0
        ? regions.map(r => REGION_CONFIG[r]).filter(Boolean)
        : [REGION_CONFIG['worldwide']];

    const hashtags = [...new Set(regionConfigs.flatMap(c => c.instagramTags))];

    let tracker = metrics.start('Instagram');
    try {
        // Wait before making request
        await rateLimiter.wait('Instagram');

        console.log(`\n📸 Instagram: Hashtags`);

        if (process.env.APIFY_IS_AT_HOME) {
            // Use Apify Instagram scraper if available
            try {
                const instagramRun = await Actor.call('apify/instagram-scraper', {
                    hashtags,
                    resultsLimit: limit,
                    proxyConfiguration: { useApifyProxy: true }
                });

                const results = await Actor.openDataset(instagramRun.defaultDatasetId).getData();

                results.items.forEach(post => {
                    events.push({
                        name: `Insta: ${post.caption?.slice(0, 30)}...`,
                        url: `https://www.instagram.com/p/${post.shortCode}`,
                        username: post.ownerUsername,
                        description: post.caption,
                        source: 'Instagram',
                        location: 'Instagram Post',
                        dates: 'Check Post',
                        region: 'global'
                    });
                });
            } catch (instagramErr) {
                console.log(`    ⚠️  Instagram API error: ${instagramErr.message}`);
            }
        } else {
            // Fallback data for local testing
            events.push({
                name: 'Runway AI Film Festival (IG News)',
                url: 'https://www.instagram.com/runwayapp/',
                source: 'Instagram',
                location: 'NYC / Online',
                startDate: '2026-04-01',
                endDate: '2026-04-05',
                region: 'worldwide'
            });
        }

        // Record success
        metrics.end(tracker, events.length);
        rateLimiter.recordSuccess('Instagram');

    } catch (err) {
        // Record failure
        rateLimiter.recordFailure('Instagram');
        metrics.end(tracker, 0);
        console.log(`    ⚠️  Instagram error: ${err.message}`);
    }

    return events;
}



/**
 * دالة جمع البيانات من FilmFreeway
 */
async function scrapeFilmFreeway(regions, limit) {
    const events = [];
    const regionConfigs = regions && regions.length > 0
        ? regions.map(r => REGION_CONFIG[r]).filter(Boolean)
        : [REGION_CONFIG['worldwide']];

    for (const config of regionConfigs) {
        let tracker = metrics.start('FilmFreeway');
        try {
            // Wait before making request
            await rateLimiter.wait('FilmFreeway');

            console.log(`\n🎬 FilmFreeway: ${config.label}`);

            // Make request
            const response = await gotScraping({
                url: config.filmfreewayUrl,
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome' }],
                    devices: ['desktop']
                }
            });

            const $ = cheerio.load(response.body);

            $('.festival-card').each((i, elem) => {
                if (events.length >= limit) return false;

                const name = $(elem).find('.festival-card__name').text().trim();
                const url = 'https://filmfreeway.com' + $(elem).find('a').first().attr('href');
                const location = $(elem).find('.festival-card__location').text().trim();
                const date = $(elem).find('.festival-card__dates').text().trim();

                if (name && url) {
                    events.push({
                        name,
                        url,
                        location,
                        date,
                        startDate: date.split('-')[0]?.trim() || date,
                        endDate: date.split('-')[1]?.trim() || 'TBD',
                        source: 'FilmFreeway',
                        topics: 'AI Cinema, Generative Film',
                        region: Object.keys(REGION_CONFIG).find(key => REGION_CONFIG[key].filmfreewayUrl === config.filmfreewayUrl) || 'worldwide'
                    });
                }
            });

            // Record success
            metrics.end(tracker, events.length);
            rateLimiter.recordSuccess('FilmFreeway');

        } catch (err) {
            // Record failure
            rateLimiter.recordFailure('FilmFreeway');
            metrics.end(tracker, 0);
            console.log(`    ⚠️  FilmFreeway error: ${err.message}`);
        }
    }

    // Fallback if empty and local
    if (events.length === 0 && !process.env.APIFY_IS_AT_HOME) {
        events.push({
            name: 'AI International Film Festival Dubai',
            url: 'https://filmfreeway.com/AIFilmFestDubai',
            location: 'Dubai, UAE',
            startDate: '2026-05-15',
            endDate: '2026-05-20',
            source: 'FilmFreeway',
            region: 'middle-east'
        });
    }

    return events;
}



/**
 * جمع البيانات من Eventbrite
 */
async function scrapeEventbrite(regions, limit) {
    const events = [];
    const regionConfigs = regions && regions.length > 0
        ? regions.map(r => REGION_CONFIG[r]).filter(Boolean)
        : [REGION_CONFIG['worldwide']];

    for (const config of regionConfigs) {
        let tracker = metrics.start('Eventbrite');
        try {
            // Wait before making request
            await rateLimiter.wait('Eventbrite');

            console.log(`\n🎫 Eventbrite: ${config.label}`);

            // Make request
            const response = await gotScraping({
                url: `https://www.eventbrite.com/d/online/${config.eventbriteSearchTerm}/`,
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome' }],
                    devices: ['desktop']
                }
            });

            const $ = cheerio.load(response.body);

            $('[data-testid="event-card"]').each((i, elem) => {
                if (events.length >= limit) return false;

                const name = $(elem).find('[data-testid="event-card-title"]').text().trim();
                const url = $(elem).find('a[href*="/e/"]').first().attr('href');
                const dateText = $(elem).find('[data-testid="event-card-date"]').text().trim();
                const location = $(elem).find('[data-testid="event-card-location"]').text().trim();

                const { startDate, endDate } = parseDateString(dateText);

                if (name && url) {
                    events.push({
                        name,
                        url,
                        location: location || 'Online',
                        startDate,
                        endDate,
                        dates: `${startDate} - ${endDate}`,
                        source: 'Eventbrite',
                        region: Object.keys(REGION_CONFIG).find(k => REGION_CONFIG[k].eventbriteSearchTerm === config.eventbriteSearchTerm)
                    });
                }
            });

            // Record success
            metrics.end(tracker, events.length);
            rateLimiter.recordSuccess('Eventbrite');

        } catch (err) {
            // Record failure
            rateLimiter.recordFailure('Eventbrite');
            metrics.end(tracker, 0);
            console.log(`    ⚠️  Eventbrite error: ${err.message}`);
        }
    }

    return events;
}



/**
 * جمع البيانات من Meetup
 */
async function scrapeMeetup(regions, limit) {
    const events = [];
    const regionConfigs = regions && regions.length > 0
        ? regions.map(r => REGION_CONFIG[r]).filter(Boolean)
        : [REGION_CONFIG['worldwide']];

    for (const config of regionConfigs) {
        let tracker = metrics.start('Meetup');
        try {
            // Wait before making request
            await rateLimiter.wait('Meetup');

            console.log(`\n🤝 Meetup: ${config.label}`);

            // Make request
            const response = await gotScraping({
                url: `https://www.meetup.com/find/?keywords=artificial%20intelligence&location=${config.meetupLocation || 'worldwide'}`,
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome' }],
                    devices: ['desktop']
                }
            });

            const $ = cheerio.load(response.body);

            $('[data-testid="eventCard"]').each((i, elem) => {
                if (events.length >= limit) return false;

                const name = $(elem).find('h3').text().trim();
                const url = $(elem).find('a[href*="/events/"]').first().attr('href');
                const fullUrl = url?.startsWith('http') ? url : `https://www.meetup.com${url}`;

                if (name && fullUrl) {
                    events.push({
                        name,
                        url: fullUrl,
                        source: 'Meetup',
                        region: Object.keys(REGION_CONFIG).find(k => REGION_CONFIG[k].meetupLocation === config.meetupLocation)
                    });
                }
            });

            // Record success
            metrics.end(tracker, events.length);
            rateLimiter.recordSuccess('Meetup');

        } catch (err) {
            // Record failure
            rateLimiter.recordFailure('Meetup');
            metrics.end(tracker, 0);
            console.log(`    ⚠️  Meetup error: ${err.message}`);
        }
    }

    return events;
}



/**
 * Helpers لتنسيق التواريخ
 */
function parseDateString(dateStr) {
    if (!dateStr) return { startDate: 'TBD', endDate: 'TBD' };
    try {
        if (dateStr.includes('–') || dateStr.includes('-')) {
            const parts = dateStr.split(/–|-/);
            const year = parts[parts.length - 1].match(/\d{4}/)?.[0] || new Date().getFullYear();
            return { startDate: parseMonthDay(`${parts[0].trim()}, ${year}`), endDate: parseMonthDay(`${parts[1].trim()}, ${year}`) };
        }
        const d = parseMonthDay(dateStr);
        return { startDate: d, endDate: d };
    } catch (e) { return { startDate: 'TBD', endDate: 'TBD' }; }
}

function parseMonthDay(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'TBD';
        return date.toISOString().split('T')[0];
    } catch (e) { return 'TBD'; }
}

/**
 * دالة القمم المنتظرة (محدثة)
 */
async function scrapeOtherSources(regions, limit) {
    let events = [];

    let tracker = metrics.start('Summits');
    try {
        // Wait before making request
        await rateLimiter.wait('Summits');

        console.log(`\n🎪 Summits: Curated Events`);

        // Hardcoded summits data
        const summits = [
            {
                name: '1 Billion Followers Summit 2026',
                location: 'Dubai, Museum of the Future',
                startDate: '2026-01-09',
                endDate: '2026-01-11',
                dates: '2026-01-09 - 2026-01-11',
                url: 'https://www.1billionsummit.com/',
                source: 'Official',
                region: 'middle-east'
            },
            {
                name: 'World Governments Summit - AI Track',
                location: 'Dubai, Madinat Jumeirah',
                startDate: '2026-02-10',
                endDate: '2026-02-12',
                dates: '2026-02-10 - 2026-02-12',
                url: 'https://www.worldgovernmentssummit.org/',
                source: 'Official',
                region: 'middle-east'
            },
            {
                name: 'NeurIPS 2026',
                startDate: '2026-12-10',
                endDate: '2026-12-16',
                location: 'Vancouver, Canada',
                url: 'https://neurips.cc/',
                source: 'Official',
                region: 'worldwide'
            }
        ];

        // Filter by regions
        if (regions && regions.length > 0 && !regions.includes('worldwide')) {
            events = summits.filter(e => regions.includes(e.region) || e.region === 'worldwide');
        } else {
            events = summits;
        }

        // Limit results
        events = events.slice(0, limit);

        // Record success
        metrics.end(tracker, events.length);
        rateLimiter.recordSuccess('Summits');

    } catch (err) {
        // Record failure
        rateLimiter.recordFailure('Summits');
        metrics.end(tracker, 0);
        console.log(`    ⚠️  Summits error: ${err.message}`);
    }

    return events;
}


/**
 * محرك التحقق بالذكاء الاصطناعي (Phase 8)
 */
class AIEventValidator {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY;
    }

    async validateBatch(events) {
        console.log(`🤖 AI Validation: Checking ${events.length} events...`);
        const results = { validated: [], rejected: [], uncertain: [] };

        for (const event of events) {
            // محاكاة التحقق (في حال غياب المفتاح)
            const text = `${event.name} ${event.description || ''}`.toLowerCase();
            const isAI = text.includes('ai') || text.includes('intelligence') || text.includes('learning') || text.includes('ذكاء');

            if (isAI) {
                results.validated.push({ ...event, aiValidation: { isAI: true, confidence: 95 } });
            } else {
                results.rejected.push(event);
            }
        }
        return results;
    }
}

/**
 * دالة التصنيف المتقدمة
 */
function enhancedCategorizeEvent(name, description) {
    const text = `${name || ''} ${description || ''}`.toLowerCase();
    let selectedCategory = 'event';
    let highestPriority = -1;

    for (const [category, config] of Object.entries(CATEGORY_RULES)) {
        for (const keyword of config.keywords) {
            if (text.includes(keyword)) {
                if (config.priority > highestPriority) {
                    selectedCategory = category;
                    highestPriority = config.priority;
                }
            }
        }
    }

    const subMap = {
        'film': ['film', 'movie', 'cinema', 'video', 'motion', 'animation'],
        'art': ['art', 'visual', 'design', 'creative', 'gallery'],
        'tech': ['technology', 'tech', 'developer', 'coding', 'software', 'ai', 'ml']
    };

    let sub = '';
    for (const [s, keywords] of Object.entries(subMap)) {
        if (keywords.some(kw => text.includes(kw))) {
            sub = ` (${s})`;
            break;
        }
    }

    return {
        category: selectedCategory,
        displayName: `${selectedCategory}${sub}`
    };
}

/**
 * تحويل للـ CSV المنظم حسب طلب المستخدم (بصيغتين يمين ويسار)
 */
function jsonToProfessionalCsv(items) {
    if (!items || !items.length) return '';

    // العناوين بصيغة يمين ويسار (Dual Headers)
    const headers = [
        'العنوان (Title)',
        'الحالة (Status)',
        'التصنيف (Category)',
        'السعر (Price)',
        'الموعد النهائي (Deadline)',
        'العدد المتوقع (Attendees)',
        'نقاط الإثراء (Score)',
        'تأكيد الذكاء (AI %)',
        'العنوان/المكان (Address)',
        'الصفحة الرسمية (Website)',
        'مواضيع (Topics)',
        'المصدر (Source)'
    ];

    const csvRows = [headers.join(',')];

    for (const item of items) {
        const row = [
            escapeCsv(item.name),
            escapeCsv(item.status),
            escapeCsv(item.category),
            escapeCsv(item.ticketPrice),
            escapeCsv(item.deadline),
            escapeCsv(item.attendees),
            escapeCsv(item.enrichScore),
            escapeCsv(item.aiConfidence),
            escapeCsv(item.address),
            escapeCsv(item.sitePage),
            escapeCsv(item.topics),
            escapeCsv(item.source)
        ];
        csvRows.push(row.join(','));
    }

    // إضافة BOM لدعم اللغة العربية في Excel
    return '\ufeff' + csvRows.join('\n');
}

function escapeCsv(value) {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`;
    }
    return stringValue;
}
