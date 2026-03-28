// backend/routes/members.js
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// GET all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find().sort({ joinDate: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single member
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new member
router.post('/', async (req, res) => {
  try {
    const { name, membershipType, indexNumber, employeeNumber, address, phone } = req.body;
    
    // Count existing members of same type
    const typeCount = await Member.countDocuments({ membershipType });
    const prefix = membershipType === 'Student' ? 'STU' : 'TCH';
    const memberId = `${prefix}${String(typeCount + 1).padStart(3, '0')}`;
    
    const memberData = {
      memberId,
      name,
      membershipType,
      address: address || '',
      phone: phone || ''
    };
    
    // Add type-specific fields
    if (membershipType === 'Student') {
      memberData.indexNumber = indexNumber || '';
    } else if (membershipType === 'Teacher') {
      memberData.employeeNumber = employeeNumber || '';
    }
    
    // Email is optional - don't include if not provided
    if (req.body.email) {
      memberData.email = req.body.email;
    }
    
    const member = new Member(memberData);
    const newMember = await member.save();
    res.status(201).json(newMember);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate entry' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// PUT update member
router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Update fields
    member.name = req.body.name || member.name;
    member.membershipType = req.body.membershipType || member.membershipType;
    member.address = req.body.address || member.address;
    member.phone = req.body.phone || member.phone;
    member.status = req.body.status || member.status;
    
    // Update type-specific fields
    if (member.membershipType === 'Student') {
      member.indexNumber = req.body.indexNumber || member.indexNumber;
      member.employeeNumber = '';
    } else if (member.membershipType === 'Teacher') {
      member.employeeNumber = req.body.employeeNumber || member.employeeNumber;
      member.indexNumber = '';
    }
    
    const updatedMember = await member.save();
    res.json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    await member.deleteOne();
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;