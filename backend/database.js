import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// GLOBAL PLUGIN: Convert _id to id for Frontend
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); }
});

// ============================================
// SCHEMAS
// ============================================

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
}, { timestamps: true });

const testSuiteSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  testCaseCount: { type: Number, default: 0 },
  source: String
}, { timestamps: true });

const testCaseSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite', required: true },
  adoId: String,
  title: { type: String, required: true },
  description: String,
  steps: [{ stepNumber: Number, action: String, expectedResult: String }],
  expectedResult: String,
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Not Run' },
  assignedTo: String,
  tags: [String],
  automationStatus: { type: String, default: 'Manual' },
  areaPath: String,
  state: String,
  scenarioType: String
}, { timestamps: true });

const testRunSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' },
  description: String,
  tester: String,
  environment: String,
  buildNumber: String,
  status: { type: String, default: 'In Progress' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  totalTests: { type: Number, default: 0 },
  passed: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  blocked: { type: Number, default: 0 },
  na: { type: Number, default: 0 }, // ADDED N/A FIELD
  notRun: { type: Number, default: 0 }
}, { timestamps: true });

const executionResultSchema = new mongoose.Schema({
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun', required: true },
  testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
  status: { type: String, default: 'Not Run' },
  comments: String,
  executedAt: Date,
  executedBy: String,
  duration: Number
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

const settingsSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  data: mongoose.Schema.Types.Mixed
});

// MODELS
const Project = mongoose.model('Project', projectSchema);
const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
const TestCase = mongoose.model('TestCase', testCaseSchema);
const TestRun = mongoose.model('TestRun', testRunSchema);
const ExecutionResult = mongoose.model('ExecutionResult', executionResultSchema);
const Report = mongoose.model('Report', reportSchema);
const Setting = mongoose.model('Setting', settingsSchema);

// INIT
export async function initializeDatabase() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create Default Project if none exists
    const count = await Project.countDocuments();
    if (count === 0) {
      await new Project({ name: 'Default Project', description: 'Auto-created' }).save();
      console.log('✅ Default Project created');
    }
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
    process.exit(1);
  }
}

// EXPORTS

// Projects
export const getAllProjects = () => Project.find().sort({ name: 1 });
export const createProject = (data) => new Project(data).save();

// Suites
export const getAllTestSuites = (projectId) => TestSuite.find(projectId ? { projectId } : {}).sort({ createdAt: -1 });
export const getTestSuiteById = (id) => TestSuite.findById(id);
export const createTestSuite = (data) => new TestSuite(data).save();
export const updateTestSuite = (id, data) => TestSuite.findByIdAndUpdate(id, data, { new: true });
export const deleteTestSuite = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await TestCase.deleteMany({ suiteId: id });
  return TestSuite.findByIdAndDelete(id);
};

// Cases
export const getAllTestCases = (projectId) => TestCase.find(projectId ? { projectId } : {}).sort({ createdAt: -1 });
export const getTestCasesBySuiteId = (suiteId) => TestCase.find({ suiteId });
export const getTestCaseById = (id) => TestCase.findById(id);
export const createTestCase = (data) => new TestCase(data).save();
export const createTestCases = (dataArray) => TestCase.insertMany(dataArray);
export const updateTestCase = (id, data) => TestCase.findByIdAndUpdate(id, data, { new: true });
export const deleteTestCase = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return TestCase.findByIdAndDelete(id);
};

// Runs
export const getAllTestRuns = (projectId) => TestRun.find(projectId ? { projectId } : {}).sort({ createdAt: -1 });
export const getTestRunById = (id) => TestRun.findById(id);
export const createTestRun = (data) => new TestRun(data).save();
export const updateTestRun = (id, data) => TestRun.findByIdAndUpdate(id, data, { new: true });
export const deleteTestRun = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await ExecutionResult.deleteMany({ runId: id });
  return TestRun.findByIdAndDelete(id);
};

// Results
export const getExecutionResultsByRunId = (runId) => ExecutionResult.find({ runId });
export const createExecutionResult = (data) => new ExecutionResult(data).save();
export const updateExecutionResult = (id, data) => ExecutionResult.findByIdAndUpdate(id, data, { new: true });

// Reports
export const getAllReports = (projectId) => Report.find(projectId ? { projectId } : {}).sort({ generatedAt: -1 });
export const getReportById = (id) => Report.findById(id);
export const createReport = (data) => new Report(data).save();
export const deleteReport = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Report.findByIdAndDelete(id);
};

// Settings
export const getSettings = async () => {
  const sets = await Setting.find();
  const result = {};
  sets.forEach(s => result[s.category] = s.data);
  return result;
};
export const updateSettings = async (category, data) => Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true });
export const updateAllSettings = async (settingsObj) => {
  const promises = Object.entries(settingsObj).map(([category, data]) => 
    Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true })
  );
  await Promise.all(promises);
  return getSettings();
};

// Stats
export const getStatistics = async (projectId) => {
  const query = projectId ? { projectId } : {};
  const totalTestCases = await TestCase.countDocuments(query);
  const totalTestRuns = await TestRun.countDocuments(query);
  const runs = await TestRun.find(query);
  
  let passed = 0, failed = 0, blocked = 0, na = 0;
  runs.forEach(r => {
    passed += r.passed || 0;
    failed += r.failed || 0;
    blocked += r.blocked || 0;
    na += r.na || 0; // COUNT N/A
  });
  const totalExecutions = passed + failed + blocked + na;

  return {
    totalTestCases,
    totalTestRuns,
    totalExecutions,
    statusCounts: { passed, failed, blocked, na, notRun: Math.max(0, totalTestCases - totalExecutions) },
    passRate: (passed + failed + blocked) > 0 ? ((passed / (passed + failed + blocked)) * 100).toFixed(1) : 0,
    priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } 
  };
};

export const saveDatabase = () => Promise.resolve(true);