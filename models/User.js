const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'shop', 'admin'], required: true },
  age: { type: Number }, // For patients
  weight: { type: Number }, // For patients
  height: { type: Number },
  photo: {type:String, default:''},
  verified: { type: Boolean, default: false},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);