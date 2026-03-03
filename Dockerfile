# استخدم الصورة الأساسية من Apify
FROM apify/actor-node:20

# نسخ ملفات المشروع
COPY package.json .
COPY ai-festivals-scraper.js main.js
COPY INPUT_SCHEMA.json .

# تثبيت المتعلقات
RUN npm install

# تشغيل الـ actor
CMD ["node", "main.js"]
