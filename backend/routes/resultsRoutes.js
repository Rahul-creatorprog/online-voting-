const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Election = require('../models/Election');
const Student = require('../models/Student');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const ElectionParticipation = require('../models/ElectionParticipation');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper to compute election results
const computeResults = async (electionId, isAdminRequest) => {
  const election = await Election.findById(electionId);
  if (!election) {
    throw new Error('Election not found.');
  }

  const totalStudents = await Student.countDocuments();
  const votesCast = await ElectionParticipation.countDocuments({ election: electionId });
  const allStudentsVoted = totalStudents > 0 && votesCast >= totalStudents;

  // If not admin, hide results unless the admin has released the results
  if (!isAdminRequest && !election.resultsReleased) {
    throw new Error('Election results are not released yet. Please check back later.');
  }

  const participationRate = totalStudents > 0 ? ((votesCast / totalStudents) * 100) : 0;

  const candidates = await Candidate.find({ election: electionId });
  
  // Count votes for each candidate
  const votes = await Vote.find({ election: electionId });
  const voteCounts = {};
  candidates.forEach(c => { voteCounts[c._id.toString()] = 0; });
  votes.forEach(v => {
    const cid = v.candidate.toString();
    if (voteCounts[cid] !== undefined) {
      voteCounts[cid]++;
    }
  });

  // Group candidates by position
  const candidatesByPosition = {};
  candidates.forEach(c => {
    if (!candidatesByPosition[c.position]) {
      candidatesByPosition[c.position] = [];
    }
    candidatesByPosition[c.position].push(c);
  });

  const resultsByPosition = {};

  for (const position in candidatesByPosition) {
    const positionCandidates = candidatesByPosition[position];

    // Compute total votes for this position
    let totalVotesForPosition = 0;
    positionCandidates.forEach(c => {
      totalVotesForPosition += voteCounts[c._id.toString()] || 0;
    });

    const candidateResults = positionCandidates.map(c => {
      const count = voteCounts[c._id.toString()] || 0;
      const pct = totalVotesForPosition > 0 ? (count / totalVotesForPosition) * 100 : 0;
      return {
        candidateId: c._id,
        name: c.name,
        registerNo: c.registerNo,
        department: c.department,
        year: c.year,
        position: c.position,
        photo: c.photo,
        manifesto: c.manifesto,
        voteCount: count,
        percentage: Math.round(pct * 100) / 100,
        label: ''
      };
    });

    // Sort descending by vote count
    candidateResults.sort((a, b) => b.voteCount - a.voteCount);

    // Label Winner / Runner up
    if (candidateResults.length > 0 && candidateResults[0].voteCount > 0) {
      candidateResults[0].label = 'WINNER';
      if (candidateResults.length > 1 && candidateResults[1].voteCount > 0) {
        candidateResults[1].label = 'RUNNER_UP';
      }
    }

    resultsByPosition[position] = candidateResults;
  }

  return {
    electionTitle: election.title,
    electionStatus: election.status,
    totalStudents,
    votesCast,
    participationRate: Math.round(participationRate * 100) / 100,
    resultsByPosition
  };
};

// GET /api/results/available/list
router.get('/available/list', protect, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    const available = [];
    const totalStudents = await Student.countDocuments();

    for (const election of elections) {
      const votesCast = await ElectionParticipation.countDocuments({ election: election._id });
      const allStudentsVoted = totalStudents > 0 && votesCast >= totalStudents;
      
      // Admin can see all, students can only see if resultsReleased is true
      if (req.user.role === 'ADMIN' || election.resultsReleased) {
        available.push({
          _id: election._id,
          title: election.title,
          status: election.status,
          startTime: election.startTime,
          endTime: election.endTime,
          votesCast,
          totalStudents,
          allStudentsVoted,
          resultsReleased: election.resultsReleased
        });
      }
    }
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/results/:electionId
router.get('/:electionId', protect, async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  try {
    const summary = await computeResults(req.params.electionId, isAdmin);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

// GET /api/results/:electionId/export/excel
router.get('/:electionId/export/excel', protect, async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  try {
    const results = await computeResults(req.params.electionId, true);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Election Results');

    // Title Block
    worksheet.addRow([`Election Results: ${results.electionTitle}`]);
    worksheet.addRow([`Status: ${results.electionStatus}`]);
    worksheet.addRow([`Total Registered Students: ${results.totalStudents}`]);
    worksheet.addRow([`Total Votes Cast: ${results.votesCast}`]);
    worksheet.addRow([`Participation Rate: ${results.participationRate}%`]);
    worksheet.addRow([]); // Blank row

    // Table Headers
    worksheet.addRow(['Position', 'Candidate Name', 'Register No', 'Department', 'Year', 'Votes Count', 'Percentage', 'Verdict']);

    for (const position in results.resultsByPosition) {
      results.resultsByPosition[position].forEach(c => {
        worksheet.addRow([
          position,
          c.name,
          c.registerNo,
          c.department,
          c.year,
          c.voteCount,
          `${c.percentage}%`,
          c.label
        ]);
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=results_election_${req.params.electionId}.xlsx`);

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName || req.user.registerNo,
      action: `Exported results to Excel for Election ID: ${req.params.electionId}`,
      ip
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

// GET /api/results/:electionId/export/csv
router.get('/:electionId/export/csv', protect, async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  try {
    const results = await computeResults(req.params.electionId, true);

    let csv = `Election Title,${results.electionTitle}\n`;
    csv += `Election Status,${results.electionStatus}\n`;
    csv += `Total Registered Students,${results.totalStudents}\n`;
    csv += `Total Votes Cast,${results.votesCast}\n`;
    csv += `Participation Rate,${results.participationRate}%\n\n`;

    csv += 'Position,Candidate Name,Register No,Department,Year,Votes Count,Percentage,Verdict\n';

    for (const position in results.resultsByPosition) {
      results.resultsByPosition[position].forEach(c => {
        csv += `"${position}","${c.name}","${c.registerNo}","${c.department}","${c.year}",${c.voteCount},"${c.percentage}%","${c.label}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=results_election_${req.params.electionId}.csv`);

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName || req.user.registerNo,
      action: `Exported results to CSV for Election ID: ${req.params.electionId}`,
      ip
    });

    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

// GET /api/results/:electionId/export/pdf
router.get('/:electionId/export/pdf', protect, async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  try {
    const results = await computeResults(req.params.electionId, true);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=results_election_${req.params.electionId}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('College Online Voting System', { align: 'center' });
    doc.fontSize(16).text('Official Election Results Report', { align: 'center' });
    doc.moveDown();

    // Summary metadata
    doc.fontSize(12).text(`Election Title: ${results.electionTitle}`);
    doc.text(`Election Status: ${results.electionStatus}`);
    doc.text(`Total Registered Students: ${results.totalStudents}`);
    doc.text(`Total Votes Cast: ${results.votesCast}`);
    doc.text(`Participation Rate: ${results.participationRate}%`);
    doc.moveDown();

    doc.lineWidth(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    for (const position in results.resultsByPosition) {
      doc.fontSize(14).text(`Position: ${position}`, { underline: true });
      doc.moveDown(0.5);

      results.resultsByPosition[position].forEach(c => {
        const labelStr = c.label ? ` [${c.label}]` : '';
        doc.fontSize(11).text(
          `${c.name} (${c.registerNo}) - ${c.department} - ${c.year} -- Votes: ${c.voteCount} (${c.percentage}%)${labelStr}`
        );
      });
      doc.moveDown();
    }

    doc.end();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName || req.user.registerNo,
      action: `Exported results to PDF for Election ID: ${req.params.electionId}`,
      ip
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

// GET /api/results/:electionId/detailed (Admin view detailed student votes)
router.get('/:electionId/detailed', protect, adminOnly, async (req, res) => {
  try {
    const votes = await Vote.find({ election: req.params.electionId })
      .populate('student', 'name registerNo department year')
      .populate('candidate', 'name registerNo position');
    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
