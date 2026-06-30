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

    // Find all donors with this blood group sorted by lastAssignedAt (ascending, nulls/undefined first) and createdAt (ascending)
    const donors = await BloodDonor.find({ bloodGroup }).sort({ lastAssignedAt: 1, createdAt: 1 });
    const N = donors.length;

    if (N === 0) {
      return res.status(400).json({ success: false, message: `No registered donors found for blood group ${bloodGroup}.` });
    }

    const selectedDonors = [];
    const matchedDonorsToUpdate = [];
    const countToSelect = Math.min(N, 5);

    for (let i = 0; i < countToSelect; i++) {
      selectedDonors.push({
        name: donors[i].name,
        contactNum: donors[i].contactNum,
        location: donors[i].location
      });
      matchedDonorsToUpdate.push(donors[i]);
    }

    // Update their lastAssignedAt timestamp to current time to send them to the bottom of the queue
    const assignmentDate = new Date();
    for (const donor of matchedDonorsToUpdate) {
      donor.lastAssignedAt = assignmentDate;
      await donor.save();
    }

    // Update request details
    request.status = 'Approved';
    request.approvedDonors = selectedDonors;
    request.approvedAt = assignmentDate;
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
