import type { ApiEnvelope, CompanyDashboard, DcrExtended, Doctor, Employee, ManagerDashboard, Product, TourPlan, VisitCoverageGrid, ExpenseClaim, ComplianceResponse, EmployeeComplianceRow, PayrollResponse, PayrollStatusRecord, RepManagerTeamResponse, RepAnalysisRow, LeaveApplication } from "@zivira/types";
import { fetchWithRetry } from "@/lib/resilience";

// Item 3 — real cross-portal notifications for the Manager portal. Not
// (yet) part of the shared @zivira/types package, so declared locally here
// — mirrors serializeDocument() over the backend's Notice model
// (src/models/notice.model.ts) via GET /manager/notices.
export type ManagerNotice = {
  id: string;
  title: string;
  message: string;
  audience: "ALL" | "MR" | "MANAGER" | "ADMIN";
  priority: "NORMAL" | "URGENT";
  postedBy?: string | null;
  targetEmployeeCode?: string | null;
  createdAt: string;
};

// Item 3 (post-launch robustness round) -- team leave entitlement/balance,
// read from the same real leaveEntitlementEntry collection admin's Leave
// Entitlement - Entry screen writes to (and the field rep's own balance
// cards read from, per-employee).
export type TeamLeaveEntitlement = {
  id: string;
  fieldForceName?: string;
  year?: string;
  balanceCl?: number; balancePl?: number; balanceSl?: number; balanceLop?: number;
  cl?: number; pl?: number; sl?: number; lop?: number;
};

// Request E, item 1 — every other active manager in the tenant, for the
// Tour Plan reassign modal's manager picker. Via GET /manager/managers.
export type ManagerListItem = {
  employeeCode: string;
  name: string;
  designation?: string | null;
};

// Phase 1 of the "Call Manager" reference build — Campaign Planning &
// Execution. Mirrors a real CampaignVisitModel row (see the backend
// model), team-scoped via GET /manager/campaign-visits the same way
// GET /manager/team already is.
export type ManagerCampaignVisit = {
  id: string;
  campaignId?: string | null;
  campaignName?: string;
  employeeCode: string;
  employeeName?: string;
  // Phase 5 — chemist deviations/visits flow through this exact same
  // generic approval queue; visitType picks which target name applies.
  visitType?: "doctor" | "chemist";
  doctorId?: string | null;
  doctorName?: string;
  chemistId?: string | null;
  chemistName?: string;
  visitDate: string;
  source: "planned" | "deviation";
  status: "Planned" | "Completed" | "Cancelled" | "Pending Approval" | "Rejected";
  deviationType?: string | null;
  rejectReason?: string | null;
  notes?: string;
  createdAt?: string;
};

// Phase 6 — team attendance/checkout visibility, built directly on Phase
// 2's real AttendanceModel via GET /manager/team-checkout-status.
export type ManagerTeamCheckoutStatus = {
  employeeCode: string;
  employeeName: string;
  checkedInToday: boolean;
  checkedOutToday: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  hasOpenPriorDay: boolean;
  openPriorDay: string | null;
};

// Phase 6 — team Chemist Call read/detail view, mirroring the real
// ChemistCallModel the field-rep Chemist Call screen (Phase 5) saves to.
export type ManagerChemistCallRow = {
  brandId?: string;
  brandName: string;
  myQty?: number;
  compBrandName?: string;
  compQty?: number;
};
export type ManagerChemistCallPobRow = { productId?: string; productName: string; qty: number };
export type ManagerChemistCallShortExpiryRow = { medicineName: string; expiryDate?: string; qty: number };
export type ManagerChemistCallJccRow = { employeeCode?: string; name: string; designation?: string };
export type ManagerChemistCall = {
  id: string;
  employeeCode: string;
  employeeName?: string;
  chemistId: string;
  chemistName?: string;
  visitDateOnly: string;
  rcpa: ManagerChemistCallRow[];
  pob: ManagerChemistCallPobRow[];
  shortExpiry: ManagerChemistCallShortExpiryRow[];
  jcc: ManagerChemistCallJccRow[];
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://zivira-backend-swagger-ui.onrender.com/api";
const TOKEN_KEY = "zivira.manager.token";

export function getToken()  { if (typeof window === "undefined") return null; return window.localStorage.getItem(TOKEN_KEY); }
export function setToken(t: string) { window.localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }

// Round 39 item 1 -- every API call now has a hard timeout and a readable
// error, so a cold/unreachable backend can never leave a button spinning
// forever (previously: no timeout at all, and a non-JSON 502 from the
// host's proxy threw a cryptic "Unexpected token <").
const REQUEST_TIMEOUT_MS = 30000;
async function fetchWithTimeoutOnce(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The server is taking too long to respond (it may be waking up). Please try again in a moment.");
    }
    throw new Error("Cannot reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}
// Round 48 Part C -- idempotent GETs retry with back-off while a sleeping host wakes (see lib/resilience.ts).
function fetchWithTimeout(url: string, init: RequestInit = {}) {
  return fetchWithRetry(() => fetchWithTimeoutOnce(url, init), init.method ?? "GET");
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error(`The server returned an unexpected response (${response.status}). It may be restarting -- please retry.`);
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
  });
  const payload = await readJson(res);
  if (!res.ok) throw new Error(payload?.error?.message ?? "API request failed");
  return payload as ApiEnvelope<T>;
}

// Items 4/6 (post-launch robustness round) -- real file download (Circulars
// / Manuals), same fetch-blob-then-save-link pattern the admin and field
// portals already use for their own downloads.
async function downloadFile(path: string, fileName: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ManagerDocument = {
  id: string;
  subject?: string | null;
  fileName?: string | null;
  uploadedOn?: string | null;
};

import type { InfoFeed } from "@/components/info-popups";
import type { TalkTicket } from "@/components/talk-to-us";
export const apiClient = {
  // Round 48 Part D
  infoFeed() { return request<InfoFeed>("/manager/info-center/feed"); },
  talkList() { return request<TalkTicket[]>("/manager/info-center/talk"); },
  talkCreate(subject: string, message: string) { return request<TalkTicket>("/manager/info-center/talk", { method: "POST", body: JSON.stringify({ subject, message }) }); },
  talkReply(id: string, message: string) { return request<TalkTicket>(`/manager/info-center/talk/${id}/reply`, { method: "POST", body: JSON.stringify({ message }) }); },
  // Round 39 item 1 -- fired when a login page opens so a sleeping backend
  // starts waking while the user types credentials.
  warmUp: () => fetch(`${API_BASE_URL}/health`, { cache: "no-store" }).catch(() => undefined),
  login: (username: string, password: string) =>
    request<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password, portal: "FIELD_FORCE" }) }),
  dashboard: () => request<ManagerDashboard>("/manager/dashboard"),
  // Item 3 — real notifications: tenant-wide Admin broadcasts plus notices
  // targeted at this manager (another manager voiding/reassigning one of
  // their Tour Plans). `since` (ISO timestamp) lets the notifications page
  // poll for only what's new.
  notices: (since?: string) => request<ManagerNotice[]>(`/manager/notices${since ? `?since=${encodeURIComponent(since)}` : ""}`),
  // Items 4/6 (post-launch robustness round)
  circulars: () => request<ManagerDocument[]>("/manager/circulars"),
  downloadCircular: (id: string, fileName: string) => downloadFile(`/manager/circulars/${id}/download`, fileName),
  manuals: () => request<ManagerDocument[]>("/manager/manuals"),
  downloadManual: (id: string, fileName: string) => downloadFile(`/manager/manuals/${id}/download`, fileName),
  // Item 12 (post-launch robustness round) -- real Flash News/Notice
  // Board/Quote of the Week/Talk to Us content admin actually saved,
  // same backend read GET /field/announcements also uses.
  announcements: () => request<{ flashNews: { content: string } | null; noticeBoard: { content1: string; content2: string; content3: string } | null; quoteOfTheWeek: { quote: string } | null; talkToUs: { content: string } | null }>("/manager/announcements"),
  team:      () => request<Employee[]>("/manager/team"),
  createTeamMember: (input: Omit<Employee, "id" | "tenantSlug" | "createdAt" | "updatedAt" | "reportingManager"> & { password?: string }) =>
    request<Employee & { demoPassword?: string }>("/manager/team", { method: "POST", body: JSON.stringify(input) }),
  dcrs:      () => request<DcrExtended[]>("/manager/dcrs"),
  approveDcr: (id: string) => request<DcrExtended>(`/manager/dcrs/${id}/approve`, { method: "POST" }),
  rejectDcr:  (id: string, reason?: string) => request<DcrExtended>(`/manager/dcrs/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  deleteDcr: (id: string) => request<{ deleted: boolean; id: string }>(`/manager/dcrs/${id}`, { method: "DELETE" }),
  employees: () => request<Employee[]>("/company/employees"),
  createEmployee: (input: Omit<Employee, "id" | "tenantSlug" | "createdAt" | "updatedAt">) =>
    request<Employee>("/company/employees", { method: "POST", body: JSON.stringify(input) }),
  doctors: () => request<Doctor[]>("/company/doctors"),
  createDoctor: (input: Omit<Doctor, "id" | "tenantSlug" | "createdAt" | "updatedAt">) =>
    request<Doctor>("/company/doctors", { method: "POST", body: JSON.stringify(input) }),
  products: () => request<Product[]>("/company/products"),
  companyDashboard: () => request<CompanyDashboard>("/company/dashboard"),

  // PRD 12.1 — Tour Plan: cross-manager assignment & void/reassign
  tourPlans: () => request<TourPlan[]>("/manager/tour-plans"),
  tourPlansCrossTeam: () => request<TourPlan[]>("/manager/tour-plans/cross-team"),
  approveTourPlan: (tpId: string) => request<TourPlan>(`/manager/tour-plans/${tpId}/approve`, { method: "PATCH" }),
  rejectTourPlan: (tpId: string, reason?: string) => request<TourPlan>(`/manager/tour-plans/${tpId}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  voidTourPlan: (tpId: string, reason: string) => request<TourPlan>(`/manager/tour-plans/${tpId}/void`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  deleteTourPlan: (tpId: string) => request<{ deleted: boolean; tpId: string }>(`/manager/tour-plans/${tpId}`, { method: "DELETE" }),
  // Request E, item 1 — reassign must actually redirect the Tour Plan to
  // whichever manager the caller picks (targetManager: code or name),
  // instead of silently recreating it under the caller themselves.
  reassignTourPlan: (tpId: string, reason: string, targetManager: string) =>
    request<{ original: TourPlan; created: TourPlan }>(`/manager/tour-plans/${tpId}/reassign`, { method: "POST", body: JSON.stringify({ reason, targetManager }) }),
  managers: () => request<ManagerListItem[]>("/manager/managers"),

  // PRD 12.2 — Visit Coverage grid
  visitCoverage: (month?: string) => request<VisitCoverageGrid>(`/manager/visit-coverage${month ? `?month=${month}` : ""}`),

  // Zivira_Project_Basic.docx Topic 2/4 — Attendance & Compliance Analytics
  // / Chronic Defaulter Detection (team-scoped)
  compliance: (month?: string) =>
    request<EmployeeComplianceRow[]>(`/manager/analytics/compliance${month ? `?month=${month}` : ""}`) as Promise<ComplianceResponse>,

  // Zivira_Project_Basic.docx Topic 3 — Salary Integration Engine (team-scoped)
  payroll: (month?: string) =>
    request<PayrollStatusRecord[]>(`/manager/analytics/payroll${month ? `?month=${month}` : ""}`) as Promise<PayrollResponse>,
  approvePayroll: (id: string) => request<PayrollStatusRecord>(`/manager/analytics/payroll/${id}/approve`, { method: "PATCH" }),
  rejectPayroll: (id: string, reason: string) =>
    request<PayrollStatusRecord>(`/manager/analytics/payroll/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),

  // Zivira_Project_Basic.docx Topic 5/6 — Rep vs Manager / Joint Field Work (team-scoped)
  repManagerAnalysis: (month?: string) =>
    request<RepAnalysisRow[]>(`/manager/analytics/rep-manager${month ? `?month=${month}` : ""}`) as Promise<RepManagerTeamResponse>,

  // PRD 12.5 follow-up — Expense Claims linked to a Tour Plan's GST branch
  expenseClaims: () => request<ExpenseClaim[]>("/manager/expense-claims"),
  expenseClaimsCrossTeam: () => request<ExpenseClaim[]>("/manager/expense-claims/cross-team"),
  approveExpenseClaim: (claimId: string) => request<ExpenseClaim>(`/manager/expense-claims/${claimId}/approve`, { method: "PATCH" }),
  rejectExpenseClaim: (claimId: string, reason: string) =>
    request<ExpenseClaim>(`/manager/expense-claims/${claimId}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  deleteExpenseClaim: (claimId: string) => request<{ deleted: boolean; claimId: string }>(`/manager/expense-claims/${claimId}`, { method: "DELETE" }),

  // New "Leave Apply" tab — team leave requests submitted from the
  // FieldRepo Leave tab, reviewed here.
  leaveApplications: () => request<LeaveApplication[]>("/manager/leave-applications"),
  teamLeaveEntitlement: () => request<TeamLeaveEntitlement[]>("/manager/leave-entitlement"),
  approveLeave: (id: string) => request<LeaveApplication>(`/manager/leave-applications/${id}/approve`, { method: "POST" }),
  rejectLeave: (id: string, reason?: string) =>
    request<LeaveApplication>(`/manager/leave-applications/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  deleteLeaveApplication: (id: string) => request<{ deleted: boolean; id: string }>(`/manager/leave-applications/${id}`, { method: "DELETE" }),

  // Phase 1 — Campaign Planning & Execution team visibility
  campaignVisits: (date?: string) =>
    request<ManagerCampaignVisit[]>(`/manager/campaign-visits${date ? `?date=${encodeURIComponent(date)}` : ""}`),

  // Phase 3 — deviation approval queue, scoped to this manager's team
  // the same way every other approval endpoint already is.
  deviationVisits: (status?: string) =>
    request<ManagerCampaignVisit[]>(`/manager/deviation-visits${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  approveDeviation: (id: string) =>
    request<ManagerCampaignVisit>(`/manager/deviation-visits/${id}/approve`, { method: "POST" }),
  rejectDeviation: (id: string, reason?: string) =>
    request<ManagerCampaignVisit>(`/manager/deviation-visits/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Phase 6 — team attendance/checkout status (real AttendanceModel data,
  // reusing the exact checked-in/checked-out/open-prior-day logic Phase 2
  // built for the field rep's own checkout gate).
  teamCheckoutStatus: () => request<ManagerTeamCheckoutStatus[]>("/manager/team-checkout-status"),

  // Phase 6 — team Chemist Call read/detail view, same reportingManager
  // scoping every other manager screen already uses.
  chemistCalls: () => request<ManagerChemistCall[]>("/manager/chemist-calls"),
  chemistCall: (id: string) => request<ManagerChemistCall>(`/manager/chemist-calls/${id}`)
};
