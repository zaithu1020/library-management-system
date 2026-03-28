// backend/models/Book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'General'
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  available: {
    type: Number,
    required: true,
    min: [0, 'Available copies cannot be negative'],
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', BookSchema);