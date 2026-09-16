"use client";

import type { EmployeeComplianceRow, ComplianceSummary, PayrollStatusRecord, PayrollSummary } from "@zivira/types";
import { AlertTriangle, Check, IndianRupee, RefreshCw, X, Shield, Bell, Download, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function ManagerCompliance() {
  const [rows, setRows] = useState<EmployeeComplianceRow[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollStatusRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [c, p] = await Promise.all([apiClient.compliance(), apiClient.payroll()]);
      setRows(c.data);
      setSummary(c.summary);
      setPayrollRows(p.data);
      setPayrollSummary(p.summary);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    setActingId(id); setError("");
    try { await apiClient.approvePayroll(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Approval failed"); }
    finally { setActingId(null); }
  }

  async function reject() {
    if (!rejectId) return;
    setActingId(rejectId); setError("");
    try { await apiClient.rejectPayroll(rejectId, rejectReason); setRejectId(null); setRejectReason(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Rejection failed"); }
    finally { setActingId(null); }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-900">
      {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</p>}
      
      {/* Reject Modal for Payroll */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Back for More Detail</h3>
              <button onClick={() => setRejectId(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason for Rejection</label>
                <textarea 
                  rows={3} 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                  placeholder="What's missing from the explanation?"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">
                Cancel
              </button>
              <button 
                onClick={reject} 
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <X size={16} /> Send Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE SECTION */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Shield size={12} className="text-teal-600" />
            <span>Compliance &amp; Field Governance</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team DCR Compliance</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Submission compliance and chronic-defaulter detection for your team — working days exclude Sundays. Auto-escalated salary holds &amp; warning notices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="relative">
            <select className="pl-3 pr-8 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none">
              <option>Current Cycle</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <Download size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw size={14} className={loading ? "animate-spin text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition">
            <Bell size={14} />
            <span>Notify All Defaulters</span>
          </button>
        </div>
      </section>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submitted Today</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">DCRs</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.submittedToday}</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="text-teal-600 font-medium">Daily Target</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending DCR</span>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.pendingDCR}</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="text-amber-700 font-medium">Due by 23:59 IST</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Missed Yesterday</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Alert</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.missedYesterday}</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="text-rose-600 font-medium">Non-submission flag</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200/90 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-14 h-14 bg-rose-50 rounded-full pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chronic Defaulters</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-rose-600 tracking-tight">{summary.chronicDefaulters}</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700 font-medium">
              <span>Salary Hold risk</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg. Compliance %</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Target: 85%</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{summary.avgCompliancePercent}%</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-1.5 rounded-full ${summary.avgCompliancePercent < 50 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${summary.avgCompliancePercent}%` }}></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Compliance Filters */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
            All MRs ({rows.length})
          </button>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[220px]">
            <input className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="Search MR name, code..." type="text" />
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Data Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className=" border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider ">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 w-10 text-center"><input className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5" type="checkbox" /></th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[220px]">Employee</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Role</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Today</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Missed Wk</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Missed Mo</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 text-center">Compliance %</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Missed (30D)</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Warning</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3 text-center">Salary Hold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map(r => {
                const wc = r.warningLevel === 'HIGH' ? { bg: 'bg-rose-50 text-rose-700 border-rose-200' } :
                           r.warningLevel === 'MEDIUM' ? { bg: 'bg-amber-50 text-amber-700 border-amber-200' } :
                           r.warningLevel === 'LOW' ? { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' } : { bg: 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' };
                
                return (
                  <tr key={r.employeeCode} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group ${r.chronicDefaulter ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-3.5 px-3 text-center"><input className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5" type="checkbox" /></td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${r.chronicDefaulter ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:border-teal-400 border border-slate-200 dark:border-slate-800'}`}>
                          {r.employeeName?.substring(0,2).toUpperCase() ?? r.employeeCode.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">
                            {r.employeeName ?? r.employeeCode}
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1">({r.employeeCode})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">{r.role ?? "—"}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {r.submittedToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                          Submitted
                        </span>
                      ) : r.pendingDCR ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-bold text-xs px-2 py-0.5 rounded ${r.missedThisWeek > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-700 dark:text-slate-300'}`}>{r.missedThisWeek}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{r.missedThisMonth}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1 max-w-[90px] mx-auto">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{r.compliancePercent}%</span>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${r.compliancePercent < 50 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${r.compliancePercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.missedLast30Days}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {r.warningLevel !== 'NONE' ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${wc.bg}`}>
                          {r.chronicDefaulter && <AlertTriangle size={12} />}
                          {r.warningLevel}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">NONE</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {r.salaryHold ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Hold
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={10} className="text-center text-slate-500 dark:text-slate-400 py-8">No team members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAYROLL SECTION */}
      <div className="mt-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-[11px] font-bold uppercase tracking-wider mb-2">
          <IndianRupee size={12} className="text-indigo-600" />
          <span>Payroll Workflow Engine</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Payroll Status</h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Approve a submitted explanation to release payroll, or send it back for more detail.
        </p>
      </div>

      {payrollSummary && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200/90 p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-14 h-14 bg-rose-50 rounded-full pointer-events-none"></div>
            <div className="text-xs font-semibold text-rose-700">On Hold</div>
            <div className="mt-2 text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{payrollSummary.onHold}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200/90 p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-14 h-14 bg-amber-50 rounded-full pointer-events-none"></div>
            <div className="text-xs font-semibold text-amber-700">Pending My Approval</div>
            <div className="mt-2 text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{payrollSummary.pendingApproval}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/90 p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-14 h-14 bg-emerald-50 rounded-full pointer-events-none"></div>
            <div className="text-xs font-semibold text-emerald-700">Released</div>
            <div className="mt-2 text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{payrollSummary.released}</div>
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className=" border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider ">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Employee</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Hold Reason</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4">Employee Explanation</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-3">Status</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payrollRows.map(p => {
                const s = p.status;
                const statusPill = s === "RELEASED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                   s === "HOLD" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                   "bg-amber-50 text-amber-700 border-amber-200";

                return (
                  <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${s === 'HOLD' ? 'bg-rose-50/20' : ''}`}>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.employeeName ?? p.employeeCode}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">({p.employeeCode})</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 max-w-[220px] font-medium">{p.holdReason ?? "—"}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 max-w-[220px] font-medium">{p.employeeExplanation ?? "—"}</td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${statusPill}`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {s === "EXPLANATION_SUBMITTED" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button disabled={actingId === p.id} onClick={() => approve(p.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50">
                            <Check size={14} /> Approve &amp; Release
                          </button>
                          <button disabled={actingId === p.id} onClick={() => { setRejectId(p.id); setRejectReason(""); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs transition disabled:opacity-50">
                            <X size={14} /> Send Back
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && payrollRows.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">No payroll records for this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
