const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const BloodDonor = require('../models/BloodDonor');
const BloodQueueState = require('../models/BloodQueueState');
const { protect, admin } = require('../middleware/auth');

// @desc    Submit a blood request
// @route   POST /api/blood-requests
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { hospitalName, patientName, bloodGroup, patientAddress, mobileNum, altMobileNum, cause } = req.body;

    if (!hospitalName || !patientName || !bloodGroup || !patientAddress || !mobileNum || !cause) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const request = await BloodRequest.create({
      hospitalName,
      patientName,
      bloodGroup: bloodGroup.toUpperCase().trim(),
      patientAddress,
      mobileNum,
      altMobileNum,
      cause
    });

    res.status(201).json({ success: true, message: 'Blood request submitted successfully!', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all blood requests
// @route   GET /api/blood-requests
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const requests = await BloodRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve a blood request (assign 5 donors via circular queue)
// @route   PUT /api/blood-requests/:id/approve
// @access  Private/Admin
router.put('/:id/approve', protect, admin, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request has already been ${request.status.toLowerCase()}.` });
    }

    const bloodGroup = request.bloodGroup.toUpperCase().trim();

    // Find all donors with this blood group sorted by stable ID (ascending)
    const donors = await BloodDonor.find({ bloodGroup }).sort({ _id: 1 });
    const N = donors.length;

    if (N === 0) {
      return res.status(400).json({ success: false, message: `No registered donors found for blood group ${bloodGroup}.` });
    }

    // Get circular queue state
    let queueState = await BloodQueueState.findOne({ bloodGroup });
    if (!queueState) {
      queueState = new BloodQueueState({ bloodGroup, lastIndex: -1 });
    }

    const selectedDonors = [];
    let nextLastIndex = queueState.lastIndex;

    if (N <= 5) {
      // If we have 5 or fewer donors, select all of them
      for (let i = 0; i < N; i++) {
        selectedDonors.push({
          name: donors[i].name,
          contactNum: donors[i].contactNum,
          location: donors[i].location
        });
      }
      nextLastIndex = N - 1;
    } else {
      // Circular queue selection of 5 donors
      const startIndex = (queueState.lastIndex + 1) % N;
      for (let i = 0; i < 5; i++) {
        const idx = (startIndex + i) % N;
        selectedDonors.push({
          name: donors[idx].name,
          contactNum: donors[idx].contactNum,
          location: donors[idx].location
        });
      }
      nextLastIndex = (startIndex + 4) % N;
    }

    // Update queue state in database
    queueState.lastIndex = nextLastIndex;
    await queueState.save();

    // Update request details
    request.status = 'Approved';
    request.approvedDonors = selectedDonors;
    request.approvedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: 'Blood request approved and donors assigned successfully.',
      data: {
        request,
        assignedDonors: selectedDonors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reject a blood request
// @route   PUT /api/blood-requests/:id/reject
// @access  Private/Admin
router.put('/:id/reject', protect, admin, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request has already been ${request.status.toLowerCase()}.` });
    }

    request.status = 'Rejected';
    await request.save();

    res.json({ success: true, message: 'Blood request rejected successfully.', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
