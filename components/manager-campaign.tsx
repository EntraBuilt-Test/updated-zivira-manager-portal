"use client";
import { useEffect, useState } from "react";
import { Megaphone, RefreshCw } from "lucide-react";
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
  return "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800";
}

// Phase 1 of the "Call Manager" reference build — real, team-scoped
// visibility into every report's Campaign Planning submissions (GET
// /manager/campaign-visits, scoped by reportingManager === this manager's
// own employeeCode, the same pattern GET /manager/team already uses).
// Read-only this round — approving/reassigning a planned visit isn't part
// of Phase 1's scope.
export function ManagerCampaign() {
  const [visits, setVisits] = useState<ManagerCampaignVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<"today" | "all">("today");
  const today = new Date().toISOString().slice(0, 10);

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

  useEffect(() => { void load(); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50 dark:bg-[#0b1120]">
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/50">
              <Megaphone size={12} /> Campaign
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">Team Campaign Visits</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Doctors your team has planned to visit under each active campaign, via Campaign Planning in the field app.
            </p>
            {error && <p className="text-rose-600 font-medium text-xs mt-2">{error}</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
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
        </div>
      </section>

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
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{v.campaignName}</td>
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
    </main>
  );
}
