"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Megaphone, RefreshCw, XCircle } from "lucide-react";
import { apiClient, type ManagerCampaignVisit } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(status: ManagerCampaignVisit["status"]) {
  if (status === "Completed") return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
  if (status === "Cancelled") return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
  if (status === "Pending Approval") return "bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border-sky-300 dark:border-sky-800";
  if (status === "Rejected") return "bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-800";
  return "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800";
}

// Phase 1 of the "Call Manager" reference build — real, team-scoped
// visibility into every report's Campaign Planning submissions (GET
// /manager/campaign-visits, scoped by reportingManager === this manager's
// own employeeCode, the same pattern GET /manager/team already uses).
//
// Phase 3 adds a real Deviation Approvals tab: off-plan visits a report
// requested from the field app's Plan toggle land here as "Pending
// Approval", scoped to this manager's team the same way every other
// approval screen (DCR/leave/tour-plan/expense) already is. Approve flips
// the visit to "Planned" — it then shows up in the Team Campaign Visits
// tab and in the rep's own Campaign Execution list exactly like a
// normally-planned visit. Reject records an optional reason.
export function ManagerCampaign() {
  const [tab, setTab] = useState<"visits" | "deviations">("deviations");

  const [visits, setVisits] = useState<ManagerCampaignVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<"today" | "all">("today");
  const today = new Date().toISOString().slice(0, 10);

  const [pending, setPending] = useState<ManagerCampaignVisit[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.campaignVisits(scope === "today" ? today : undefined);
      setVisits(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load campaign visits");
    } finally {
      setLoading(false);
    }
  }

  async function loadPending() {
    setPendingLoading(true);
    setPendingError("");
    try {
      const res = await apiClient.deviationVisits("Pending Approval");
      setPending(res.data);
    } catch (e) {
      setPendingError(e instanceof Error ? e.message : "Unable to load deviation requests");
    } finally {
      setPendingLoading(false);
    }
  }

  useEffect(() => { void load(); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void loadPending(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(id: string) {
    setActingId(id);
    setPendingError("");
    try {
      await apiClient.approveDeviation(id);
      setPending((prev) => prev.filter((v) => v.id !== id));
      void load();
    } catch (e) {
      setPendingError(e instanceof Error ? e.message : "Unable to approve this deviation");
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    setActingId(id);
    setPendingError("");
    try {
      await apiClient.rejectDeviation(id, rejectReason.trim() || undefined);
      setPending((prev) => prev.filter((v) => v.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      setPendingError(e instanceof Error ? e.message : "Unable to reject this deviation");
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50 dark:bg-[#0b1120]">
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/50">
              <Megaphone size={12} /> Campaign
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">Campaign &amp; Deviations</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Review off-plan visit requests from your team and see everything planned or executed under each active campaign.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold flex-shrink-0">
            <button type="button" onClick={() => setTab("deviations")} className={`px-3 py-1.5 rounded-lg transition-colors ${tab === "deviations" ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}>
              Deviation Approvals {pending.length > 0 ? `(${pending.length})` : ""}
            </button>
            <button type="button" onClick={() => setTab("visits")} className={`px-3 py-1.5 rounded-lg transition-colors ${tab === "visits" ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}>
              Team Campaign Visits
            </button>
          </div>
        </div>
      </section>

      {tab === "deviations" ? (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Off-plan visits your reports requested, awaiting your decision.</p>
            <button onClick={loadPending} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700" type="button">
              <RefreshCw size={13} className={pendingLoading ? "animate-spin" : ""} />
            </button>
          </div>
          {pendingError && <p className="text-rose-600 font-medium text-xs px-6 pt-3">{pendingError}</p>}
          {!pendingLoading && pending.length === 0 && !pendingError && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic px-6 py-8 text-center">No deviation requests waiting on you.</p>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {pending.map((v) => (
              <div key={v.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{v.doctorName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {v.employeeName || v.employeeCode} · {formatDate(v.visitDate)} · {v.deviationType || "Deviation"}
                  </p>
                  {v.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 italic">&ldquo;{v.notes}&rdquo;</p>}
                </div>
                {rejectingId === v.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200"
                    />
                    <button type="button" disabled={actingId === v.id} onClick={() => void reject(v.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-60">
                      Confirm
                    </button>
                    <button type="button" onClick={() => { setRejectingId(null); setRejectReason(""); }} className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={actingId === v.id}
                      onClick={() => void approve(v.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actingId === v.id}
                      onClick={() => setRejectingId(v.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 disabled:opacity-60"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <div className="flex items-center justify-end gap-2.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button type="button" onClick={() => setScope("today")} className={`px-3 py-1.5 rounded-lg transition-colors ${scope === "today" ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}>
                Today
              </button>
              <button type="button" onClick={() => setScope("all")} className={`px-3 py-1.5 rounded-lg transition-colors ${scope === "all" ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}>
                All Upcoming
              </button>
            </div>
            <button onClick={load} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all" type="button">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {error && <p className="text-rose-600 font-medium text-xs">{error}</p>}

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            {!loading && visits.length === 0 && !error && (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic px-6 py-8 text-center">
                {scope === "today" ? "No campaign visits planned for today across your team." : "No campaign visits planned by your team yet."}
              </p>
            )}
            {visits.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Rep</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Campaign</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Source</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800/70 last:border-0">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{v.employeeName || v.employeeCode}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{v.doctorName}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{v.campaignName || (v.source === "deviation" ? (v.deviationType || "Deviation") : "-")}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(v.visitDate)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{v.source}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadge(v.status)}`}>{v.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
