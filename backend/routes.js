import express from 'express';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getAllProjects, getProjectById, createProject,
  getAllTestSuites, createTestSuite, deleteTestSuite,
  getAllTestCases, getTestCasesBySuiteId, createTestCase, createTestCases, updateTestCase, deleteTestCase,
  getAllTestRuns, getTestRunById, createTestRun, updateTestRun, deleteTestRun,
  getExecutionResultsByRunId, createExecutionResult, updateExecutionResult,
  getAllReports, createReport, deleteReport, getReportById,
  getSettings, updateSettings, updateAllSettings, getStatistics
} from './database.js';
import { parseCSVFile, parseADOFormat } from './services/csvService.js';
import { generatePDFReport, generateWordReport } from './services/reportService.js';
import { analyzeTestResults } from './services/grokService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// PROJECTS
router.get('/projects', async (req, res, next) => { try { res.json({ success: true, data: await getAllProjects() }); } catch (e) { next(e); } });
router.post('/projects', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createProject(req.body) }); } catch (e) { next(e); } });

// SUITES
router.get('/test-suites', async (req, res, next) => { try { res.json({ success: true, data: await getAllTestSuites(req.query.projectId) }); } catch (e) { next(e); } });
router.post('/test-suites', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createTestSuite(req.body) }); } catch (e) { next(e); } });
router.delete('/test-suites/:id', async (req, res, next) => { try { await deleteTestSuite(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// CASES
router.get('/test-cases', async (req, res, next) => { try { const data = req.query.suiteId ? await getTestCasesBySuiteId(req.query.suiteId) : await getAllTestCases(req.query.projectId); res.json({ success: true, data }); } catch (e) { next(e); } });
router.post('/test-cases', async (req, res, next) => { try { res.status(201).json({ success: true, data: await createTestCase(req.body) }); } catch (e) { next(e); } });
router.put('/test-cases/:id', async (req, res, next) => { try { res.json({ success: true, data: await updateTestCase(req.params.id, req.body) }); } catch (e) { next(e); } });
router.delete('/test-cases/:id', async (req, res, next) => { try { await deleteTestCase(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// CSV
router.post('/upload/csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const parsedData = await parseCSVFile(req.file.path);
    const testCases = parseADOFormat(parsedData);
    const suite = await createTestSuite({
      projectId: req.body.projectId, name: req.body.suiteName, description: req.body.suiteDescription, source: 'ADO Import', testCaseCount: testCases.length
    });
    const testCasesWithSuite = testCases.map(tc => { const { id, ...rest } = tc; return { ...rest, suiteId: suite._id, projectId: req.body.projectId }; });
    await createTestCases(testCasesWithSuite);
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ success: true, message: `Imported ${testCases.length} cases` });
  } catch (error) { next(error); }
});

// RUNS
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

// EXECUTION RESULT UPDATE
router.put('/execution-results/:id', async (req, res, next) => {
  try {
    const updated = await updateExecutionResult(req.params.id, req.body);
    const results = await getExecutionResultsByRunId(updated.runId);
    
    const stats = {
      passed: results.filter(r => r.status === 'Passed').length,
      failed: results.filter(r => r.status === 'Failed').length,
      blocked: results.filter(r => r.status === 'Blocked').length,
      na: results.filter(r => r.status === 'N/A').length,
      notRun: results.filter(r => r.status === 'Not Run').length
    };

    if (stats.notRun === 0) {
      stats.status = 'Completed';
      stats.completedAt = new Date();
    } else {
      stats.status = 'In Progress';
    }

    await updateTestRun(updated.runId, stats);
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// REPORTS
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
        const results = await getExecutionResultsByRunId(r._id);
        allResults = [...allResults, ...results.map(res => ({ ...res._doc, runName: r.name }))];
      }
      reportName = `${project.name} Project Report`;
      reportData = { type: 'project', project, runs, results: allResults };
    } else {
      const testRun = await getTestRunById(runId);
      const results = await getExecutionResultsByRunId(runId);
      reportName = `${testRun.name} Report`;
      reportData = { type: 'run', testRun, results };
    }

    console.log("🤖 Asking AI...");
    const aiAnalysis = await analyzeTestResults(reportData, settings);
    reportData.aiAnalysis = aiAnalysis;

    let fileResult;
    if (format === 'pdf') fileResult = await generatePDFReport(reportData);
    else fileResult = await generateWordReport(reportData);

    const report = await createReport({
      projectId, name: reportName, runId: runId === 'ALL_PROJECT_RUNS' ? null : runId,
      format, filePath: fileResult.filePath, fileName: fileResult.fileName, generatedAt: new Date()
    });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
});

router.get('/reports/:id/download', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (fs.existsSync(report.filePath)) {
      res.download(report.filePath, report.fileName);
    } else {
      console.log("File missing, regenerating...");
      // Simple regen for single runs
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

// SETTINGS & STATS
router.get('/statistics', async (req, res, next) => { try { res.json({ success: true, data: await getStatistics(req.query.projectId) }); } catch (e) { next(e); } });
router.get('/settings', async (req, res, next) => { try { res.json({ success: true, data: await getSettings() }); } catch (e) { next(e); } });
router.put('/settings/:category', async (req, res, next) => { try { await updateSettings(req.params.category, req.body); const all = await getSettings(); res.json({ success: true, data: all }); } catch (e) { next(e); } });
router.put('/settings', async (req, res, next) => { try { await updateAllSettings(req.body); const all = await getSettings(); res.json({ success: true, data: all }); } catch (e) { next(e); } });

export default router;