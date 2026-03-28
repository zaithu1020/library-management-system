// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import Dashboard from './Dashboard';
import logo from './assets/institute-logo.png';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Member filter state
  const [memberFilter, setMemberFilter] = useState('');
  const [memberType, setMemberType] = useState('Student');

  // Last Backup state
  const [lastBackup, setLastBackup] = useState(null);

  // Edit states
  const [editingMember, setEditingMember] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // Fine rate state
  const [fineRate, setFineRate] = useState(10);
  const [showFineSettings, setShowFineSettings] = useState(false);

  // Overdue notification state
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  // User management states
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', password: 'admin', role: 'Administrator' }
  ]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    role: 'Librarian'
  });

  // Fine report data
  const [fineReport, setFineReport] = useState([]);

  // Fetch data when component loads
  useEffect(() => {
    if (isAuthenticated) {
      fetchBooks();
      fetchMembers();
      fetchTransactions();
    }
  }, [isAuthenticated]);

  // Check for overdue books on load
  useEffect(() => {
    if (transactions.length > 0) {
      const overdue = transactions.filter(t => 
        t.status === 'Issued' && new Date(t.dueDate) < new Date()
      );
      setOverdueCount(overdue.length);
      if (overdue.length > 0) {
        setShowOverdueAlert(true);
      }
    }
  }, [transactions]);

  // Calculate fine report
  useEffect(() => {
    if (transactions.length > 0) {
      const fines = transactions
        .filter(t => t.status === 'Returned' && t.fine > 0)
        .map(t => {
          const book = books.find(b => b._id === t.book?._id || t.book);
          const member = members.find(m => m._id === t.member?._id || t.member);
          return {
            date: new Date(t.returnDate).toLocaleDateString('ar-SA'),
            bookTitle: book?.title || 'Unknown',
            memberName: member?.name || 'Unknown',
            memberType: member?.membershipType || 'Unknown',
            fine: t.fine,
            memberId: member?.memberId || 'Unknown'
          };
        });
      setFineReport(fines);
    }
  }, [transactions, books, members]);

  // API Calls
  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books');
      setBooks(res.data);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members');
      setMembers(res.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginData.username && u.password === loginData.password);
    
    if (user) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid username or password!');
    }
  };

  // ========== USER MANAGEMENT FUNCTIONS ==========
  const handleChangePassword = (e) => {
    e.preventDefault();
    
    const currentUser = users.find(u => u.username === loginData.username);
    
    if (!currentUser) {
      alert('User not found!');
      return;
    }
    
    if (currentUser.password !== passwordData.currentPassword) {
      alert('Current password is incorrect!');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    if (passwordData.newPassword.length < 3) {
      alert('Password must be at least 3 characters!');
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.username === loginData.username 
        ? { ...u, password: passwordData.newPassword }
        : u
    );
    
    setUsers(updatedUsers);
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    alert('Password changed successfully!');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    
    if (users.find(u => u.username === newUserData.username)) {
      alert('Username already exists!');
      return;
    }
    
    if (newUserData.password.length < 3) {
      alert('Password must be at least 3 characters!');
      return;
    }
    
    setUsers([...users, { ...newUserData, id: users.length + 1 }]);
    setNewUserData({ username: '', password: '', role: 'Librarian' });
    alert('User added successfully!');
  };

  const handleDeleteUser = (userId) => {
    if (users.length === 1) {
      alert('Cannot delete the last user!');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };
  // ========== END USER MANAGEMENT FUNCTIONS ==========

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
  };

  // Search function
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.isbn.toLowerCase().includes(term) ||
        book.category.toLowerCase().includes(term)
      );
      setSearchResults(filtered);
    }
  };

  // Calculate fine for a transaction
  const calculateFine = (dueDate, returnDate = null, memberType = 'Student') => {
    if (memberType === 'Teacher') return 0;
    
    const today = new Date();
    const due = new Date(dueDate);
    const returnDt = returnDate ? new Date(returnDate) : today;
    
    if (returnDt > due) {
      const dueDay = new Date(due.toDateString());
      const returnDay = new Date(returnDt.toDateString());
      const daysLate = Math.ceil((returnDay - dueDay) / (1000 * 60 * 60 * 24));
      return daysLate > 0 ? daysLate * fineRate : 0;
    }
    return 0;
  };

  // ========== PDF EXPORT FUNCTIONS WITH ARABIC SUPPORT ==========
  const exportToPDF = (data, columns, title, fileName) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      doc.setFont('helvetica');
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Colombo' });
      doc.text(`Generated: ${dateStr}`, 14, 30);
      
      autoTable(doc, {
        head: [columns],
        body: data,
        startY: 35,
        styles: { 
          fontSize: 9,
          font: 'helvetica',
          cellPadding: 4,
          halign: 'left',
          valign: 'middle',
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' }
        }
      });
      
      doc.save(`${fileName}.pdf`);
      alert(`${fileName} exported successfully!`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error exporting to PDF: ' + error.message);
    }
  };

  const exportBooksToPDF = () => {
    const columns = ['Title', 'Author', 'Book Number', 'Category', 'Total', 'Available'];
    const data = books.map(book => [
      book.title || '',
      book.author || '',
      book.isbn || '',
      book.category || '',
      book.quantity?.toString() || '0',
      book.available?.toString() || '0'
    ]);
    exportToPDF(data, columns, 'Books Report', `Books_Report_${new Date().toLocaleDateString()}`);
  };

  const exportMembersToPDF = () => {
    const columns = ['Member ID', 'Name', 'Type', 'Index/Employee No', 'Address', 'Phone', 'Status'];
    const data = members.map(member => [
      member.memberId || '',
      member.name || '',
      member.membershipType || '',
      member.indexNumber || member.employeeNumber || '-',
      member.address || '-',
      member.phone || '-',
      member.status || 'Active'
    ]);
    exportToPDF(data, columns, 'Members Report', `Members_Report_${new Date().toLocaleDateString()}`);
  };

  const exportTransactionsToPDF = () => {
    const columns = ['Book', 'Member', 'Issue Date', 'Due Date', 'Return Date', 'Fine (Rs.)'];
    const data = transactions.map(t => {
      const book = books.find(b => b._id === t.book?._id || t.book);
      const member = members.find(m => m._id === t.member?._id || t.member);
      const fine = calculateFine(t.dueDate, t.returnDate, member?.membershipType);
      
      return [
        book?.title || 'Unknown',
        member?.name || 'Unknown',
        new Date(t.issueDate).toLocaleDateString('ar-SA'),
        new Date(t.dueDate).toLocaleDateString('ar-SA'),
        t.returnDate ? new Date(t.returnDate).toLocaleDateString('ar-SA') : 'Not Returned',
        `Rs. ${fine}`
      ];
    });
    exportToPDF(data, columns, 'Transactions Report', `Transactions_Report_${new Date().toLocaleDateString()}`);
  };

  const exportFineReportToPDF = () => {
    const columns = ['Date', 'Book', 'Member', 'Type', 'Fine (Rs.)', 'Member ID'];
    const data = fineReport.map(f => [
      f.date,
      f.bookTitle,
      f.memberName,
      f.memberType,
      `Rs. ${f.fine}`,
      f.memberId
    ]);
    exportToPDF(data, columns, 'Fine Collection Report', `Fine_Report_${new Date().toLocaleDateString()}`);
  };
  // ========== END PDF EXPORT FUNCTIONS ==========

  // ========== PRINT FUNCTIONS WITH FULL ARABIC SUPPORT ==========
  const printWithArabicSupport = (title, columns, data) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="ltr">
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Noto Naskh Arabic', 'Amiri', 'Scheherazade New', 'Traditional Arabic', 'Arial', sans-serif; 
              padding: 25px; 
              margin: 0;
              background: white;
              font-size: 14px;
              direction: ltr;
              line-height: 1.5;
            }
            
            .header {
              display: flex;
              align-items: center;
              gap: 20px;
              margin-bottom: 25px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 15px;
            }
            
            .logo {
              height: 70px;
              width: auto;
              object-fit: contain;
            }
            
            .institute-info {
              flex: 1;
            }
            
            .institute-info h2 {
              margin: 0;
              color: #333;
              font-size: 20px;
              font-family: 'Noto Naskh Arabic', 'Amiri', sans-serif;
            }
            
            .institute-info p {
              margin: 5px 0;
              color: #666;
              font-size: 12px;
            }
            
            h1 { 
              color: #2196f3; 
              font-size: 26px;
              margin: 20px 0 10px;
              border-bottom: 3px solid #2196f3;
              padding-bottom: 10px;
              font-family: 'Noto Naskh Arabic', 'Amiri', sans-serif;
            }
            
            .date {
              color: #666;
              font-size: 12px;
              margin-bottom: 20px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              font-family: 'Noto Naskh Arabic', 'Amiri', 'Scheherazade New', sans-serif;
              font-size: 13px;
            }
            
            th { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 12px; 
              text-align: left; 
              font-weight: 600;
              border: 1px solid #5a6fcf;
            }
            
            td { 
              padding: 10px; 
              border: 1px solid #ddd;
              text-align: left;
              vertical-align: top;
            }
            
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            
            tr:hover { 
              background: #f0f0f0; 
            }
            
            .footer { 
              margin-top: 30px; 
              padding-top: 15px;
              border-top: 2px solid #e0e0e0;
              font-size: 12px; 
              color: #666;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 10px;
            }
            
            @media print {
              body { margin: 0; padding: 15px; }
              th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logo}" alt="Institute Logo" class="logo" onerror="this.style.display='none'" />
            <div class="institute-info">
              <h2>Assalihath Ladies Arabic College</h2>
              <p>Bund Road, Sennal Gramam-01, Sammanthurai, Sri Lanka</p>
              <p>Tel: 0672260343 / 0772920298 / 0772273925 | Email: https://assalihath.com</p>
            </div>
          </div>
          
          <h1>${title}</h1>
          <div class="date">Generated: ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Colombo' })}</div>
          
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell || '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <div>Total Records: ${data.length}</div>
            <div>© ${new Date().getFullYear()} Assalihath Ladies Arabic College. All rights reserved.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printBooks = () => {
    const columns = ['Title', 'Author', 'Book Number', 'Category', 'Available'];
    const data = books.map(book => [book.title, book.author, book.isbn, book.category, `${book.available}/${book.quantity}`]);
    printWithArabicSupport('Books List', columns, data);
  };

  const printMembers = () => {
    const columns = ['Member ID', 'Name', 'Type', 'Index/Employee No', 'Phone', 'Status'];
    const data = members.map(member => [
      member.memberId,
      member.name,
      member.membershipType,
      member.indexNumber || member.employeeNumber || '-',
      member.phone || '-',
      member.status
    ]);
    printWithArabicSupport('Members List', columns, data);
  };

  const printFineReport = () => {
    const columns = ['Date', 'Book', 'Member', 'Type', 'Fine (Rs.)'];
    const data = fineReport.map(f => [f.date, f.bookTitle, f.memberName, f.memberType, `Rs. ${f.fine}`]);
    printWithArabicSupport('Fine Collection Report', columns, data);
  };
  // ========== END PRINT FUNCTIONS ==========

  // ========== EXPORT TO EXCEL FUNCTIONS WITH ARABIC SUPPORT ==========
  const exportToExcel = (data, sheetName, fileName) => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 15 }));
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      alert(`${fileName} exported successfully!`);
    } catch (error) {
      alert('Error exporting to Excel: ' + error.message);
    }
  };

  const exportBooks = () => {
    const booksData = books.map(book => ({
      'Title': book.title || '',
      'Author': book.author || '',
      'Book Number': book.isbn || '',
      'Category': book.category || '',
      'Total Copies': book.quantity || 0,
      'Available': book.available || 0
    }));
    exportToExcel(booksData, 'Books', `Books_${new Date().toLocaleDateString()}`);
  };

  const exportMembers = () => {
    const membersData = members.map(member => ({
      'Member ID': member.memberId || '',
      'Name': member.name || '',
      'Type': member.membershipType || '',
      'Index/Employee No': member.indexNumber || member.employeeNumber || '',
      'Address': member.address || '',
      'Phone': member.phone || '',
      'Status': member.status || 'Active'
    }));
    exportToExcel(membersData, 'Members', `Members_${new Date().toLocaleDateString()}`);
  };

  const exportTransactions = () => {
    const transactionsData = transactions.map(t => {
      const book = books.find(b => b._id === t.book?._id || t.book);
      const member = members.find(m => m._id === t.member?._id || t.member);
      const fine = calculateFine(t.dueDate, t.returnDate, member?.membershipType);
      
      return {
        'Book Title': book?.title || 'Unknown',
        'Member Name': member?.name || 'Unknown',
        'Member Type': member?.membershipType || 'Unknown',
        'Issue Date': new Date(t.issueDate).toLocaleDateString('ar-SA'),
        'Due Date': new Date(t.dueDate).toLocaleDateString('ar-SA'),
        'Return Date': t.returnDate ? new Date(t.returnDate).toLocaleDateString('ar-SA') : 'Not Returned',
        'Status': t.status,
        'Fine (Rs.)': fine
      };
    });
    exportToExcel(transactionsData, 'Transactions', `Transactions_${new Date().toLocaleDateString()}`);
  };

  const exportFineReport = () => {
    exportToExcel(fineReport, 'Fine Report', `Fine_Report_${new Date().toLocaleDateString()}`);
  };
  // ========== END EXPORT FUNCTIONS ==========

  // ========== BACKUP FUNCTIONS ==========
  const createBackup = async () => {
    try {
      setLoading(true);
      const backupData = {
        date: new Date().toLocaleString(),
        books: books,
        members: members,
        transactions: transactions,
        settings: { fineRate: fineRate },
        summary: {
          totalBooks: books.length,
          totalMembers: members.length,
          totalTransactions: transactions.length,
          issuedBooks: transactions.filter(t => t.status === 'Issued').length
        }
      };
      
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const now = new Date();
      setLastBackup({ date: now.toLocaleDateString(), time: now.toLocaleTimeString(), full: now.toLocaleString() });
      alert('Backup created successfully!');
    } catch (error) {
      alert('Backup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const backupData = JSON.parse(e.target.result);
        const confirmRestore = window.confirm(
          `WARNING: This will REPLACE all current data!\n\n` +
          `Backup contains:\nBooks: ${backupData.books?.length || 0}\nMembers: ${backupData.members?.length || 0}\nTransactions: ${backupData.transactions?.length || 0}\n\nContinue?`
        );
        
        if (!confirmRestore) return;
        
        if (backupData.books) {
          for (const book of backupData.books) {
            try { await axios.post('http://localhost:5000/api/books', book); } catch (e) {}
          }
        }
        
        if (backupData.members) {
          for (const member of backupData.members) {
            try { await axios.post('http://localhost:5000/api/members', member); } catch (e) {}
          }
        }
        
        if (backupData.settings?.fineRate) setFineRate(backupData.settings.fineRate);
        await fetchBooks(); await fetchMembers(); await fetchTransactions();
        alert('Restore completed successfully!');
      } catch (error) {
        alert('Restore failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };
  // ========== END BACKUP FUNCTIONS ==========

  // ========== BOOK FUNCTIONS ==========
  const editBook = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity
    });
    setActiveTab('books');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateBook = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/books/${editingBook._id}`, formData);
      alert('Book updated successfully!');
      setEditingBook(null);
      setFormData({});
      fetchBooks();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelBookEdit = () => {
    setEditingBook(null);
    setFormData({});
  };

  const addBook = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/books', formData);
      alert('Book added successfully!');
      setFormData({});
      fetchBooks();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/books/${id}`);
      alert('Book deleted!');
      fetchBooks();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  // ========== END BOOK FUNCTIONS ==========

  // ========== MEMBER FUNCTIONS ==========
  const addMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const typeCount = members.filter(m => m.membershipType === memberType).length;
      const prefix = memberType === 'Student' ? 'STU' : 'TCH';
      const memberId = `${prefix}${String(typeCount + 1).padStart(3, '0')}`;
      const memberData = { ...formData, memberId: memberId, membershipType: memberType };
      await axios.post('http://localhost:5000/api/members', memberData);
      alert('Member added successfully!');
      setFormData({});
      fetchMembers();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const editMember = (member) => {
    setEditingMember(member);
    setMemberType(member.membershipType);
    setFormData({
      name: member.name,
      indexNumber: member.indexNumber || '',
      employeeNumber: member.employeeNumber || '',
      address: member.address || '',
      phone: member.phone || ''
    });
    setActiveTab('members');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/members/${editingMember._id}`, { ...formData, membershipType: memberType });
      alert('Member updated successfully!');
      setEditingMember(null);
      setFormData({});
      fetchMembers();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setFormData({});
  };

  const deleteMember = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/members/${id}`);
      alert('Member deleted!');
      fetchMembers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  // ========== END MEMBER FUNCTIONS ==========

  // ========== ISSUE BOOK FUNCTIONS ==========
  const issueBook = async (e) => {
    e.preventDefault();
    const selectedBook = books.find(b => b._id === formData.bookId);
    if (!selectedBook || selectedBook.available <= 0) {
      alert('This book is currently not available!');
      return;
    }
    
    try {
      setLoading(true);
      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      dueDate.setDate(issueDate.getDate() + 3);
      const dueDateTime = dueDate.toISOString().split('T')[0] + 'T17:00:00';
      
      await axios.post('http://localhost:5000/api/transactions/issue', {
        bookId: formData.bookId,
        memberId: formData.memberId,
        dueDate: dueDateTime
      });
      alert('Book issued successfully! Due date: ' + dueDate.toLocaleDateString('ar-SA') + ' (3 days)');
      setFormData({});
      fetchBooks();
      fetchTransactions();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async (id, dueDate, memberType) => {
    try {
      setLoading(true);
      const fine = calculateFine(dueDate, null, memberType);
      if (fine > 0) {
        const payFine = window.confirm(`Fine amount: Rs. ${fine}. Mark as paid?`);
        if (!payFine) return;
      }
      await axios.post(`http://localhost:5000/api/transactions/return/${id}`);
      alert(`Book returned successfully!${fine > 0 ? ` Fine paid: Rs. ${fine}` : ''}`);
      fetchBooks();
      fetchTransactions();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  // ========== END ISSUE BOOK FUNCTIONS ==========

  // Login Page
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <img src={logo} alt="Institute Logo" className="login-logo" />
          <h2>Library Management System</h2>
          <p>Please login to continue</p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
            <button type="submit">Login</button>
          </form>
          <p className="login-hint">Hint: Use admin / admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        logo={logo} 
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassword(true)}
        onManageUsers={() => setShowUserManagement(true)}
        userRole={users.find(u => u.username === loginData.username)?.role || 'Librarian'}
        username={loginData.username}
      />
      
      {showOverdueAlert && overdueCount > 0 && (
        <div className="overdue-alert">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text"><strong>{overdueCount}</strong> book{overdueCount > 1 ? 's are' : ' is'} overdue!</div>
            <button className="alert-close" onClick={() => setShowOverdueAlert(false)}>✕</button>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={activeTab === 'books' ? 'active' : ''} onClick={() => { setActiveTab('books'); setShowSearch(false); setSearchTerm(''); setEditingBook(null); setFormData({}); }}>Books</button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => { setActiveTab('members'); setMemberFilter(''); setEditingMember(null); setFormData({}); setMemberType('Student'); }}>Members</button>
        <button className={activeTab === 'issue' ? 'active' : ''} onClick={() => setActiveTab('issue')}>Issue/Return</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports</button>
        <button className={activeTab === 'backup' ? 'active' : ''} onClick={() => setActiveTab('backup')}>Backup</button>
      </div>

      {loading && <div className="loading">Processing...</div>}

      {activeTab === 'dashboard' && <Dashboard books={books} members={members} transactions={transactions} />}

      {/* BOOKS TAB */}
      {activeTab === 'books' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <button className="search-toggle" onClick={() => setShowSearch(!showSearch)}>{showSearch ? 'Hide Search' : 'Search Books'}</button>
          </div>
          {showSearch && (
            <div className="search-container">
              <input type="text" className="search-input" placeholder="Search by title, author, book number, or category..." value={searchTerm} onChange={handleSearch} autoFocus />
            </div>
          )}
          <form onSubmit={editingBook ? updateBook : addBook} className="add-form">
            <input type="text" placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            <input type="text" placeholder="Author" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} required />
            <input type="text" placeholder="Book Number" value={formData.isbn || ''} onChange={(e) => setFormData({...formData, isbn: e.target.value})} required disabled={editingBook} />
            <input type="text" placeholder="Category" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            <input type="number" placeholder="Quantity" value={formData.quantity || 1} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} min="1" required />
            <div className="form-actions">
              <button type="submit" disabled={loading} className={editingBook ? 'update-btn' : ''}>{editingBook ? 'Update Book' : 'Add Book'}</button>
              {editingBook && <button type="button" className="cancel-btn" onClick={cancelBookEdit}>Cancel</button>}
            </div>
          </form>
          <h2>{searchTerm ? 'Search Results' : 'Books List'}</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Book Number</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(searchTerm ? searchResults : books).length > 0 ? 
                  (searchTerm ? searchResults : books).map(book => (
                    <tr key={book._id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.isbn}</td>
                      <td>{book.category}</td>
                      <td>{book.available}/{book.quantity}</td>
                      <td>
                        <button className="edit-btn" onClick={() => editBook(book)}>Edit</button>
                        <button className="delete-btn" onClick={() => deleteBook(book._id)}>Delete</button>
                      </td>
                    </tr>
                  )) : 
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>{searchTerm ? 'No books found' : 'No books added yet'}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="tab-content">
          <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
          <div className="member-type-selector">
            <button className={`type-btn ${memberType === 'Student' ? 'active' : ''}`} onClick={() => setMemberType('Student')}>Student</button>
            <button className={`type-btn ${memberType === 'Teacher' ? 'active' : ''}`} onClick={() => setMemberType('Teacher')}>Teacher</button>
          </div>
          <form onSubmit={editingMember ? updateMember : addMember} className="add-form">
            <input type="text" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            {memberType === 'Student' ? (
              <>
                <input type="text" placeholder="Index Number" value={formData.indexNumber || ''} onChange={(e) => setFormData({...formData, indexNumber: e.target.value})} required />
                <input type="text" placeholder="Address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              </>
            ) : (
              <>
                <input type="text" placeholder="Employee Number" value={formData.employeeNumber || ''} onChange={(e) => setFormData({...formData, employeeNumber: e.target.value})} required />
                <input type="text" placeholder="Address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
                <input type="text" placeholder="Phone" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </>
            )}
            <div className="form-actions">
              <button type="submit" disabled={loading} className={editingMember ? 'update-btn' : ''}>{editingMember ? 'Update Member' : 'Add Member'}</button>
              {editingMember && <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
          <div className="member-stats">
            <div className="stat-box total"><span className="stat-label">Total Members</span><span className="stat-value">{members.length}</span></div>
            <div className="stat-box students"><span className="stat-label">Students</span><span className="stat-value">{members.filter(m => m.membershipType === 'Student').length}</span></div>
            <div className="stat-box teachers"><span className="stat-label">Teachers</span><span className="stat-value">{members.filter(m => m.membershipType === 'Teacher').length}</span></div>
          </div>
          <div className="filter-buttons">
            <button className={`filter-btn ${memberFilter === '' ? 'active' : ''}`} onClick={() => setMemberFilter('')}>ALL</button>
            <button className={`filter-btn ${memberFilter === 'Student' ? 'active' : ''}`} onClick={() => setMemberFilter('Student')}>STUDENTS</button>
            <button className={`filter-btn ${memberFilter === 'Teacher' ? 'active' : ''}`} onClick={() => setMemberFilter('Teacher')}>TEACHERS</button>
          </div>
          <h2>Members List</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Index/Employee No</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(m => !memberFilter || m.membershipType === memberFilter).length > 0 ? 
                  members.filter(m => !memberFilter || m.membershipType === memberFilter).map(member => (
                    <tr key={member._id}>
                      <td><span className="member-id-badge">{member.memberId}</span></td>
                      <td>{member.name}</td>
                      <td>{member.membershipType}</td>
                      <td>{member.indexNumber || member.employeeNumber || '-'}</td>
                      <td>{member.address || '-'}</td>
                      <td>{member.phone || '-'}</td>
                      <td><span className={`status ${member.status.toLowerCase()}`}>{member.status}</span></td>
                      <td>
                        <button className="edit-btn" onClick={() => editMember(member)}>Edit</button>
                        <button className="delete-btn" onClick={() => deleteMember(member._id)}>Delete</button>
                      </td>
                    </tr>
                  )) : 
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No members found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ISSUE/RETURN TAB */}
      {activeTab === 'issue' && (
        <div className="tab-content">
          <h2>Issue Book</h2>
          <form onSubmit={issueBook} className="add-form">
            <select value={formData.bookId || ''} onChange={(e) => setFormData({...formData, bookId: e.target.value})} required>
              <option value="">Select Book</option>
              {books.filter(b => b.available > 0).map(book => (<option key={book._id} value={book._id}>{book.title} ({book.available} available)</option>))}
            </select>
            <select value={formData.memberId || ''} onChange={(e) => setFormData({...formData, memberId: e.target.value})} required>
              <option value="">Select Member</option>
              {members.filter(m => m.status === 'Active').map(member => (<option key={member._id} value={member._id}>{member.name} ({member.memberId}) - {member.membershipType} - {member.indexNumber || member.employeeNumber || ''}</option>))}
            </select>
            <div className="info-message"><p>Due date will be automatically set to 3 days from today</p></div>
            <button type="submit" disabled={loading}>Issue Book</button>
          </form>
          <h2>Active Issues</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Fine (Rs.)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t => t.status === 'Issued').length > 0 ? 
                  transactions.filter(t => t.status === 'Issued').map(t => {
                    const book = books.find(b => b._id === t.book?._id || t.book);
                    const member = members.find(m => m._id === t.member?._id || t.member);
                    const fine = calculateFine(t.dueDate, null, member?.membershipType);
                    return (
                      <tr key={t._id}>
                        <td>{book?.title || 'Unknown'}</td>
                        <td>{member?.name || 'Unknown'}</td>
                        <td>{member?.membershipType || 'Unknown'}</td>
                        <td>{new Date(t.issueDate).toLocaleDateString('ar-SA')}</td>
                        <td className={fine > 0 ? 'overdue-date' : ''}>{new Date(t.dueDate).toLocaleDateString('ar-SA')}</td>
                        <td>{fine > 0 ? <span className="fine-amount">Rs. {fine}</span> : 'No fine'}</td>
                        <td><button className="return-btn" onClick={() => returnBook(t._id, t.dueDate, member?.membershipType)}>Return</button></td>
                      </tr>
                    );
                  }) : 
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No active issues</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <h2 style={{ marginTop: '30px' }}>Return History</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Fine Paid (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t => t.status === 'Returned').slice(0, 5).map(t => {
                  const book = books.find(b => b._id === t.book?._id || t.book);
                  const member = members.find(m => m._id === t.member?._id || t.member);
                  const fine = calculateFine(t.dueDate, t.returnDate, member?.membershipType);
                  return (
                    <tr key={t._id}>
                      <td>{book?.title || 'Unknown'}</td>
                      <td>{member?.name || 'Unknown'}</td>
                      <td>{member?.membershipType || 'Unknown'}</td>
                      <td>{new Date(t.issueDate).toLocaleDateString('ar-SA')}</td>
                      <td>{new Date(t.returnDate).toLocaleDateString('ar-SA')}</td>
                      <td>{fine > 0 ? `Rs. ${fine}` : 'None'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="tab-content">
          <div className="settings-header"><h2>Export Reports</h2><button className="settings-toggle" onClick={() => setShowFineSettings(!showFineSettings)}>Fine Settings</button></div>
          {showFineSettings && (
            <div className="fine-settings-panel">
              <h3>Configure Fine Rate</h3>
              <div className="fine-setting-form">
                <div className="form-group"><label>Fine per day (Rs.):</label><input type="number" min="0" step="5" value={fineRate} onChange={(e) => setFineRate(parseInt(e.target.value) || 0)} className="fine-input" /></div>
                <div className="fine-preview"><p>Current rate: <strong>Rs. {fineRate} per day</strong></p><p>5 days late = <strong>Rs. {fineRate * 5}</strong></p><p>10 days late = <strong>Rs. {fineRate * 10}</strong></p><p className="teacher-note">Teachers: No fine</p></div>
                <button className="save-fine-btn" onClick={() => { setShowFineSettings(false); alert(`Fine rate updated to Rs. ${fineRate} per day`); }}>Save Settings</button>
              </div>
            </div>
          )}
          <div className="reports-grid">
            <div className="report-card"><div className="report-icon">Books</div><h3>Books Report</h3><p>Export all books with details</p><button className="export-btn" onClick={exportBooks}>Excel</button><button className="pdf-btn" onClick={exportBooksToPDF}>PDF</button><button className="print-btn" onClick={printBooks}>Print</button></div>
            <div className="report-card"><div className="report-icon">Members</div><h3>Members Report</h3><p>Export all members with details</p><button className="export-btn" onClick={exportMembers}>Excel</button><button className="pdf-btn" onClick={exportMembersToPDF}>PDF</button><button className="print-btn" onClick={printMembers}>Print</button></div>
            <div className="report-card"><div className="report-icon">Transactions</div><h3>Transactions Report</h3><p>Export all transactions</p><button className="export-btn" onClick={exportTransactions}>Excel</button><button className="pdf-btn" onClick={exportTransactionsToPDF}>PDF</button></div>
            <div className="report-card"><div className="report-icon">Fine</div><h3>Fine Report</h3><p>Export all fines collected</p><button className="export-btn" onClick={exportFineReport}>Excel</button><button className="pdf-btn" onClick={exportFineReportToPDF}>PDF</button><button className="print-btn" onClick={printFineReport}>Print</button></div>
            <div className="report-card summary-card"><div className="report-icon">Summary</div><h3>Library Summary</h3><div className="summary-stats"><p>Total Books: <strong>{books.length}</strong></p><p>Total Members: <strong>{members.length}</strong></p><p>Issued Books: <strong>{transactions.filter(t => t.status === 'Issued').length}</strong></p><p>Overdue Books: <strong>{overdueCount}</strong></p><p>Total Fines: <strong>Rs. {fineReport.reduce((sum, f) => sum + f.fine, 0)}</strong></p><p>Teachers: <strong>No fine</strong></p></div></div>
          </div>
        </div>
      )}

      {/* BACKUP TAB */}
      {activeTab === 'backup' && (
        <div className="tab-content">
          <h2>Backup & Restore</h2>
          <div className="backup-container">
            <div className="backup-card"><div className="backup-icon">Create Backup</div><h3>Create Backup</h3><p>Download all library data as a JSON file</p><div className="backup-stats"><p>Books: <strong>{books.length}</strong></p><p>Members: <strong>{members.length}</strong></p><p>Transactions: <strong>{transactions.length}</strong></p></div><button className="backup-btn" onClick={createBackup} disabled={loading}>Download Backup</button></div>
            <div className="backup-card restore-card"><div className="backup-icon">Restore</div><h3>Restore from Backup</h3><p>Select a backup file (.json) to restore data</p><div className="warning-box">Warning: This will overwrite existing data!</div><input type="file" id="restore-file" accept=".json" style={{ display: 'none' }} onChange={restoreFromBackup} /><button className="restore-btn" onClick={() => document.getElementById('restore-file').click()} disabled={loading}>Choose Backup File</button></div>
            <div className="backup-card"><div className="backup-icon">Last Backup</div><h3>Last Backup</h3>{lastBackup ? (<div className="last-backup-details"><div className="backup-time"><span>Date:</span><strong>{lastBackup.date}</strong></div><div className="backup-time"><span>Time:</span><strong>{lastBackup.time}</strong></div><div className="backup-success-badge">Successful</div></div>) : (<p className="no-backup-msg">No backup created yet</p>)}</div>
          </div>
        </div>
      )}
      
      <Footer />

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group"><label>Current Password:</label><input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
              <div className="form-group"><label>New Password:</label><input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} required /></div>
              <div className="form-group"><label>Confirm New Password:</label><input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} required /></div>
              <div className="modal-actions"><button type="submit" className="btn-primary">Change Password</button><button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Manage Users</h2>
            <div className="add-user-form"><h3>Add New User</h3><form onSubmit={handleAddUser}><input type="text" placeholder="Username" value={newUserData.username} onChange={(e) => setNewUserData({...newUserData, username: e.target.value})} required /><input type="password" placeholder="Password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} required /><select value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}><option value="Librarian">Librarian</option><option value="Administrator">Administrator</option></select><button type="submit">Add User</button></form></div>
            <div className="users-list"><h3>Current Users</h3><table><thead><tr><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map(user => (<tr key={user.id}><td>{user.username}</td><td>{user.role}</td><td>{users.length > 1 && <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>Delete</button>}</td></tr>))}</tbody></table></div>
            <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowUserManagement(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;