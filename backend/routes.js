import express from 'express';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getAllProjects, createProject, getProjectById,
  getAllTestSuites, createTestSuite, deleteTestSuite,
  getAllTestCases, getTestCasesBySuiteId, createTestCase, createTestCases, updateTestCase, deleteTestCase,
  getAllTestRuns, getTestRunById, createTestRun, updateTestRun, deleteTestRun,
  getExecutionResultsByRunId, createExecutionResult, updateExecutionResult, deleteExecutionResult,
  getAllReports, createReport, deleteReport, getReportById,
  getSettings, updateSettings, getStatistics
} from './database.js';
import { parseCSVFile, parseADOFormat } from './services/csvService.js';
import { generatePDFReport, generateWordReport } from './services/reportService.js';
import { analyzeTestResults } from './services/grokService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const upload = multer({ dest: join(__dirname, 'uploads') });

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
    const parsedData = await parseCSVFile(req.file.path);
    const testCases = parseADOFormat(parsedData);
    const suite = await createTestSuite({ projectId: req.body.projectId, name: req.body.suiteName, testCaseCount: testCases.length });
    const mapped = testCases.map(tc => ({ ...tc, suiteId: suite._id, projectId: req.body.projectId }));
    await createTestCases(mapped);
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ success: true });
  } catch (error) { next(error); }
});

// RUNS
router.get('/test-runs', async (req, res, next) => { try { res.json({ success: true, data: await getAllTestRuns(req.query.projectId) }); } catch (e) { next(e); } });
router.post('/test-runs', async (req, res, next) => {
  try {
    const run = await createTestRun(req.body);
    if (req.body.testCaseIds) {
      for (const tcId of req.body.testCaseIds) await createExecutionResult({ runId: run._id, testCaseId: tcId, status: 'Not Run' });
    }
    res.status(201).json({ success: true, data: run });
  } catch (e) { next(e); }
});
router.delete('/test-runs/:id', async (req, res, next) => { try { await deleteTestRun(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// RESULTS
router.get('/test-runs/:runId/results', async (req, res, next) => { try { res.json({ success: true, data: await getExecutionResultsByRunId(req.params.runId) }); } catch (e) { next(e); } });
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
    stats.status = stats.notRun === 0 ? 'Completed' : 'In Progress';
    if (stats.status === 'Completed') stats.completedAt = new Date();
    await updateTestRun(updated.runId, stats);
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});
router.delete('/execution-results/:id', async (req, res, next) => { try { await deleteExecutionResult(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

// REPORTS
router.get('/reports', async (req, res, next) => { try { res.json({ success: true, data: await getAllReports(req.query.projectId) }); } catch (e) { next(e); } });
router.post('/reports/generate', async (req, res, next) => {
  try {
    const { runId, format, projectId } = req.body;
    const settings = await getSettings();
    let reportData = {};
    if (runId === 'ALL_PROJECT_RUNS') {
      const project = await getProjectById(projectId);
      const runs = await getAllTestRuns(projectId);
      let results = [];
      for (const r of runs) {
        const res = await getExecutionResultsByRunId(r._id);
        results = [...results, ...res.map(item => ({ ...item._doc, runName: r.name }))];
      }
      reportData = { type: 'project', project, runs, results };
    } else {
      const testRun = await getTestRunById(runId);
      const results = await getExecutionResultsByRunId(runId);
      reportData = { type: 'run', testRun, results };
    }
    reportData.aiAnalysis = await analyzeTestResults(reportData, settings);
    const file = (format === 'pdf') ? await generatePDFReport(reportData) : await generateWordReport(reportData);
    const report = await createReport({ projectId, name: reportData.type === 'project' ? `${reportData.project.name} Report` : `${reportData.testRun.name} Report`, format, filePath: file.filePath, fileName: file.fileName });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
});
router.get('/reports/:id/download', async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id);
    if (fs.existsSync(report.filePath)) res.download(report.filePath, report.fileName);
    else {
      let reportData = {};
      if (report.runId) {
        const testRun = await getTestRunById(report.runId);
        const results = await getExecutionResultsByRunId(report.runId);
        reportData = { type: 'run', testRun, results, aiAnalysis: { isSimulation: true } };
      } else return res.status(404).send("Expired");
      const file = (report.format === 'pdf') ? await generatePDFReport(reportData) : await generateWordReport(reportData);
      res.download(file.filePath, report.fileName);
    }
  } catch (e) { next(e); }
});

// MISC
router.get('/statistics', async (req, res, next) => { try { res.json({ success: true, data: await getStatistics(req.query.projectId) }); } catch (e) { next(e); } });
router.get('/settings', async (req, res, next) => { try { res.json({ success: true, data: await getSettings() }); } catch (e) { next(e); } });
router.put('/settings/:category', async (req, res, next) => { try { await updateSettings(req.params.category, req.body); res.json({ success: true, data: await getSettings() }); } catch (e) { next(e); } });

export default router;