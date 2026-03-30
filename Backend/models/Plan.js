const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String, // Silver, Gold, etc.
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true // e.g., '1 month', '1 year'
  },
  highlights: [String],
  freeCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  freeServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserService'
  }],
  bonusServices: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserService'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
