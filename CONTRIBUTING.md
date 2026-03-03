# 🤝 دليل المساهمة

شكراً لاهتمامك في المساهمة في **AI Festivals & Conferences Scraper**! 💪

نرحب بجميع المساهمات - سواء كانت تقارير الأخطاء، الميزات الجديدة، التحسينات، أو حتى الوثائق.

---

## 📋 قبل أن تبدأ

### اقرأ أولاً:
- ✅ [README.md](./README.md) - فهم عام عن المشروع
- ✅ [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - قواعد السلوك
- ✅ [المشاكل الموجودة](https://github.com/yourusername/ai-festivals-scraper/issues) - تجنب التكرار

---

## 🐛 الإبلاغ عن الأخطاء

### كيفية الإبلاغ عن خطأ:

1. **تحقق أولاً:**
   - تأكد أن الخطأ جديد (لم يتم الإبلاغ عنه من قبل)
   - جرّب النسخة الأحدث من المستودع
   - جرّب مع بيانات إدخال مختلفة

2. **انفتح Issue جديد:**
   - اذهب إلى [Issues](https://github.com/yourusername/ai-festivals-scraper/issues)
   - اضغط **New Issue**
   - اختر **Bug report**

3. **قدم معلومات واضحة:**
   ```
   ### الخطأ
   وصف مختصر للخطأ
   
   ### الخطوات لتكراره
   1. قم بـ...
   2. ثم...
   3. النتيجة: ...
   
   ### السلوك المتوقع
   ماذا كان يجب أن يحدث
   
   ### البيئة
   - Node.js: v16.0.0
   - NPM: v7.0.0
   - OS: Windows/Mac/Linux
   ```

---

## ✨ اقتراح ميزات جديدة

### كيفية اقتراح ميزة:

1. **تحقق من الميزات الموجودة:**
   - هل الميزة المطلوبة موجودة؟
   - هل هناك Issue أو PR مشابه؟

2. **فتح Discussion:**
   - اذهب إلى [Discussions](https://github.com/yourusername/ai-festivals-scraper/discussions)
   - اختر **Feature Request**

3. **صف الميزة:**
   ```
   ### المشكلة
   ماذا تريد؟ لماذا؟
   
   ### الحل المقترح
   كيف يجب تنفيذها؟
   
   ### بدائل أخرى
   هل هناك طرق أخرى؟
   ```

---

## 💻 خطوات المساهمة بالكود

### 1. Fork المستودع
```bash
# اضغط على Fork في أعلى الصفحة
```

### 2. استنساخ المستودع المفروع
```bash
git clone https://github.com/YOUR_USERNAME/ai-festivals-scraper.git
cd ai-festivals-scraper
```

### 3. إنشاء فرع جديد
```bash
# استخدم اسم وصفي للفرع
git checkout -b feature/add-new-source
# أو
git checkout -b fix/connection-timeout
```

### 4. عمل التغييرات
```bash
# عدّل الملفات حسب الحاجة
# تأكد من اتباع أسلوب الكود
# أضف اختبارات إن أمكن
```

### 5. التزام التغييرات
```bash
# أضف التغييرات
git add .

# التزم مع رسالة واضحة
git commit -m "feat: add support for new conference source"
# أو
git commit -m "fix: resolve timeout issue with Eventbrite"
```

### 6. دفع التغييرات
```bash
git push origin feature/add-new-source
```

### 7. فتح Pull Request
- اذهب إلى [Pull Requests](https://github.com/yourusername/ai-festivals-scraper/pulls)
- اضغط **New Pull Request**
- اختر فرعك واملأ النموذج

---

## 📝 معايير الكود

### أسلوب الكود:
```javascript
// ✅ جيد
const getName = () => {
  return 'AI Scraper';
};

// ❌ سيء
const getname=()=>{'AI Scraper'}

// ✅ تعليقات واضحة
// جمع البيانات من Eventbrite
const scrapeEventbrite = async () => {
  // ...
};

// ❌ تعليقات غير مفيدة
// عمل شيء
const doStuff = () => {
  // ...
};
```

### معايير:
- استخدم `const` و `let` بدلاً من `var`
- اسم المتغيرات واضحة: `const eventCount` بدلاً من `const ec`
- أضف تعليقات للعمليات المعقدة
- استخدم `async/await` بدلاً من الـ callbacks
- معالجة الأخطاء شاملة: استخدم `try/catch`

### أمثلة جيدة:
```javascript
/**
 * جمع أحداث من Eventbrite
 * @param {string} region - المنطقة الجغرافية
 * @returns {Promise<Array>} قائمة الأحداث
 */
async function scrapeEventbrite(region) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const events = [];
    // معالجة البيانات...
    
    return events;
  } catch (error) {
    console.error(`Error scraping Eventbrite: ${error.message}`);
    return [];
  }
}
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات:
```bash
npm test
```

### إضافة اختبارات جديدة:
```javascript
// في test.js
describe('New Feature', () => {
  it('should do something', async () => {
    const result = await newFeature();
    expect(result).toBe(true);
  });
});
```

### تغطية الاختبارات:
```bash
npm run test:coverage
```

---

## 📚 تحسين الوثائق

### ملفات الوثائق:
- `README.md` - الملف الرئيسي
- `INSTALLATION_GUIDE.md` - دليل التثبيت
- `PROJECT_STRUCTURE.md` - شرح الملفات
- `[أي ملف .md آخر]`

### كيفية تحسين الوثائق:
1. عدّل الملف المناسب
2. استخدم Markdown صحيح
3. أضف أمثلة واضحة
4. تحقق من الأخطاء الإملائية

---

## 🚀 عملية المراجعة

### ماذا سنفعل:
1. ✅ مراجعة الكود
2. ✅ تشغيل الاختبارات
3. ✅ التحقق من الأداء
4. ✅ مراجعة الوثائق

### ماذا نتوقع منك:
1. ✅ الرد على الملاحظات
2. ✅ إجراء التعديلات المطلوبة
3. ✅ تحديث PR عند الحاجة
4. ✅ الصبر والاحترام

### معايير القبول:
- ✅ لا توجد أخطاء في الكود
- ✅ جميع الاختبارات نجحت
- ✅ الأداء لم يتدهور
- ✅ الوثائق محدثة
- ✅ اتبع معايير الكود

---

## 🎯 أولويات المساهمات

### نرحب بـ:
- 🟢 تصحيح الأخطاء
- 🟢 تحسينات الأداء
- 🟢 إضافة مصادر جديدة
- 🟢 تحسينات الوثائق
- 🟢 ترجمة للغات جديدة
- 🟢 اختبارات جديدة

### نحن حذرون من:
- 🟠 تغييرات جذرية بدون نقاش
- 🟠 إضافة متعلقات جديدة ضخمة
- 🟠 تغييرات في الواجهة الرئيسية
- 🟠 إزالة ميزات موجودة

---

## 📞 الدعم والتواصل

### أين تطلب المساعدة:
- 💬 **Discussions:** للأسئلة والنقاشات العامة
- 🐛 **Issues:** لتقارير الأخطاء والميزات
- 📧 **Email:** support@aifestivalsscraper.com
- 🐦 **Twitter:** [@AIScraperTools](https://twitter.com/AIScraperTools)

---

## 🎉 شكرك!

شكراً على مساهمتك! بمساهماتك تجعل هذا المشروع أفضل للجميع! 🙏

---

**Happy Contributing!** 🚀

Made with ❤️ for the Arab AI Community
