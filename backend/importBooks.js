// backend/importBooks.js
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Book = require('./models/Book');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/library')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Read the Excel file
const workbook = XLSX.readFile('As-salihath ladies arabic colledge.xlsx');

// Sheets to import
const sheets = ['تفسير', 'الحديث', 'الفقه', 'النحو', 'التصوف', 'التاريخ', 'العقيدة', 'الغة العربية'];

// Category mapping
const categoryMap = {
  'تفسير': 'Tafsir',
  'الحديث': 'Hadith',
  'الفقه': 'Fiqh',
  'النحو': 'Arabic Grammar',
  'التصوف': 'Sufism',
  'التاريخ': 'History',
  'العقيدة': 'Aqeedah',
  'الغة العربية': 'Arabic Language'
};

async function importData() {
  try {
    let totalImported = 0;
    let skippedCount = 0;
    
    // Process each sheet
    for (const sheetName of sheets) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.log(`Sheet "${sheetName}" not found, skipping...`);
        continue;
      }
      
      // Convert sheet to rows
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      
      // Find the column indices
      let titleCol = -1;
      let authorCol = -1;
      let serialCol = -1;
      let bookNumberCol = -1;
      
      // Look for header row
      for (let i = 0; i < Math.min(rows.length, 30); i++) {
        const row = rows[i];
        if (!row) continue;
        
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '');
          if (cell.includes('اسم كتاب') || cell.includes('إسم كتاب')) {
            titleCol = j;
          }
          if (cell.includes('إسم مؤلف')) {
            authorCol = j;
          }
          if (cell.includes('رقم المسلسل')) {
            serialCol = j;
          }
          if (cell.includes('رقم المسلسل للفن')) {
            bookNumberCol = j;
          }
        }
        if (titleCol !== -1) break;
      }
      
      if (titleCol === -1) {
        console.log(`Could not find book titles in sheet "${sheetName}", skipping...`);
        continue;
      }
      
      const category = categoryMap[sheetName] || sheetName;
      
      // Start from row where data begins (skip header rows)
      let startRow = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row && row.length > 0 && row[titleCol] && String(row[titleCol]).trim() !== '') {
          // Check if it's a data row (not a header with Arabic text)
          const cellValue = String(row[titleCol]).trim();
          if (!cellValue.includes('علم التفسير') && !cellValue.includes('علم الحديث') && !cellValue.includes('علم الفقه') && cellValue.length > 2) {
            startRow = i;
            break;
          }
        }
      }
      
      console.log(`Processing sheet: ${sheetName} (${category}) starting from row ${startRow}`);
      
      // Process data rows
      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        let title = '';
        if (titleCol !== -1 && row[titleCol]) {
          title = String(row[titleCol]).trim();
        }
        
        let author = '';
        if (authorCol !== -1 && row[authorCol]) {
          author = String(row[authorCol]).trim();
        }
        
        // If no author, use "Unknown"
        if (!author) {
          author = 'Unknown';
        }
        
        // Get serial number or create one
        let serial = '';
        if (serialCol !== -1 && row[serialCol]) {
          serial = String(row[serialCol]).trim();
        } else if (bookNumberCol !== -1 && row[bookNumberCol]) {
          serial = String(row[bookNumberCol]).trim();
        }
        
        // If no serial, create one
        if (!serial) {
          serial = `${category}_${Date.now()}_${i}`;
        }
        
        // Skip empty titles
        if (!title) continue;
        
        // Skip very short titles that might be headers
        if (title.length < 3) continue;
        
        // Create book
        const bookData = {
          title: title,
          author: author,
          isbn: serial,
          category: category,
          quantity: 1,
          available: 1,
          description: `From ${sheetName} section | ${category}`
        };
        
        try {
          // Check if book already exists by ISBN
          const existingBook = await Book.findOne({ isbn: serial });
          if (!existingBook) {
            await Book.create(bookData);
            totalImported++;
            console.log(`✅ Imported: ${title.substring(0, 50)}... (${category})`);
          } else {
            skippedCount++;
            console.log(`⏭️ Skipped (duplicate ISBN): ${title.substring(0, 50)}...`);
          }
        } catch (err) {
          // If ISBN already exists, try with different ISBN
          if (err.code === 11000) {
            const newSerial = `${serial}_${Date.now()}`;
            bookData.isbn = newSerial;
            await Book.create(bookData);
            totalImported++;
            console.log(`✅ Imported (new ISBN): ${title.substring(0, 50)}... (${category})`);
          } else if (err.message && err.message.includes('author')) {
            console.log(`⚠️ Skipped (no author): ${title.substring(0, 50)}...`);
            skippedCount++;
          } else {
            console.log(`❌ Error importing: ${title.substring(0, 50)}...`, err.message);
            skippedCount++;
          }
        }
      }
    }
    
    console.log(`\n🎉 Import complete!`);
    console.log(`📚 Total books imported: ${totalImported}`);
    console.log(`⏭️ Skipped: ${skippedCount}`);
    
    // Show count in database
    const totalBooks = await Book.countDocuments();
    console.log(`📊 Total books in database: ${totalBooks}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

importData();