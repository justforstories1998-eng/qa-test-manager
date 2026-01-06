import express from 'express';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import {
  getAllTestSuites,
  createTestSuite,
  deleteTestSuite,
  getAllTestCases,
  getTestCasesBySuiteId,
  createTestCase,
  createTestCases, // <--- THIS WAS MISSING
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
  createReport,
  deleteReport,
  getSettings,
  updateSettings,
  getStatistics
} from './database.js';

import { parseCSVFile, parseADOFormat } from './services/csvService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// --- TEST SUITES ---
router.get('/test-suites', async (req, res, next) => {
  try { res.json({ success: true, data: await getAllTestSuites() }); } catch (e) { next(e); }
});

router.post('/test-suites', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await createTestSuite(req.body) }); } catch (e) { next(e); }
});

router.delete('/test-suites/:id', async (req, res, next) => {
  try { await deleteTestSuite(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

// --- TEST CASES ---
router.get('/test-cases', async (req, res, next) => {
  try {
    const data = req.query.suiteId ? await getTestCasesBySuiteId(req.query.suiteId) : await getAllTestCases();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/test-cases', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await createTestCase(req.body) }); } catch (e) { next(e); }
});

router.put('/test-cases/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await updateTestCase(req.params.id, req.body) }); } catch (e) { next(e); }
});

router.delete('/test-cases/:id', async (req, res, next) => {
  try { await deleteTestCase(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

// --- CSV UPLOAD ---
router.post('/upload/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    
    // Parse
    const parsedData = await parseCSVFile(req.file.path);
    const testCases = parseADOFormat(parsedData);
    
    // Create Suite
    const suite = await createTestSuite({
      name: req.body.suiteName,
      description: req.body.suiteDescription,
      source: 'ADO Import',
      testCaseCount: testCases.length
    });
    
    // Map IDs
    const testCasesWithSuite = testCases.map(tc => {
      const { id, ...rest } = tc; 
      return { ...rest, suiteId: suite._id }; 
    });
    
    // Save Bulk
    await createTestCases(testCasesWithSuite);
    
    // Cleanup file
    fs.unlink(req.file.path, (err) => { if (err) console.error('Failed to delete temp file:', err); });

    res.status(201).json({ success: true, message: `Imported ${testCases.length} test cases` });
  } catch (error) { 
    console.error("CSV Import Error:", error);
    next(error); 
  }
});

// --- TEST RUNS ---
router.get('/test-runs', async (req, res, next) => {
  try { res.json({ success: true, data: await getAllTestRuns() }); } catch (e) { next(e); }
});

router.post('/test-runs', async (req, res, next) => {
  try {
    const run = await createTestRun(req.body);
    if (req.body.testCaseIds) {
      const resultsToCreate = req.body.testCaseIds.map(tcId => ({
        runId: run._id,
        testCaseId: tcId,
        status: 'Not Run'
      }));
      // Simple loop to ensure creation
      for (const result of resultsToCreate) {
        await createExecutionResult(result);
      }
    }
    res.status(201).json({ success: true, data: run });
  } catch (e) { next(e); }
});

router.delete('/test-runs/:id', async (req, res, next) => {
  try { 
    const deleted = await deleteTestRun(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Run not found' });
    res.json({ success: true, message: 'Deleted successfully' }); 
  } catch (e) { next(e); }
});

router.get('/test-runs/:runId/results', async (req, res, next) => {
  try { res.json({ success: true, data: await getExecutionResultsByRunId(req.params.runId) }); } catch (e) { next(e); }
});

router.put('/execution-results/:id', async (req, res, next) => {
  try {
    const updated = await updateExecutionResult(req.params.id, req.body);
    // Update stats
    const results = await getExecutionResultsByRunId(updated.runId);
    const stats = {
      passed: results.filter(r => r.status === 'Passed').length,
      failed: results.filter(r => r.status === 'Failed').length,
      blocked: results.filter(r => r.status === 'Blocked').length,
      notRun: results.filter(r => r.status === 'Not Run').length
    };
    await updateTestRun(updated.runId, stats);
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// --- REPORTS ---
router.get('/reports', async (req, res, next) => {
  try { res.json({ success: true, data: await getAllReports() }); } catch (e) { next(e); }
});

router.post('/reports/generate', async (req, res, next) => {
  try {
    const { runId, format } = req.body;
    const testRun = await getTestRunById(runId);
    const report = await createReport({
      name: `${testRun.name} Report`,
      runId: testRun._id,
      format,
      generatedAt: new Date()
    });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
});

// --- SETTINGS & STATS ---
router.get('/settings', async (req, res, next) => {
  try { res.json({ success: true, data: await getSettings() }); } catch (e) { next(e); }
});

router.put('/settings/:category', async (req, res, next) => {
  try { res.json({ success: true, data: await updateSettings(req.params.category, req.body) }); } catch (e) { next(e); }
});

router.get('/statistics', async (req, res, next) => {
  try { res.json({ success: true, data: await getStatistics() }); } catch (e) { next(e); }
});

export default router;