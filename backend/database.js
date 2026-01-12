import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); }
});

// ============================================
// SCHEMAS
// ============================================

const projectSchema = new mongoose.Schema({ name: { type: String, required: true }, description: String }, { timestamps: true });

const testSuiteSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  testCaseCount: { type: Number, default: 0 }
}, { timestamps: true });

const testCaseSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite', required: true },
  adoId: String,
  title: { type: String, required: true },
  description: String,
  steps: Array,
  priority: { type: String, default: 'Medium' },
  assignedTo: String,
  areaPath: String,
  scenarioType: String
}, { timestamps: true });

const testRunSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' },
  environment: String,
  tester: String,
  status: { type: String, default: 'In Progress' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  totalTests: { type: Number, default: 0 },
  passed: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  blocked: { type: Number, default: 0 },
  na: { type: Number, default: 0 },
  notRun: { type: Number, default: 0 }
}, { timestamps: true });

const executionResultSchema = new mongoose.Schema({
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun', required: true },
  testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
  status: { type: String, default: 'Not Run' },
  comments: String,
  executedAt: Date
});

const reportSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: String,
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' },
  format: String,
  filePath: String,
  fileName: String,
  generatedAt: { type: Date, default: Date.now }
});

// NEW: BUG SCHEMA
const bugSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, default: 'Medium' },
  status: { type: String, default: 'Active' }, // Active, In Progress, Resolved, Under development, Closed
  assignedTo: String,
  testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({ category: { type: String, required: true, unique: true }, data: mongoose.Schema.Types.Mixed });

// MODELS
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
    console.log('✅ MongoDB Connected');
    if (await Project.countDocuments() === 0) await new Project({ name: 'Default Project' }).save();
  } catch (e) { console.error(e); process.exit(1); }
}

// PROJECTS
export const getAllProjects = () => Project.find().sort({ name: 1 });
export const getProjectById = (id) => Project.findById(id);
export const createProject = (data) => new Project(data).save();

// BUGS
export const getAllBugs = (projectId) => Bug.find({ projectId }).sort({ createdAt: -1 });
export const createBug = (data) => new Bug(data).save();
export const updateBug = (id, data) => Bug.findByIdAndUpdate(id, data, { new: true });
export const deleteBug = (id) => Bug.findByIdAndDelete(id);

// SUITES
export const getAllTestSuites = (projectId) => TestSuite.find({ projectId }).sort({ createdAt: -1 });
export const createTestSuite = (data) => new TestSuite(data).save();
export const deleteTestSuite = async (id) => { await TestCase.deleteMany({ suiteId: id }); return TestSuite.findByIdAndDelete(id); };

// CASES
export const getAllTestCases = (projectId) => TestCase.find({ projectId }).sort({ createdAt: -1 });
export const getTestCasesBySuiteId = (suiteId) => TestCase.find({ suiteId });
export const createTestCase = (data) => new TestCase(data).save();
export const createTestCases = (dataArray) => TestCase.insertMany(dataArray);
export const updateTestCase = (id, data) => TestCase.findByIdAndUpdate(id, data, { new: true });
export const deleteTestCase = (id) => TestCase.findByIdAndDelete(id);

// RUNS
export const getAllTestRuns = (projectId) => TestRun.find({ projectId }).sort({ createdAt: -1 });
export const getTestRunById = (id) => TestRun.findById(id);
export const createTestRun = (data) => new TestRun(data).save();
export const updateTestRun = (id, data) => TestRun.findByIdAndUpdate(id, data, { new: true });
export const deleteTestRun = async (id) => { await ExecutionResult.deleteMany({ runId: id }); return TestRun.findByIdAndDelete(id); };

// RESULTS
export const getExecutionResultsByRunId = (runId) => ExecutionResult.find({ runId });
export const createExecutionResult = (data) => new ExecutionResult(data).save();
export const updateExecutionResult = (id, data) => ExecutionResult.findByIdAndUpdate(id, data, { new: true });

// REPORTS
export const getAllReports = (projectId) => Report.find({ projectId }).sort({ generatedAt: -1 });
export const getReportById = (id) => Report.findById(id);
export const createReport = (data) => new Report(data).save();
export const deleteReport = (id) => Report.findByIdAndDelete(id);

// SETTINGS
export const getSettings = async () => {
  const sets = await Setting.find();
  const result = {};
  sets.forEach(s => result[s.category] = s.data);
  return result;
};
export const updateSettings = (category, data) => Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true });

// STATS
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