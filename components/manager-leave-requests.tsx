"use client";
import type { LeaveApplication } from "@zivira/types";
import { Check, RefreshCw, X, Calendar, Download, CheckCircle2, Shield, Search, Briefcase, Stethoscope, Home, UserCheck, Users, Eye, MoreVertical, PartyPopper } from "lucide-react";
import { useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string; icon: ReactNode; badgeBg: string }> = {
  PENDING:  { bg: "bg-amber-50/25", color: "text-amber-900", border: "border-l-4 border-l-amber-500", icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />, badgeBg: "bg-amber-100 border-amber-300" },
  APPROVED: { bg: "", color: "text-emerald-800", border: "", icon: <Check size={12} className="stroke-[3]" />, badgeBg: "bg-emerald-100/80 border-emerald-200" },
  REJECTED: { bg: "", color: "text-rose-800", border: "", icon: <X size={12} className="stroke-[3]" />, badgeBg: "bg-rose-100/80 border-rose-200" }
};

const LEAVE_TYPE_ICONS: Record<string, { icon: ReactNode; bg: string; text: string }> = {
  "Personal Work": { icon: <Briefcase size={12} />, bg: "bg-slate-100", text: "text-slate-800" },
  "Medical Appointment": { icon: <Stethoscope size={12} />, bg: "bg-blue-50 border border-blue-200/50", text: "text-blue-800" },
  "Casual Leave": { icon: <PartyPopper size={12} />, bg: "bg-purple-50 border border-purple-200/50", text: "text-purple-800" },
  "Sick Leave": { icon: <Stethoscope size={12} />, bg: "bg-rose-50 border border-rose-200/50", text: "text-rose-800" },
};

function getLeaveIcon(type: string) {
  const t = LEAVE_TYPE_ICONS[type];
  if (t) return t;
  return { icon: <Home size={12} />, bg: "bg-slate-100", text: "text-slate-800" };
}

function formatDateFull(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ManagerLeaveRequests() {
  const [rows, setRows] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try { setRows((await apiClient.leaveApplications()).data); }
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
    try { await apiClient.approveLeave(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Approval failed"); }
    finally { setActing(null); }
  }

  async function reject() {
    if (!rejectId) return;
    setActing(rejectId);
    try { await apiClient.rejectLeave(rejectId, rejectReason); setRejectId(null); setRejectReason(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Rejection failed"); }
    finally { setActing(null); }
  }

  const pendingCount = rows.filter(r => r.status === "PENDING").length;
  const approvedCount = rows.filter(r => r.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 bg-emerald-100/70 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-0.5 rounded-md">
              Team Activity & Workforce Attendance
            </span>
            <span className="text-xs text-slate-400 font-medium">· Real-time leave roster</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Leave Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-normal">
            Review, approve, and track field leave applications submitted by your Medical Representatives. Maintain coverage across assigned hospital HCP territories.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs" type="button">
            <Calendar size={16} className="text-slate-500" />
            <span>This Month</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs" type="button">
            <Download size={14} className="text-slate-500" />
            <span>Export Schedule</span>
          </button>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs" type="button">
            <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20" type="button">
            <Check size={16} />
            <span>Batch Approve ({pendingCount})</span>
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</p>}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Reject Leave Request</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason (optional)</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain the reason for rejection" className="w-full text-sm p-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-emerald-500" />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition" type="button">Cancel</button>
              <button onClick={reject} type="button" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all">
                <X size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KeyMetricsSummaryStrip */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Pending Review</span>
            <span className="flex h-6 px-2 items-center rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Action Needed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</span>
            <span className="text-xs text-slate-500 font-medium">submissions</span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 font-medium mt-1">Check territory backup</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">requests</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Roster balanced</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">On Leave Today</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">0</span>
            <span className="text-xs text-slate-600 font-medium">Reps</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate font-medium mt-1">All active today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">+1.8%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">98%</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Target: &gt;90%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Coverage</span>
            <Shield size={16} className="text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400">Optimal</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Zero Tier-1 doctors skipped</p>
        </div>
      </section>

      {/* FilterAndSearchToolbar */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs whitespace-nowrap">
            All Requests ({rows.length})
          </button>
          <button className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-100/70 transition-all whitespace-nowrap inline-flex items-center gap-2">
            <span>Pending Review</span>
          </button>
        </div>
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder:text-slate-400 transition-all text-slate-900 dark:text-white" placeholder="Search Rep name, MR-code, or reason..." type="text" />
          </div>
          <select className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all">
            <option>All Leave Types</option>
            <option>Personal Work</option>
            <option>Medical Appointment</option>
          </select>
        </div>
      </section>

      {/* LeaveRequestsDataTableContainer */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold tracking-wider uppercase select-none">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 pl-4 pr-2 w-10 text-center"><input className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" type="checkbox" /></th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-2 w-10 text-center">S.NO</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 min-w-[170px]">EMPLOYEE / CODE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 min-w-[170px]">REASON & CATEGORY</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 min-w-[190px]">SCHEDULE TIMELINE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-2 text-center w-14">DAYS</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 text-center min-w-[120px]">STATUS</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 pr-4 pl-2 text-right min-w-[130px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium">
              {rows.map((row, i) => {
                const sc = STATUS_COLORS[row.status] ?? STATUS_COLORS.PENDING;
                const canAct = row.status === "PENDING";
                const ltIcon = getLeaveIcon(row.leaveType);
                return (
                  <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group ${sc.bg} ${sc.border}`}>
                    <td className="py-3.5 pl-4 pr-2 text-center"><input className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" type="checkbox" /></td>
                    <td className="py-3.5 px-2 text-center font-mono text-slate-400 font-semibold">{i + 1}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-xs border border-emerald-200 dark:border-emerald-800">
                          {row.employeeName ? row.employeeName.substring(0, 2).toUpperCase() : "EM"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono tracking-tight text-xs">{row.employeeCode}</span>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">{row.employeeName}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal truncate">Field Representative</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${ltIcon.bg} ${ltIcon.text} text-[11px] font-semibold dark:bg-opacity-20`}>
                            {ltIcon.icon} {row.leaveType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <div className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-white">{formatDateFull(row.fromDate)}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{formatDateFull(row.toDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold font-mono text-xs border border-slate-200 dark:border-slate-700">{row.days}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${sc.badgeBg} ${sc.color} font-bold text-[11px] tracking-wide border dark:bg-opacity-20`}>
                        {sc.icon} {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canAct ? (
                          <>
                            <button disabled={acting === row.id} onClick={() => approve(row.id)} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 shrink-0 disabled:opacity-50" type="button">
                              <Check size={14} /> <span>Approve</span>
                            </button>
                            <button disabled={acting === row.id} onClick={() => { setRejectId(row.id); setRejectReason(""); }} className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 hover:border-rose-300 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-all shrink-0 disabled:opacity-50" type="button">
                              Decline
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="View Details">
                              <Eye size={16} />
                            </button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Options">
                              <MoreVertical size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={24} className="mb-2 opacity-50" />
                      <p>No leave requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
