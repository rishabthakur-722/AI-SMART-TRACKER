console.log('Testing /api/ai/summary endpoint...');

fetch('http://localhost:4000/api/ai/summary')
  .then(r => {
    console.log('Status code:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('Response success:', d.success);
    console.log('Response message:', d.message);
    if (d.success && d.data) {
      console.log('Data keys:', Object.keys(d.data));
      console.log('dailyMarketOverview:', d.data.insights?.dailyMarketOverview);
    } else {
      console.log('Full body:', JSON.stringify(d, null, 2));
    }
  })
  .catch(e => console.error('❌ Request failed:', e.message));
