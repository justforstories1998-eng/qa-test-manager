import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); }
});

const projectSchema = new mongoose.Schema({ name: { type: String, required: true }, description: String }, { timestamps: true });
const testSuiteSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, name: String, description: String, testCaseCount: Number }, { timestamps: true });
const testCaseSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' }, adoId: String, title: String, description: String, steps: Array, priority: String, assignedTo: String, areaPath: String, scenarioType: String }, { timestamps: true });
const testRunSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, name: String, suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' }, environment: String, tester: String, status: String, startedAt: Date, completedAt: Date, totalTests: Number, passed: Number, failed: Number, blocked: Number, na: Number, notRun: Number }, { timestamps: true });
const executionResultSchema = new mongoose.Schema({ runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' }, testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }, status: String, comments: String, executedAt: Date });
const reportSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, name: String, runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' }, format: String, filePath: String, fileName: String, generatedAt: { type: Date, default: Date.now } });

// UPDATED BUG SCHEMA
const bugSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, default: 'Medium' },
  status: { type: String, default: 'Active' },
  assignedTo: String,
  testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' },
  attachment: {
    fileName: String,
    originalName: String,
    mimeType: String,
    url: String
  }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({ category: { type: String, required: true, unique: true }, data: mongoose.Schema.Types.Mixed });

const Project = mongoose.model('Project', projectSchema);
const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
const TestCase = mongoose.model('TestCase', testCaseSchema);
const TestRun = mongoose.model('TestRun', testRunSchema);
const ExecutionResult = mongoose.model('ExecutionResult', executionResultSchema);
const Report = mongoose.model('Report', reportSchema);
const Bug = mongoose.model('Bug', bugSchema);
const Setting = mongoose.model('Setting', settingsSchema);

export async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    if (await Project.countDocuments() === 0) await new Project({ name: 'Default Project' }).save();
  } catch (e) { console.error(e); process.exit(1); }
}

export const getAllProjects = () => Project.find().sort({ name: 1 });
export const getProjectById = (id) => Project.findById(id);
export const createProject = (data) => new Project(data).save();
export const getAllBugs = (projectId) => Bug.find({ projectId }).sort({ createdAt: -1 });
export const createBug = (data) => new Bug(data).save();
export const updateBug = (id, data) => Bug.findByIdAndUpdate(id, data, { new: true });
export const deleteBug = (id) => Bug.findByIdAndDelete(id);
export const getAllTestSuites = (projectId) => TestSuite.find({ projectId }).sort({ createdAt: -1 });
export const createTestSuite = (data) => new TestSuite(data).save();
export const deleteTestSuite = async (id) => { await TestCase.deleteMany({ suiteId: id }); return TestSuite.findByIdAndDelete(id); };
export const getAllTestCases = (projectId) => TestCase.find({ projectId }).sort({ createdAt: -1 });
export const getTestCasesBySuiteId = (suiteId) => TestCase.find({ suiteId });
export const getTestCaseById = (id) => TestCase.findById(id);
export const createTestCase = (data) => new TestCase(data).save();
export const createTestCases = (dataArray) => TestCase.insertMany(dataArray);
export const updateTestCase = (id, data) => TestCase.findByIdAndUpdate(id, data, { new: true });
export const deleteTestCase = (id) => TestCase.findByIdAndDelete(id);
export const getAllTestRuns = (projectId) => TestRun.find({ projectId }).sort({ createdAt: -1 });
export const getTestRunById = (id) => TestRun.findById(id);
export const createTestRun = (data) => new TestRun(data).save();
export const updateTestRun = (id, data) => TestRun.findByIdAndUpdate(id, data, { new: true });
export const deleteTestRun = async (id) => { await ExecutionResult.deleteMany({ runId: id }); return TestRun.findByIdAndDelete(id); };
export const getExecutionResultsByRunId = (runId) => ExecutionResult.find({ runId });
export const createExecutionResult = (data) => new ExecutionResult(data).save();
export const updateExecutionResult = (id, data) => ExecutionResult.findByIdAndUpdate(id, data, { new: true });
export const deleteExecutionResult = async (id) => {
  const res = await ExecutionResult.findByIdAndDelete(id);
  if (res) await TestRun.findByIdAndUpdate(res.runId, { $inc: { totalTests: -1 } });
  return res;
};
export const getAllReports = (projectId) => Report.find({ projectId }).sort({ generatedAt: -1 });
export const getReportById = (id) => Report.findById(id);
export const createReport = (data) => new Report(data).save();
export const deleteReport = (id) => Report.findByIdAndDelete(id);
export const getSettings = async () => {
  const sets = await Setting.find();
  const result = {};
  sets.forEach(s => result[s.category] = s.data);
  return result;
};
export const updateSettings = (category, data) => Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true });
export const getStatistics = async (projectId) => {
  const query = { projectId };
  const totalTestCases = await TestCase.countDocuments(query);
  const totalBugs = await Bug.countDocuments({ ...query, status: { $ne: 'Closed' } });
  const runs = await TestRun.find(query);
  let passed = 0, failed = 0, blocked = 0, na = 0;
  runs.forEach(r => { passed += r.passed || 0; failed += r.failed || 0; blocked += r.blocked || 0; na += r.na || 0; });
  const totalExecutions = passed + failed + blocked + na;
  return {
    totalTestCases, totalBugs, totalTestRuns: runs.length, totalExecutions,
    statusCounts: { passed, failed, blocked, na, notRun: Math.max(0, totalTestCases - totalExecutions) },
    passRate: (passed + failed) > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0,
    priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } 
  };
};
export const saveDatabase = () => Promise.resolve(true);