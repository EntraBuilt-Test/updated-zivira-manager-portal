"use client";
import type { RepAnalysisRow, TeamJointWorkSummary } from "@zivira/types";
import { RefreshCw, Users, Activity, Download, Calendar, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ManagerRepAnalysis() {
  const router = useRouter();
  const [reps, setReps] = useState<RepAnalysisRow[]>([]);
  const [summary, setSummary] = useState<TeamJointWorkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "logged" | "zero">("all");
  const [viewing, setViewing] = useState<RepAnalysisRow | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await apiClient.repManagerAnalysis();
      setReps(r.data);
      setSummary(r.teamSummary);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const totalFieldVisits = reps.reduce((acc, r) => acc + r.totalVisits, 0);

  const visibleReps = reps
    .filter(r => tab === "all" || (tab === "logged" ? r.jointVisits > 0 : r.jointVisitPercent === 0))
    .filter(r => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (r.employeeName ?? "").toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q);
    });
  const loggedCount = reps.filter(r => r.jointVisits > 0).length;
  const zeroCount = reps.filter(r => r.jointVisitPercent === 0).length;

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function exportReport() {
    if (visibleReps.length === 0) return;
    const header = ["Employee Code", "Employee Name", "Doctors Visited", "Total Visits", "Joint Visits", "Joint Visit %"];
    const lines = [header.map(csvCell).join(",")];
    for (const r of visibleReps) {
      lines.push([r.employeeCode, r.employeeName ?? "", r.doctorsVisited, r.totalVisits, r.jointVisits, r.jointVisitPercent].map(csvCell).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rep-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 bg-slate-50 dark:bg-[#0b1120]">
      {/* Page Header & Title Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden" data-purpose="page-title-banner">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-50/50 dark:bg-teal-900/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/50 uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400"></span>
              ANALYTICS & FIELD SUPERVISION • JOINT FIELD WORK
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Rep Coverage & Joint Field Work</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Analyze how much time you&apos;re spending in the field with each representative versus total healthcare provider (HCP) coverage and solo physician visits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={exportReport} disabled={visibleReps.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed" type="button">
              <Download size={14} className="text-slate-500" />
              <span>Export Report</span>
            </button>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition" type="button">
              <RefreshCw size={14} className={loading ? "animate-spin text-slate-600" : "text-slate-600"} />
              <span>Refresh</span>
            </button>
            <button onClick={() => notify("Scheduling joint work isn't available from this page yet — assign an itinerary from Tour Plans instead.")} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/25 transition" type="button">
              <Calendar size={14} />
              <span>Schedule Joint Work</span>
            </button>
          </div>
        </div>
        {notice && <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 relative z-10">{notice}</p>}
        {error && <p className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 relative z-10">{error}</p>}
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Size</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Active</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{summary.teamSize}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reps Assigned</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              <Activity size={12} /> 100% Territory allocation
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Joint Calls</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">Target Deficit</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{summary.totalJointCalls}</span>
              <span className="text-xs font-medium text-slate-400">/ Goal: 10 calls</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1">
              8 calls pending this cycle
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Joint / Rep</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">-80% Bench</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{summary.avgJointCallsPerRep}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Calls / MR</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Min SOP standard: <span className="font-bold text-slate-700 dark:text-slate-300">2.0 / MR</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joint Call %</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/50">Metric</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-teal-700 dark:text-teal-500 tracking-tight">{summary.jointCallPercent}%</span>
              <span className="text-xs font-medium text-slate-400">of total logged</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Joint visits ratio
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Field Visits</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Volume</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalFieldVisits}</span>
              <span className="text-xs font-medium text-slate-400">Total</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              Combined team coverage
            </p>
          </div>
        </section>
      )}

      {/* Filter Bar & Segmented Controls */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setTab("all")} className={tab === "all" ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm" : "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"} type="button">
              All Reps ({reps.length})
            </button>
            <button onClick={() => setTab("logged")} className={tab === "logged" ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm" : "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"} type="button">
              Joint Work Logged ({loggedCount})
            </button>
            <button onClick={() => setTab("zero")} className={tab === "zero" ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm flex items-center gap-1.5" : "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"} type="button">
              <span>Zero Joint Calls</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400">{zeroCount}</span>
            </button>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden md:flex items-center gap-2">
            <span>Displaying {visibleReps.length} of {reps.length} Field Representatives</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-0.5">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all text-slate-800 dark:text-white" placeholder="Search representative name, employee code..." type="text" />
          </div>
        </div>
      </section>

      {/* Main Data Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white  bg-slate-50 dark:bg-slate-900">Representative</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white text-center  bg-slate-50 dark:bg-slate-900">Doctors Visited</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white text-center  bg-slate-50 dark:bg-slate-900">Total Visits</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white text-center  bg-slate-50 dark:bg-slate-900">Joint Visits (With You)</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white text-center  bg-slate-50 dark:bg-slate-900">Joint Visit %</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white text-center  bg-slate-50 dark:bg-slate-900">Supervision Status</th>
                <th className="text-slate-500 dark:text-white py-3.5 px-4 font-bold text-slate-700 dark:text-white  bg-slate-50 dark:bg-slate-900">Last Joint Call</th>
                <th className="text-slate-500 dark:text-white py-3.5 pr-4 pl-2 text-right  bg-slate-50 dark:bg-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!loading && visibleReps.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-500 dark:text-slate-400 py-8">{reps.length === 0 ? "No representatives found" : "No representatives match your search/filter"}</td></tr>
              )}
              {visibleReps.map(r => {
                const noJointWork = r.jointVisitPercent === 0;
                return (
                  <tr key={r.employeeCode} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/75 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full ${noJointWork ? 'bg-indigo-100 text-indigo-700 ring-indigo-200' : 'bg-teal-100 text-teal-800 ring-teal-300/50'} font-bold text-xs flex items-center justify-center ring-1`}>
                          {r.employeeName?.substring(0,2).toUpperCase() ?? r.employeeCode.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors text-sm">{r.employeeName ?? r.employeeCode}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{r.employeeCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold ${noJointWork ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'} text-sm`}>{r.doctorsVisited}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold ${noJointWork ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'} text-sm`}>{r.totalVisits}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {noJointWork ? (
                        <span className="font-semibold text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-800/50">0</span>
                      ) : (
                        <div className="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 text-sm bg-teal-50 dark:bg-teal-900/40 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/50">
                          <span>{r.jointVisits}</span>
                          <Users size={12} />
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold text-xs ${noJointWork ? 'text-slate-400' : 'text-teal-700 dark:text-teal-400'}`}>{r.jointVisitPercent}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${noJointWork ? 'bg-slate-300 dark:bg-slate-600' : 'bg-teal-600 dark:bg-teal-500'}`} style={{ width: `${r.jointVisitPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {noJointWork ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Overdue Tour
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {noJointWork ? (
                        <span className="text-xs text-slate-400 italic">No joint work logged</span>
                      ) : (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recently Logged</div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {noJointWork ? (
                          <button onClick={() => router.push("/manager/tour-plans")} className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition flex items-center gap-1" type="button" title="Assign a joint day from Tour Plans">
                            Plan Day
                          </button>
                        ) : (
                          <button onClick={() => setViewing(r)} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition" type="button">
                            View Log
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strategic Insights & Target Planning */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manager Field Coaching & Joint Work Recommendations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Actionable territory insights calculated from current cycle telemetry</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">High Priority</span>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-3">
            <div className="text-xs text-amber-900 dark:text-amber-400 leading-relaxed">
              <strong className="font-bold">Several reps</strong> currently have zero joint supervisory field days recorded for this cycle. Prioritize field accompaniment to hit your monthly goals.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
              <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">Step 1 · Alignment</div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">Review Tour Plans (MTP)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Confirm scheduled joint route dates in the Tour Plan module.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
              <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">Step 2 · Physician Call</div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">Tier-1 KOL Co-Visiting</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Target top prescription cardiologists and institutional heads.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
              <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">Step 3 · Assessment</div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">Log Rep Performance</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Submit instant detailing scores and feedback via manager portal.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cycle Supervision Target</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Required manager accompaniment</p>
            
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{summary?.totalJointCalls ?? 0} / 10</span>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Completed</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-teal-600 dark:bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(((summary?.totalJointCalls ?? 0) / 10) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span>Active Cycle</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => notify("Auto-generating a joint tour roster isn't available from this page yet — build it from Tour Plans instead.")} className="w-full py-2.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2" type="button">
              <span>Auto-Generate Joint Tour Roster</span>
            </button>
          </div>
        </div>
      </section>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewing.employeeName ?? viewing.employeeCode}</h3>
              <button onClick={() => setViewing(null)} type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none" aria-label="Close">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Employee Code</span><span className="font-mono font-bold text-teal-800 dark:text-teal-400">{viewing.employeeCode}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Doctors Visited</span><span className="font-bold">{viewing.doctorsVisited}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Total Visits</span><span className="font-bold">{viewing.totalVisits}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Joint Visits (With You)</span><span className="font-bold">{viewing.jointVisits}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Joint Visit %</span><span className="font-bold">{viewing.jointVisitPercent}%</span></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
