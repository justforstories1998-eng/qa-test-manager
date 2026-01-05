import express from 'express';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Database operations
import {
  getAllTestSuites,
  getTestSuiteById,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
  getAllTestCases,
  getTestCaseById,
  getTestCasesBySuiteId,
  createTestCase,
  createTestCases,
  updateTestCase,
  deleteTestCase,
  getAllTestRuns,
  getTestRunById,
  createTestRun,
  updateTestRun,
  deleteTestRun,
  getExecutionResultsByRunId,
  createExecutionResult,
  updateExecutionResult,
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
  getSettings,
  updateSettings,
  updateAllSettings,
  getStatistics
} from './database.js';

// Services
import { parseCSVFile, parseADOFormat } from './services/csvService.js';
import { generatePDFReport, generateWordReport } from './services/reportService.js';
import { analyzeTestResults, generateAISummary } from './services/grokService.js';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize router
const router = express.Router();

// ============================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================
// TEST SUITES ROUTES
// ============================================

// Get all test suites
router.get('/test-suites', async (req, res, next) => {
  try {
    const suites = await getAllTestSuites();
    res.json({ success: true, data: suites });
  } catch (error) {
    next(error);
  }
});

// Get single test suite
router.get('/test-suites/:id', async (req, res, next) => {
  try {
    const suite = await getTestSuiteById(req.params.id);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Test suite not found' });
    }
    res.json({ success: true, data: suite });
  } catch (error) {
    next(error);
  }
});

// Create test suite
router.post('/test-suites', async (req, res, next) => {
  try {
    const suite = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCaseCount: 0
    };
    const created = await createTestSuite(suite);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// Update test suite
router.put('/test-suites/:id', async (req, res, next) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    const updated = await updateTestSuite(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Test suite not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete test suite
router.delete('/test-suites/:id', async (req, res, next) => {
  try {
    const deleted = await deleteTestSuite(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Test suite not found' });
    }
    res.json({ success: true, message: 'Test suite deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// TEST CASES ROUTES
// ============================================

// Get all test cases (with optional suite filter)
router.get('/test-cases', async (req, res, next) => {
  try {
    let testCases;
    if (req.query.suiteId) {
      testCases = await getTestCasesBySuiteId(req.query.suiteId);
    } else {
      testCases = await getAllTestCases();
    }
    res.json({ success: true, data: testCases });
  } catch (error) {
    next(error);
  }
});

// Get single test case
router.get('/test-cases/:id', async (req, res, next) => {
  try {
    const testCase = await getTestCaseById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }
    res.json({ success: true, data: testCase });
  } catch (error) {
    next(error);
  }
});

// Create test case
router.post('/test-cases', async (req, res, next) => {
  try {
    const testCase = {
      id: uuidv4(),
      adoId: req.body.adoId || null,
      suiteId: req.body.suiteId,
      title: req.body.title,
      description: req.body.description || '',
      steps: req.body.steps || [],
      expectedResult: req.body.expectedResult || '',
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'Not Run',
      assignedTo: req.body.assignedTo || '',
      tags: req.body.tags || [],
      automationStatus: req.body.automationStatus || 'Manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const created = await createTestCase(testCase);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// Update test case
router.put('/test-cases/:id', async (req, res, next) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    const updated = await updateTestCase(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete test case
router.delete('/test-cases/:id', async (req, res, next) => {
  try {
    const deleted = await deleteTestCase(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }
    res.json({ success: true, message: 'Test case deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// TEST RUNS ROUTES
// ============================================

// Get all test runs
router.get('/test-runs', async (req, res, next) => {
  try {
    const runs = await getAllTestRuns();
    res.json({ success: true, data: runs });
  } catch (error) {
    next(error);
  }
});

// Get single test run with results
router.get('/test-runs/:id', async (req, res, next) => {
  try {
    const run = await getTestRunById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    const results = await getExecutionResultsByRunId(req.params.id);
    res.json({ success: true, data: { ...run, results } });
  } catch (error) {
    next(error);
  }
});

// Create test run
router.post('/test-runs', async (req, res, next) => {
  try {
    const testRun = {
      id: uuidv4(),
      name: req.body.name,
      suiteId: req.body.suiteId,
      description: req.body.description || '',
      tester: req.body.tester || '',
      environment: req.body.environment || 'Development',
      buildNumber: req.body.buildNumber || '',
      status: 'In Progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalTests: req.body.totalTests || 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      notRun: req.body.totalTests || 0
    };
    const created = await createTestRun(testRun);
    
    // Initialize execution results for each test case
    if (req.body.testCaseIds && req.body.testCaseIds.length > 0) {
      for (const tcId of req.body.testCaseIds) {
        const result = {
          id: uuidv4(),
          runId: created.id,
          testCaseId: tcId,
          status: 'Not Run',
          comments: '',
          executedAt: null,
          executedBy: '',
          duration: null
        };
        await createExecutionResult(result);
      }
    }
    
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// Update test run
router.put('/test-runs/:id', async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'Completed' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    }
    const updated = await updateTestRun(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete test run
router.delete('/test-runs/:id', async (req, res, next) => {
  try {
    const deleted = await deleteTestRun(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    res.json({ success: true, message: 'Test run deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// EXECUTION RESULTS ROUTES
// ============================================

// Get results for a test run
router.get('/test-runs/:runId/results', async (req, res, next) => {
  try {
    const results = await getExecutionResultsByRunId(req.params.runId);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Update execution result
router.put('/execution-results/:id', async (req, res, next) => {
  try {
    const updates = {
      ...req.body,
      executedAt: new Date().toISOString()
    };
    const updated = await updateExecutionResult(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Execution result not found' });
    }
    
    // Update test run statistics
    if (updated.runId) {
      const results = await getExecutionResultsByRunId(updated.runId);
      const stats = {
        passed: results.filter(r => r.status === 'Passed').length,
        failed: results.filter(r => r.status === 'Failed').length,
        blocked: results.filter(r => r.status === 'Blocked').length,
        notRun: results.filter(r => r.status === 'Not Run').length
      };
      await updateTestRun(updated.runId, stats);
    }
    
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CSV UPLOAD ROUTES
// ============================================

// Upload and parse CSV file
router.post('/upload/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const suiteName = req.body.suiteName || `Import ${new Date().toLocaleDateString()}`;
    const suiteDescription = req.body.suiteDescription || 'Imported from Azure DevOps CSV';
    
    // Parse CSV file
    const parsedData = await parseCSVFile(filePath);
    const testCases = parseADOFormat(parsedData);
    
    // Create test suite
    const suite = {
      id: uuidv4(),
      name: suiteName,
      description: suiteDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCaseCount: testCases.length,
      source: 'ADO Import'
    };
    await createTestSuite(suite);
    
    // Add suite ID to each test case and save
    const testCasesWithSuite = testCases.map(tc => ({
      ...tc,
      id: uuidv4(),
      suiteId: suite.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    await createTestCases(testCasesWithSuite);
    
    res.status(201).json({
      success: true,
      data: {
        suite,
        testCasesCount: testCasesWithSuite.length,
        testCases: testCasesWithSuite
      },
      message: `Successfully imported ${testCasesWithSuite.length} test cases`
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// REPORTS ROUTES
// ============================================

// Get all reports
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await getAllReports();
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/reports/:id', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// Generate report
router.post('/reports/generate', async (req, res, next) => {
  try {
    const { runId, format, options } = req.body;
    
    // Get test run data
    const testRun = await getTestRunById(runId);
    if (!testRun) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    
    // Get execution results
    const results = await getExecutionResultsByRunId(runId);
    
    // Get test case details for each result
    const detailedResults = await Promise.all(
      results.map(async (result) => {
        const testCase = await getTestCaseById(result.testCaseId);
        return { ...result, testCase };
      })
    );
    
    // Get settings
    const settings = await getSettings();
    
    // Prepare report data
    const reportData = {
      testRun,
      results: detailedResults,
      settings: settings.reporting,
      generatedAt: new Date().toISOString()
    };
    
    let filePath;
    let fileName;
    
    if (format === 'pdf') {
      const pdfResult = await generatePDFReport(reportData, options);
      filePath = pdfResult.filePath;
      fileName = pdfResult.fileName;
    } else if (format === 'word' || format === 'docx') {
      const wordResult = await generateWordReport(reportData, options);
      filePath = wordResult.filePath;
      fileName = wordResult.fileName;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid format. Use pdf or word' });
    }
    
    // Save report record
    const report = {
      id: uuidv4(),
      name: `${testRun.name} - Report`,
      runId,
      format,
      filePath,
      fileName,
      generatedAt: new Date().toISOString(),
      generatedBy: options?.generatedBy || 'System'
    };
    await createReport(report);
    
    res.json({
      success: true,
      data: report,
      message: `Report generated successfully as ${format.toUpperCase()}`
    });
  } catch (error) {
    next(error);
  }
});

// Download report
router.get('/reports/:id/download', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.download(report.filePath, report.fileName);
  } catch (error) {
    next(error);
  }
});

// Delete report
router.delete('/reports/:id', async (req, res, next) => {
  try {
    const deleted = await deleteReport(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GROK AI ROUTES
// ============================================

// Analyze test results with Grok AI
router.post('/grok/analyze', async (req, res, next) => {
  try {
    const { runId } = req.body;
    const settings = await getSettings();
    
    if (!settings.grokAI.enabled || !settings.grokAI.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Grok AI is not enabled or API key is missing. Please configure in Settings.'
      });
    }
    
    // Get test run data
    const testRun = await getTestRunById(runId);
    if (!testRun) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    
    // Get execution results with test case details
    const results = await getExecutionResultsByRunId(runId);
    const detailedResults = await Promise.all(
      results.map(async (result) => {
        const testCase = await getTestCaseById(result.testCaseId);
        return { ...result, testCase };
      })
    );
    
    // Analyze with Grok
    const analysis = await analyzeTestResults(testRun, detailedResults, settings.grokAI);
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

// Generate AI summary for report
router.post('/grok/summary', async (req, res, next) => {
  try {
    const { runId } = req.body;
    const settings = await getSettings();
    
    if (!settings.grokAI.enabled || !settings.grokAI.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Grok AI is not enabled or API key is missing.'
      });
    }
    
    const testRun = await getTestRunById(runId);
    if (!testRun) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }
    
    const results = await getExecutionResultsByRunId(runId);
    const detailedResults = await Promise.all(
      results.map(async (result) => {
        const testCase = await getTestCaseById(result.testCaseId);
        return { ...result, testCase };
      })
    );
    
    const summary = await generateAISummary(testRun, detailedResults, settings.grokAI);
    
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SETTINGS ROUTES
// ============================================

// Get all settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await getSettings();
    // Hide API key in response
    const safeSettings = { ...settings };
    if (safeSettings.grokAI?.apiKey) {
      safeSettings.grokAI = {
        ...safeSettings.grokAI,
        apiKey: safeSettings.grokAI.apiKey ? '••••••••' : ''
      };
    }
    res.json({ success: true, data: safeSettings });
  } catch (error) {
    next(error);
  }
});

// Update specific settings category
router.put('/settings/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const updated = await updateSettings(category, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Settings category not found' });
    }
    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Update all settings
router.put('/settings', async (req, res, next) => {
  try {
    const updated = await updateAllSettings(req.body);
    res.json({ success: true, data: updated, message: 'All settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// STATISTICS ROUTES
// ============================================

// Get dashboard statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const stats = await getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get detailed statistics for a test suite
router.get('/statistics/suite/:suiteId', async (req, res, next) => {
  try {
    const testCases = await getTestCasesBySuiteId(req.params.suiteId);
    const runs = await getAllTestRuns();
    const suiteRuns = runs.filter(r => r.suiteId === req.params.suiteId);
    
    const stats = {
      totalTestCases: testCases.length,
      totalRuns: suiteRuns.length,
      priorityBreakdown: {
        critical: testCases.filter(tc => tc.priority === 'Critical').length,
        high: testCases.filter(tc => tc.priority === 'High').length,
        medium: testCases.filter(tc => tc.priority === 'Medium').length,
        low: testCases.filter(tc => tc.priority === 'Low').length
      },
      automationStatus: {
        manual: testCases.filter(tc => tc.automationStatus === 'Manual').length,
        automated: testCases.filter(tc => tc.automationStatus === 'Automated').length,
        planned: testCases.filter(tc => tc.automationStatus === 'Planned').length
      }
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;