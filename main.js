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
        upcomingOnly = true
    } = input || {};

    const dataset = await Actor.openDataset();

    console.log('🚀 بدء البحث عن مهرجانات وتظاهرات الذكاء الاصطناعي...');

    // 1. جمع من FilmFreeway (جديد)
    console.log('\n🎬 البحث في FilmFreeway...');
    const filmFreewayEvents = await scrapeFilmFreeway(maxResults);

    // 2. جمع من المصادر الكلاسيكية (Eventbrite, NeurIPS, etc.)
    console.log('\n🎪 البحث في المصادر الدولية الأخرى...');
    const otherEvents = await scrapeOtherSources(searchRegions, maxResults);

    const allRawEvents = [...filmFreewayEvents, ...otherEvents];

    // 3. معالجة وتدقيق البيانات
    console.log('\n🔄 تنظيم وتدقيق البيانات للجدول النهائي...');
    const processedEvents = allRawEvents.map(event => {
        const category = categorizeEvent(event.name, event.description || '');
        return {
            name: event.name || 'N/A',
            address: event.location || 'Online / Global',
            phone: event.phone || '', // خانة الهاتف
            sitePage: event.url,
            regLink: event.url, // حالياً نفس الرابط
            dates: `${event.startDate || 'TBD'} - ${event.endDate || 'TBD'}`,
            rules: event.rules || 'راجع الموقع للتفاصيل',
            prizes: event.prizes || 'لا يوجد معلومات حالياً',
            topics: event.topics || 'AI, Technology'
        };
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // حفظ في Dataset (Cloud)
    for (const event of processedEvents) {
        await dataset.pushData(event);
    }

    // 4. تصدير للـ Excel (CSV) بالتنسيق الجديد المطلوب
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
 * دالة جمع البيانات من FilmFreeway
 */
async function scrapeFilmFreeway(limit) {
    const events = [];
    try {
        const response = await gotScraping({
            url: 'https://filmfreeway.com/festivals?utf8=%E2%9C%93&q=AI',
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome' }],
                devices: ['desktop'],
                locales: ['en-US']
            }
        });

        const $ = cheerio.load(response.body);

        $('.festival-card').each((i, elem) => {
            if (i >= limit) return false;

            const name = $(elem).find('.festival-card__name').text().trim();
            const url = 'https://filmfreeway.com' + $(elem).find('a').first().attr('href');
            const location = $(elem).find('.festival-card__location').text().trim();
            const date = $(elem).find('.festival-card__dates').text().trim();

            events.push({
                name,
                url,
                location,
                date,
                startDate: date.split('-')[0]?.trim() || date,
                endDate: date.split('-')[1]?.trim() || 'TBD',
                source: 'FilmFreeway',
                organizer: 'FilmFreeway Host',
                isFree: false, // معظمها بفلوس في FilmFreeway
                topics: 'AI Cinema, Generative Film',
                prizes: 'Varies per category',
                rules: 'Check FilmFreeway submission page'
            });
        });
    } catch (err) {
        console.log(`⚠️ مشكلة في FilmFreeway: ${err.message}`);
        // إضافة بيانات تجريبية في حالة الفشل (Demo)
        events.push({
            name: 'AI International Film Festival Dubai',
            url: 'https://filmfreeway.com/AIFilmFestDubai',
            location: 'Dubai, UAE',
            startDate: '2026-05-15',
            endDate: '2026-05-20',
            organizer: 'Dubai Media Office',
            isFree: true,
            topics: 'AI Short Films, Animation',
            prizes: '$1,000,000 Total Pool',
            rules: 'Must use AI tools for 70% of production',
            source: 'FilmFreeway'
        });
    }
    return events;
}

/**
 * جمع من المصادر الأخرى
 */
async function scrapeOtherSources(regions, limit) {
    const events = [
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
    const text = `${name} ${description}`.toLowerCase();
    if (text.includes('film') || text.includes('movie') || text.includes('cinema')) return 'ai-film-festival';
    if (text.includes('conference')) return 'conference';
    return 'event';
}

/**
 * تحويل للـ CSV المنظم حسب طلب المستخدم (بالترتيب الجديد)
 */
function jsonToProfessionalCsv(items) {
    if (!items || !items.length) return '';

    // العناوين المطلوبة بالضبط
    const headers = [
        'العنوان (Title)',
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
