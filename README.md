# 🤖 AI Festivals & Conferences Scraper

جامع ذكي وشامل لمهرجانات وأحداث الذكاء الاصطناعي من حول العالم

**Intelligent scraper for AI festivals, conferences & events worldwide**

---

## 📋 الميزات | Features

✅ جمع من مصادر متعددة (Eventbrite, Meetup, LinkedIn, المواقع الرسمية)  
✅ دعم 6 مناطق جغرافية (عالمي، الشرق الأوسط، أفريقيا، أوروبا، آسيا، الأمريكيتين)  
✅ تصنيف تلقائي للأحداث (مؤتمرات، ورش عمل، لقاءات، ندوات، قمم، هاكاثون)  
✅ دعم اللغة العربية والإنجليزية  
✅ تصفية بحسب التاريخ والنوع  
✅ إزالة التكرارات التلقائية  
✅ تصدير بصيغ متعددة (JSON, CSV, XLSX)

---

## 🚀 البدء السريع | Quick Start

### الخطوة 1: رفع الـ Actor على Apify

```bash
# تثبيت Apify CLI (إن لم تكن قد ثبته)
npm install -g apify-cli

# تسجيل الدخول
apify login

# إنشاء actor جديد
apify create ai-festivals-scraper

# نسخ الملفات
cp ai-festivals-scraper.js ./
cp package.json ./
cp INPUT_SCHEMA.json ./

# رفع التغييرات
apify push
```

### الخطوة 2: تشغيل الـ Actor

```bash
# محلياً (للاختبار)
apify run

# أو من واجهة Apify
# اذهب إلى https://console.apify.com
```

---

## 📖 التوثيق الكامل | Full Documentation

### 1. المدخلات | Inputs

#### `searchRegions` (مصفوفة)
**المناطق التي تريد البحث فيها**

الخيارات:
- `worldwide` - البحث العالمي
- `middle-east` - الشرق الأوسط
- `africa` - أفريقيا
- `europe` - أوروبا
- `asia` - آسيا
- `americas` - الأمريكيتين

**مثال:**
```json
{
  "searchRegions": ["middle-east", "africa", "asia"]
}
```

---

#### `upcomingOnly` (منطقي)
**جمع الأحداث القادمة فقط (لم تحدث بعد)**

القيمة الافتراضية: `true`

```json
{
  "upcomingOnly": true
}
```

---

#### `minDate` (تاريخ)
**لا تجمع أحداث قبل هذا التاريخ**

الصيغة: `YYYY-MM-DD`  
مثال: `2025-03-03`

```json
{
  "minDate": "2025-06-01"
}
```

---

#### `maxResults` (رقم)
**الحد الأقصى لعدد الأحداث**

- الحد الأدنى: 10
- الحد الأقصى: 1000
- الافتراضي: 100

```json
{
  "maxResults": 500
}
```

---

#### `includeEventTypes` (مصفوفة)
**أنواع الأحداث المراد تضمينها**

الخيارات:
- `conference` - مؤتمرات رسمية
- `workshop` - ورش عمل
- `meetup` - لقاءات ومجتمعات
- `webinar` - ندوات أونلاين
- `summit` - قمم صناعية
- `hackathon` - هاكاثون
- `course` - دورات تدريبية

```json
{
  "includeEventTypes": ["conference", "workshop", "webinar"]
}
```

---

#### `dataSources` (مصفوفة)
**مصادر البيانات التي تريد جمع من منها**

الخيارات:
- `eventbrite` - منصة Eventbrite
- `meetup` - مجتمعات Meetup
- `linkedin` - أحداث LinkedIn
- `official-websites` - المواقع الرسمية للمؤتمرات
- `conference-aggregators` - مجمعات المؤتمرات

```json
{
  "dataSources": ["eventbrite", "meetup", "official-websites"]
}
```

---

#### `language` (نص)
**لغة الإخراج**

الخيارات: `ar` (عربي) أو `en` (إنجليزي)

```json
{
  "language": "ar"
}
```

---

#### `outputFormat` (نص)
**صيغة الإخراج النهائي**

الخيارات:
- `json` - صيغة JSON
- `csv` - جداول CSV
- `xlsx` - ملفات Excel

```json
{
  "outputFormat": "json"
}
```

---

### 2. المخرجات | Outputs

الـ Actor يحفظ البيانات في Dataset يحتوي على:

```json
{
  "summary": {
    "totalEvents": 250,
    "conferences": 45,
    "workshops": 80,
    "meetups": 95,
    "generatedAt": "2025-03-03T10:30:00Z",
    "regions": ["middle-east", "africa"]
  },
  "events": [
    {
      "name": "NeurIPS 2025",
      "url": "https://neurips.cc/",
      "source": "official-website",
      "type": "major-conference",
      "category": "conference",
      "dateInfo": "2025-12-09",
      "location": "New Orleans, USA",
      "description": "المؤتمر الدولي الرسمي...",
      "tags": ["ai", "machine-learning", "research"],
      "region": "americas",
      "addedAt": "2025-03-03T10:30:00Z"
    }
  ]
}
```

---

## 🔗 الربط مع n8n

### الخطوة 1: إضافة Apify Node إلى n8n

```bash
npm install @apify/n8n-nodes-apify
```

### الخطوة 2: إنشاء Workflow

في n8n:
1. أضف node **Apify**
2. اختر **Run Actor**
3. أدخل Actor ID: `ai-festivals-scraper`
4. أدخل المدخلات المطلوبة

### الخطوة 3: معالجة النتائج

```javascript
// استخرج البيانات من Apify
const events = $node['Apify'].json.events;

// رشحها وصنفها
const aiEvents = events.filter(e => 
  e.tags.includes('ai') && 
  new Date(e.dateInfo) > new Date()
);

// أرسلها إلى قاعدة بيانات أو Slack
return aiEvents;
```

---

## 💻 أمثلة استخدام | Usage Examples

### مثال 1: جمع مؤتمرات الشرق الأوسط فقط

```json
{
  "searchRegions": ["middle-east"],
  "includeEventTypes": ["conference", "summit"],
  "minDate": "2025-06-01",
  "maxResults": 50
}
```

### مثال 2: جمع كل الورش والدورات العالمية

```json
{
  "searchRegions": ["worldwide"],
  "includeEventTypes": ["workshop", "course", "webinar"],
  "maxResults": 200,
  "outputFormat": "csv"
}
```

### مثال 3: جمع أحداث أفريقيا وآسيا للعام القادم

```json
{
  "searchRegions": ["africa", "asia"],
  "minDate": "2026-01-01",
  "upcomingOnly": true,
  "dataSources": ["eventbrite", "meetup"]
}
```

---

## 🔧 المتطلبات التقنية | Technical Requirements

- **Node.js**: 16.0+
- **npm**: 7.0+
- **Apify Account**: مجاني أو مدفوع
- **Internet Connection**: للوصول للمصادر

---

## 📊 هيكل البيانات | Data Structure

كل حدث يحتوي على:

```javascript
{
  name: String,           // اسم الحدث
  url: String,            // رابط الحدث
  source: String,         // مصدر البيانات
  type: String,           // نوع المصدر
  category: String,       // تصنيف الحدث
  date: String,           // تاريخ الحدث
  location: String,       // الموقع الجغرافي
  description: String,    // الوصف
  tags: String[],         // الكلمات الرئيسية
  region: String,         // المنطقة المكتشفة
  addedAt: String         // وقت الإضافة
}
```

---

## 🐛 استكشاف الأخطاء | Troubleshooting

### المشكلة: "No results found"

**الحل:**
1. تأكد من صحة `minDate`
2. أضف أكثر من مصدر بيانات
3. اختر `worldwide` بدلاً من منطقة محددة

### المشكلة: "Timeout error"

**الحل:**
1. قلل عدد المناطق المختارة
2. قلل `maxResults`
3. استخدم Apify Proxy

---

## 📝 الترخيص | License

MIT License

---

## 👨‍💻 الدعم | Support

للمساعدة والدعم:
- GitHub Issues: [أنشئ issue جديدة]
- Email: support@example.com
- Apify Community: https://www.apify.com/community

---

## 🔄 التحديثات القادمة | Upcoming Updates

- [ ] دعم Instagram Events و TikTok Events
- [ ] تنبيهات بريدية تلقائية
- [ ] تكامل مع Google Calendar
- [ ] دعم لغات إضافية
- [ ] رسوم بيانية وتحليلات متقدمة

---

**صُنع بـ ❤️ لمجتمع الذكاء الاصطناعي العربي**

Made with ❤️ for the Arab AI Community
