const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Vendor = require('./models/Vendor');

async function checkVendors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const onlineVendors = await Vendor.find({ isOnline: true }).select('name businessName address.city availability');
    console.log('Online Vendors Count:', onlineVendors.length);
    console.log(JSON.stringify(onlineVendors, null, 2));

    const availableVendors = await Vendor.find({ availability: 'AVAILABLE' }).select('name businessName address.city isOnline');
    console.log('Available Vendors Count:', availableVendors.length);
    console.log(JSON.stringify(availableVendors, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkVendors();
