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
  attachments: [{ url: String, originalName: String, mimeType: String }],
  attachment: { url: String, originalName: String, mimeType: String }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({ category: { type: String, required: true, unique: true }, data: mongoose.Schema.Types.Mixed });

// ============================================
// BOARD MODULE — FULL AZURE DEVOPS SCHEMAS
// ============================================

const boardSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  columns: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    color: { type: String, default: '#94a3b8' },
    wipLimit: { type: Number, default: 0 },
    state: { type: String },
    split: { type: Boolean, default: false },
    doingTitle: { type: String, default: 'Doing' },
    doneTitle: { type: String, default: 'Done' },
  }],
  swimlanes: [{ id: String, title: String, color: String, collapsed: { type: Boolean, default: false } }],
  cardFields: { type: [String], default: ['type', 'priority', 'assignee', 'storyPoints'] },
  stateTransitions: { type: mongoose.Schema.Types.Mixed, default: {
    'Backlog': ['To Do'],
    'To Do': ['In Progress', 'Backlog'],
    'In Progress': ['Review', 'To Do'],
    'Review': ['Done', 'In Progress'],
    'Done': ['Review', 'Closed'],
    'Closed': ['Done'],
  }},
}, { timestamps: true });

const workItemSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  workItemId: { type: Number },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem' },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['Epic', 'Feature', 'User Story', 'Task', 'Bug', 'Issue', 'Test Case'], default: 'Task' },
  priority: { type: Number, default: 2 },
  severity: { type: String, enum: ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'], default: '3 - Medium' },
  status: { type: String, default: 'Backlog' },
  activity: { type: String, enum: ['Development', 'Design', 'Testing', 'Documentation', 'Deployment', 'Management'], default: 'Development' },
  assignee: String,
  storyPoints: { type: Number, default: 0 },
  effort: { type: Number, default: 0 },
  remainingWork: { type: Number, default: 0 },
  originalEstimate: { type: Number, default: 0 },
  completedWork: { type: Number, default: 0 },
  tags: [String],
  areaPath: { type: String, default: 'Default' },
  iterationPath: String,
  acceptanceCriteria: String,
  reproSteps: String,
  environment: String,
  priorityLabel: String,
  swimlaneId: String,
  order: { type: Number, default: 0 },
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  stateHistory: [{ status: String, changedAt: { type: Date, default: Date.now }, changedBy: String }],
  fieldHistory: [{ field: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed, changedAt: { type: Date, default: Date.now }, changedBy: String }],
  attachments: [{ url: String, originalName: String, mimeType: String, size: Number, uploadedAt: { type: Date, default: Date.now }, uploadedBy: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const workItemLinkSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', required: true },
  linkType: { type: String, enum: ['Parent', 'Child', 'Related', 'Dependency', 'Blocking', 'Duplicate', 'Tested By', 'Affects'], default: 'Related' },
  comment: String
}, { timestamps: true });

const sprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  name: { type: String, required: true },
  goal: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['Planned', 'Active', 'Completed'], default: 'Planned' },
  capacity: { type: Number, default: 0 },
  velocity: { type: Number, default: 0 }
}, { timestamps: true });

const sprintCapacitySchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: String, required: true },
  capacityPerDay: { type: Number, default: 8 },
  daysOff: [{ start: Date, end: Date }],
  activities: { type: Map, of: Number, default: {} }
}, { timestamps: true });

const savedQuerySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  filters: { type: mongoose.Schema.Types.Mixed, required: true },
  isShared: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const burndownSnapshotSchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  totalPoints: { type: Number, default: 0 },
  completedPoints: { type: Number, default: 0 },
  remainingPoints: { type: Number, default: 0 },
  idealRemaining: { type: Number, default: 0 }
}, { timestamps: true });

const cfdSnapshotSchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  totalCount: { type: Number, default: 0 },
  newCount: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  resolvedCount: { type: Number, default: 0 },
  closedCount: { type: Number, default: 0 },
}, { timestamps: true });

const workItemTemplateSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, default: 'Task' },
  priority: { type: Number, default: 3 },
  severity: { type: String, default: '3 - Medium' },
  status: { type: String, default: 'Backlog' },
  assignee: String,
  storyPoints: { type: Number, default: 0 },
  effort: { type: Number, default: 0 },
  areaPath: String,
  iterationPath: String,
  activity: String,
  acceptanceCriteria: String,
  tags: [String],
  steps: [{ stepNumber: Number, action: String, expectedResult: String }],
}, { timestamps: true });

const deletedWorkItemSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  deletedAt: { type: Date, default: Date.now },
  deletedBy: String,
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
  workItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  mentions: [String],
  reactions: [{ emoji: String, userId: String }],
  editedAt: Date,
}, { timestamps: true });

const notificationSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  workItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['follow', 'mention'], default: 'follow' },
}, { timestamps: true });

notificationSubscriptionSchema.index({ userId: 1, workItemId: 1 }, { unique: true });

const workflowRuleSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['state-transition', 'field-update', 'notification'], default: 'state-transition' },
  fromState: String,
  toState: String,
  conditions: { type: mongoose.Schema.Types.Mixed, default: {} },
  actions: { type: mongoose.Schema.Types.Mixed, default: {} },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

// ============================================
// MODELS
// ============================================
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
const TestCase = mongoose.model('TestCase', testCaseSchema);
const TestRun = mongoose.model('TestRun', testRunSchema);
const ExecutionResult = mongoose.model('ExecutionResult', executionResultSchema);
const Report = mongoose.model('Report', reportSchema);
const Bug = mongoose.model('Bug', bugSchema);
const BoardModel = mongoose.model('Board', boardSchema);
const WorkItem = mongoose.model('WorkItem', workItemSchema);
const WorkItemLink = mongoose.model('WorkItemLink', workItemLinkSchema);
const Sprint = mongoose.model('Sprint', sprintSchema);
const SprintCapacity = mongoose.model('SprintCapacity', sprintCapacitySchema);
const SavedQuery = mongoose.model('SavedQuery', savedQuerySchema);
const BurndownSnapshot = mongoose.model('BurndownSnapshot', burndownSnapshotSchema);
const CfdSnapshot = mongoose.model('CfdSnapshot', cfdSnapshotSchema);
const WorkItemTemplate = mongoose.model('WorkItemTemplate', workItemTemplateSchema);
const DeletedWorkItem = mongoose.model('DeletedWorkItem', deletedWorkItemSchema);
const Discussion = mongoose.model('Discussion', discussionSchema);
const NotificationSubscription = mongoose.model('NotificationSubscription', notificationSubscriptionSchema);
const WorkflowRule = mongoose.model('WorkflowRule', workflowRuleSchema);
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
      await new User({ firstName: 'Admin', lastName: 'User', email: adminEmail, password: adminPassword, role: 'admin', mustChangePassword: true }).save();
      console.log(`✅ Default admin created: ${adminEmail}`);
    } else {
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.default.compare(adminPassword, adminExists.password);
      if (!passwordMatch) { adminExists.password = adminPassword; await adminExists.save(); console.log(`✅ Admin password updated for ${adminEmail}`); }
    }
  } catch (e) { console.error('❌ Database initialization failed:', e.message); process.exit(1); }
}

// ============================================
// PROJECTS
// ============================================
export const getAllProjects = () => Project.find().sort({ name: 1 });
export const getProjectById = (id) => Project.findById(id);
export const createProject = (data) => new Project(data).save();
export const deleteProject = (id) => Project.findByIdAndDelete(id);

// ============================================
// BUGS
// ============================================
export const getAllBugs = (projectId) => Bug.find({ projectId }).sort({ createdAt: -1 });
export const createBug = (data) => new Bug(data).save();
export const updateBug = (id, data) => Bug.findByIdAndUpdate(id, data, { new: true });
export const deleteBug = (id) => Bug.findByIdAndDelete(id);

// ============================================
// TEST MANAGEMENT
// ============================================
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
export const deleteExecutionResult = async (id) => { const res = await ExecutionResult.findByIdAndDelete(id); if (res) await TestRun.findByIdAndUpdate(res.runId, { $inc: { totalTests: -1 } }); return res; };

// ============================================
// REPORTS
// ============================================
export const getAllReports = (projectId) => Report.find({ projectId }).sort({ generatedAt: -1 });
export const getReportById = (id) => Report.findById(id);
export const createReport = (data) => new Report(data).save();
export const deleteReport = (id) => Report.findByIdAndDelete(id);

// ============================================
// SETTINGS & STATS
// ============================================
export const getSettings = async () => { const sets = await Setting.find(); const result = {}; sets.forEach(s => result[s.category] = s.data); return result; };
export const updateSettings = (category, data) => Setting.findOneAndUpdate({ category }, { data }, { upsert: true, new: true });
export const getStatistics = async (projectId) => {
  const query = { projectId };
  const totalTestCases = await TestCase.countDocuments(query);
  const totalBugs = await Bug.countDocuments({ ...query, status: { $ne: 'Closed' } });
  const runs = await TestRun.find(query);
  let passed = 0, failed = 0, blocked = 0, na = 0;
  runs.forEach(r => { passed += r.passed || 0; failed += r.failed || 0; blocked += r.blocked || 0; na += r.na || 0; });
  const totalExecutions = passed + failed + blocked + na;
  return { totalTestCases, totalBugs, totalTestRuns: runs.length, totalExecutions, statusCounts: { passed, failed, blocked, na, notRun: Math.max(0, totalTestCases - totalExecutions) }, passRate: (passed + failed) > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0 };
};
export const saveDatabase = () => Promise.resolve(true);

// ============================================
// BOARD CRUD
// ============================================
export const getAllBoards = (projectId) => BoardModel.find({ projectId }).sort({ createdAt: -1 });
export const getBoardById = (id) => BoardModel.findById(id);
export const createBoard = (data) => new BoardModel(data).save();
export const updateBoard = (id, data) => BoardModel.findByIdAndUpdate(id, data, { new: true });
export const deleteBoard = async (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; await WorkItem.deleteMany({ boardId: id }); return BoardModel.findByIdAndDelete(id); };

// ============================================
// WORK ITEMS CRUD
// ============================================
let workItemCounter = 1;
const getNextWorkItemId = async (projectId) => {
  const last = await WorkItem.findOne({ projectId }).sort({ workItemId: -1 }).select('workItemId');
  return (last?.workItemId || 0) + 1;
};

export const getAllWorkItems = async (projectId, filters = {}) => {
  const query = { projectId };
  if (filters.boardId) query.boardId = filters.boardId;
  if (filters.sprintId) query.sprintId = filters.sprintId;
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.parentId) query.parentId = filters.parentId;
  if (filters.parentId === 'null') query.parentId = null;
  if (filters.areaPath) query.areaPath = filters.areaPath;
  if (filters.iterationPath) query.iterationPath = filters.iterationPath;
  let q = WorkItem.find(query);
  if (filters.sortBy === 'priority') q = q.sort({ priority: 1 });
  else if (filters.sortBy === 'storyPoints') q = q.sort({ storyPoints: -1 });
  else if (filters.sortBy === 'title') q = q.sort({ title: 1 });
  else q = q.sort({ order: 1, createdAt: -1 });
  return q;
};
export const getWorkItemById = (id) => WorkItem.findById(id);
export const createWorkItem = async (data) => {
  if (!data.workItemId) data.workItemId = await getNextWorkItemId(data.projectId);
  if (!data.stateHistory) data.stateHistory = [{ status: data.status || 'Backlog', changedAt: new Date() }];
  return new WorkItem(data).save();
};
export const updateWorkItem = async (id, data) => {
  const existing = await WorkItem.findById(id);
  if (existing) {
    const changes = [];
    const trackedFields = ['status', 'assignee', 'priority', 'severity', 'type', 'storyPoints', 'effort', 'iterationPath', 'areaPath', 'title'];
    for (const field of trackedFields) {
      if (data[field] !== undefined && data[field] !== existing[field]) {
        changes.push({ field, oldValue: existing[field], newValue: data[field], changedAt: new Date(), changedBy: data.changedBy || 'System' });
      }
    }
    if (data.status && data.status !== existing.status) {
      const history = existing.stateHistory || [];
      history.push({ status: data.status, changedAt: new Date(), changedBy: data.changedBy || 'System' });
      data.stateHistory = history;
    }
    if (changes.length > 0) {
      const existingHistory = existing.stateHistory || [];
      const statusChange = data.status && data.status !== existing.status ? [{ status: data.status, changedAt: new Date(), changedBy: data.changedBy || 'System' }] : [];
      data.stateHistory = [...existingHistory, ...statusChange];
      data.fieldHistory = [...(existing.fieldHistory || []), ...changes];
    }
  }
  return WorkItem.findByIdAndUpdate(id, data, { new: true });
};
export const deleteWorkItem = async (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; await WorkItemLink.deleteMany({ $or: [{ sourceId: id }, { targetId: id }] }); await WorkItem.updateMany({ parentId: id }, { $unset: { parentId: 1 } }); return WorkItem.findByIdAndDelete(id); };
export const updateWorkItemOrder = async (items) => {
  const ops = items.map(({ id, status, order }) => ({ updateOne: { filter: { _id: id }, update: { $set: { status, order } } } }));
  if (ops.length > 0) await WorkItem.bulkWrite(ops);
};
export const getWorkItemHierarchy = async (projectId) => {
  const items = await WorkItem.find({ projectId }).sort({ priority: 1, order: 1 });
  const map = {};
  items.forEach(i => { map[i._id.toString()] = { ...i.toJSON(), children: [] }; });
  const roots = [];
  items.forEach(i => {
    const node = map[i._id.toString()];
    if (i.parentId && map[i.parentId.toString()]) map[i.parentId.toString()].children.push(node);
    else roots.push(node);
  });
  return roots;
};

// ============================================
// WORK ITEM CLONE
// ============================================
export const cloneWorkItem = async (id, overrides = {}) => {
  const original = await WorkItem.findById(id);
  if (!original) throw new Error('Work item not found');
  const cloneData = original.toObject();
  delete cloneData._id;
  delete cloneData.workItemId;
  delete cloneData.createdAt;
  delete cloneData.updatedAt;
  cloneData.title = overrides.title || `${original.title} (Copy)`;
  cloneData.status = overrides.status || 'Backlog';
  cloneData.stateHistory = [{ status: cloneData.status, changedAt: new Date(), changedBy: 'System' }];
  cloneData.tags = [...(original.tags || [])];
  if (overrides.assignee !== undefined) cloneData.assignee = overrides.assignee;
  if (overrides.parentId !== undefined) cloneData.parentId = overrides.parentId;
  if (overrides.sprintId !== undefined) cloneData.sprintId = overrides.sprintId;
  cloneData.workItemId = await getNextWorkItemId(original.projectId);
  return new WorkItem(cloneData).save();
};

// ============================================
// BULK OPERATIONS
// ============================================
export const bulkUpdateWorkItems = async (ids, updates) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { modifiedCount: 0 };
  const existingItems = await WorkItem.find({ _id: { $in: validIds } });
  const statusChange = updates.status;
  if (statusChange) {
    for (const item of existingItems) {
      if (item.status !== statusChange) {
        const history = item.stateHistory || [];
        history.push({ status: statusChange, changedAt: new Date(), changedBy: 'Bulk Operation' });
        await WorkItem.findByIdAndUpdate(item._id, { $set: { stateHistory: history } });
      }
    }
  }
  return WorkItem.updateMany({ _id: { $in: validIds } }, { $set: updates }, { new: true });
};

export const bulkDeleteWorkItems = async (ids) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { deletedCount: 0 };
  await WorkItemLink.deleteMany({ $or: [{ sourceId: { $in: validIds } }, { targetId: { $in: validIds } }] });
  return WorkItem.deleteMany({ _id: { $in: validIds } });
};

export const bulkChangeType = async (ids, newType) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { modifiedCount: 0 };
  return WorkItem.updateMany({ _id: { $in: validIds } }, { $set: { type: newType } });
};

export const bulkMoveToIteration = async (ids, iterationPath) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { modifiedCount: 0 };
  return WorkItem.updateMany({ _id: { $in: validIds } }, { $set: { iterationPath } });
};

export const bulkAddTags = async (ids, tags) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { modifiedCount: 0 };
  return WorkItem.updateMany({ _id: { $in: validIds } }, { $addToSet: { tags: { $each: tags } } });
};

export const bulkRemoveTags = async (ids, tags) => {
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { modifiedCount: 0 };
  return WorkItem.updateMany({ _id: { $in: validIds } }, { $pullAll: { tags } });
};

// ============================================
// WORK ITEM LINKS
// ============================================
export const getLinksForWorkItem = async (workItemId) => {
  return WorkItemLink.find({ $or: [{ sourceId: workItemId }, { targetId: workItemId }] }).populate('sourceId targetId');
};
export const createWorkItemLink = async (data) => {
  const existing = await WorkItemLink.findOne({ sourceId: data.sourceId, targetId: data.targetId, linkType: data.linkType });
  if (existing) return existing;
  return new WorkItemLink(data).save();
};
export const deleteWorkItemLink = (id) => WorkItemLink.findByIdAndDelete(id);

// ============================================
// SPRINT CRUD
// ============================================
export const getAllSprints = (projectId) => Sprint.find({ projectId }).sort({ createdAt: -1 });
export const getSprintById = (id) => Sprint.findById(id);
export const createSprint = (data) => new Sprint(data).save();
export const updateSprint = (id, data) => Sprint.findByIdAndUpdate(id, data, { new: true });
export const deleteSprint = async (id) => { if (!mongoose.Types.ObjectId.isValid(id)) return null; await WorkItem.updateMany({ sprintId: id }, { $unset: { sprintId: 1 } }); await SprintCapacity.deleteMany({ sprintId: id }); await BurndownSnapshot.deleteMany({ sprintId: id }); return Sprint.findByIdAndDelete(id); };

// ============================================
// SPRINT CAPACITY
// ============================================
export const getCapacitiesBySprint = (sprintId) => SprintCapacity.find({ sprintId });
export const upsertCapacity = async (data) => {
  return SprintCapacity.findOneAndUpdate(
    { sprintId: data.sprintId, assignee: data.assignee },
    data, { upsert: true, new: true }
  );
};
export const deleteCapacity = (id) => SprintCapacity.findByIdAndDelete(id);

// ============================================
// BURNDOWN
// ============================================
export const createBurndownSnapshot = (data) => new BurndownSnapshot(data).save();
export const getBurndownBySprint = (sprintId) => BurndownSnapshot.find({ sprintId }).sort({ date: 1 });
export const generateBurndown = async (sprintId, projectId) => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint || !sprint.startDate || !sprint.endDate) return [];
  const items = await WorkItem.find({ sprintId });
  const totalPoints = items.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const snapshots = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start.getTime() + d * dayMs);
    const idealRemaining = Math.max(0, totalPoints * (1 - d / totalDays));
    const completedPoints = items.filter(i => {
      if (i.status === 'Done') return true;
      const history = i.stateHistory || [];
      const doneEntry = history.find(h => h.status === 'Done');
      return doneEntry && new Date(doneEntry.changedAt) <= date;
    }).reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;
    snapshots.push({ sprintId, projectId, date, totalPoints, completedPoints, remainingPoints, idealRemaining });
  }
  await BurndownSnapshot.deleteMany({ sprintId });
  if (snapshots.length > 0) await BurndownSnapshot.insertMany(snapshots);
  return snapshots;
};

// ============================================
// CUMULATIVE FLOW DIAGRAM
// ============================================
export const getCfdBySprint = (sprintId) => CfdSnapshot.find({ sprintId }).sort({ date: 1 });
export const generateCFD = async (sprintId, projectId) => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint || !sprint.startDate || !sprint.endDate) return [];
  const items = await WorkItem.find({ sprintId });
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const snapshots = [];
  const dayMs = 24 * 60 * 60 * 1000;

  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start.getTime() + d * dayMs);
    let newCount = 0, activeCount = 0, resolvedCount = 0, closedCount = 0;
    for (const item of items) {
      const history = item.stateHistory || [];
      let currentStatus = 'To Do';
      for (const h of history) {
        if (new Date(h.changedAt) <= date) currentStatus = h.status;
      }
      if (item.createdAt && new Date(item.createdAt) > date) continue;
      if (currentStatus === 'Done') closedCount++;
      else if (currentStatus === 'Review') resolvedCount++;
      else if (currentStatus === 'In Progress') activeCount++;
      else newCount++;
    }
    snapshots.push({ sprintId, projectId, date, totalCount: newCount + activeCount + resolvedCount + closedCount, newCount, activeCount, resolvedCount, closedCount });
  }
  await CfdSnapshot.deleteMany({ sprintId });
  if (snapshots.length > 0) await CfdSnapshot.insertMany(snapshots);
  return snapshots;
};

// ============================================
// VELOCITY
// ============================================
export const getVelocity = async (projectId, lastSprints = 6) => {
  const sprints = await Sprint.find({ projectId, status: 'Completed' }).sort({ endDate: -1 }).limit(lastSprints);
  const velocityData = [];
  for (const sprint of sprints) {
    const items = await WorkItem.find({ sprintId: sprint._id, status: 'Done' });
    const completedPoints = items.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    velocityData.push({ sprintName: sprint.name, sprintId: sprint._id, velocity: completedPoints, startDate: sprint.startDate, endDate: sprint.endDate });
  }
  return velocityData;
};

// ============================================
// SAVED QUERIES
// ============================================
export const getQueriesByProject = (projectId) => SavedQuery.find({ projectId }).sort({ createdAt: -1 });
export const createQuery = (data) => new SavedQuery(data).save();
export const updateQuery = (id, data) => SavedQuery.findByIdAndUpdate(id, data, { new: true });
export const deleteQuery = (id) => SavedQuery.findByIdAndDelete(id);

// ============================================
// NOTIFICATION SUBSCRIPTIONS
// ============================================
export const followWorkItem = (userId, workItemId, projectId, type = 'follow') => {
  return NotificationSubscription.findOneAndUpdate(
    { userId, workItemId }, { userId, workItemId, projectId, type }, { upsert: true, new: true }
  );
};
export const unfollowWorkItem = (userId, workItemId) => NotificationSubscription.findOneAndDelete({ userId, workItemId });
export const getFollowers = (workItemId) => NotificationSubscription.find({ workItemId });
export const getUserSubscriptions = (userId, projectId) => NotificationSubscription.find({ userId, projectId });
export const isFollowing = (userId, workItemId) => NotificationSubscription.findOne({ userId, workItemId });

// ============================================
// WORKFLOW RULES
// ============================================
export const getWorkflowRules = (projectId) => WorkflowRule.find({ projectId, enabled: true });
export const createWorkflowRule = (data) => new WorkflowRule(data).save();
export const updateWorkflowRule = (id, data) => WorkflowRule.findByIdAndUpdate(id, data, { new: true });
export const deleteWorkflowRule = (id) => WorkflowRule.findByIdAndDelete(id);

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
export const searchUsers = (query) => User.find({ $or: [{ firstName: { $regex: query, $options: 'i' } }, { lastName: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }] }).select('-password');

// ============================================
// WORK ITEM TEMPLATES
// ============================================
export const getTemplatesByProject = (projectId) => WorkItemTemplate.find({ projectId }).sort({ name: 1 });
export const getTemplateById = (id) => WorkItemTemplate.findById(id);
export const createTemplate = (data) => new WorkItemTemplate(data).save();
export const updateTemplate = (id, data) => WorkItemTemplate.findByIdAndUpdate(id, data, { new: true });
export const deleteTemplate = (id) => WorkItemTemplate.findByIdAndDelete(id);

// ============================================
// RECYCLE BIN (DELETED WORK ITEMS)
// ============================================
export const softDeleteWorkItem = async (id, deletedBy) => {
  const item = await WorkItem.findById(id);
  if (!item) return null;
  await new DeletedWorkItem({ originalId: item._id, projectId: item.projectId, data: item.toObject(), deletedBy }).save();
  await WorkItem.findByIdAndDelete(id);
  return item;
};
export const getDeletedWorkItems = (projectId) => DeletedWorkItem.find({ projectId }).sort({ deletedAt: -1 });
export const restoreWorkItem = async (deletedId) => {
  const deleted = await DeletedWorkItem.findById(deletedId);
  if (!deleted) return null;
  const restored = await new WorkItem(deleted.data).save();
  await DeletedWorkItem.findByIdAndDelete(deletedId);
  return restored;
};
export const permanentDeleteWorkItem = (deletedId) => DeletedWorkItem.findByIdAndDelete(deletedId);

// ============================================
// DISCUSSION / COMMENTS
// ============================================
export const getDiscussionsByWorkItem = (workItemId) => Discussion.find({ workItemId }).sort({ createdAt: 1 });
export const createDiscussion = (data) => new Discussion(data).save();
export const updateDiscussion = (id, data) => Discussion.findByIdAndUpdate(id, { ...data, editedAt: new Date() }, { new: true });
export const deleteDiscussion = (id) => Discussion.findByIdAndDelete(id);
export const addReaction = async (discussionId, emoji, userId) => {
  const doc = await Discussion.findById(discussionId);
  if (!doc) return null;
  const existing = doc.reactions.find(r => r.emoji === emoji && r.userId === userId);
  if (existing) {
    doc.reactions = doc.reactions.filter(r => !(r.emoji === emoji && r.userId === userId));
  } else {
    doc.reactions.push({ emoji, userId });
  }
  await doc.save();
  return doc;
};
