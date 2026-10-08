"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ChevronDown, ChevronRight } from "lucide-react";
import { apiClient, type TeamLeaveMember, type TeamLeaveRecord } from "@/lib/api-client";
import { decidedText, decisionRemarks, historyLines } from "@/lib/approval-display";

// Round 60 -- Team Leave: every person below this manager with their leave list and history. Each leave shows the shared decision label
// ("Approved by Admin", "Approved by Manager (Name)", "Rejected by ...", "Leave cancelled by Admin"), the decision date, the remarks, and the
// append-only history. Deep link: /manager/leave?tab=team&emp=<employeeCode> opens that person's list.
const CHIP: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-300"
};
const fmt = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };

function Chip({ label, n, tone }: { label: string; n: number; tone: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${n ? tone : "bg-slate-50 text-slate-400 border-slate-200"}`}>{label} {n}</span>;
}

export function ManagerTeamLeave({ initialEmp }: { initialEmp?: string }) {
  const [rows, setRows] = useState<TeamLeaveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(initialEmp ?? null);
  const [status, setStatus] = useState<"ALL" | TeamLeaveRecord["status"]>("ALL");

  function load() {
    setLoading(true); setError("");
    apiClient.teamLeave()
      .then((r) => setRows(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load team leave"))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialEmp) setOpen(initialEmp); }, [initialEmp]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q) || (r.territory ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const toggle = (code: string) => {
    const next = open === code ? null : code;
    setOpen(next);
    try {   // keep the URL shareable
      const u = new URL(window.location.href); u.searchParams.set("tab", "team");
      if (next) u.searchParams.set("emp", next); else u.searchParams.delete("emp");
      window.history.replaceState(null, "", u.toString());
    } catch { /* non-browser */ }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code or HQ" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2">
          <option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={load} disabled={loading} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50" title="Refresh" type="button">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <p className="text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">{rows.length ? "No one matches the search." : "No one reports to you yet."}</p>
      )}

      <div className="space-y-2">
        {shown.map((m) => {
          const isOpen = open === m.employeeCode;
          const leaves = m.leaves.filter((l) => status === "ALL" || l.status === status);
          return (
            <div key={m.employeeCode} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button type="button" onClick={() => toggle(m.employeeCode)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left" aria-expanded={isOpen}>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name} <span className="text-[11px] font-medium text-slate-400">{m.employeeCode}</span></div>
                  <div className="text-[11px] text-slate-500 truncate">{[m.designation, m.territory].filter(Boolean).join(" · ")}{m.isDirectReport ? "" : " · reports through a team lead"}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <Chip label="Pending" n={m.counts.pending} tone={CHIP.PENDING} /><Chip label="Approved" n={m.counts.approved} tone={CHIP.APPROVED} />
                  <Chip label="Rejected" n={m.counts.rejected} tone={CHIP.REJECTED} /><Chip label="Cancelled" n={m.counts.cancelled} tone={CHIP.CANCELLED} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 space-y-2">
                  <div className="text-[11px] text-slate-500">{m.approvedDays} approved day(s) in total</div>
                  {leaves.length === 0 && <p className="text-xs text-slate-500 italic">No leave records{status === "ALL" ? "" : " with this status"}.</p>}
                  {leaves.map((l) => {
                    const hist = historyLines(l);
                    return (
                      <div key={l.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-2.5 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{l.leaveType} · {fmt(l.fromDate)} - {fmt(l.toDate)} · {l.days} day(s)</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black ${CHIP[l.status] ?? CHIP.PENDING}`}>{decidedText(l, l.status === "PENDING" ? "Pending" : l.statusLabel)}</span>
                        </div>
                        {l.reason ? <div className="text-slate-500">Reason: {l.reason}</div> : null}
                        {decisionRemarks(l) ? <div className="text-slate-600">Remarks: {decisionRemarks(l)}</div> : null}
                        {hist.length > 0 && (
                          <details className="text-[11px] text-slate-500"><summary className="cursor-pointer">History ({hist.length})</summary><ul className="mt-1 space-y-0.5 list-disc pl-4">{hist.map((h, i) => <li key={i}>{h}</li>)}</ul></details>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
