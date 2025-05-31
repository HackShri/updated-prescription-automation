require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


router.post('/signup', async (req, res) => {
  const { name, email, password, role, secretCode, age, weight, height } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'admin' && secretCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({ message: 'Invalid secret code for admin' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      age,
      weight,
      height,
      photo: '', // Default empty photo
      verified: role === 'patient' || role === 'admin', // Patients/admins are auto-verified
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if ((user.role === 'doctor' || user.role === 'shop') && !user.verified) {
      return res.status(403).json({ message: 'Account not verified' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try{
    const {email} = req.body;

    const user = await User.findOne({ email});
    if (!user || user.role !=='patient'){
      return res.status(404).json({
        message: 'Patient not found'
      })
    }
    const photoBase64 = req.file.buffer.toString('base64');
    user.photo = `data:${req.file.mimetype};base64,${photoBase64}`;
    await user.save();

    res.json({
      message: 'Photo uploaded successfully',
      
    })
  }catch(error){
    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
})

module.exports = router;