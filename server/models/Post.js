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
  image: {  
    type: Buffer, // 🔹 Almacena la imagen en formato binario
  },
  image_mime: {  
    type: String, // 🔹 Almacena el tipo MIME de la imagen (ej. 'image/png', 'image/jpeg')
    required: false
  },
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

module.exports = mongoose.model('Post', PostSchema);
