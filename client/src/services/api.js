const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

function getHeaders() {
  const token = localStorage.getItem('payroll_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders();

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  } catch (netErr) {
    throw new Error('Could not connect to the backend server. Please verify the server is running on localhost:5000.');
  }

  if (response.status === 401) {
    localStorage.removeItem('payroll_token');
    localStorage.removeItem('payroll_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed with status ' + response.status);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response;
}

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  updatePassword: (currentPassword, newPassword) => request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Platform Owner & Public Registration
  registerCompany: (data) => request('/companies/register', { method: 'POST', body: JSON.stringify(data) }),
  getPlatformStats: () => request('/companies/stats'),
  getCompanies: () => request('/companies'),
  getAllCompanies: () => request('/companies?include_owner=true'),
  getCompanyById: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),

  // Accounts & User Logins Management
  getAccounts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accounts${query ? `?${query}` : ''}`);
  },
  createAccount: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  resetAccountPassword: (id, new_password) => request(`/accounts/${id}/password`, { method: 'PUT', body: JSON.stringify({ new_password }) }),
  updateAccountRole: (id, role) => request(`/accounts/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateAccountStatus: (id, status) => request(`/accounts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ''}`);
  },
  getEmployeeById: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSalaryStructure: (id, data) => request(`/employees/${id}/salary`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  getDepartments: (companyId) => request('/employees/departments' + (companyId ? `?company_id=${companyId}` : '')),
  getShifts: (companyId) => request('/employees/shifts' + (companyId ? `?company_id=${companyId}` : '')),

  // Attendance
  clockIn: (data) => request('/attendance/clock-in', { method: 'POST', body: JSON.stringify(typeof data === 'string' ? { notes: data } : (data || {})) }),
  clockOut: (data) => request('/attendance/clock-out', { method: 'POST', body: JSON.stringify(data || {}) }),
  getTodayStatus: () => request('/attendance/today'),
  getMyAttendance: (month, year) => request(`/attendance/my?month=${month || ''}&year=${year || ''}`),
  getMasterAttendance: (date, department_id, status) => {
    const params = new URLSearchParams({ date: date || '', department_id: department_id || '', status: status || '' }).toString();
    return request(`/attendance/master?${params}`);
  },
  markAttendanceManual: (data) => request('/attendance/manual', { method: 'POST', body: JSON.stringify(data) }),
  bulkMarkAttendance: (data) => request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),

  // Leaves
  getLeaveTypes: () => request('/leaves/types'),
  getMyBalances: () => request('/leaves/balances'),
  applyLeave: (data) => request('/leaves/apply', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves/requests${query ? `?${query}` : ''}`);
  },
  reviewLeave: (id, status, review_notes) => request(`/leaves/requests/${id}/review`, { method: 'PUT', body: JSON.stringify({ status, review_notes }) }),

  // Expenses & Reimbursements
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  reviewExpense: (id, status, review_notes) => request(`/expenses/${id}/review`, { method: 'PUT', body: JSON.stringify({ status, review_notes }) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Payroll
  getPayrollBatches: () => request('/payroll/batches'),
  previewPayrollBatch: (month, year) => request(`/payroll/preview?month=${month}&year=${year}`),
  generatePayrollBatch: (data) => request('/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
  finalizePayrollBatch: (id, data) => request(`/payroll/batches/${id}/finalize`, { method: 'PUT', body: JSON.stringify(data || {}) }),
  emailBatchPayslips: (id) => request(`/payroll/batches/${id}/email-all`, { method: 'POST' }),
  getPayslips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payroll/payslips${query ? `?${query}` : ''}`);
  },
  getPayslipById: (id) => request(`/payroll/payslips/${id}`),
  updatePayslip: (id, data) => request(`/payroll/payslips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  emailSinglePayslip: (id) => request(`/payroll/payslips/${id}/email`, { method: 'POST' }),
  getPayslipPdfUrl: (id) => `${API_BASE}/payroll/payslips/${id}/pdf`,

  // 🛡️ Maker-Checker Workflow & Statutory Exports
  submitBatchForReview: (id) => request(`/payroll/batches/${id}/submit-review`, { method: 'POST' }),
  approveBatch: (id, checker_notes) => request(`/payroll/batches/${id}/approve`, { method: 'POST', body: JSON.stringify({ checker_notes }) }),
  rejectBatch: (id, checker_notes) => request(`/payroll/batches/${id}/reject`, { method: 'POST', body: JSON.stringify({ checker_notes }) }),
  getEcrDownloadUrl: (id) => `${API_BASE}/payroll/batches/${id}/export-ecr`,
  getBankBatchDownloadUrl: (id) => `${API_BASE}/payroll/batches/${id}/export-bank`,
  getFormTDownloadUrl: (id) => `${API_BASE}/payroll/batches/${id}/export-form-t`,

  // 🏛️ Compliance & Governance Hub (Labour Codes, DPDP, CERT-In, POSH, Tax 12BB, GST)
  getComplianceOverview: () => request('/compliance/overview'),
  getLabourCodeAnalysis: () => request('/compliance/labour-codes'),
  rebalanceSalary: (empId) => request(`/compliance/labour-codes/rebalance/${empId}`, { method: 'POST' }),
  getDpdpConsents: () => request('/compliance/dpdp'),
  anonymizeEmployee: (empId) => request(`/compliance/dpdp/anonymize/${empId}`, { method: 'POST' }),
  getEmployeeDossier: (empId) => request(`/compliance/dpdp/dossier/${empId}`),
  getSecurityIncidents: () => request('/compliance/incidents'),
  createSecurityIncident: (data) => request('/compliance/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateSecurityIncident: (id, data) => request(`/compliance/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAuditLogs: (params = {}) => request(`/compliance/audit-logs?${new URLSearchParams(params).toString()}`),
  getPoshComplaints: () => request('/compliance/posh'),
  filePoshComplaint: (data) => request('/compliance/posh/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getPoshAnnualReport: () => request('/compliance/posh/annual-report'),
  getTaxDeclarations: () => request('/compliance/tax-declarations'),
  saveTaxDeclaration: (empId, data) => request(`/compliance/tax-declarations/${empId}`, { method: 'POST', body: JSON.stringify(data) }),
  calculateTaxComparison: (data) => request('/compliance/tax-calculator', { method: 'POST', body: JSON.stringify(data) }),
  getSaasGstInvoices: () => request('/compliance/gst-invoices'),
  generateSaasGstInvoice: (data) => request('/compliance/gst-invoices/generate', { method: 'POST', body: JSON.stringify(data) }),
  signDpaContract: () => request('/compliance/contracts/sign-dpa', { method: 'POST' }),

  // Email Logs
  getEmailLogs: () => request('/email-logs'),

  // Reports
  getAttendanceReport: (month, year, department_id) => request(`/reports/attendance?month=${month || ''}&year=${year || ''}&department_id=${department_id || ''}`),
  getPayrollReport: (year) => request(`/reports/payroll?year=${year || ''}`),
  getAttendanceCsvUrl: (month, year, department_id) => `${API_BASE}/reports/attendance?month=${month || ''}&year=${year || ''}&department_id=${department_id || ''}&format=csv`,
  getPayrollCsvUrl: (year) => `${API_BASE}/reports/payroll?year=${year || ''}&format=csv`,

  // Company Settings
  getCompanySettings: () => request('/settings/company'),
  updateCompanySettings: (data) => request('/settings/company', { method: 'PUT', body: JSON.stringify(data) }),

  // 💾 Enterprise Backups & CERT-In Disaster Recovery
  getBackups: () => request('/companies/backups/list'),
  createBackup: (notes) => request('/companies/backups', { method: 'POST', body: JSON.stringify({ notes }) }),
  getBackupDownloadUrl: (fileName) => `${API_BASE}/companies/backups/${fileName}/download`,
  restoreBackup: (fileName) => request(`/companies/backups/${fileName}/restore`, { method: 'POST' }),

  // 🔔 Multi-Channel Webhooks (Slack, Teams, WhatsApp, SMS)
  testWebhook: () => request('/companies/test-webhook', { method: 'POST' }),
  getWebhookLogs: () => request('/companies/webhooks/logs'),

  // 📡 Biometric Hardware Push SDK & Device Management
  getBiometricDevices: () => request('/biometric/devices'),
  registerBiometricDevice: (data) => request('/biometric/devices', { method: 'POST', body: JSON.stringify(data) }),
  deleteBiometricDevice: (id) => request(`/biometric/devices/${id}`, { method: 'DELETE' }),
  simulateBiometricPunch: (id, data) => request(`/biometric/devices/${id}/simulate-punch`, { method: 'POST', body: JSON.stringify(data) }),

  // 📂 Employee Digital Document Locker & FnF Settlement
  getEmployeeDocuments: (employeeId) => request(`/lifecycle/documents/${employeeId}`),
  uploadEmployeeDocument: (data) => request('/lifecycle/documents', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmployeeDocument: (id, status) => request(`/lifecycle/documents/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteEmployeeDocument: (id) => request(`/lifecycle/documents/${id}`, { method: 'DELETE' }),
  previewFnF: (data) => request('/lifecycle/fnf/calculate', { method: 'POST', body: JSON.stringify(data) }),
  saveFnF: (data) => request('/lifecycle/fnf', { method: 'POST', body: JSON.stringify(data) }),
  getEmployeeFnF: (employeeId) => request(`/lifecycle/fnf/${employeeId}`),

  // 🤖 Egotech AI HR & Tax Assistant
  askAi: (prompt) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }),
};

export default api;
