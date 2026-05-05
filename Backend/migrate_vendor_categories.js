const mongoose = require('mongoose');
const Category = require('./models/Category');
const Vendor = require('./models/Vendor');
require('dotenv').config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const vendorCategories = await Category.find({ vendorId: { $ne: null } });
    console.log(`Found ${vendorCategories.length} vendor categories to update`);

    for (const cat of vendorCategories) {
      const vendor = await Vendor.findById(cat.vendorId).select('cityId');
      cat.showOnHome = true;
      if (vendor?.cityId) {
        cat.cityIds = [vendor.cityId];
      }
      await cat.save();
      console.log(`Updated category: ${cat.title}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
