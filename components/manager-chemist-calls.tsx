"use client";

// Phase 6 — team Chemist Call read/detail view, mirroring the existing
// Team DCRs screen's list+detail pattern, reading the real ChemistCallModel
// records the field rep's Chemist Call screen (Phase 5) saves via
// POST /field/chemist-calls. Read-only: no approve/reject workflow was
// asked for here, only visibility ("the same way they can already see
// team DCRs, at least as a read/detail view").

import { Stethoscope, RefreshCw, Search, X, Pill, Package, CalendarClock, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, type ManagerChemistCall } from "@/lib/api-client";

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d; }
}

export function ManagerChemistCalls() {
  const [calls, setCalls] = useState<ManagerChemistCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try { setCalls((await apiClient.chemistCalls()).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => calls.filter(c =>
    !search ||
    (c.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
    c.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
    (c.chemistName || "").toLowerCase().includes(search.toLowerCase())
  ), [calls, search]);

  const detail = calls.find(c => c.id === detailId) || null;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-900">
      {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</p>}

      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/80 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Stethoscope size={12} className="text-purple-600" />
            <span>Chemist Calls</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Chemist Call Records</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            RCPA, POB, Short Expiry and JCC submitted by your team&apos;s Chemist Call screen — tap a row for the full detail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee or chemist"
              className="pl-8 pr-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw size={14} className={loading ? "animate-spin text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Chemist</th>
                <th className="px-4 py-3">Visit Date</th>
                <th className="px-4 py-3">RCPA</th>
                <th className="px-4 py-3">POB</th>
                <th className="px-4 py-3">Short Expiry</th>
                <th className="px-4 py-3">JCC</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">No Chemist Call records yet.</td></tr>
              )}
              {!loading && filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => setDetailId(c.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{c.employeeName || "—"}</p>
                    <p className="text-[11px] text-slate-400">{c.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{c.chemistName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(c.visitDateOnly)}</td>
                  <td className="px-4 py-3 text-slate-500">{c.rcpa?.length ?? 0} brands</td>
                  <td className="px-4 py-3 text-slate-500">{c.pob?.length ?? 0} items</td>
                  <td className="px-4 py-3 text-slate-500">{c.shortExpiry?.length ?? 0} items</td>
                  <td className="px-4 py-3 text-slate-500">{c.jcc?.length ?? 0} colleagues</td>
                  <td className="px-4 py-3 text-right text-purple-600 font-bold text-xs">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{detail.chemistName || "Chemist"}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detail.employeeName || detail.employeeCode} · {fmtDate(detail.visitDateOnly)}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"><Pill size={13} /> RCPA</h4>
                {detail.rcpa && detail.rcpa.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.rcpa.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{r.brandName}</span>
                        <span className="text-slate-500 text-xs">My Qty: {r.myQty ?? 0}{r.compBrandName ? ` · ${r.compBrandName}: ${r.compQty ?? 0}` : ""}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No RCPA rows recorded.</p>}
              </div>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"><Package size={13} /> POB</h4>
                {detail.pob && detail.pob.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.pob.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{r.productName}</span>
                        <span className="text-slate-500 text-xs">Qty: {r.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No POB items recorded.</p>}
              </div>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"><CalendarClock size={13} /> Short Expiry</h4>
                {detail.shortExpiry && detail.shortExpiry.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.shortExpiry.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{r.medicineName}</span>
                        <span className="text-slate-500 text-xs">Exp: {fmtDate(r.expiryDate)} · Qty: {r.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No Short Expiry items recorded.</p>}
              </div>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"><Users size={13} /> JCC</h4>
                {detail.jcc && detail.jcc.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.jcc.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{r.name}</span>
                        <span className="text-slate-500 text-xs">{r.designation || ""} {r.employeeCode ? `· ${r.employeeCode}` : ""}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">No JCC colleagues recorded.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
