# استخدم الصورة الأساسية من Apify
FROM apify/actor-node:20

# نسخ ملفات المشروع
COPY package*.json ./
COPY INPUT_SCHEMA.json .

# تثبيت المتعلقات
RUN npm install --quiet --only=production

# نسخ باقي ملفات المشروع
COPY . ./

# تشغيل الـ actor
CMD ["node", "main.js"]
