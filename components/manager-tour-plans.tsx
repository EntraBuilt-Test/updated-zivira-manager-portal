"use client";
import type { TourPlan } from "@zivira/types";
import { Ban, Check, RefreshCw, Repeat, RotateCcw, Users, X, Copy, Map, MoreVertical, Search, Download, History, AlertTriangle, Verified, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState, ReactNode } from "react";
import { apiClient, type ManagerListItem } from "@/lib/api-client";

const STATUS_COLORS: Record<string, { bg: string; color: string; icon: ReactNode }> = {
  SUBMITTED: { bg: "bg-amber-100/70", color: "text-amber-800", icon: <Clock size={14} className="text-amber-700" /> },
  APPROVED:  { bg: "bg-emerald-50", color: "text-emerald-800", icon: <CheckCircle size={14} className="text-emerald-600" /> },
  REJECTED:  { bg: "bg-rose-50", color: "text-rose-800", icon: <Ban size={14} className="text-rose-600" /> },
  VOIDED:    { bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400", icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> },
  DRAFT:     { bg: "bg-blue-50", color: "text-blue-800", icon: <Clock size={14} className="text-blue-600" /> }
};

type ActionKind = "void" | "reassign" | "reject" | "revoke";
type TabKind = "all" | "pending";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ManagerTourPlans() {
  const [crossTeam, setCrossTeam] = useState(false);
  const [tps, setTps] = useState<TourPlan[]>([]);
  const [myEmployeeCode, setMyEmployeeCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionTarget, setActionTarget] = useState<{ tp: TourPlan; kind: ActionKind } | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [managers, setManagers] = useState<ManagerListItem[]>([]);
  const [targetManager, setTargetManager] = useState("");
  const [revokePickerOpen, setRevokePickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<TabKind>("pending");
  const [monthFilter, setMonthFilter] = useState("");
  const [repFilter, setRepFilter] = useState("");
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<TourPlan | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = crossTeam ? await apiClient.tourPlansCrossTeam() : await apiClient.tourPlans();
      setTps(res.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    apiClient.dashboard().then(r => setMyEmployeeCode(r.data.manager.employeeCode)).catch(() => {});
    apiClient.managers().then(r => setManagers(r.data)).catch(() => {});
  }, []);

  useEffect(() => { void load(); }, [crossTeam]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(tpId: string) {
    setActing(true);
    try { await apiClient.approveTourPlan(tpId); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Approve failed"); }
    finally { setActing(false); }
  }

  async function batchApprove(ids: string[]) {
    if (ids.length === 0) return;
    setActing(true); setError(""); setBatchResult(null);
    try {
      const results = await Promise.allSettled(ids.map(id => apiClient.approveTourPlan(id)));
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      setBatchResult(failed === 0
        ? `Approved ${succeeded} of ${ids.length} plan(s).`
        : `Approved ${succeeded} of ${ids.length} plan(s); ${failed} failed.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Batch approve failed"); }
    finally { setActing(false); }
  }

  async function copyTpId(tpId: string) {
    try {
      await navigator.clipboard.writeText(tpId);
      setCopiedId(tpId);
      setTimeout(() => setCopiedId(prev => (prev === tpId ? null : prev)), 1500);
    } catch { /* clipboard not available — nothing to fall back to safely */ }
  }

  function exportCsv(rowsToExport: TourPlan[]) {
    const headers = ["TP ID", "Employee Name", "Employee Code", "Month", "Locations", "Assigned Manager", "Status", "Reason / Notes"];
    const lines = [headers.join(",")];
    for (const tp of rowsToExport) {
      const notes = tp.status === "VOIDED"
        ? `Voided by ${tp.voidedByName ?? tp.voidedBy}: ${tp.voidReason ?? ""}${tp.reassignedToTpId ? ` -> ${tp.reassignedToTpId}` : ""}`
        : tp.parentTpId ? `Reassigned from ${tp.parentTpId}` : "";
      lines.push([
        csvCell(tp.tpId),
        csvCell(tp.employeeName ?? ""),
        csvCell(tp.employeeCode),
        csvCell(tp.month),
        csvCell(tp.locations.map(l => l.town).join("; ")),
        csvCell(tp.assignedManagerName ?? tp.assignedManager),
        csvCell(tp.status),
        csvCell(notes)
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tour-plans.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function runAction() {
    if (!actionTarget) return;
    setActing(true); setError("");
    try {
      if (actionTarget.kind === "void" || actionTarget.kind === "revoke") await apiClient.voidTourPlan(actionTarget.tp.tpId, reason);
      else if (actionTarget.kind === "reassign") await apiClient.reassignTourPlan(actionTarget.tp.tpId, reason, targetManager);
      else await apiClient.rejectTourPlan(actionTarget.tp.tpId, reason);
      setActionTarget(null); setReason(""); setTargetManager("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
    finally { setActing(false); }
  }

  // Real, fixed enums driven off the loaded data — not hardcoded lists.
  const monthOptions = Array.from(new Set(tps.map(tp => tp.month))).sort();
  const repOptions = Array.from(
    new Map(tps.map(tp => [tp.employeeCode, tp.employeeName ?? tp.employeeCode] as const)).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const searchedTps = tps.filter(tp =>
    (!searchTerm ||
      tp.tpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tp.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      tp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!monthFilter || tp.month === monthFilter) &&
    (!repFilter || tp.employeeCode === repFilter)
  );

  const allTabCount = searchedTps.length;
  const pendingTabCount = searchedTps.filter(tp => tp.status === "SUBMITTED").length;
  const filteredTps = tab === "pending" ? searchedTps.filter(tp => tp.status === "SUBMITTED") : searchedTps;

  const pendingCount = tps.filter(tp => tp.status === "SUBMITTED").length;
  const approvedCount = tps.filter(tp => tp.status === "APPROVED").length;
  const voidedCount = tps.filter(tp => tp.status === "VOIDED").length;

  const isMine = (tp: TourPlan) => !myEmployeeCode || tp.assignedManager === myEmployeeCode;
  const visiblePendingIds = filteredTps.filter(tp => tp.status === "SUBMITTED" && isMine(tp)).map(tp => tp.tpId);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Breadcrumb & Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
              FIELD FORCE ITINERARY & COMPLIANCE
            </span>
            <span className="text-slate-300 font-mono text-xs">/</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs uppercase">TOUR PLANS</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {crossTeam ? "Cross-Team Tour Plans" : "My Team's Tour Plans"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {crossTeam ? "Every MR's Tour Plan across the tenant — void & reassign any of them to your team." : "Review, validate healthcare provider (HCP) visit itineraries, and approve monthly tour plans submitted by your medical representatives."}
          </p>
        </div>
        
        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button onClick={() => setCrossTeam(!crossTeam)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm font-semibold border border-slate-200 dark:border-slate-800" type="button">
            <Users size={16} className="text-slate-500 dark:text-slate-400" />
            <span>{crossTeam ? "Showing: Cross-Team" : "Show Cross-Team"}</span>
          </button>
          <button onClick={() => setRevokePickerOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm font-semibold border border-slate-200 dark:border-slate-800" type="button" title="Revoke an approved Tour Plan">
            <RotateCcw size={16} className="text-slate-500 dark:text-slate-400" />
            <span>Revoke / Reassign</span>
          </button>
          <button onClick={load} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm border border-slate-200 dark:border-slate-800" title="Refresh records" type="button">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => batchApprove(visiblePendingIds)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-[0.99] text-sm font-semibold disabled:opacity-50" type="button" disabled={acting || visiblePendingIds.length === 0}>
            <Check size={16} />
            <span>Batch Approve Plans ({visiblePendingIds.length})</span>
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</p>}
      {batchResult && (
        <p className="text-sm font-medium text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-3">
          <span>{batchResult}</span>
          <button onClick={() => setBatchResult(null)} className="text-emerald-500 hover:text-emerald-700 shrink-0" type="button"><X size={14} /></button>
        </p>
      )}

      {/* 2. Operational KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Pending Review */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-amber-500/10 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Review</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Action Required
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">plans</span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-emerald-500/10 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              <CheckCircle size={12} className="text-emerald-600" />
              On Schedule
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">plans</span>
          </div>
        </div>

        {/* Card 3: Voided / Reassigned */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Voided / Reassigned</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
              <History size={12} />
              Audit Logged
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{voidedCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">plans</span>
          </div>
        </div>

        {/* Card 4: Planned Coverage Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Planned Coverage</span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-semibold">
              +2.4% vs tgt
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">96.8%</span>
          </div>
          <div className="w-full flex flex-col gap-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: "96.8%" }}></div>
            </div>
          </div>
        </div>

        {/* Card 5: Active Field Reps */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Field Reps</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              100% Deployed
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">14</span>
            <span className="text-lg text-slate-400 font-normal">/ 14</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Action Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-50 dark:bg-slate-900 dark:bg-slate-800">
          <button
            onClick={() => setTab("all")}
            className={tab === "all"
              ? "px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 dark:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 dark:border-slate-600"
              : "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:hover:text-slate-200 transition-colors"}
            type="button"
          >
            All Plans ({allTabCount})
          </button>
          <button
            onClick={() => setTab("pending")}
            className={tab === "pending"
              ? "px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 dark:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 dark:border-slate-600"
              : "px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Pending Review ({pendingTabCount})</span>
          </button>
        </div>
        
        {/* Search & Dropdown Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[260px] flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" placeholder="Search TP ID, Rep name, MR code..." type="text"/>
          </div>
          
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="pl-3 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 text-sm font-medium outline-none cursor-pointer">
            <option value="">All Months</option>
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={repFilter} onChange={e => setRepFilter(e.target.value)} className="pl-3 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 text-sm font-medium outline-none cursor-pointer">
            <option value="">All Reps</option>
            {repOptions.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>

          <button onClick={() => exportCsv(filteredTps)} disabled={filteredTps.length === 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-200 transition-colors text-sm font-medium disabled:opacity-50" type="button">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4. Comprehensive Tour Plans Data Table Module */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className=" dark:bg-slate-800 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 w-12 text-center">
                  <input className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" type="checkbox"/>
                </th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">TP ID</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Medical Representative</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Month</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Target Locations</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Manager (ABM)</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Status</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Reason / Notes</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200 text-sm font-medium">
              {filteredTps.map(tp => {
                const sc = STATUS_COLORS[tp.status] ?? STATUS_COLORS.DRAFT;
                const isMine = !myEmployeeCode || tp.assignedManager === myEmployeeCode;
                const canApprove = tp.status === "SUBMITTED" && isMine;
                const canVoid = tp.status !== "VOIDED";
                
                return (
                  <tr key={tp.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 dark:hover:bg-slate-800/40 transition-colors ${tp.status === 'SUBMITTED' ? 'bg-amber-50/20 border-l-4 border-l-amber-400' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <input className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer" type="checkbox"/>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-slate-900 dark:text-white dark:text-slate-200 border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                        <span>{tp.tpId}</span>
                        <button onClick={() => copyTpId(tp.tpId)} className="text-slate-400 hover:text-emerald-600 transition-colors" title={copiedId === tp.tpId ? "Copied!" : "Copy TP ID"} type="button">
                          <Copy size={12} className={copiedId === tp.tpId ? "text-emerald-600" : ""} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                          {tp.employeeName ? tp.employeeName.substring(0, 2).toUpperCase() : "EM"}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white">{tp.employeeName ?? tp.employeeCode}</span>
                            {tp.employeeName && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium">{tp.employeeCode}</span>}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Field Representative</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                        {tp.month}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-900 dark:text-white font-semibold">{tp.locations.length} location(s)</span>
                        <div className="flex flex-wrap gap-1">
                          {tp.locations.slice(0, 3).map((loc, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] border border-slate-200 dark:border-slate-800 dark:border-slate-700 truncate max-w-[120px]">{loc.town}</span>
                          ))}
                          {tp.locations.length > 3 && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] border border-slate-200 dark:border-slate-800 dark:border-slate-700">+{tp.locations.length - 3}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{tp.assignedManagerName ?? tp.assignedManager}</span>
                        {tp.assignedManagerName && <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{tp.assignedManager}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${sc.bg} ${sc.color} text-[11px] font-bold tracking-wide border dark:bg-opacity-20`}>
                        {sc.icon}
                        {tp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {tp.status === "VOIDED" && `Voided by ${tp.voidedByName ?? tp.voidedBy}: ${tp.voidReason}${tp.reassignedToTpId ? ` → ${tp.reassignedToTpId}` : ""}`}
                        {tp.parentTpId && `Reassigned from ${tp.parentTpId}`}
                        {!tp.parentTpId && tp.status !== "VOIDED" && "—"}
                      </p>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {canApprove && (
                          <>
                            <button disabled={acting} onClick={() => approve(tp.tpId)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1" type="button">
                              <Check size={14} /> Approve
                            </button>
                            <button disabled={acting} onClick={() => { setActionTarget({ tp, kind: "reject" }); setReason(""); }} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 transition-colors text-xs font-bold disabled:opacity-50" type="button">
                              Decline
                            </button>
                          </>
                        )}
                        {canVoid && !canApprove && (
                          <>
                            <button disabled={acting} onClick={() => { setActionTarget({ tp, kind: "void" }); setReason(""); }} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center transition-colors disabled:opacity-50" title="Void" type="button">
                              <Ban size={16} />
                            </button>
                            <button disabled={acting} onClick={() => { setActionTarget({ tp, kind: "reassign" }); setReason(""); setTargetManager(""); }} className="w-8 h-8 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center transition-colors disabled:opacity-50" title="Void & Reassign" type="button">
                              <Repeat size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setDetailsTarget(tp)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors" title="More Options" type="button">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredTps.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={24} className="mb-2 opacity-50" />
                      <p>No Tour Plans found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tour Plan Details Modal (opened from row "More Options") */}
      {detailsTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{detailsTarget.tpId}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detailsTarget.employeeName ?? detailsTarget.employeeCode} — {detailsTarget.month}</p>
              </div>
              <button onClick={() => setDetailsTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" type="button">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className="font-semibold text-slate-900 dark:text-white">{detailsTarget.status}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Assigned Manager</span>
                <span className="font-semibold text-slate-900 dark:text-white">{detailsTarget.assignedManagerName ?? detailsTarget.assignedManager}</span>
              </div>
              {detailsTarget.parentTpId && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Reassigned from</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{detailsTarget.parentTpId}</span>
                </div>
              )}
              {detailsTarget.status === "VOIDED" && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Voided by {detailsTarget.voidedByName ?? detailsTarget.voidedBy}</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{detailsTarget.voidReason}</p>
                  {detailsTarget.reassignedToTpId && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">→ Reassigned to {detailsTarget.reassignedToTpId}</p>}
                </div>
              )}
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1.5">Target Locations ({detailsTarget.locations.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailsTarget.locations.map((loc, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">{loc.town}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setDetailsTarget(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition" type="button">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Picker Modal */}
      {revokePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Revoke a Tour Plan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Pick an approved Tour Plan to revoke. This voids it — the MR will need a fresh plan approved to resume tour coverage.
            </p>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {tps.filter(tp => tp.status === "APPROVED").length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">No approved Tour Plans available to revoke.</p>
              )}
              {tps.filter(tp => tp.status === "APPROVED").map(tp => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => { setActionTarget({ tp, kind: "revoke" }); setReason(""); setRevokePickerOpen(false); }}
                  className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-800 transition-colors text-left group"
                >
                  <div className="flex flex-col">
                    <strong className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{tp.tpId}</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{tp.employeeName ?? tp.employeeCode} — {tp.month}</span>
                  </div>
                  <RotateCcw size={16} className="text-slate-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setRevokePickerOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition" type="button">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Target Modal */}
      {actionTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {actionTarget.kind === "void" && `Void ${actionTarget.tp.tpId}`}
              {actionTarget.kind === "revoke" && `Revoke ${actionTarget.tp.tpId}`}
              {actionTarget.kind === "reassign" && `Void & Reassign ${actionTarget.tp.tpId}`}
              {actionTarget.kind === "reject" && `Reject ${actionTarget.tp.tpId}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-800 dark:border-slate-700">
              <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-200">{actionTarget.tp.employeeName ?? actionTarget.tp.employeeCode} — {actionTarget.tp.month}</strong>
              {actionTarget.kind === "reassign" && <span className="block mt-1">A brand-new Tour Plan will be created under the manager you pick below, linked back to this one.</span>}
            </p>
            
            <div className="space-y-4">
              {actionTarget.kind === "reassign" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reassign to <span className="text-rose-500">*</span></label>
                  <select value={targetManager} onChange={e => setTargetManager(e.target.value)} className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white outline-none">
                    <option value="">Select manager…</option>
                    {managers.map(m => (
                      <option key={m.employeeCode} value={m.employeeCode}>
                        {m.name} ({m.employeeCode}){m.designation ? ` — ${m.designation}` : ""}
                      </option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> No other active managers found in this tenant yet.</p>
                  )}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason {actionTarget.kind !== "reject" && <span className="text-rose-500">*</span>}</label>
                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain the reason..." className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white outline-none resize-none" />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setActionTarget(null); setReason(""); setTargetManager(""); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition" type="button">Cancel</button>
              <button
                onClick={runAction}
                disabled={acting || (actionTarget.kind !== "reject" && !reason.trim()) || (actionTarget.kind === "reassign" && !targetManager)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
                  actionTarget.kind === "reassign" ? "bg-purple-600 hover:bg-purple-700" : "bg-rose-500 hover:bg-rose-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                type="button"
              >
                {actionTarget.kind === "reassign" ? <Repeat size={16} /> : <X size={16} />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
