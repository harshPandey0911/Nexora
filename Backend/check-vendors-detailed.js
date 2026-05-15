const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Vendor = require('./models/Vendor');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await Vendor.find({ 
    $or: [
      { isOnline: true }, 
      { availability: 'AVAILABLE' }
    ] 
  }).select('name businessName address.city isOnline availability service categories');
  console.log(JSON.stringify(vendors, null, 2));
  process.exit(0);
}
check();
