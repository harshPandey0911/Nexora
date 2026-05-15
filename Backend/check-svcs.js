const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Service = require('./models/UserService');
const Vendor = require('./models/Vendor');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const svcs = await Service.find({ title: { $in: ['ele', 'Fan'] } }).populate('vendorId', 'name isOnline availability');
  console.log(JSON.stringify(svcs, null, 2));
  process.exit(0);
}

check();
