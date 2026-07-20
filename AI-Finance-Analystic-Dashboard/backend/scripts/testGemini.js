require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { env } = require('../config/env.js');

console.log('Testing Gemini API...');
console.log('API Key:', env.geminiApiKey ? env.geminiApiKey.slice(0, 12) + '...' : 'MISSING');

async function testModel(modelName) {
  console.log(`\n--- Testing Model: ${modelName} ---`);
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + 
    encodeURIComponent(modelName) + ':generateContent?key=' + env.geminiApiKey;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: Gemini is working!' }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 20 }
      })
    });
    const d = await response.json();
    const reply = d?.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
    if (reply) {
      console.log(`✅ ${modelName} reply:`, reply);
      return true;
    } else if (d?.error) {
      console.error(`❌ ${modelName} error:`, d.error.message, '| code:', d.error.code);
    } else {
      console.log(`⚠️ No text extracted for ${modelName}. Response:`, JSON.stringify(d, null, 2));
    }
  } catch (e) {
    console.error(`❌ Network error for ${modelName}:`, e.message);
  }
  return false;
}

(async () => {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-pro');
})();
