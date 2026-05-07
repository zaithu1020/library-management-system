// backend/routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('book')
      .populate('member')
      .sort({ issueDate: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST issue book - FIXED: ALWAYS CREATE NEW TRANSACTION
router.post('/issue', async (req, res) => {
  try {
    const { bookId, memberId, dueDate } = req.body;
    
    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    if (book.available <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }
    
    // Check if member exists and is active
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    if (member.status !== 'Active') {
      return res.status(400).json({ message: 'Member account is not active' });
    }
    
    // ✅ FIX: CREATE A NEW TRANSACTION - NOT findOneAndUpdate
    const transaction = new Transaction({
      book: bookId,
      member: memberId,
      dueDate: new Date(dueDate),
      issueDate: new Date(),
      status: 'Issued',
      fine: 0
    });
    
    // Update book availability
    book.available -= 1;
    await book.save();
    
    // Save the new transaction
    const savedTransaction = await transaction.save();
    
    // Populate and return
    const populatedTransaction = await Transaction.findById(savedTransaction._id)
      .populate('book')
      .populate('member');
    
    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Issue error:', error);
    res.status(400).json({ message: error.message });
  }
});

// POST return book - UPDATES specific transaction
router.post('/return/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status === 'Returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }
    
    // Update this specific transaction
    transaction.returnDate = new Date();
    transaction.status = 'Returned';
    
    // Calculate fine if overdue (Students only)
    const member = await Member.findById(transaction.member);
    if (member && member.membershipType !== 'Teacher') {
      if (transaction.returnDate > transaction.dueDate) {
        const daysLate = Math.ceil((transaction.returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
        transaction.fine = daysLate * (req.body.fineRate || 10);
      }
    }
    
    // Return book to available
    const book = await Book.findById(transaction.book);
    if (book) {
      book.available += 1;
      await book.save();
    }
    
    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('book')
      .populate('member');
    
    res.json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET overdue books
router.get('/overdue', async (req, res) => {
  try {
    const today = new Date();
    const overdue = await Transaction.find({
      status: 'Issued',
      dueDate: { $lt: today }
    })
      .populate('book')
      .populate('member')
      .sort({ dueDate: 1 });
    
    res.json(overdue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;