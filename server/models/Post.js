const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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
  // ✅ Estado del artículo
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  // 👍 Lista de usuarios que dieron like
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ⭐ Lista de usuarios que guardaron en favoritos
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVisible: {
    type: Boolean,
    default: true
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

// Método para dar like o quitar like
PostSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likes.indexOf(userId);
  if (userIndex === -1) {
    // Si no existe, lo agregamos (like)
    this.likes.push(userId);
  } else {
    // Si ya existe, lo quitamos (unlike)
    this.likes.splice(userIndex, 1);
  }
  await this.save();
  return this;
};

// Método para agregar o quitar de favoritos
PostSchema.methods.toggleFavorite = async function(userId) {
  const userIndex = this.favoritedBy.indexOf(userId);
  if (userIndex === -1) {
    // Si no está en favoritos, lo agregamos
    this.favoritedBy.push(userId);
  } else {
    // Si ya está, lo quitamos
    this.favoritedBy.splice(userIndex, 1);
  }
  await this.save();
  return this;
};

// Método para publicar el post
PostSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishDate = new Date();
  await this.save();
  return this;
};

// Método para volver a borrador
PostSchema.methods.setDraft = async function() {
  this.status = 'draft';
  await this.save();
  return this;
};

module.exports = mongoose.model('Post', PostSchema);
