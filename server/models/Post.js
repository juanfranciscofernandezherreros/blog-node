const mongoose = require('mongoose');
const slugify = require('slugify');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tags'
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'review'],
    default: 'draft'
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  isVisible: {
    type: Boolean,
    default: true
  },
  images: {
    type: String,
    required: false
  },  

  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishDate: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔧 MÉTODOS PARA MANEJAR LIKES Y FAVORITOS

PostSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likes.indexOf(userId);
  if (userIndex === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(userIndex, 1);
  }
  await this.save();
  return this;
};

PostSchema.methods.toggleFavorite = async function(userId) {
  const userIndex = this.favoritedBy.indexOf(userId);
  if (userIndex === -1) {
    this.favoritedBy.push(userId);
  } else {
    this.favoritedBy.splice(userIndex, 1);
  }
  await this.save();
  return this;
};

PostSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishDate = new Date();
  await this.save();
  return this;
};

PostSchema.methods.setDraft = async function() {
  this.status = 'draft';
  await this.save();
  return this;
};

// ✅ MIDDLEWARE PARA GENERAR SLUG AUTOMÁTICAMENTE
PostSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema);
