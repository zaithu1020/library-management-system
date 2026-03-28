// backend/models/Member.js
const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  membershipType: {
    type: String,
    enum: ['Student', 'Teacher'],
    default: 'Student'
  },
  // Student specific fields
  indexNumber: {
    type: String,
    default: '',
    trim: true
  },
  // Teacher specific fields
  employeeNumber: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  // Email is NOT required anymore - make it optional
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    default: null  // Allow null values
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Expired'],
    default: 'Active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Member', MemberSchema);