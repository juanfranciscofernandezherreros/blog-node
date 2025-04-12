const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  subscribedToUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }],
  subscribedToCategories: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category'
  }],
  subscribedToTags: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tags'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);
