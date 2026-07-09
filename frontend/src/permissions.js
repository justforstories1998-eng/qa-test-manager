export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  QA_LEAD: 'qa_lead',
  TESTER: 'tester',
  DEVELOPER: 'developer',
  BUSINESS_ANALYST: 'business_analyst',
  USER: 'user',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  qa_lead: 'QA Lead',
  tester: 'Tester',
  developer: 'Developer',
  business_analyst: 'Business Analyst',
  user: 'User',
};

const FULL_ACCESS = ['dashboard', 'test-cases', 'execution', 'bugs', 'reports', 'settings', 'admin', 'board', 'work-items', 'boards', 'backlogs', 'sprints'];
const ALL_MODULES_EXCEPT_ADMIN = ['dashboard', 'test-cases', 'execution', 'bugs', 'reports', 'settings', 'board', 'work-items', 'boards', 'backlogs', 'sprints'];
const VIEW_ONLY_MODULES = ['dashboard', 'test-cases', 'execution', 'bugs', 'reports', 'settings', 'board', 'work-items', 'boards', 'backlogs', 'sprints'];
const BOARD_MODULES = ['board', 'work-items', 'boards', 'backlogs', 'sprints'];

const ROLE_PERMISSIONS = {
  admin: { modules: FULL_ACCESS, canEdit: true, canDelete: true, canManageUsers: true },
  project_manager: { modules: ALL_MODULES_EXCEPT_ADMIN, canEdit: true, canDelete: true, canManageUsers: false },
  qa_lead: { modules: ALL_MODULES_EXCEPT_ADMIN, canEdit: true, canDelete: true, canManageUsers: false },
  tester: { modules: ALL_MODULES_EXCEPT_ADMIN, canEdit: true, canDelete: false, canManageUsers: false },
  developer: { modules: ALL_MODULES_EXCEPT_ADMIN, canEdit: true, canDelete: false, canManageUsers: false },
  business_analyst: { modules: BOARD_MODULES, canEdit: true, canDelete: false, canManageUsers: false },
  user: { modules: VIEW_ONLY_MODULES, canEdit: false, canDelete: false, canManageUsers: false },
};

export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
};

export const canAccessModule = (role, module) => {
  const perms = getRolePermissions(role);
  return perms.modules.includes(module);
};

export const canEdit = (role) => getRolePermissions(role).canEdit;
export const canDelete = (role) => getRolePermissions(role).canDelete;
export const canManageUsers = (role) => getRolePermissions(role).canManageUsers;
