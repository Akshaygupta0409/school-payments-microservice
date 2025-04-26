import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'school', 'trustee'],
    default: 'trustee'
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();

  }

  try {
    this.password = await bcrypt.hash(
      this.password,
      10
    );

    next();

  } catch (err) {
    next(err);

  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};

export const User = model(
  'User',
  userSchema
);
