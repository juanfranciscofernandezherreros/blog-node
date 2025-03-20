const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'El email no es válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  isActive: {
    type: Boolean,
    default: false
  },
  activationToken: {
    type: String
  },
  activationTokenExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// ✅ Middleware para hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  // Solo hashea si la contraseña fue modificada
  if (!this.isModified('password')) return next();

  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});


// ✅ Método para comparar contraseñas en el login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


// ✅ Método para generar un token de activación
UserSchema.methods.generateActivationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.activationToken = token;
  this.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  return token;
};


// ✅ Método para generar un token de restablecimiento de contraseña (opcional)
UserSchema.methods.generateResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hora
  return token;
};


const User = mongoose.model('User', UserSchema);

module.exports = User;
