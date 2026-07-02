import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { ret.id = ret._id.toString(); }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  mustChangePassword: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const projectSchema = new mongoose.Schema({ name: { type: String, required: true }, description: String }, { timestamps: true });
const testSuiteSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, name: String, description: String, testCaseCount: Number }, { timestamps: true });
const testCaseSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' }, adoId: String, title: String, description: String, steps: Array, priority: String, assignedTo: String, areaPath: String, scenarioType: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true });
const testRunSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, name: String, suiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite' }, environment: String, tester: String, status: String, startedAt: Date, completedAt: Date, totalTests: Number, passed: Number, failed: Number, blocked: Number, na: Number, notRun: Number }, { timestamps: true });
const executionResultSchema = new mongoose.Schema({ runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' }, testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }, status: String, comments: String, executedAt: Date });
const reportSchema = new mongoose.Schema({ projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, name: String, runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun' }, format: String, filePath: String, fileName: String, generatedAt: { type: Date, default: Date.now } });

const bugSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, default: 'Medium' },
  status: { type: String, default: 'Active' },
  assignedTo: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    url: String,
    originalName: String,
    mimeType: String
  }],
  attachment: {
    url: String,
    originalName: String,
    mimeType: String
  }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({ category: { type: String, required: true, unique: true }, data: mongoose.Schema.Types.Mixed });

const User = mongoose.model('User', userSchema);
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
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@qamanager.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        mustChangePassword: true
      }).save();
      console.log(`✅ Default admin created: ${adminEmail}`);
    } else {
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.default.compare(adminPassword, adminExists.password);
      if (!passwordMatch) {
        adminExists.password = adminPassword;
        await adminExists.save();
        console.log(`✅ Admin password updated for ${adminEmail}`);
      }
    }
  } catch (e) { console.error('❌ Database initialization failed:', e.message); process.exit(1); }
}

export const getAllProjects = () => Project.find().sort({ name: 1 });
export const getProjectById = (id) => Project.findById(id);
export const createProject = (data) => new Project(data).save();
export const getAllBugs = (projectId) => Bug.find({ projectId }).sort({ createdAt: -1 });
export const createBug = (data) => new Bug(data).save();
export const updateBug = (id, data) => Bug.findByIdAndUpdate(id, data, { new: true });
export const deleteBug = (id) => Bug.findByIdAndDelete(id);
export const getAllTestSuites = (projectId) => TestSuite.find({ projectId }).sort({ createdAt: -1 });
export const getTestSuiteById = (id) => TestSuite.findById(id);
export const createTestSuite = (data) => new TestSuite(data).save();
export const updateTestSuite = (id, data) => TestSuite.findByIdAndUpdate(id, data, { new: true });
export const deleteTestSuite = async (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; await TestCase.deleteMany({ suiteId: id }); return TestSuite.findByIdAndDelete(id); };
export const getAllTestCases = (projectId) => TestCase.find({ projectId }).sort({ createdAt: -1 });
export const getTestCasesBySuiteId = (suiteId) => TestCase.find({ suiteId });
export const getTestCaseById = (id) => TestCase.findById(id);
export const createTestCase = (data) => new TestCase(data).save();
export const createTestCases = (dataArray) => TestCase.insertMany(dataArray);
export const updateTestCase = (id, data) => TestCase.findByIdAndUpdate(id, data, { new: true });
export const deleteTestCase = (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; return TestCase.findByIdAndDelete(id); };
export const getAllTestRuns = (projectId) => TestRun.find({ projectId }).sort({ createdAt: -1 });
export const getTestRunById = (id) => TestRun.findById(id);
export const createTestRun = (data) => new TestRun(data).save();
export const updateTestRun = (id, data) => TestRun.findByIdAndUpdate(id, data, { new: true });
export const deleteTestRun = async (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; await ExecutionResult.deleteMany({ runId: id }); return TestRun.findByIdAndDelete(id); };
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

// ============================================
// USER OPERATIONS
// ============================================
export const getAllUsers = () => User.find().select('-password').sort({ firstName: 1 });
export const getUserById = (id) => User.findById(id).select('-password');
export const getUserByIdWithPassword = (id) => User.findById(id);
export const getUserByEmail = (email) => User.findOne({ email: email.toLowerCase() });
export const createUser = (data) => new User(data).save();
export const updateUser = (id, data) => User.findByIdAndUpdate(id, data, { new: true }).select('-password');
export const deleteUser = (id) => User.findByIdAndDelete(id);
export const getUsersByProject = (projectId) => User.find({ assignedProjects: projectId }).select('-password');
export const searchUsers = (query) => User.find({
  $or: [
    { firstName: { $regex: query, $options: 'i' } },
    { lastName: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } }
  ]
}).select('-password');