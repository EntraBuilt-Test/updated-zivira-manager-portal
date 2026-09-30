"use client";

// Phase 6 — real team Attendance/Checkout status screen, replacing the
// unwired ModulePlaceholder that used to sit here. Reads the exact
// AttendanceModel-backed data Phase 2 built for the field rep's own
// checkout gate (GET /manager/team-checkout-status), scoped to this
// manager's reports the same way every other manager screen already is.

import { ClipboardCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, type ManagerTeamCheckoutStatus } from "@/lib/api-client";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function ManagerAttendance() {
  const [rows, setRows] = useState<ManagerTeamCheckoutStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setRows((await apiClient.teamCheckoutStatus()).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => rows.filter(r =>
    !search ||
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.employeeCode.toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  const openPriorCount = rows.filter(r => r.hasOpenPriorDay).length;
  const checkedInCount = rows.filter(r => r.checkedInToday).length;
  const checkedOutCount = rows.filter(r => r.checkedOutToday).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-900">
      {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</p>}

      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200/80 text-sky-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ClipboardCheck size={12} className="text-sky-600" />
            <span>Team Attendance</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Checkout Status</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Who&apos;s checked in, who has an unresolved open day from before, and who&apos;s fully checked out for today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or code"
              className="pl-8 pr-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw size={14} className={loading ? "animate-spin text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Checked In Today</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{checkedInCount} <span className="text-sm text-slate-400 font-semibold">/ {rows.length}</span></p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Checked Out Today</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">{checkedOutCount} <span className="text-sm text-slate-400 font-semibold">/ {rows.length}</span></p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Open Prior Day</p>
          <p className={`text-2xl font-bold mt-1 ${openPriorCount > 0 ? "text-rose-600" : "text-slate-700 dark:text-slate-200"}`}>{openPriorCount}</p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">No team members found.</td></tr>
              )}
              {!loading && filtered.map(r => (
                <tr key={r.employeeCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{r.employeeName}</p>
                    <p className="text-[11px] text-slate-400">{r.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.checkedInToday ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs"><CheckCircle2 size={14} /> {fmtTime(r.checkInAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold text-xs"><XCircle size={14} /> Not checked in</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.checkedOutToday ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs"><CheckCircle2 size={14} /> {fmtTime(r.checkOutAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold text-xs"><XCircle size={14} /> Not checked out</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.hasOpenPriorDay ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                        <AlertTriangle size={12} /> Open since {r.openPriorDay}
                      </span>
                    ) : r.checkedOutToday ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">Fully closed out</span>
                    ) : r.checkedInToday ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">In progress</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] font-bold">Not started</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
