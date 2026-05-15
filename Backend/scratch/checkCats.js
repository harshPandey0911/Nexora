const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Category = require('../models/Category');

async function check() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    const cats = await Category.find({}).lean();
    console.log('Found', cats.length, 'categories');
    console.log(JSON.stringify(cats.map(c => ({ title: c.title, vendorId: c.vendorId, offeringType: c.offeringType })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
