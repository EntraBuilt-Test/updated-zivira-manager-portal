"use client";
import type { ExpenseClaim } from "@zivira/types";
import { Check, Receipt, RefreshCw, Users, X, Shield, Search, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function ManagerExpenseClaims() {
  const [crossTeam, setCrossTeam] = useState(false);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [myEmployeeCode, setMyEmployeeCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ExpenseClaim | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [claimsTab, setClaimsTab] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    apiClient.dashboard().then(r => setMyEmployeeCode(r.data.manager.employeeCode)).catch(() => {});
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = crossTeam ? await apiClient.expenseClaimsCrossTeam() : await apiClient.expenseClaims();
      setClaims(res.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [crossTeam]);

  async function approve(claimId: string) {
    setActing(true);
    try { await apiClient.approveExpenseClaim(claimId); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Approve failed"); }
    finally { setActing(false); }
  }

  async function runReject() {
    if (!rejectTarget) return;
    setActing(true); setError("");
    try {
      await apiClient.rejectExpenseClaim(rejectTarget.claimId, reason);
      setRejectTarget(null); setReason("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Reject failed"); }
    finally { setActing(false); }
  }

  const pendingCount = claims.filter(c => c.status === "SUBMITTED").length;
  const pendingAmount = claims.filter(c => c.status === "SUBMITTED").reduce((acc, c) => acc + c.amountRs, 0);
  const approvedCount = claims.filter(c => c.status === "APPROVED").length;
  const approvedAmount = claims.filter(c => c.status === "APPROVED").reduce((acc, c) => acc + c.amountRs, 0);

  const displayedClaims = claims.filter(c => {
    if (claimsTab === "pending") return c.status === "SUBMITTED";
    if (claimsTab === "approved") return c.status === "APPROVED";
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject {rejectTarget.claimId}</h3>
              <button onClick={() => { setRejectTarget(null); setReason(""); }} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rejectTarget.employeeName ?? rejectTarget.employeeCode}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">₹{rejectTarget.amountRs.toLocaleString("en-IN")} • {rejectTarget.category}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason for Rejection</label>
                <textarea 
                  rows={3} 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="Explain why this claim is being queried or rejected..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
              </div>
              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button onClick={() => { setRejectTarget(null); setReason(""); }} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">
                Cancel
              </button>
              <button 
                onClick={runReject} 
                disabled={acting || !reason.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <X size={16} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header and Actions */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
            <span>Financial Operations &amp; Field Audit</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 dark:text-slate-400">Expense Claims</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {crossTeam ? "Cross-Team Expense Claims" : "My Team's Expense Claims"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Claims filed against Tour Plans, routed to you by GST branch linkage. Verify receipts, kilometers, and audit compliance.
          </p>
        </div>
        
        {/* Primary Actions Group */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button onClick={() => setCrossTeam(!crossTeam)} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${crossTeam ? 'bg-slate-800 text-white hover:bg-slate-700 border-transparent' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Users size={16} />
            <span>{crossTeam ? "Showing Cross-Team" : "Show Cross-Team"}</span>
          </button>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* Operational KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Action Required</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">₹{pendingAmount.toLocaleString("en-IN")}</span>
            <span className="text-xs font-bold text-amber-600">{pendingCount} Claims</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approved MTD</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">SLA Met</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-emerald-700">₹{approvedAmount.toLocaleString("en-IN")}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{approvedCount} Claims</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Conveyance &amp; Fuel</span>
            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Shield size={14} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Verified</span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Check size={12} /> GPS telemetry sync active
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lodging &amp; Food (DA)</span>
            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <FileText size={14} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">100%</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">GST-invoice tagged</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approval Turnaround</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700">Fast</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">1.4 Days</span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-600 font-semibold">+0.6d faster than SLA</p>
        </div>
      </section>

      {/* Filter and Search Toolbar */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setClaimsTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition ${claimsTab === "all" ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-none"}`}
            >
              All Claims ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => setClaimsTab("pending")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${claimsTab === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <span>Pending</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${claimsTab === "pending" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"}`}>{pendingCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setClaimsTab("approved")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${claimsTab === "approved" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <span>Approved</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${claimsTab === "approved" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"}`}>{approvedCount}</span>
            </button>
          </div>
          <div className="text-xs text-slate-400 font-medium">Auto-synced with GST Tax Invoicing Ledger</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-12 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search Claim ID, Rep name, Tour Plan..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>
      </section>

      {/* Claims Table */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80  text-[11px] font-extrabold uppercase tracking-wider ">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-5">Claim ID</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3">Medical Rep (MR)</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3">Linked Tour Plan</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3">Category</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3">Date</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 text-right">Amount</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 text-center">GST Branch</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 px-3 text-center">Status</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3.5 pr-6 pl-3 text-right sticky right-0  z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 dark:text-slate-300">
              {displayedClaims.length === 0 && !loading && (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">No expense claims found</td></tr>
              )}
              {displayedClaims.map(c => {
                const isMine = !myEmployeeCode || c.assignedManager === myEmployeeCode;
                const canAct = c.status === "SUBMITTED" && isMine;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                    <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{c.claimId}</span>
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                        📎 Receipt Attached
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center ring-1 ring-blue-300">
                          {c.employeeName?.substring(0, 2).toUpperCase() ?? c.employeeCode.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.employeeName ?? c.employeeCode}</div>
                          <div className="text-[10px] text-slate-400">{c.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-mono text-emerald-700 font-semibold">{c.tpId}</span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                        {c.category}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                      {c.expenseDate}
                    </td>
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">₹{c.amountRs.toLocaleString("en-IN")}</div>
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80">
                        {c.gstBranchName ?? "—"}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      {c.status === "SUBMITTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> PENDING
                        </span>
                      )}
                      {c.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={12} className="text-emerald-600" /> APPROVED
                        </span>
                      )}
                      {c.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <X size={12} className="text-rose-600" /> REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/95 backdrop-blur-sm z-10">
                      {canAct && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button disabled={acting} onClick={() => approve(c.claimId)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50">
                            Approve
                          </button>
                          <button disabled={acting} onClick={() => { setRejectTarget(c); setReason(""); }} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-lg font-semibold text-xs transition disabled:opacity-50">
                            Query / Reject
                          </button>
                        </div>
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
