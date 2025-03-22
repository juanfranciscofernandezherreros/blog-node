const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  // ✅ Ruta local o URL remota
  path: {
    type: String,
    required: true // Puede ser una ruta (local) o una URL (Cloudinary, S3)
  },

  // ✅ Tipo de archivo (opcional pero útil)
  mimeType: {
    type: String
  },

  // ✅ Tamaño en bytes (opcional)
  size: {
    type: Number
  },

  // ✅ Post relacionado
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },

  // ✅ Usuario que subió la imagen
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ Estado visible o no
  isVisible: {
    type: Boolean,
    default: true
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

// Middleware para actualizar `updatedAt`
ImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Image', ImageSchema);
