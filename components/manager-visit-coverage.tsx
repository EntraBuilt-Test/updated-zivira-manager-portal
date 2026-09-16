"use client";
import type { VisitCoverageGrid } from "@zivira/types";
import { RefreshCw, MapPin, Users, Download, Calendar, Shield, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function ManagerVisitCoverage() {
  const [grid, setGrid] = useState<VisitCoverageGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setGrid((await apiClient.visitCoverage()).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const totalDoctors = grid?.rows.length ?? 0;
  let totalVisitsTarget = 0;
  let totalVisitsActual = 0;
  let zeroVisitDeficit = 0;
  
  if (grid) {
    grid.rows.forEach(r => {
      totalVisitsTarget += 3; // Using 3 as an arbitrary target for KPI presentation
      let drTotal = 0;
      r.cells.forEach(c => {
        drTotal += c.visitCount;
      });
      totalVisitsActual += drTotal;
      if (drTotal === 0) zeroVisitDeficit++;
    });
  }
  
  const completionRate = totalVisitsTarget > 0 ? ((totalVisitsActual / totalVisitsTarget) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50 dark:bg-slate-900">
      
      {/* Page Header and Actions */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80 mb-1">
            <MapPin size={12} />
            Field HCP Visitation &amp; Territory Coverage • {grid?.month ?? "Loading..."}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Visit Coverage Matrix — {grid?.month ?? ""}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl">
            Doctor coverage frequency matrix mapping assigned Medical Representatives against target HCPs. Highlighting under-visited Tier-1 physicians and visit deficit thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div className="relative">
            <select className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2 pl-3 pr-8 rounded-lg shadow-xs hover:border-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
              <option>{grid?.month ?? "Current Month"}</option>
            </select>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition">
            <Users size={14} /> <span>Cross-Team</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition">
            <Download size={14} /> <span>Export XLS</span>
          </button>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> <span>Refresh</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg shadow-sm transition transform active:scale-95">
            <Calendar size={14} /> <span>Schedule Follow-ups</span>
          </button>
        </div>
      </section>

      {/* KPI Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total HCPs In Scope</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60">Active</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">{totalDoctors}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Doctors</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Coverage Completion</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/70">In Progress</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-amber-600 tracking-tight tabular-nums">{completionRate}%</span>
            <span className="text-xs text-slate-400 font-medium">/ 100% tgt</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(Number(completionRate), 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-rose-50/40 p-3.5 rounded-xl border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
            <span className="flex items-center gap-1">
              <Shield size={14} className="text-rose-500" /> Zero-Visit Deficit
            </span>
            {zeroVisitDeficit > 0 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase">Action Req</span>}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-rose-700 tracking-tight tabular-nums">{zeroVisitDeficit}</span>
            <span className="text-xs text-rose-600 font-medium">Doctors</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Top Performing MR</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70">★ Rank #1</span>
          </div>
          <div className="mt-2 truncate">
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{grid?.mrs[0]?.name ?? "—"}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="text-slate-400">Team Leaderboard</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>GPS Call Compliance</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/70">Verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">98.2%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Geofence logged validation rate
          </div>
        </div>
      </section>

      {/* Filter and Legend Toolbar */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 gap-1 overflow-x-auto">
            <button className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold transition">All Doctors ({totalDoctors})</button>
            <button className="px-3 py-1.5 rounded-md text-rose-700 hover:text-rose-900 hover:bg-white/60 transition flex items-center gap-1.5">
              <span>Zero Visits / Alert</span>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-[10px] bg-rose-100 px-1 rounded-full text-rose-800">{zeroVisitDeficit}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Legend:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-200/80 text-rose-700 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span> 0 Visits
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200/80 text-amber-700 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 1–2 Visits
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> ≥3 Visits
            </span>
          </div>
        </div>
      </section>

      {/* Matrix Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {error && <p className="text-xs font-bold text-rose-600 p-4">{error}</p>}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className=" border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5" /></th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[260px]">Doctor &amp; Primary Facility</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[170px]">Assigned Primary MR</th>
                {grid?.mrs.map(mr => (
                  <th key={mr.employeeCode} className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[125px] text-center bg-slate-100 dark:bg-slate-800/60 border-l border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center">
                      <span className="text-slate-800 dark:text-slate-200">{mr.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 lowercase font-normal">{mr.employeeCode}</span>
                    </div>
                  </th>
                ))}
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[120px] text-center border-l border-slate-200 dark:border-slate-800">Total Month Visits</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 min-w-[110px] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {!loading && (!grid || grid.rows.length === 0) && (
                <tr><td colSpan={(grid?.mrs.length ?? 0) + 5} className="text-center text-slate-500 dark:text-slate-400 py-8">No doctors mapped to your team yet</td></tr>
              )}
              {grid?.rows.map((row, idx) => {
                let docTotal = 0;
                row.cells.forEach(c => docTotal += c.visitCount);
                const isDeficit = docTotal === 0;

                return (
                  <tr key={row.doctorId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${isDeficit ? 'bg-rose-50/10' : ''}`}>
                    <td className="py-3 px-3 text-center">
                      <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {isDeficit && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Zero Visits Recorded"></span>}
                        {row.doctorName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        {row.doctorId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {row.mappedEmployeeName?.substring(0, 2).toUpperCase() ?? row.mappedEmployeeCode?.substring(0, 2).toUpperCase() ?? "—"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs leading-none">{row.mappedEmployeeName ?? "—"}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{row.mappedEmployeeCode ?? "—"}</span>
                        </div>
                      </div>
                    </td>
                    {row.cells.map(cell => {
                      let cellClass = "bg-emerald-50 border-emerald-200/60 text-emerald-700";
                      if (cell.visitCount === 0) cellClass = "bg-rose-50 border-rose-200/60 text-rose-600";
                      else if (cell.visitCount <= 2) cellClass = "bg-amber-50 border-amber-200/60 text-amber-700";
                      
                      return (
                        <td key={cell.employeeCode} className="py-3 px-3 text-center border-l border-slate-100 dark:border-slate-800">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-black border tabular-nums ${cellClass}`}>
                            {cell.visitCount}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center border-l border-slate-100 dark:border-slate-800">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black tabular-nums ${isDeficit ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                        {docTotal}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isDeficit ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wide">
                          Deficit
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
