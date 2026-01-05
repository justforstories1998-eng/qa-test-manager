import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// GLOBAL PLUGIN: Convert _id to id for Frontend
// ============================================
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
  }
});

// ============================================
// SCHEMAS
// ============================================

const testSuiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  testCaseCount: { type: Number, default: 0 },
  source: String
}, { timestamps: true });

const testCaseSchema = new mongoose.Schema({
  suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite', required: true },
  adoId: String,
  title: { type: String, required: true },
  description: String,
  steps: [{
    stepNumber: Number,
    action: String,
    expectedResult: String
  }],
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
  name: String,
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' },
  format: String,
  filePath: String,
  fileName: String,
  generatedAt: { type: Date, default: Date.now },
  generatedBy: String
});

const settingsSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  data: mongoose.Schema.Types.Mixed
});

// ============================================
// MODELS
// ============================================
const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
const TestCase = mongoose.model('TestCase', testCaseSchema);
const TestRun = mongoose.model('TestRun', testRunSchema);
const ExecutionResult = mongoose.model('ExecutionResult', executionResultSchema);
const Report = mongoose.model('Report', reportSchema);
const Setting = mongoose.model('Setting', settingsSchema);

// ============================================
// DATABASE INITIALIZATION
// ============================================

export async function initializeDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

export const getAllTestSuites = () => TestSuite.find().sort({ createdAt: -1 });
export const getTestSuiteById = (id) => TestSuite.findById(id);
export const createTestSuite = (data) => new TestSuite(data).save();
export const updateTestSuite = (id, data) => TestSuite.findByIdAndUpdate(id, data, { new: true });
export const deleteTestSuite = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await TestCase.deleteMany({ suiteId: id });
  return TestSuite.findByIdAndDelete(id);
};

export const getAllTestCases = () => TestCase.find().sort({ createdAt: -1 });
export const getTestCasesBySuiteId = (suiteId) => {
  if (!mongoose.Types.ObjectId.isValid(suiteId)) return [];
  return TestCase.find({ suiteId });
};
export const getTestCaseById = (id) => TestCase.findById(id);
export const createTestCase = (data) => new TestCase(data).save();
export const createTestCases = (dataArray) => TestCase.insertMany(dataArray);
export const updateTestCase = (id, data) => TestCase.findByIdAndUpdate(id, data, { new: true });
export const deleteTestCase = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return TestCase.findByIdAndDelete(id);
};

export const getAllTestRuns = () => TestRun.find().sort({ createdAt: -1 });
export const getTestRunById = (id) => TestRun.findById(id);
export const createTestRun = (data) => new TestRun(data).save();
export const updateTestRun = (id, data) => TestRun.findByIdAndUpdate(id, data, { new: true });
export const deleteTestRun = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await ExecutionResult.deleteMany({ runId: id });
  return TestRun.findByIdAndDelete(id);
};

export const getExecutionResultsByRunId = (runId) => {
  if (!mongoose.Types.ObjectId.isValid(runId)) return [];
  return ExecutionResult.find({ runId });
};
export const createExecutionResult = (data) => new ExecutionResult(data).save();
export const updateExecutionResult = (id, data) => ExecutionResult.findByIdAndUpdate(id, data, { new: true });

export const getAllReports = () => Report.find().sort({ generatedAt: -1 });
export const getReportById = (id) => Report.findById(id);
export const createReport = (data) => new Report(data).save();
export const deleteReport = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Report.findByIdAndDelete(id);
};

export const getSettings = async () => {
  const sets = await Setting.find();
  const result = {};
  sets.forEach(s => result[s.category] = s.data);
  return result;
};

export const updateSettings = async (category, data) => {
  return Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true });
};

// FIX: Added missing updateAllSettings export
export const updateAllSettings = async (settingsObj) => {
  const promises = Object.entries(settingsObj).map(([category, data]) => 
    Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true })
  );
  await Promise.all(promises);
  return getSettings();
};

export const getStatistics = async () => {
  const totalTestCases = await TestCase.countDocuments();
  const totalTestRuns = await TestRun.countDocuments();
  const runs = await TestRun.find();
  
  let passed = 0, failed = 0, blocked = 0;
  runs.forEach(r => {
    passed += r.passed || 0;
    failed += r.failed || 0;
    blocked += r.blocked || 0;
  });

  const totalExecutions = passed + failed + blocked;

  return {
    totalTestCases,
    totalTestRuns,
    totalExecutions,
    statusCounts: { passed, failed, blocked, notRun: Math.max(0, totalTestCases - totalExecutions) },
    passRate: totalExecutions > 0 ? ((passed / totalExecutions) * 100).toFixed(1) : 0,
    priorityCounts: { critical: 0, high: 0, medium: 0, low: 0 } 
  };
};

export const saveDatabase = () => Promise.resolve(true);