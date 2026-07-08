import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import multerStorageCloudinary from 'multer-storage-cloudinary'; 
import fs from 'fs';
import {
  getAllProjects, getProjectById, createProject, deleteProject,
  getAllBugs, createBug, updateBug, deleteBug,
  getAllTestSuites, createTestSuite, deleteTestSuite,
  getAllTestCases, getTestCasesBySuiteId, createTestCase, createTestCases, updateTestCase, deleteTestCase,
  getAllTestRuns, getTestRunById, createTestRun, updateTestRun, deleteTestRun,
  getExecutionResultsByRunId, createExecutionResult, updateExecutionResult, deleteExecutionResult,
  getAllReports, createReport, deleteReport, getReportById,
  getSettings, updateSettings, getStatistics,
  searchUsers, getAllUsers
} from './database.js';
import { parseCSVFile, parseADOFormat } from './services/csvService.js';
import { generatePDFReport, generateWordReport } from './services/reportService.js';
import { analyzeTestResults } from './services/grokService.js';
import { sendBugAssignmentEmail, sendBugCreatedConfirmationEmail } from './services/emailService.js';
import { authenticateToken } from './middleware/auth.js';

// ============================================
// FAIL-SAFE: Import Constructor for Node v24
// ============================================
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || 
                         (multerStorageCloudinary.default ? multerStorageCloudinary.default.CloudinaryStorage : null) ||
                         multerStorageCloudinary;

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateToken);

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensures the storage library finds the uploader
cloudinary.v2 = cloudinary;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qa_manager_bugs',
    resource_type: 'auto', 
    allowed_formats: ['jpg', 'png', 'pdf', 'mp4', 'mov', 'docx', 'avi', 'webm']
  },
});

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB Limit for video support
});

const csvUpload = multer({ dest: 'uploads/' });

// ============================================
// PROJECTS
// ============================================
router.get('/projects', async (req, res, next) => { try { res.json({ success: true, data: await getAllProjects() }); } catch (e) { next(e); } });
router.post('/projects', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createProject(req.body) }); } catch (e) { next(e); } });
router.delete('/projects/:id', async (req, res, next) => { try { await deleteProject(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// USER SEARCH (For Bug Assignment Dropdown)
// ============================================
router.get('/users/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const users = await searchUsers(q);
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

// ============================================
// BUGS (CLOUDINARY ENABLED - 50MB VIDEO SUPPORT)
// ============================================
router.get('/bugs', async (req, res, next) => { try { res.json({ success: true, data: await getAllBugs(req.query.projectId) }); } catch (e) { next(e); } });

router.post('/bugs', upload.single('attachment'), async (req, res, next) => {
  try {
    const bugData = { ...req.body };
    if (req.body.createdBy) {
      bugData.createdBy = req.body.createdBy;
    }
    if (req.file) {
      bugData.attachments = [{
        url: req.file.path || req.file.secure_url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }];
      bugData.attachment = {
        url: req.file.path || req.file.secure_url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      };
    }
    const bug = await createBug(bugData);
    
    if (bugData.createdBy) {
      try {
        const createdByUser = await import('./database.js').then(m => m.getUserById(bugData.createdBy));
        if (createdByUser) {
          await sendBugCreatedConfirmationEmail(bug, createdByUser);
        }
      } catch (emailErr) {
        console.error('Bug creation confirmation email error:', emailErr);
      }
    }

    if (bugData.assignedTo && bugData.createdBy) {
      try {
        const assignedUser = await searchUsers(bugData.assignedTo).then(users => users[0]);
        const createdByUser = await import('./database.js').then(m => m.getUserById(bugData.createdBy));
        if (assignedUser && createdByUser) {
          await sendBugAssignmentEmail(bug, assignedUser, createdByUser);
        }
      } catch (emailErr) {
        console.error('Bug assignment email error:', emailErr);
      }
    }
    
    res.status(201).json({ success: true, data: bug });
  } catch (e) { next(e); }
});

router.put('/bugs/:id', upload.single('attachment'), async (req, res, next) => {
  try {
    const bugData = { ...req.body };
    if (req.file) {
      const newAttachment = {
        url: req.file.path || req.file.secure_url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      };
      bugData.attachments = [newAttachment];
      bugData.attachment = newAttachment;
    }
    const updated = await updateBug(req.params.id, bugData);
    
    if (bugData.assignedTo) {
      try {
        const assignedUser = await searchUsers(bugData.assignedTo).then(users => users[0]);
        if (assignedUser) {
          const createdByUser = updated.createdBy ? await import('./database.js').then(m => m.getUserById(updated.createdBy)) : null;
          if (createdByUser) {
            await sendBugAssignmentEmail(updated, assignedUser, createdByUser);
          }
        }
      } catch (emailErr) {
        console.error('Bug assignment email error:', emailErr);
      }
    }
    
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.delete('/bugs/:id', async (req, res, next) => { try { await deleteBug(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// TEST SUITES
// ============================================
router.get('/test-suites', async (req, res, next) => { try { res.json({ success: true, data: await getAllTestSuites(req.query.projectId) }); } catch (e) { next(e); } });
router.post('/test-suites', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createTestSuite(req.body) }); } catch (e) { next(e); } });
router.delete('/test-suites/:id', async (req, res, next) => { try { await deleteTestSuite(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// TEST CASES
// ============================================
router.get('/test-cases', async (req, res, next) => { 
  try { 
    const data = req.query.suiteId ? await getTestCasesBySuiteId(req.query.suiteId) : await getAllTestCases(req.query.projectId); 
    res.json({ success: true, data }); 
  } catch (e) { next(e); } 
});

router.post('/test-cases', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createTestCase(req.body) }); } catch (e) { next(e); } });
router.put('/test-cases/:id', async (req, res, next) => { try { res.json({ success: true, data: await updateTestCase(req.params.id, req.body) }); } catch (e) { next(e); } });
router.delete('/test-cases/:id', async (req, res, next) => { try { await deleteTestCase(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// CSV IMPORT
// ============================================
router.post('/upload/csv', csvUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const parsedData = await parseCSVFile(req.file.path);
    const testCases = parseADOFormat(parsedData);
    const suite = await createTestSuite({ projectId: req.body.projectId, name: req.body.suiteName, testCaseCount: testCases.length });
    const mapped = testCases.map(tc => ({ ...tc, suiteId: suite._id, projectId: req.body.projectId }));
    await createTestCases(mapped);
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ success: true, message: `Imported ${testCases.length} cases` });
  } catch (error) { next(error); }
});

// ============================================
// TEST RUNS
// ============================================
router.get('/test-runs', async (req, res, next) => { try { res.json({ success: true, data: await getAllTestRuns(req.query.projectId) }); } catch (e) { next(e); } });
router.post('/test-runs', async (req, res, next) => {
  try {
    const run = await createTestRun(req.body);
    if (req.body.testCaseIds) {
      const resultsToCreate = req.body.testCaseIds.map(tcId => ({ runId: run._id, testCaseId: tcId, status: 'Not Run' }));
      for (const res of resultsToCreate) await createExecutionResult(res);
    }
    res.status(201).json({ success: true, data: run });
  } catch (e) { next(e); }
});
router.delete('/test-runs/:id', async (req, res, next) => { try { await deleteTestRun(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });
router.get('/test-runs/:runId/results', async (req, res, next) => { try { res.json({ success: true, data: await getExecutionResultsByRunId(req.params.runId) }); } catch (e) { next(e); } });

// ============================================
// EXECUTION RESULTS
// ============================================
router.put('/execution-results/:id', async (req, res, next) => {
  try {
    const updated = await updateExecutionResult(req.params.id, req.body);
    const results = await getExecutionResultsByRunId(updated.runId);
    const stats = { passed: results.filter(r => r.status === 'Passed').length, failed: results.filter(r => r.status === 'Failed').length, blocked: results.filter(r => r.status === 'Blocked').length, na: results.filter(r => r.status === 'N/A').length, notRun: results.filter(r => r.status === 'Not Run').length };
    stats.status = stats.notRun === 0 ? 'Completed' : 'In Progress';
    if (stats.status === 'Completed') stats.completedAt = new Date();
    await updateTestRun(updated.runId, stats);
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});
router.delete('/execution-results/:id', async (req, res, next) => { try { await deleteExecutionResult(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// REPORTS (WITH AUTO-REGENERATE)
// ============================================
router.get('/reports', async (req, res, next) => { try { res.json({ success: true, data: await getAllReports(req.query.projectId) }); } catch (e) { next(e); } });

router.post('/reports/generate', async (req, res, next) => {
  try {
    const { runId, format, projectId } = req.body;
    const settings = await getSettings();
    let reportData = {};
    let reportName = "";

    if (runId === 'ALL_PROJECT_RUNS') {
      const project = await getProjectById(projectId);
      const runs = await getAllTestRuns(projectId);
      let allResults = [];
      for (const r of runs) {
        const res = await getExecutionResultsByRunId(r._id);
        allResults = [...allResults, ...res.map(item => ({ ...item._doc, runName: r.name }))];
      }
      reportName = `${project.name} Project Report`;
      reportData = { type: 'project', project, runs, results: allResults };
    } else {
      const testRun = await getTestRunById(runId);
      const results = await getExecutionResultsByRunId(runId);
      reportName = `${testRun.name} Report`;
      reportData = { type: 'run', testRun, results };
    }

    const aiAnalysis = await analyzeTestResults(reportData, settings);
    reportData.aiAnalysis = aiAnalysis;

    let fileResult;
    if (format === 'pdf') fileResult = await generatePDFReport(reportData);
    else fileResult = await generateWordReport(reportData);

    const report = await createReport({ projectId, name: reportName, runId: runId === 'ALL_PROJECT_RUNS' ? null : runId, format, filePath: fileResult.filePath, fileName: fileResult.fileName, generatedAt: new Date() });
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
});

router.get('/reports/:id', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
});

router.get('/reports/:id/download', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (fs.existsSync(report.filePath)) res.download(report.filePath, report.fileName);
    else {
      if (report.runId) {
        const testRun = await getTestRunById(report.runId);
        const results = await getExecutionResultsByRunId(report.runId);
        const fileResult = await generatePDFReport({ type: 'run', testRun, results, aiAnalysis: { isSimulation: true } });
        res.download(fileResult.filePath, report.fileName);
      } else {
        res.status(404).json({ error: 'File expired.' });
      }
    }
  } catch (e) { next(e); }
});

router.delete('/reports/:id', async (req, res, next) => { try { await deleteReport(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// ============================================
// STATS & SETTINGS
// ============================================
router.get('/statistics', async (req, res, next) => { try { res.json({ success: true, data: await getStatistics(req.query.projectId) }); } catch (e) { next(e); } });
router.get('/settings', async (req, res, next) => { try { res.json({ success: true, data: await getSettings() }); } catch (e) { next(e); } });
router.put('/settings/:category', async (req, res, next) => { try { await updateSettings(req.params.category, req.body); const allSettings = await getSettings(); res.json({ success: true, data: allSettings }); } catch (e) { next(e); } });

export default router;