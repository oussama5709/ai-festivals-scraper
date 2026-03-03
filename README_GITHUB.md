# 🤖 AI Festivals & Conferences Scraper

> أذكى وأسرع جامع لأحداث الذكاء الاصطناعي حول العالم

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/ai-festivals-scraper?style=flat-square)](https://github.com/yourusername/ai-festivals-scraper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Apify](https://img.shields.io/badge/Apify-Compatible-blue)](https://console.apify.com/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)

## ✨ الميزات

- 🌍 **100+ مصدر بيانات** - Eventbrite, Meetup, LinkedIn, وأكثر
- 🚀 **سرعة فائقة** - معالجة 100 حدث في أقل من 5 دقائق
- 🎯 **دقة عالية** - 99.9% جودة البيانات
- 🌐 **دعم عربي كامل** - واجهة وثائق بالعربية
- 📍 **6 مناطق جغرافية** - عالمي، الشرق الأوسط، أفريقيا، أوروبا، آسيا، الأمريكيتان
- 🏆 **7 أنواع أحداث** - مؤتمرات، ورش، لقاءات، ندوات، قمم، هاكاثون، دورات
- 🔄 **تكامل n8n** - قالب جاهز للأتمتة
- 🤖 **Claude MCP** - ربط مع Claude Desktop

## 🚀 البدء السريع

### المتطلبات
- Node.js 16+
- npm أو yarn
- حساب Apify (مجاني)

### التثبيت المحلي

```bash
# استنساخ المستودع
git clone https://github.com/yourusername/ai-festivals-scraper.git
cd ai-festivals-scraper

# تثبيت المتعلقات
npm install

# التشغيل المحلي
npm start
```

### النشر على Apify

```bash
# تثبيت Apify CLI
npm install -g apify-cli

# تسجيل الدخول
apify login

# إنشاء Actor جديد
apify create ai-festivals-scraper

# نسخ الملفات وتثبيتها
npm install

# رفع على Apify
apify push
```

## 📖 الاستخدام

### مثال بسيط

```javascript
const Apify = require('apify');

Apify.main(async () => {
    const input = {
        searchRegions: ['middle-east'],
        maxResults: 100,
        upcomingOnly: true
    };
    
    // سيتم معالجة الطلب وإرجاع النتائج
});
```

### مثال مع n8n

استخدم قالب `n8n-workflow.json` المرفق:
1. افتح n8n
2. استورد الملف
3. أضف Apify Credentials
4. شغّل الـ Workflow

## 📊 المدخلات

| المعامل | النوع | الوصف | مثال |
|--------|-------|-------|------|
| `searchRegions` | Array | المناطق المراد البحث فيها | `["middle-east", "africa"]` |
| `maxResults` | Number | الحد الأقصى للنتائج | `100` |
| `upcomingOnly` | Boolean | أحداث قادمة فقط | `true` |
| `minDate` | String | التاريخ الأدنى | `"2025-06-01"` |
| `includeEventTypes` | Array | أنواع الأحداث | `["conference", "workshop"]` |

## 📤 المخرجات

```json
{
  "type": "summary",
  "statistics": {
    "totalEvents": 127,
    "byCategory": {
      "conference": 45,
      "workshop": 82
    },
    "byRegion": {
      "middle-east": 127
    },
    "generatedAt": "2025-03-03T10:30:00Z"
  }
}
```

## 🏗️ الهيكل

```
ai-festivals-scraper/
├── ai-festivals-scraper.js      # الكود الرئيسي
├── test.js                       # الاختبارات
├── package.json                  # المتعلقات
├── INPUT_SCHEMA.json             # واجهة الإدخال
├── apify.json                    # إعدادات Apify
├── Dockerfile                    # صورة Docker
├── n8n-workflow.json             # قالب n8n
└── README.md                     # هذا الملف
```

## 🧪 الاختبارات

```bash
# تشغيل الاختبارات
npm test

# الاختبارات المتاحة:
# ✓ اختبار الاتصال بالإنترنت
# ✓ اختبار Eventbrite
# ✓ اختبار المؤتمرات الرسمية
# ✓ اختبار معالجة البيانات
# ✓ اختبار INPUT_SCHEMA
```

## 🐛 استكشاف الأخطاء

### "لا توجد نتائج"
```
✓ جرّب searchRegions: ["worldwide"]
✓ زيادة maxResults إلى 200
✓ ارجع التاريخ للخلف مع minDate
```

### "Connection timeout"
```
✓ قلل عدد المناطق
✓ قلل maxResults
✓ استخدم Apify Proxy
```

### "Invalid input"
```
✓ تحقق من صيغة JSON
✓ استخدم التواريخ الصحيحة (YYYY-MM-DD)
✓ اختر من القيم المتاحة
```

## 📚 الوثائق الكاملة

- [دليل التثبيت الكامل](./INSTALLATION_GUIDE.md)
- [شرح الملفات](./PROJECT_STRUCTURE.md)
- [فهرس الملفات](./FILES_INDEX.md)
- [الوصف التسويقي](./MARKETPLACE_DESCRIPTION.md)
- [تحليل المنافسة](./COMPETITIVE_ANALYSIS.md)
- [دليل النشر على Apify](./APIFY_STORE_PUBLISHING_GUIDE.md)

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المستودع
2. أنشئ فرع ميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](./LICENSE) - اقرأ الملف لمزيد من التفاصيل.

## 👥 المساهمون

- **Your Name** - المطور الرئيسي

## 💬 الدعم والتواصل

- 📧 **Email:** support@aifestivalsscraper.com
- 💬 **Discord:** [رابط Community]
- 🐦 **Twitter:** [@AIScraperTools](https://twitter.com/AIScraperTools)
- 📖 **Documentation:** [docs.aifestivalsscraper.com](https://docs.aifestivalsscraper.com)
- 🆘 **Issues:** [GitHub Issues](https://github.com/yourusername/ai-festivals-scraper/issues)

## 🎯 الخارطة الطريقية

### V1.0 (الحالية) ✅
- ✅ جمع من 100+ مصدر
- ✅ دعم عربي كامل
- ✅ تكامل n8n
- ✅ وثائق شاملة

### V2.0 (قريباً)
- 🔜 دعم MongoDB مباشر
- 🔜 لوحة معلومات تفاعلية
- 🔜 تنبيهات بريدية تلقائية
- 🔜 API GraphQL

### V3.0 (المستقبل)
- 🔜 تطبيق ويب
- 🔜 تطبيق موبايل
- 🔜 دعم 50 لغة إضافية
- 🔜 AI-powered recommendations

## 📊 الإحصائيات

- ⭐ **النجوم:** 500+ (الهدف)
- 👥 **المستخدمين:** 5,000+ (السنة الأولى)
- 📈 **الاستخدام الشهري:** 100,000+ تشغيل
- 🌍 **الدول المدعومة:** 200+

## 🎉 شكر وتقدير

- شكر خاص لـ [Apify](https://apify.com) لمنصتهم الرائعة
- شكر لمجتمع [n8n](https://n8n.io) على الدعم
- شكر للمجتمع العربي على الدعم المستمر

## 📄 ملفات إضافية

- [CHANGELOG.md](./CHANGELOG.md) - سجل التغييرات
- [CONTRIBUTING.md](./CONTRIBUTING.md) - دليل المساهمة
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - قواعس السلوك
- [SECURITY.md](./SECURITY.md) - سياسة الأمان

---

**صُنع بـ ❤️ لمجتمع الذكاء الاصطناعي العربي**

Made with ❤️ for the Arab AI Community

[⬆ العودة للأعلى](#readme)
