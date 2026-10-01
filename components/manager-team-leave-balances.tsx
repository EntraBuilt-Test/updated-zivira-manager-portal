"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiClient, type TeamLeaveEntitlement } from "@/lib/api-client";

// Item 3 (post-launch robustness round) -- the Manager Portal had a Leave
// Requests (approvals) tab, but no view of the team's actual leave
// entitlement/balance at all. This reads the same real
// leaveEntitlementEntry collection admin's "Leave Entitlement - Entry"
// screen writes to (team-scoped via GET /manager/leave-entitlement), so a
// manager sees exactly the same real CL/PL/SL/LOP numbers their own team
// members see on their own Leave Apply screen.
export function ManagerTeamLeaveBalances() {
  const [rows, setRows] = useState<TeamLeaveEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.teamLeaveEntitlement()
      .then((r) => setRows(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load team leave entitlement"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Real per-employee entitlement set by Admin via Leave Entitlement - Entry.
        </p>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50" title="Refresh" type="button">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</p>}

      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          Admin hasn&apos;t set up Leave Entitlement for your team yet.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Field Force</th>
                <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Year</th>
                <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center whitespace-nowrap">CL</th>
                <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center whitespace-nowrap">PL</th>
                <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center whitespace-nowrap">SL</th>
                <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center whitespace-nowrap">LOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{r.fieldForceName}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.year}</td>
                  <td className="px-3 py-2.5 text-center font-mono">{r.balanceCl ?? r.cl ?? "—"} <span className="text-slate-400">/ {r.cl ?? "—"}</span></td>
                  <td className="px-3 py-2.5 text-center font-mono">{r.balancePl ?? r.pl ?? "—"} <span className="text-slate-400">/ {r.pl ?? "—"}</span></td>
                  <td className="px-3 py-2.5 text-center font-mono">{r.balanceSl ?? r.sl ?? "—"} <span className="text-slate-400">/ {r.sl ?? "—"}</span></td>
                  <td className="px-3 py-2.5 text-center font-mono">{r.balanceLop ?? r.lop ?? "—"} <span className="text-slate-400">/ {r.lop ?? "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
