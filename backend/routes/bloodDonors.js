const express = require('express');
const router = express.Router();
const BloodDonor = require('../models/BloodDonor');

// Helper to seed initial mock donors if collection is empty
const seedMockDonors = async () => {
  const count = await BloodDonor.countDocuments();
  if (count === 0) {
    const mockDonors = [
      { name: 'Ramesh Kumar', bloodGroup: 'O+', location: 'Gandhi Nagar', contactNum: '+91 94430 11111' },
      { name: 'Priya Dharshini', bloodGroup: 'A+', location: 'Palani Road', contactNum: '+91 94430 22222' },
      { name: 'Suresh Ananth', bloodGroup: 'B+', location: 'Dharapuram Road', contactNum: '+91 94430 33333' },
      { name: 'Mano Ranjith', bloodGroup: 'AB+', location: 'Eripalayam', contactNum: '+91 94430 44444' },
      { name: 'Kousalya Devi', bloodGroup: 'O-', location: 'Udumalpet Town', contactNum: '+91 94430 55555' },
      { name: 'Deepak Raj', bloodGroup: 'A-', location: 'Pollachi Road', contactNum: '+91 94430 66666' }
    ];
    await BloodDonor.insertMany(mockDonors);
    console.log('[BloodDonor Route] Auto-seeded initial mock donors in database.');
  }
};

// @desc    Register a new blood donor
// @route   POST /api/blood-donors
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, location, bloodGroup, contactNum } = req.body;

    if (!name || !location || !bloodGroup || !contactNum) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const donor = await BloodDonor.create({
      name,
      location,
      bloodGroup: bloodGroup.toUpperCase().trim(),
      contactNum
    });

    res.status(201).json({ success: true, message: 'Successfully registered as a blood donor!', data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all blood donors
// @route   GET /api/blood-donors
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Seed mock donors if DB is empty
    await seedMockDonors();

    const { bloodGroup } = req.query;
    let query = {};
    if (bloodGroup) {
      // Decode bloodGroup (handles + sign encoding properly)
      query.bloodGroup = bloodGroup.trim().toUpperCase();
    }

    const donors = await BloodDonor.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: donors.length, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const { protect, admin } = require('../middleware/auth');

// @desc    Update a blood donor
// @route   PUT /api/blood-donors/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, location, bloodGroup, contactNum } = req.body;
    let donor = await BloodDonor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Blood donor record not found.' });
    }

    donor.name = name !== undefined ? name.trim() : donor.name;
    donor.location = location !== undefined ? location.trim() : donor.location;
    donor.bloodGroup = bloodGroup !== undefined ? bloodGroup.toUpperCase().trim() : donor.bloodGroup;
    donor.contactNum = contactNum !== undefined ? contactNum.trim() : donor.contactNum;

    await donor.save();
    res.json({ success: true, message: 'Blood donor updated successfully!', data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a blood donor
// @route   DELETE /api/blood-donors/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const donor = await BloodDonor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Blood donor record not found.' });
    }

    await donor.deleteOne();
    res.json({ success: true, message: 'Blood donor deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
