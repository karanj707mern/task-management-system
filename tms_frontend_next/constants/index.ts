export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
// Backend origin without the /api/v1 prefix — used for static asset URLs (e.g. avatars)
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || API_BASE_URL.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REQUEST_ACCESS: '/request-access',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROJECTS: '/dashboard/projects',
  EPICS: '/dashboard/epics',
  SPRINTS: '/dashboard/sprints',
  BRANCHES: '/dashboard/branches',
  COMMITS: '/dashboard/commits',
  PULL_REQUESTS: '/dashboard/pull-requests',
  CODE_REVIEWS: '/dashboard/code-reviews',
  NOTIFICATIONS: '/dashboard/notifications',
  TASKS: '/dashboard/tasks',
  TEAMS: '/dashboard/teams',
  USERS: '/dashboard/users',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
};

export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export const EPIC_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const SPRINT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Product',
];

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Please log in to continue',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  EMAIL_EXISTS: 'Email already exists',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  CREATE_SUCCESS: 'Created successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  REQUEST_SUBMITTED: 'Access request submitted. An admin will review your request.',
};
