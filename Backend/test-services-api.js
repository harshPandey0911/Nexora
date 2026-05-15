const axios = require('axios');

async function testApi() {
  try {
    const response = await axios.get('http://localhost:5000/api/public/services');
    console.log('Services Count:', response.data.services.length);
    console.log('Services:', response.data.services.map(s => s.title));
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testApi();
