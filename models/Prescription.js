const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientEmail: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  instructions: { type: String },
  medications: [{ type: String }],
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  usageLimit: { type: Number, default: 1 },
  used: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  doctorSignature: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prescription', prescriptionSchema);