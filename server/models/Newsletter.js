const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NewsletterSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Evita emails duplicados en la base de datos
    trim: true,
    lowercase: true, // Guarda los emails en minúsculas
  }
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);
