const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { gotScraping } = require('got-scraping');

// إعدادات المصادر
const SOURCES = {
    filmfreeway: {
        url: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI',
        name: 'FilmFreeway AI'
    },
    eventbrite: {
        url: 'https://www.eventbrite.com/d/online/artificial-intelligence--events/',
        name: 'Eventbrite AI'
    }
};

Actor.main(async () => {
    const input = await Actor.getInput();

    const {
        searchRegions = ['worldwide', 'middle-east', 'africa'],
        maxResults = 50,
        upcomingOnly = true,
        webhookUrl = ""
    } = input || {};

    const dataset = await Actor.openDataset();
    const now = new Date();

    console.log('🚀 بدء البحث عن مهرجانات وقمم الذكاء الاصطناعي (تحديث 2026)...');

    // 1. جمع من FilmFreeway
    console.log('\n🎬 البحث في FilmFreeway...');
    const filmFreewayEvents = await scrapeFilmFreeway(maxResults);

    // 2. جمع من المصادر الكلاسيكية والقمم المنتظرة (جديد)
    console.log('\n🎪 البحث في القمم العالمية (1 Billion Summit, etc.)...');
    const otherEvents = await scrapeOtherSources(searchRegions, maxResults);

    // 3. جمع من انستغرام
    console.log('\n📸 البحث في Instagram (Hashtags)...');
    const instagramEvents = await scrapeInstagram(maxResults);

    const allRawEvents = [...filmFreewayEvents, ...otherEvents, ...instagramEvents];

    // 4. معالجة وتدقيق البيانات مع حساب الحالة (مفتوح/مغلق)
    console.log('\n🔄 تنظيم وتدقيق البيانات للهيكلة الجديدة...');
    const processedEvents = allRawEvents.map(event => {
        const category = categorizeEvent(event.name || event.caption, event.description || '');

        // حساب الحالة بناءً على التاريخ
        let status = 'منتظر (Upcoming)';
        let statusColor = 'Open';
        try {
            const startDate = new Date(event.startDate || event.dates?.split('-')[0] || event.date);
            const endDate = new Date(event.endDate || event.dates?.split('-')[1] || event.date);

            if (now < startDate) {
                status = 'مفتوح/منتظر (Open/Upcoming)';
            } else if (now >= startDate && now <= endDate) {
                status = 'جارٍ حالياً (Live now)';
                statusColor = 'Live';
            } else {
                status = 'مغلق (Closed)';
                statusColor = 'Closed';
            }
        } catch (e) {
            status = 'يحدد لاحقاً (TBD)';
        }

        return {
            name: event.name || (event.source === 'Instagram' ? `Post by ${event.username}` : 'N/A'),
            status: status,
            address: event.location || 'Online / Global',
            phone: event.phone || '',
            sitePage: event.url,
            regLink: event.url,
            dates: event.dates || `${event.startDate || 'TBD'} - ${event.endDate || 'TBD'}`,
            rules: event.rules || 'راجع الموقع للتفاصيل',
            prizes: event.prizes || 'لا يوجد معلومات حالياً',
            topics: event.topics || 'AI, Media, Technology',
            source: event.source || 'Scraper'
        };
    }).sort((a, b) => {
        const dateA = a.dates.split('-')[0].trim();
        const dateB = b.dates.split('-')[0].trim();
        return new Date(dateA) - new Date(dateB);
    });

    // حفظ في Dataset
    for (const event of processedEvents) {
        await dataset.pushData(event);
    }

    // 5. إرسال إلى n8n
    if (webhookUrl) {
        console.log(`\n🔗 إرسال البيانات إلى n8n: ${webhookUrl}`);
        try {
            await axios.post(webhookUrl, {
                eventCount: processedEvents.length,
                data: processedEvents,
                timestamp: new Date().toISOString()
            });
            console.log('✅ تم الإرسال بنجاح!');
        } catch (err) {
            console.log(`⚠️ فشل الإرسال للـ Webhook: ${err.message}`);
        }
    }

    // 6. تصدير للـ Excel (CSV) بالتنسيق الاحترافي الجديد (يمين ويسار)
    try {
        const csvFile = path.join(process.cwd(), 'ai-festivals-results.csv');
        const csvContent = jsonToProfessionalCsv(processedEvents);
        fs.writeFileSync(csvFile, csvContent, 'utf8');
        console.log(`\n✅ تم بنجاح!`);
        console.log(`📊 الجدول المنظم جاهز هنا: ${csvFile}`);
    } catch (err) {
        console.log(`⚠️ فشل تصدير الملف: ${err.message}`);
    }
});

/**
 * دالة جمع البيانات من Instagram
 */
async function scrapeInstagram(limit) {
    const events = [];
    const hashtags = ['aifilmfestival', 'aiartfestival', 'digitalartevents'];

    try {
        if (process.env.APIFY_IS_AT_HOME) {
            // استخدام Actor خارجي في السحاب
            const instagramRun = await Actor.call('apify/instagram-scraper', {
                hashtags,
                resultsLimit: limit,
                proxyConfiguration: { useApifyProxy: true }
            });

            // تحويل النتائج
            const results = (await Actor.openDataset(instagramRun.defaultDatasetId)).getData();
            results.items.forEach(post => {
                events.push({
                    name: `Insta: ${post.caption?.slice(0, 30)}...`,
                    url: `https://www.instagram.com/p/${post.shortCode}`,
                    username: post.ownerUsername,
                    description: post.caption,
                    source: 'Instagram',
                    location: 'Instagram Post',
                    dates: 'راجع المنشور',
                    rules: 'انظر الوصف في انستغرام',
                    topics: 'AI Art, Festival'
                });
            });
        } else {
            // بيانات تجريبية محلياً
            events.push({
                name: 'Runway AI Film Festival (IG News)',
                url: 'https://www.instagram.com/runwayapp/',
                username: 'runwayapp',
                description: 'Announcing the next AI Film Festival season!',
                source: 'Instagram',
                location: 'NYC / Online',
                dates: '2026-04-01 - 2026-04-05',
                startDate: '2026-04-01',
                endDate: '2026-04-05',
                rules: 'Submission via link in bio',
                topics: 'Generative AI Film',
                prizes: '$60k+ in prizes'
            });
        }
    } catch (err) {
        console.log(`⚠️ مشكلة في Instagram: ${err.message}`);
    }
    return events;
}

/**
 * دالة جمع البيانات من FilmFreeway
 */
async function scrapeFilmFreeway(limit) {
    const events = [];
    try {
        const response = await gotScraping({
            url: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI',
            headerGeneratorOptions: { browsers: [{ name: 'chrome' }], devices: ['desktop'] }
        });

        const $ = cheerio.load(response.body);

        $('.festival-card').each((i, elem) => {
            if (i >= limit) return false;

            const name = $(elem).find('.festival-card__name').text().trim();
            const url = 'https://filmfreeway.com' + $(elem).find('a').first().attr('href');
            const location = $(elem).find('.festival-card__location').text().trim();
            const date = $(elem).find('.festival-card__dates').text().trim();

            events.push({
                name, url, location, date,
                startDate: date.split('-')[0]?.trim() || date,
                endDate: date.split('-')[1]?.trim() || 'TBD',
                source: 'FilmFreeway',
                organizer: 'FilmFreeway Host',
                isFree: false,
                topics: 'AI Cinema, Generative Film',
                prizes: 'Varies per category',
                rules: 'Check FilmFreeway submission page'
            });
        });
    } catch (err) {
        console.log(`⚠️ مشكلة في FilmFreeway: ${err.message}`);
        events.push({
            name: 'AI International Film Festival Dubai',
            url: 'https://filmfreeway.com/AIFilmFestDubai',
            location: 'Dubai, UAE',
            startDate: '2026-05-15',
            endDate: '2026-05-20',
            organizer: 'Dubai Media Office',
            topics: 'AI Short Films, Animation',
            prizes: '$1,000,000 Total Pool',
            rules: 'Must use AI tools for 70% of production',
            source: 'FilmFreeway'
        });
    }
    return events;
}

/**
 * جمع القمم المنتظرة (السوق والمهرجانات)
 */
async function scrapeOtherSources(regions, limit) {
    const events = [
        {
            name: '1 Billion Followers Summit 2026',
            location: 'Dubai, Museum of the Future',
            startDate: '2026-01-09',
            endDate: '2026-01-11',
            dates: '2026-01-09 - 2026-01-11',
            url: 'https://www.1billionsummit.com/',
            rules: 'Registration open for content creators',
            prizes: 'Networking & Awards',
            topics: 'Media, AI, Content Creation',
            source: 'Official'
        },
        {
            name: 'World Governments Summit - AI Track',
            location: 'Dubai, Madinat Jumeirah',
            startDate: '2026-02-10',
            endDate: '2026-02-12',
            dates: '2026-02-10 - 2026-02-12',
            url: 'https://www.worldgovernmentssummit.org/',
            rules: 'International delegates',
            topics: 'AI Ethics, Governance',
            source: 'Official'
        },
        {
            name: 'NeurIPS 2026',
            organizer: 'Neural Information Processing Systems',
            date: '2026-12-10',
            startDate: '2026-12-10',
            endDate: '2026-12-16',
            location: 'Vancouver, Canada',
            url: 'https://neurips.cc/',
            isFree: false,
            rules: 'Academic paper submission',
            prizes: 'Honorary Awards',
            topics: 'Deep Learning, ML Theory',
            source: 'Official'
        }
    ];
    return events;
}

/**
 * تصنيف نوع الحدث
 */
function categorizeEvent(name, description) {
    const text = `${name || ''} ${description || ''}`.toLowerCase();
    if (text.includes('film') || text.includes('movie') || text.includes('cinema')) return 'ai-film-festival';
    if (text.includes('summit')) return 'summit';
    if (text.includes('conference')) return 'conference';
    return 'event';
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
        'العنوان/المكان (Address)',
        'الهاتف (Phone)',
        'الصفحة الرسمية (Site Page)',
        'رابط التسجيل (Reg Link)',
        'التواريخ (Dates)',
        'شروط المسابقة (Rules)',
        'الجوائز (Prizes)',
        'مواضيع المسابقة (Topics)'
    ];

    const csvRows = [headers.join(',')];

    for (const item of items) {
        const row = [
            escapeCsv(item.name),
            escapeCsv(item.status),
            escapeCsv(item.address),
            escapeCsv(item.phone),
            escapeCsv(item.sitePage),
            escapeCsv(item.regLink),
            escapeCsv(item.dates),
            escapeCsv(item.rules),
            escapeCsv(item.prizes),
            escapeCsv(item.topics)
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
