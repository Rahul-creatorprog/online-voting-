require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Student = require('./models/Student');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const electionRoutes = require('./routes/electionRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const votingRoutes = require('./routes/votingRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const profileRoutes = require('./routes/profileRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

// Connect Database and Seed
connectDB().then(() => {
  seedDatabase();
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/elections', electionRoutes);
app.use('/api/admin/candidates', candidateRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api', profileRoutes); // Handles /api/student/change-password & /api/admin/change-password
app.use('/api/admin/audit-logs', auditLogRoutes);

// Serve static frontend files if they exist (production monolith mode)
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  // Keep API routes intact, but send index.html for all other page requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  // Fallback root endpoint if frontend is not built
  app.get('/', (req, res) => {
    res.json({ message: 'Online Voting System API is running (Frontend not built)...' });
  });
}

// Seed data function
const seedDatabase = async () => {
  try {
    const adminExists = await Admin.exists({ username: 'admin' });
    if (!adminExists) {
      // Create default admin
      const adminPassHash = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: adminPassHash,
        email: 'admin@college.edu',
        fullName: 'System Administrator'
      });
      console.log('Seeded default admin (user: admin, pass: admin123)');
    }

    if (process.env.SEED_DEMO_DATA === 'true') {
      const studentCount = await Student.countDocuments();
      if (studentCount === 0) {
        // Seed sample students (Password123!)
        const studentPassHash = await bcrypt.hash('Password123!', 10);
        const students = await Student.insertMany([
          { registerNo: '2026CSE001', name: 'Alice Vance', department: 'Computer Science', year: 'III Year', email: 'alice@gmail.com', password: studentPassHash, status: 'ENABLED' },
          { registerNo: '2026CSE002', name: 'Bob Smith', department: 'Computer Science', year: 'III Year', email: 'bob@gmail.com', password: studentPassHash, status: 'ENABLED' },
          { registerNo: '2026CSE003', name: 'Charlie Brown', department: 'Computer Science', year: 'II Year', email: 'charlie@gmail.com', password: studentPassHash, status: 'ENABLED' },
          { registerNo: '2026ECE001', name: 'Diana Prince', department: 'Electronics & Comm', year: 'IV Year', email: 'diana@gmail.com', password: studentPassHash, status: 'ENABLED' },
          { registerNo: '2026MECH01', name: 'Evan Wright', department: 'Mechanical Eng', year: 'I Year', email: 'evan@gmail.com', password: studentPassHash, status: 'DISABLED' }
        ]);
        console.log('Seeded sample students');

        const electionCount = await Election.countDocuments();
        if (electionCount === 0) {
          // Create sample election
          const now = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(now.getDate() + 1);

          const election = await Election.create({
            title: 'College Union Election 2026',
            startTime: now,
            endTime: tomorrow,
            status: 'RUNNING'
          });
          console.log('Seeded active sample election');

          // Create sample candidates
          await Candidate.insertMany([
            { election: election._id, name: 'John Doe', registerNo: '2026CSE100', department: 'Computer Science', year: 'IV Year', position: 'Secretary', manifesto: 'Empowering student voices and organizing tech workshops.' },
            { election: election._id, name: 'Jane Miller', registerNo: '2026ECE102', department: 'Electronics & Comm', year: 'IV Year', position: 'Secretary', manifesto: 'Bridging the gap between students and administration.' },
            { election: election._id, name: 'Sam Wilson', registerNo: '2026MECH201', department: 'Mechanical Eng', year: 'III Year', position: 'Joint Secretary', manifesto: 'Enhancing co-curricular activities and campus facilities.' },
            { election: election._id, name: 'Lucy Heart', registerNo: '2026CSE203', department: 'Computer Science', year: 'III Year', position: 'Joint Secretary', manifesto: 'Promoting cultural exchange programs and events.' },
            { election: election._id, name: 'David Miller', registerNo: '2026CSE305', department: 'Computer Science', year: 'III Year', position: 'Treasurer', manifesto: 'Ensuring transparency in student body funds and budgets.' },
            { election: election._id, name: 'Mary Watson', registerNo: '2026ECE306', department: 'Electronics & Comm', year: 'III Year', position: 'Treasurer', manifesto: 'Funding creative club initiatives and sports programs.' },
            { election: election._id, name: 'Vikram Singh', registerNo: '2026MECH401', department: 'Mechanical Eng', year: 'IV Year', position: 'Sports Secretary', manifesto: 'Upgrading sports equipment and hosting inter-department tournament.' },
            { election: election._id, name: 'Emma Stone', registerNo: '2026CSE405', department: 'Computer Science', year: 'IV Year', position: 'Sports Secretary', manifesto: 'Incentivizing athletic accomplishments and fitness programs.' }
          ]);
          console.log('Seeded sample candidates');
        }
      }
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
