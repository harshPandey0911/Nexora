const axios = require('axios');

async function testApi() {
  try {
    const response = await axios.get('http://localhost:5000/api/public/home-data');
    console.log('Categories Count:', response.data.categories.length);
    console.log('Categories:', response.data.categories.map(c => c.title));
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testApi();
