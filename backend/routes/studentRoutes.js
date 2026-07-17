const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const ExcelJS = require('exceljs');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET /api/admin/students (Supports Pagination, Search, Sorting)
router.get('/', protect, adminOnly, async (req, res) => {
  const { search, page = 0, size = 10, sortBy = 'createdAt', direction = 'asc' } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  let query = {};
  if (search) {
    query = {
      $or: [
        { registerNo: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
  }

  const sortOrder = direction.toLowerCase() === 'desc' ? -1 : 1;
  const sort = { [sortBy]: sortOrder };

  try {
    const totalElements = await Student.countDocuments(query);
    const content = await Student.find(query)
      .sort(sort)
      .skip(pageNum * sizeNum)
      .limit(sizeNum);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / sizeNum),
      number: pageNum,
      size: sizeNum
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/students (Add single student)
router.post('/', protect, adminOnly, async (req, res) => {
  const { registerNo, name, department, year, email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!registerNo || !name || !department || !year || !email) {
    return res.status(400).json({ error: 'Validation Error', message: 'All fields are required.' });
  }

  try {
    const existingStudent = await Student.findOne({
      $or: [{ registerNo: registerNo.toUpperCase() }, { email: email.toLowerCase() }]
    });

    if (existingStudent) {
      return res.status(400).json({ error: 'Duplicate Error', message: 'Student with this Register Number or Email already exists.' });
    }

    const defaultPass = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPass, 10);

    const newStudent = await Student.create({
      registerNo: registerNo.toUpperCase(),
      name,
      department,
      year,
      email: email.toLowerCase(),
      password: hashedPassword,
      status: 'ENABLED'
    });

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Created Student: ${newStudent.registerNo}`,
      ip
    });

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/admin/students/:id (Update student)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, department, year, email } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    if (name) student.name = name;
    if (department) student.department = department;
    if (year) student.year = year;
    if (email) student.email = email.toLowerCase();

    await student.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Updated Student ID: ${id}`,
      ip
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/admin/students/:id (Delete student)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Deleted Student ID: ${id}`,
      ip
    });

    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/students/:id/toggle (Toggle account ENABLED/DISABLED)
router.post('/:id/toggle', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    student.status = student.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    await student.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Toggled Student ${student.registerNo} status to ${student.status}`,
      ip
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/students/:id/reset-password (Reset student password)
router.post('/:id/reset-password', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!password) {
    return res.status(400).json({ error: 'Validation Error', message: 'New password is required.' });
  }

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    student.password = await bcrypt.hash(password, 10);
    await student.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Reset Password for Student ID: ${id}`,
      ip
    });

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/students/template (Download import template)
router.get('/template', async (req, res) => {
  const { format = 'xlsx' } = req.query;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_import_template.csv');
    const csvContent = 'Register Number,Student Name,Department,Year,Email\n2026CSE001,John Doe,Computer Science,III Year,johndoe@gmail.com\n2026ECE002,Jane Smith,Electronics & Comm,IV Year,janesmith@gmail.com\n';
    return res.send(csvContent);
  }

  // Create Excel Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students Template');

  worksheet.columns = [
    { header: 'Register Number', key: 'regNo', width: 20 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Department', key: 'dept', width: 25 },
    { header: 'Year', key: 'year', width: 15 },
    { header: 'Email', key: 'email', width: 30 }
  ];

  worksheet.addRow(['2026CSE001', 'John Doe', 'Computer Science', 'III Year', 'johndoe@gmail.com']);
  worksheet.addRow(['2026ECE002', 'Jane Smith', 'Electronics & Comm', 'IV Year', 'janesmith@gmail.com']);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students_import_template.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

// POST /api/admin/students/import (Bulk Upload)
router.post('/import', protect, adminOnly, upload.single('file'), async (req, res) => {
  const file = req.file;
  const ip = req.ip || req.connection.remoteAddress;

  if (!file) {
    return res.status(400).json({ error: 'Validation Error', message: 'No file was uploaded.' });
  }

  const logs = [];
  let totalRows = 0;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  try {
    const workbook = new ExcelJS.Workbook();
    let rows = [];

    if (file.originalname.endsWith('.xlsx')) {
      await workbook.xlsx.readFile(file.path);
      const worksheet = workbook.getWorksheet(1);
      
      const headers = {};
      const headerRow = worksheet.getRow(1);
      for (let i = 1; i <= worksheet.columnCount; i++) {
        const val = headerRow.getCell(i).value;
        headers[i] = (val ? val.toString() : '').toLowerCase().trim();
      }

      let regNoCol = 1;
      let nameCol = 2;
      let deptCol = 3;
      let yearCol = 4;
      let emailCol = 5;
      let passwordCol = null;

      for (let i = 1; i <= worksheet.columnCount; i++) {
        const header = headers[i];
        if (!header) continue;
        if (header.includes('roll') || header.includes('register') || header.includes('reg')) {
          regNoCol = i;
        } else if (header.includes('name')) {
          nameCol = i;
        } else if (header.includes('email')) {
          emailCol = i;
        } else if (header.includes('department') || header.includes('dept')) {
          deptCol = i;
        } else if (header.includes('year') || header.includes('class')) {
          yearCol = i;
        } else if (header.includes('password') || header.includes('pass')) {
          passwordCol = i;
        }
      }

      const hasDept = Object.values(headers).some(h => h && (h.includes('department') || h.includes('dept')));
      const hasYear = Object.values(headers).some(h => h && (h.includes('year') || h.includes('class')));

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header
        
        const regNoVal = row.getCell(regNoCol).value;
        const nameVal = row.getCell(nameCol).value;
        const emailVal = row.getCell(emailCol).value;
        const deptVal = hasDept ? row.getCell(deptCol).value : null;
        const yearVal = hasYear ? row.getCell(yearCol).value : null;
        const passwordVal = passwordCol ? row.getCell(passwordCol).value : null;

        const regNo = regNoVal ? regNoVal.toString().trim() : '';
        const name = nameVal ? nameVal.toString().trim() : '';
        const email = emailVal ? emailVal.toString().trim() : '';
        
        let dept = deptVal ? deptVal.toString().trim() : '';
        let year = yearVal ? yearVal.toString().trim() : '';
        let password = passwordVal ? passwordVal.toString().trim() : '';

        if (!dept) {
          dept = regNo.includes('BIT') ? 'Information Technology' : (regNo.includes('CSE') ? 'Computer Science' : 'Information Technology');
        }
        if (!year) {
          year = 'II Year';
        }

        rows.push({ regNo, name, dept, year, email, password, rowNumber });
      });
    } else if (file.originalname.endsWith('.csv')) {
      await workbook.csv.readFile(file.path);
      const worksheet = workbook.getWorksheet(1);

      const headers = {};
      const headerRow = worksheet.getRow(1);
      for (let i = 1; i <= worksheet.columnCount; i++) {
        const val = headerRow.getCell(i).value;
        headers[i] = (val ? val.toString() : '').toLowerCase().trim();
      }

      let regNoCol = 1;
      let nameCol = 2;
      let deptCol = 3;
      let yearCol = 4;
      let emailCol = 5;
      let passwordCol = null;

      for (let i = 1; i <= worksheet.columnCount; i++) {
        const header = headers[i];
        if (!header) continue;
        if (header.includes('roll') || header.includes('register') || header.includes('reg')) {
          regNoCol = i;
        } else if (header.includes('name')) {
          nameCol = i;
        } else if (header.includes('email')) {
          emailCol = i;
        } else if (header.includes('department') || header.includes('dept')) {
          deptCol = i;
        } else if (header.includes('year') || header.includes('class')) {
          yearCol = i;
        } else if (header.includes('password') || header.includes('pass')) {
          passwordCol = i;
        }
      }

      const hasDept = Object.values(headers).some(h => h && (h.includes('department') || h.includes('dept')));
      const hasYear = Object.values(headers).some(h => h && (h.includes('year') || h.includes('class')));

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const regNoVal = row.getCell(regNoCol).value;
        const nameVal = row.getCell(nameCol).value;
        const emailVal = row.getCell(emailCol).value;
        const deptVal = hasDept ? row.getCell(deptCol).value : null;
        const yearVal = hasYear ? row.getCell(yearCol).value : null;
        const passwordVal = passwordCol ? row.getCell(passwordCol).value : null;

        const regNo = regNoVal ? regNoVal.toString().trim() : '';
        const name = nameVal ? nameVal.toString().trim() : '';
        const email = emailVal ? emailVal.toString().trim() : '';
        
        let dept = deptVal ? deptVal.toString().trim() : '';
        let year = yearVal ? yearVal.toString().trim() : '';
        let password = passwordVal ? passwordVal.toString().trim() : '';

        if (!dept) {
          dept = regNo.includes('BIT') ? 'Information Technology' : (regNo.includes('CSE') ? 'Computer Science' : 'Information Technology');
        }
        if (!year) {
          year = 'II Year';
        }

        rows.push({ regNo, name, dept, year, email, password, rowNumber });
      });
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a .xlsx or .csv file.' });
    }

    const defaultPassHash = await bcrypt.hash('Password123!', 10);

    for (const data of rows) {
      totalRows++;
      const { regNo, name, dept, year, email, password, rowNumber } = data;

      if (!regNo || !name || !email) {
        logs.push(`Row ${rowNumber}: Ignored due to empty column value(s).`);
        errorCount++;
        continue;
      }

      if (!email.includes('@') || !email.includes('.')) {
        logs.push(`Row ${rowNumber}: Ignored due to invalid email address (${email}).`);
        errorCount++;
        continue;
      }

      // Check duplicates
      const exists = await Student.findOne({
        $or: [{ registerNo: regNo.toUpperCase() }, { email: email.toLowerCase() }]
      });

      if (exists) {
        logs.push(`Row ${rowNumber}: Duplicate record for Register Number ${regNo} or Email ${email}.`);
        duplicateCount++;
        continue;
      }

      const passHash = password ? await bcrypt.hash(password, 10) : defaultPassHash;

      await Student.create({
        registerNo: regNo.toUpperCase().trim(),
        name: name.trim(),
        department: dept.trim(),
        year: year.trim(),
        email: email.toLowerCase().trim(),
        password: passHash,
        status: 'ENABLED'
      });

      successCount++;
    }

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Imported student list. Total Rows: ${totalRows}, Success: ${successCount}, Duplicates: ${duplicateCount}, Errors: ${errorCount}`,
      ip
    });

    res.json({
      totalRows,
      successCount,
      duplicateCount,
      errorCount,
      logs
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
