const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
  const {
    patientEmail,
    instructions,
    medications,
    age,
    weight,
    height,
    usageLimit,
    expiresAt,
    doctorSignature,
  } = req.body;
  try {
    const patient = await User.findOne({ email: patientEmail, role: 'patient' });
    if (!patient) {
      return res.status(400).json({ message: 'Patient not found' });
    }
    const prescription = new Prescription({
      patientEmail,
      patientId: patient._id,
      doctorId: req.user.userId,
      instructions,
      medications,
      age,
      weight,
      height,
      usageLimit,
      expiresAt,
      doctorSignature,
      patientPhoto: patient.photo || '',
    });
    await prescription.save();

    // Create notification for patient
    await Notification.create({
      user: patient._id,
      type: 'prescription',
      message: 'A new prescription has been issued to you.',
      meta: { prescriptionId: prescription._id }
    });

    // Emit socket event to patient (if using socket.io rooms by userId)
    const io = req.app.get('io');
    if (io) {
      io.to(String(patient._id)).emit('notification', {
        type: 'prescription',
        message: 'A new prescription has been issued to you.',
        prescriptionId: prescription._id
      });
    }

    res.status(201).json({ _id: prescription._id, patientId: patient._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/patient', authMiddleware, roleMiddleware('patient'), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.userId });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    if (req.user.userId !== prescription.patientId && req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/use', authMiddleware, roleMiddleware('shop'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    if (prescription.used >= prescription.usageLimit) {
      return res.status(400).json({ message: 'Usage limit reached' });
    }
    if (new Date(prescription.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Prescription expired' });
    }
    prescription.used += 1;
    await prescription.save();
    res.json({ message: 'Prescription used' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;