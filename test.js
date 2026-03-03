/**
 * ملف اختبار سريع للـ Actor
 * Quick test file for the Actor
 * 
 * لتشغيل الاختبار:
 * node test.js
 */

const axios = require('axios');
const { cheerio } = require('cheerio');

console.log('🧪 بدء الاختبارات...\n');

// ========================
// 1. اختبار الاتصال بالإنترنت
// ========================
async function testInternetConnection() {
  try {
    console.log('📡 اختبار الاتصال بالإنترنت...');
    
    const response = await axios.get('https://www.google.com', {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.status === 200) {
      console.log('✅ الاتصال بالإنترنت: جيد\n');
      return true;
    }
  } catch (error) {
    console.log('❌ الاتصال بالإنترنت: فشل');
    console.log(`   الخطأ: ${error.message}\n`);
    return false;
  }
}

// ========================
// 2. اختبار Eventbrite
// ========================
async function testEventbrite() {
  try {
    console.log('🎪 اختبار Eventbrite...');
    
    const response = await axios.get(
      'https://www.eventbrite.com/d/online/artificial-intelligence--events/',
      {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );
    
    if (response.status === 200) {
      console.log('✅ Eventbrite: متاح\n');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Eventbrite: قد يكون محميًا ضد الـ bots');
    console.log(`   الخطأ: ${error.message}\n`);
    return false;
  }
}

// ========================
// 3. اختبار المؤتمرات الرسمية
// ========================
async function testMajorConferences() {
  const conferences = [
    { name: 'NeurIPS', url: 'https://neurips.cc/' },
    { name: 'ICML', url: 'https://icml.cc/' },
    { name: 'CVPR', url: 'https://cvpr.thecvf.com/' }
  ];
  
  console.log('🎓 اختبار المؤتمرات الرسمية...');
  
  let successCount = 0;
  
  for (const conf of conferences) {
    try {
      const response = await axios.get(conf.url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ${conf.name}: متاح`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ⚠️ ${conf.name}: غير متاح - ${error.message}`);
    }
  }
  
  console.log(`\n📊 النتيجة: ${successCount}/${conferences.length} متاح\n`);
  return successCount > 0;
}

// ========================
// 4. اختبار معالجة البيانات
// ========================
function testDataProcessing() {
  console.log('🔄 اختبار معالجة البيانات...');
  
  try {
    // اختبر دالة التصنيف
    const testCases = [
      { name: 'NeurIPS 2025 Conference', expected: 'conference' },
      { name: 'AI Workshop Series', expected: 'workshop' },
      { name: 'Machine Learning Meetup', expected: 'meetup' },
      { name: 'Data Science Webinar', expected: 'webinar' }
    ];
    
    function categorizeEvent(name, description) {
      const text = `${name} ${description || ''}`.toLowerCase();
      
      if (text.includes('conference')) return 'conference';
      if (text.includes('workshop')) return 'workshop';
      if (text.includes('meetup')) return 'meetup';
      if (text.includes('webinar')) return 'webinar';
      if (text.includes('summit')) return 'summit';
      if (text.includes('hackathon')) return 'hackathon';
      
      return 'event';
    }
    
    let passed = 0;
    
    for (const test of testCases) {
      const result = categorizeEvent(test.name, '');
      const status = result === test.expected ? '✅' : '❌';
      console.log(`   ${status} "${test.name}" → ${result}`);
      
      if (result === test.expected) passed++;
    }
    
    console.log(`\n📊 النتيجة: ${passed}/${testCases.length} اختبار نجح\n`);
    return passed === testCases.length;
  } catch (error) {
    console.log(`❌ خطأ في معالجة البيانات: ${error.message}\n`);
    return false;
  }
}

// ========================
// 5. اختبار JSON Schema
// ========================
function testInputSchema() {
  console.log('📋 اختبار INPUT_SCHEMA...');
  
  try {
    const fs = require('fs');
    const schema = JSON.parse(fs.readFileSync('./INPUT_SCHEMA.json', 'utf8'));
    
    if (schema.properties && schema.properties.searchRegions) {
      console.log('   ✅ Schema متوفر وصحيح\n');
      return true;
    } else {
      console.log('   ❌ Schema غير صحيح\n');
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️ لم أتمكن من قراءة INPUT_SCHEMA: ${error.message}\n`);
    return false;
  }
}

// ========================
// تشغيل جميع الاختبارات
// ========================
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 AI FESTIVALS SCRAPER - TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const results = {
    '📡 الاتصال بالإنترنت': false,
    '🎪 Eventbrite': false,
    '🎓 المؤتمرات الرسمية': false,
    '🔄 معالجة البيانات': false,
    '📋 INPUT_SCHEMA': false
  };
  
  // تشغيل الاختبارات
  results['📡 الاتصال بالإنترنت'] = await testInternetConnection();
  results['🎪 Eventbrite'] = await testEventbrite();
  results['🎓 المؤتمرات الرسمية'] = await testMajorConferences();
  results['🔄 معالجة البيانات'] = testDataProcessing();
  results['📋 INPUT_SCHEMA'] = testInputSchema();
  
  // ملخص النتائج
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 ملخص الاختبارات');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let totalPassed = 0;
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '⚠️';
    console.log(`${status} ${test}`);
    if (passed) totalPassed++;
  }
  
  console.log(`\n📈 النتيجة النهائية: ${totalPassed}/${Object.keys(results).length} اختبار نجح\n`);
  
  if (totalPassed === Object.keys(results).length) {
    console.log('🎉 جميع الاختبارات نجحت! Actor جاهز للاستخدام!\n');
  } else if (totalPassed >= Object.keys(results).length - 1) {
    console.log('✅ معظم الاختبارات نجحت. قد تواجه بعض المشاكل مع المصادر المحمية.\n');
  } else {
    console.log('⚠️ توصية: تحقق من الاتصال والإعدادات قبل رفع الـ Actor\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('الخطوة التالية: apify push');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// تشغيل جميع الاختبارات
runAllTests().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
