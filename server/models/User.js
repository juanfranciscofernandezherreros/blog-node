const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
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
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // permite valores únicos pero también nulos
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
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
    default: true // se activa directamente con Google
  },
  activationToken: String,
  activationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Middleware para hashear la contraseña antes de guardar (solo si existe)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateActivationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.activationToken = token;
  this.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

UserSchema.methods.generateResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000;
  return token;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
