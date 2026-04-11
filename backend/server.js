// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ========== SIMPLE SCHEMAS ==========
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true },
  category: { type: String, default: 'General' },
  quantity: { type: Number, default: 1 },
  available: { type: Number, default: 1 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const memberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true },
  name: { type: String, required: true },
  membershipType: { type: String, enum: ['Student', 'Teacher'], default: 'Student' },
  indexNumber: { type: String, default: '' },
  employeeNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  joinDate: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  issueDate: { type: Date, default: Date.now },
  dueDate: Date,
  returnDate: Date,
  status: { type: String, default: 'Issued' },
  fine: { type: Number, default: 0 }
});

const Book = mongoose.model('Book', bookSchema);
const Member = mongoose.model('Member', memberSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ========== BOOK ROUTES ==========
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MEMBER ROUTES ==========
app.get('/api/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ joinDate: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const typeCount = await Member.countDocuments({ membershipType: req.body.membershipType });
    const prefix = req.body.membershipType === 'Student' ? 'STU' : 'TCH';
    const memberId = `${prefix}${String(typeCount + 1).padStart(3, '0')}`;
    const member = new Member({ ...req.body, memberId });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== TRANSACTION ROUTES ==========
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('book').populate('member').sort({ issueDate: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/transactions/issue', async (req, res) => {
  try {
    const { bookId, memberId, dueDate } = req.body;
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }
    const transaction = new Transaction({ book: bookId, member: memberId, dueDate });
    book.available -= 1;
    await book.save();
    await transaction.save();
    const populated = await Transaction.findById(transaction._id).populate('book').populate('member');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/transactions/return/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    transaction.returnDate = new Date();
    transaction.status = 'Returned';
    const book = await Book.findById(transaction.book);
    if (book) {
      book.available += 1;
      await book.save();
    }
    await transaction.save();
    const populated = await Transaction.findById(transaction._id).populate('book').populate('member');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', time: new Date() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Library Management System API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});