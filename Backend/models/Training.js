const mongoose = require('mongoose');

/**
 * Training Model
 * Stores training materials (videos and MCQs) for vendors
 */
const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a training title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Please provide a training video URL (YouTube/Vimeo)']
  },
  videoDuration: {
    type: Number, // In seconds (to track minimum watch time)
    default: 0
  },
  questions: [
    {
      question: {
        type: String,
        required: true
      },
      options: [{
        type: String,
        required: true
      }],
      correctOptionIndex: {
        type: Number,
        required: true
      }
    }
  ],
  minimumScore: {
    type: Number,
    default: 3 // Minimum questions to pass
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Training', trainingSchema);
