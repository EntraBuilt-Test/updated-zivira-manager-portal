"use client";
import type { DcrExtended } from "@zivira/types";
import { Check, RefreshCw, X, Search, Calendar, Download, AlertCircle } from "lucide-react";
import { useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string; icon: ReactNode }> = {
  SUBMITTED: { bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200", icon: <AlertCircle size={12} className="text-amber-600" /> },
  MANAGER_APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", icon: <Check size={12} className="text-emerald-600" /> },
  APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", icon: <Check size={12} className="text-emerald-600" /> },
  REJECTED: { bg: "bg-rose-50", color: "text-rose-700", border: "border-rose-200", icon: <X size={12} className="text-rose-600" /> },
  DRAFT: { bg: "bg-slate-50 dark:bg-slate-900", color: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800", icon: <span /> }
};

function getDoctorName(doctorId: DcrExtended["doctorId"]) {
  if (typeof doctorId === "object" && doctorId && "name" in doctorId) {
    return doctorId.name;
  }
  return "";
}

const INTEREST_COLORS: Record<string, string> = {
  HIGH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-rose-50 text-rose-700 border-rose-200",
  NONE: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
};

function feedbackTitle(dcr: DcrExtended) {
  const parts: string[] = [];
  if (dcr.hospitalClinic) parts.push(`Hospital/Clinic: ${dcr.hospitalClinic}`);
  if (dcr.checkInTime || dcr.checkOutTime) parts.push(`Visit: ${dcr.checkInTime ?? "—"} to ${dcr.checkOutTime ?? "—"}${dcr.visitDurationMinutes ? ` (${dcr.visitDurationMinutes} min)` : ""}`);
  if (dcr.productFeedback) parts.push(`Feedback: ${dcr.productFeedback}`);
  if (dcr.competitorMentioned) parts.push(`Competitor mentioned: ${dcr.competitorMentioned}`);
  if (dcr.followUpRequired) parts.push(`Follow-up required${dcr.followUpDate ? ` by ${new Date(dcr.followUpDate).toLocaleDateString("en-IN")}` : ""}`);
  return parts.join("\n") || "No additional visit details captured";
}

// No shared CSV helper exists in this repo (lib/download-csv.ts) — build a
// small self-contained CSV export with no new dependency.
function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(row => headers.map(h => escape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 20;

export function ManagerDcrList() {
  const [dcrs, setDcrs] = useState<DcrExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);

  async function load() {
    setLoading(true); setError("");
    try { setDcrs((await apiClient.dcrs()).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(); }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  async function approve(id: string) {
    setActing(id);
    try { await apiClient.approveDcr(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Approval failed"); }
    finally { setActing(null); }
  }

  async function reject() {
    if (!rejectId) return;
    setActing(rejectId);
    try { await apiClient.rejectDcr(rejectId, rejectReason); setRejectId(null); setRejectReason(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Rejection failed"); }
    finally { setActing(null); }
  }

  const pendingCount = dcrs.filter(d => d.status === "SUBMITTED").length;
  const approvedCount = dcrs.filter(d => d.status === "MANAGER_APPROVED" || d.status === "APPROVED").length;

  // Item 2(d)/(e) — real search + session + status filtering, applied
  // consistently to the table, the Export button, pagination, and the
  // Batch Approve action below (so "what's shown" and "what's exported /
  // batch-approved" always agree).
  const filteredDcrs = dcrs.filter((dcr) => {
    if (sessionFilter !== "ALL" && dcr.callSession !== sessionFilter) return false;
    if (statusFilter !== "ALL" && dcr.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const doctorName = getDoctorName(dcr.doctorId).toLowerCase();
      const products = dcr.productsDetailed ?? [];
      const matches =
        dcr.employeeCode.toLowerCase().includes(q) ||
        (dcr.employeeName ?? "").toLowerCase().includes(q) ||
        doctorName.includes(q) ||
        products.some(p => p.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const maxPage = Math.max(0, Math.ceil(filteredDcrs.length / PAGE_SIZE) - 1);
  const effectivePage = Math.min(page, maxPage);
  const pagedDcrs = filteredDcrs.slice(effectivePage * PAGE_SIZE, (effectivePage + 1) * PAGE_SIZE);
  const visiblePendingIds = filteredDcrs.filter(d => d.status === "SUBMITTED").map(d => d.id);

  function exportCsv() {
    const rows = filteredDcrs.map(dcr => ({
      employeeCode: dcr.employeeCode,
      employeeName: dcr.employeeName ?? "",
      doctor: getDoctorName(dcr.doctorId) || "",
      visitDate: dcr.visitDate,
      callSession: dcr.callSession ?? "",
      callTime: dcr.callTime ?? "",
      punchInTime: dcr.punchInTime ?? "",
      punchOutTime: dcr.punchOutTime ?? "",
      products: (dcr.productsDetailed ?? []).join("; "),
      status: dcr.status,
    }));
    downloadCsv(`team-dcrs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  async function batchApprovePending() {
    if (visiblePendingIds.length === 0) return;
    setBatchApproving(true); setError("");
    try {
      const results = await Promise.allSettled(visiblePendingIds.map(id => apiClient.approveDcr(id)));
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      if (failed > 0) setError(`Batch approve: ${succeeded} succeeded, ${failed} failed.`);
      await load();
    } finally {
      setBatchApproving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header & Primary Controls Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-800/60">
              Team Activity & Compliance
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Real-time sync
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">Team DCRs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review, verify call GPS telemetry, inputs distribution, and approve daily call reports submitted by your team.</p>
        </div>

        {/* Action Buttons Strip */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* This dashboard has no date-filtering data or state (apiClient.dcrs()
              takes no date param and nothing here is filtered by visitDate), so
              this label is left as a non-interactive date display rather than
              wired to fake filtering. */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <span>Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</span>
          </div>

          <button onClick={exportCsv} disabled={filteredDcrs.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button">
            <Download size={14} className="text-slate-400" />
            <span>Export</span>
          </button>

          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" type="button">
            <RefreshCw size={12} className={`text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button onClick={batchApprovePending} disabled={batchApproving || visiblePendingIds.length === 0} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" type="button">
            <Check size={14} />
            <span>{batchApproving ? "Approving…" : visiblePendingIds.length === 0 ? "0 Pending" : `Batch Approve Pending (${visiblePendingIds.length})`}</span>
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</p>}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject DCR</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason (optional)</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain the reason for rejection" className="w-full text-sm p-3 rounded-xl border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 focus:ring-brand-500" />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition" type="button">Cancel</button>
              <button onClick={reject} type="button" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all">
                <X size={16} /> Reject Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total DCRs</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{dcrs.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">100% rep submit</span>
          </div>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-sm">
          <div className="text-[11px] font-medium text-amber-800 dark:text-amber-500 flex items-center justify-between">
            <span>Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{pendingCount}</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">Action required</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Manager Approved</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{approvedCount}</span>
            <span className="text-[10px] text-slate-400">Verified</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Joint Work Calls</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{dcrs.filter(d => d.jointWork?.accompanyingManager).length}</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">ABM-001</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Samples Promoted</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {dcrs.reduce((acc, d) => acc + (d.samplesGiven?.length || 0), 0)}
            </span>
            <span className="text-[10px] text-slate-400">Packs issued</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Doctor Coverage</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">100%</span>
            <span className="text-[10px] text-emerald-600 font-semibold">On Target</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder:text-slate-400" placeholder="Search Doctor, Employee Code, or Brand..." type="text" />
        </div>
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <select value={sessionFilter} onChange={e => { setSessionFilter(e.target.value); setPage(0); }} className="py-1.5 pl-2.5 pr-7 text-xs border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 dark:text-slate-200 focus:ring-1 focus:ring-brand-500 font-medium">
            <option value="ALL">All Sessions</option>
            <option value="AFTERNOON">Afternoon Only</option>
            <option value="EVENING">Evening Only</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="py-1.5 pl-2.5 pr-7 text-xs border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 dark:text-slate-200 focus:ring-1 focus:ring-brand-500 font-medium">
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="MANAGER_APPROVED">Manager Approved</option>
          </select>
          <button onClick={() => { setSearch(""); setSessionFilter("ALL"); setStatusFilter("ALL"); setPage(0); }} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors" title="Clear Filters" type="button">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* DCR Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase sticky top-0 z-10 select-none">
              <tr>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 w-10 text-center"><input className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500" type="checkbox" /></th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-2 w-12 text-center">S.NO</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3">EMPLOYEE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[170px]">DOCTOR & SPECIALTY</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">SESSION</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">TIME</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">PUNCH IN</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">PUNCH OUT</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[120px]">PRODUCTS</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[120px]">SAMPLES</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[110px]">INPUTS</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[150px]">JOINT WORK</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">FEEDBACK</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">OVERRIDE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 text-center min-w-[150px]">STATUS & ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300 dark:text-slate-200">
              {pagedDcrs.map((dcr, i) => {
                const sc = STATUS_COLORS[dcr.status] ?? STATUS_COLORS["DRAFT"];
                const canAct = dcr.status === "SUBMITTED";
                return (
                  <tr key={dcr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-3 text-center"><input className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500" type="checkbox" /></td>
                    <td className="py-3.5 px-2 text-center text-slate-400 font-mono text-[11px] tabular-nums">{effectivePage * PAGE_SIZE + i + 1}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-brand-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                          {dcr.employeeName ? dcr.employeeName.substring(0, 2).toUpperCase() : "R"}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{dcr.employeeCode}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{getDoctorName(dcr.doctorId) || "—"}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>Clinic/Hospital</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 uppercase">
                        {dcr.callSession ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">{dcr.callTime ?? "—"}</td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono font-semibold px-1.5 py-0.5 rounded border text-[11px] tabular-nums ${dcr.punchInTime ? 'text-brand-700 bg-brand-50 border-brand-200/50 dark:text-brand-300 dark:bg-brand-900/30' : 'text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:border-slate-700'}`}>
                        {dcr.punchInTime ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono font-semibold px-1.5 py-0.5 rounded border text-[11px] tabular-nums ${dcr.punchOutTime ? 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30' : 'text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:border-slate-700'}`}>
                        {dcr.punchOutTime ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {dcr.productsDetailed?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {dcr.productsDetailed.map((p, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {dcr.samplesGiven?.length ? dcr.samplesGiven.map((s, idx) => (
                        <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1 mr-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          <span>{s.productName}</span>
                          <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-1 rounded">×{s.qty}</span>
                        </div>
                      )) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {dcr.inputsGiven?.length ? dcr.inputsGiven.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 mb-1 mr-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {s.itemType ?? s.inputName} × {s.qty}
                        </span>
                      )) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {dcr.jointWork?.accompanyingManager ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/60 text-[10px] font-semibold">
                          {dcr.jointWork.accompanyingManager} · {dcr.jointWork.jointWorkType?.replace(/_/g, " ")}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 font-normal bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:border-slate-700">Solo Call</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" title={feedbackTitle(dcr)}>
                      {dcr.prescriptionInterest ? (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${INTEREST_COLORS[dcr.prescriptionInterest] ?? INTEREST_COLORS.NONE}`}>
                          {dcr.prescriptionInterest}{dcr.followUpRequired ? " · FU" : ""}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-400 text-xs">
                      {dcr.overVisitFlag ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-400">
                          Visit #{dcr.overVisitCount ?? "4+"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {canAct ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button disabled={acting === dcr.id} onClick={() => approve(dcr.id)} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50" type="button">
                            Approve
                          </button>
                          <button disabled={acting === dcr.id} onClick={() => { setRejectId(dcr.id); setRejectReason(""); }} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 shadow-xs transition-colors disabled:opacity-50" type="button">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.color} ${sc.border} dark:bg-opacity-20`}>
                          {sc.icon} {dcr.status.replace("_", " ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredDcrs.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={24} className="mb-2 opacity-50" />
                      <p>No DCRs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination & Summary Information */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/70 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-700 dark:text-slate-300">{filteredDcrs.length === 0 ? 0 : effectivePage * PAGE_SIZE + 1} - {Math.min((effectivePage + 1) * PAGE_SIZE, filteredDcrs.length)}</strong> of <strong className="text-slate-700 dark:text-slate-300">{filteredDcrs.length}</strong> DCRs</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50 font-medium">
              <Check size={10} /> 100% Rep Tour Compliance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Page {filteredDcrs.length === 0 ? 0 : effectivePage + 1} of {maxPage + 1}</span>
            <div className="inline-flex rounded-md shadow-xs">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={effectivePage === 0} className="px-2.5 py-1 text-xs font-semibold rounded-l-md border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-500 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed hover:enabled:bg-slate-50 dark:hover:enabled:bg-slate-800 transition-colors" type="button">
                &lt;
              </button>
              <button onClick={() => setPage(p => Math.min(maxPage, p + 1))} disabled={effectivePage >= maxPage} className="px-2.5 py-1 text-xs font-semibold rounded-r-md border-y border-r border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-500 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed hover:enabled:bg-slate-50 dark:hover:enabled:bg-slate-800 transition-colors" type="button">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
