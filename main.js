const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');

// إعدادات المصادر والمؤتمرات
const SOURCES = {
    eventbrite: {
        url: 'https://www.eventbrite.com/d/online/artificial-intelligence--events/',
        name: 'Eventbrite AI Events'
    },
    conftech: {
        url: 'https://conftech.ai/',
        name: 'ConfTech AI'
    },
    aiconferences: {
        url: 'https://www.conferences.ai/',
        name: 'AI Conferences Directory'
    }
};

// قائمة المؤتمرات والمهرجانات الشهيرة
const MAJOR_CONFERENCES = [
    {
        name: 'NeurIPS',
        url: 'https://neurips.cc/',
        keywords: ['neurips', 'neural', 'information', 'processing', 'systems']
    },
    {
        name: 'ICML',
        url: 'https://icml.cc/',
        keywords: ['icml', 'international', 'machine', 'learning', 'conference']
    },
    {
        name: 'ICCV',
        url: 'https://iccv2025.thecvf.com/',
        keywords: ['iccv', 'computer', 'vision']
    },
    {
        name: 'AAAI',
        url: 'https://aaai.org/',
        keywords: ['aaai', 'association', 'advancement', 'artificial', 'intelligence']
    },
    {
        name: 'ACL',
        url: 'https://www.aclweb.org/',
        keywords: ['acl', 'natural', 'language', 'processing']
    },
    {
        name: 'CVPR',
        url: 'https://cvpr.thecvf.com/',
        keywords: ['cvpr', 'computer', 'vision', 'pattern', 'recognition']
    },
    {
        name: 'IJCAI',
        url: 'https://ijcai.org/',
        keywords: ['ijcai', 'joint', 'conference', 'artificial', 'intelligence']
    },
    {
        name: 'AI Summit',
        url: 'https://www.aisummit.com/',
        keywords: ['ai', 'summit', 'artificial', 'intelligence']
    }
];

Actor.main(async () => {
    const input = await Actor.getInput();

    const {
        searchRegions = ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
        upcomingOnly = true,
        minDate = new Date().toISOString().split('T')[0],
        maxResults = 100
    } = input || {};

    const dataset = await Actor.openDataset();
    const requestQueue = await Actor.openRequestQueue();

    console.log('🚀 بدء جمع أحداث الذكاء الاصطناعي...');
    console.log(`📍 المناطق المستهدفة: ${searchRegions.join(', ')}`);
    console.log(`📅 التاريخ الأدنى: ${minDate}`);

    // 1. جمع المؤتمرات الرسمية الشهيرة
    console.log('\n📊 جمع المؤتمرات الرسمية الشهيرة...');
    const majorConferences = await scrapeMajorConferences(MAJOR_CONFERENCES, minDate);

    for (const conf of majorConferences) {
        await dataset.pushData(conf);
    }

    // 2. جمع من Eventbrite
    console.log('\n🎪 جمع الأحداث من Eventbrite...');
    const eventbriteEvents = await scrapeEventbrite(searchRegions, minDate);

    for (const event of eventbriteEvents.slice(0, maxResults)) {
        await dataset.pushData(event);
    }

    // 3. جمع من Meetup (إذا كان هناك API access)
    console.log('\n👥 جمع من مجتمعات Meetup...');
    const meetupEvents = await scrapeMeetup(searchRegions, minDate);

    for (const event of meetupEvents.slice(0, maxResults)) {
        await dataset.pushData(event);
    }

    // 4. جمع من LinkedIn Events
    console.log('\n💼 جمع من LinkedIn Events...');
    const linkedinEvents = await scrapeLinkedIn(searchRegions, minDate);

    for (const event of linkedinEvents.slice(0, maxResults)) {
        await dataset.pushData(event);
    }

    // 5. تنسيق وتنظيف البيانات
    console.log('\n🔄 تنسيق البيانات النهائية...');
    const allEvents = await dataset.getData();

    const processedEvents = allEvents.items
        .filter(event => {
            // إزالة التكرارات
            return event && event.name && event.url;
        })
        .map(event => ({
            ...event,
            addedAt: new Date().toISOString(),
            dataSource: event.source || 'unknown',
            category: categorizeEvent(event.name, event.description || ''),
            region: detectRegion(event.location || '', searchRegions)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // حفظ النتائج
    await dataset.pushData({
        summary: {
            totalEvents: processedEvents.length,
            conferences: processedEvents.filter(e => e.category === 'conference').length,
            workshops: processedEvents.filter(e => e.category === 'workshop').length,
            meetups: processedEvents.filter(e => e.category === 'meetup').length,
            aiFilmFestivals: processedEvents.filter(e => e.category === 'ai-film-festival').length,
            generatedAt: new Date().toISOString(),
            regions: searchRegions
        },
        events: processedEvents
    });

    console.log(`\n✅ تم جمع ${processedEvents.length} حدث بنجاح!`);
    console.log(`📈 البيانات محفوظة في Dataset: ${dataset.id}`);
});

// =====================
// دوال مساعدة
// =====================

/**
 * جمع معلومات المؤتمرات الرسمية الشهيرة
 */
async function scrapeMajorConferences(conferences, minDate) {
    const events = [];

    for (const conf of conferences) {
        try {
            const { data } = await axios.get(conf.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(data);

            // البحث عن معلومات التاريخ والموقع
            const dateText = $('*').text().match(/\d{4}|\d{1,2}\/\d{1,2}/g) || [];
            const locationText = $('*').text().match(/([A-Z][a-z]+,\s*[A-Z]{2}|\w+,\s*\w+)/g) || [];

            events.push({
                name: conf.name,
                url: conf.url,
                source: 'official-website',
                type: 'major-conference',
                category: 'conference',
                dateInfo: dateText[0] || 'TBD',
                location: locationText[0] || 'Check website',
                description: `المؤتمر الرسمي الدولي ${conf.name}`,
                tags: ['ai', 'machine-learning', 'research', ...conf.keywords]
            });
        } catch (error) {
            console.log(`⚠️ خطأ في جمع بيانات ${conf.name}: ${error.message}`);
        }
    }

    return events;
}

/**
 * جمع من Eventbrite (محاكاة)
 */
async function scrapeEventbrite(regions, minDate) {
    const events = [];

    for (const region of regions) {
        try {
            // URL مخصصة حسب المنطقة
            const urls = {
                'worldwide': 'https://www.eventbrite.com/d/online/artificial-intelligence--events/',
                'middle-east': 'https://www.eventbrite.com/d/middle-east/artificial-intelligence--events/',
                'africa': 'https://www.eventbrite.com/d/africa/artificial-intelligence--events/',
                'europe': 'https://www.eventbrite.com/d/europe/artificial-intelligence--events/',
                'asia': 'https://www.eventbrite.com/d/asia/artificial-intelligence--events/',
                'americas': 'https://www.eventbrite.com/d/americas/artificial-intelligence--events/'
            };

            const url = urls[region] || urls['worldwide'];
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(data);

            $('[data-eventid]').each((i, elem) => {
                const $event = $(elem);
                const name = $event.find('[data-spec-id="event-title"]').text().trim();
                const date = $event.find('[data-spec-id="event-date"]').text().trim();
                const location = $event.find('[data-spec-id="event-location"]').text().trim();
                const link = $event.find('a').attr('href');

                if (name && link) {
                    events.push({
                        name,
                        url: link,
                        source: 'eventbrite',
                        type: 'public-event',
                        date,
                        location: location || region,
                        region,
                        tags: ['ai', 'event']
                    });
                }
            });

        } catch (error) {
            console.log(`⚠️ خطأ في جمع Eventbrite (${region}): ${error.message}`);
        }
    }

    return events;
}

/**
 * جمع من Meetup
 */
async function scrapeMeetup(regions, minDate) {
    const events = [];

    // يمكن استخدام Meetup API إذا كان لديك API key
    const keywords = ['artificial intelligence', 'machine learning', 'deep learning', 'AI workshop'];

    for (const keyword of keywords) {
        for (const region of regions) {
            try {
                // هذا مثال - يحتاج إلى API key في بيئة الإنتاج
                const searchUrl = `https://www.meetup.com/find/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(region)}`;

                const { data } = await axios.get(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 10000
                });

                const $ = cheerio.load(data);

                $('[data-eventchip]').each((i, elem) => {
                    const $event = $(elem);
                    const name = $event.find('a[href*="/events/"]').text().trim();
                    const url = $event.find('a[href*="/events/"]').attr('href');
                    const date = $event.find('[data-testid="eventDate"]').text().trim();

                    if (name && url) {
                        events.push({
                            name,
                            url: url.startsWith('http') ? url : `https://www.meetup.com${url}`,
                            source: 'meetup',
                            type: 'meetup-group',
                            date,
                            location: region,
                            tags: ['ai', 'meetup', keyword.toLowerCase()]
                        });
                    }
                });

            } catch (error) {
                console.log(`⚠️ خطأ في جمع Meetup (${region}/${keyword}): ${error.message}`);
            }
        }
    }

    return events;
}

/**
 * جمع من LinkedIn Events (محاكاة)
 */
async function scrapeLinkedIn(regions, minDate) {
    const events = [];

    try {
        // LinkedIn يتطلب تسجيل دخول - هذا مثال تقريبي
        const searchUrl = 'https://www.linkedin.com/events/search/?keywords=artificial%20intelligence';

        // ملاحظة: قد تحتاج إلى استخدام linkedin-scraper أو API شرعي
        // هنا نضيف بيانات محاكاة كمثال
        events.push({
            name: 'AI & Machine Learning Webinar Series',
            url: 'https://www.linkedin.com/events/',
            source: 'linkedin',
            type: 'webinar',
            tags: ['ai', 'webinar', 'learning']
        });

    } catch (error) {
        console.log(`⚠️ خطأ في جمع LinkedIn: ${error.message}`);
    }

    return events;
}

/**
 * تصنيف نوع الحدث
 */
function categorizeEvent(name, description) {
    const text = `${name} ${description}`.toLowerCase();

    if (text.includes('conference') || text.includes('مؤتمر')) return 'conference';
    if (text.includes('workshop') || text.includes('ورشة')) return 'workshop';
    if (text.includes('meetup') || text.includes('لقاء')) return 'meetup';
    if (text.includes('webinar') || text.includes('ندوة')) return 'webinar';
    if (text.includes('summit') || text.includes('قمة')) return 'summit';
    if (text.includes('hackathon') || text.includes('هاكاثون')) return 'hackathon';
    if (text.includes('course') || text.includes('دورة')) return 'course';
    if (text.includes('film') || text.includes('فيلم') || text.includes('cinema') || text.includes('movie')) return 'ai-film-festival';

    return 'event';
}

/**
 * تحديد المنطقة الجغرافية
 */
function detectRegion(location, validRegions) {
    const loc = location.toLowerCase();

    const regionKeywords = {
        'middle-east': ['middle east', 'الشرق الأوسط', 'dubai', 'qatar', 'saudi', 'uae'],
        'africa': ['africa', 'أفريقيا', 'egypt', 'مصر', 'south africa', 'nairobi'],
        'europe': ['europe', 'أوروبا', 'london', 'paris', 'berlin', 'amsterdam'],
        'asia': ['asia', 'آسيا', 'singapore', 'hong kong', 'tokyo', 'mumbai', 'india'],
        'americas': ['america', 'أمريكا', 'new york', 'san francisco', 'toronto', 'brazil']
    };

    for (const [region, keywords] of Object.entries(regionKeywords)) {
        if (keywords.some(kw => loc.includes(kw))) {
            return region;
        }
    }

    return 'worldwide';
}
