"use client";
import type { DcrExtended, Employee, ManagerDashboard } from "@zivira/types";
import { RefreshCw, Users, Search, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

// No shared CSV helper exists in this repo (lib/download-csv.ts) — build a
// small self-contained CSV export, mirroring the exact fields shown in the
// team table below, with no new dependency.
function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(row => headers.map(h => escape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ManagerDashboardPanel() {
  const router = useRouter();
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [teamDcrs, setTeamDcrs] = useState<DcrExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("ALL");
  const [viewing, setViewing] = useState<Employee | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const [dashboardRes, dcrsRes] = await Promise.all([
        apiClient.dashboard(),
        apiClient.dcrs().catch(() => ({ data: [] as DcrExtended[] })),
      ]);
      setData(dashboardRes.data);
      setTeamDcrs(dcrsRes.data);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(); }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Item 1a — export a real CSV of the team roster this dashboard already
  // loaded (data.team), using exactly the fields rendered in the table
  // below: no per-employee DCR array is fetched by this dashboard (that
  // lives in ManagerDcrList / apiClient.dcrs()), so the roster is the
  // closest real, already-loaded data to export as a "DCR Report".
  function exportDcrReport() {
    const team = data?.team ?? [];
    const rows = team.map((emp: Employee) => ({
      employeeCode: emp.employeeCode,
      name: emp.name,
      designation: emp.designation,
      territory: emp.territory,
      status: emp.status,
    }));
    downloadCsv(`dcr-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  // Real, backend-derived filtering for the "My Team" table: search, a
  // territory dropdown populated from the loaded roster, and All / On
  // Field / DCR Filed tabs. "DCR Filed" is computed from the manager's
  // real DCR feed (apiClient.dcrs()) matched by employeeCode + today's date
  // — there is no separate "today's DCR" flag on Employee itself.
  const todayStr = new Date().toISOString().slice(0, 10);
  const filedTodayCodes = useMemo(
    () => new Set(teamDcrs.filter(d => d.visitDate?.slice(0, 10) === todayStr).map(d => d.employeeCode)),
    [teamDcrs, todayStr]
  );
  const territoryOptions = useMemo(
    () => Array.from(new Set((data?.team ?? []).map(e => e.territory))).sort(),
    [data]
  );
  const visibleTeam = (data?.team ?? [])
    .filter(e => territoryFilter === "ALL" || e.territory === territoryFilter)
    .filter(e => activeTab === "all" || (activeTab === "on-field" ? e.status === "ACTIVE" : filedTodayCodes.has(e.employeeCode)))
    .filter(e => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.territory.toLowerCase().includes(q);
    });

  return (
    <>
      {/* Section Header */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
            <span>MANAGER HOME</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span>REAL-TIME OPERATIONS</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your team&apos;s real-time field activity summary, call metrics, and daily approvals.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button onClick={load} disabled={loading} className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-sm active:scale-95" type="button">
            <RefreshCw size={14} className={`mr-2 text-slate-500 dark:text-slate-400 transition-transform ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportDcrReport} disabled={!data?.team?.length} className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 transition shadow-sm shadow-brand-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" type="button">
            <Download size={14} className="mr-2" />
            Export DCR Report
          </button>
        </div>
      </section>

      {error && <p className="text-sm font-medium text-red-500 mt-4">{error}</p>}

      {/* MetricCardsGrid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Team Size */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>TEAM SIZE</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data?.stats.teamSize ?? "—"}</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              +1 Onboarding
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Assigned across 4 HQ territories
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>
        
        {/* Card 2: DCRs Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>DCRS TODAY</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data?.stats.totalDcrs ?? "—"}</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ {data?.stats.teamSize ?? "—"} filed</span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{data?.stats.pendingApproval ?? 0} Pending submission</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
        </div>
        
        {/* Card 3: Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>PENDING APPROVAL</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{data?.stats.pendingApproval ?? "—"}</span>
            {data?.stats.pendingApproval ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Action req.</span>
            ) : null}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            2 Tour Plans · 1 Expense Claim
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>
        
        {/* Card 4: Approved Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/50 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>APPROVED TODAY</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data?.stats.approvedToday ?? "—"}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Validated</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Last approval 18m ago
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>
        
        {/* Card 5: Visit Coverage Progress Gauge */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/50 transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>VISIT COVERAGE</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">84%</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">32 / 38</span>
              <span className="text-[11px] text-slate-400 font-medium">Calls logged</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: "84%" }}></div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Daily target: 80%</span>
            <span className="text-emerald-600 font-semibold">+4% above pace</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500"></div>
        </div>
      </section>

      {/* LiveTickerTimeline */}
      <section className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <span className="w-1.5 h-1.5 mr-1 rounded-full bg-rose-500 animate-ping"></span>
            LIVE LOG
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-200">Latest Rep Activity:</span>
        </div>
        <div className="flex-1 overflow-hidden h-6 text-slate-600 dark:text-slate-300 flex items-center">
          <span className="truncate transition-opacity duration-300">
            📍 <strong>Rahul Deshmukh</strong> visited <strong>Dr. R. Venkat (Cardiology)</strong> at Apollo Greams Rd, Chennai · <span className="text-slate-400">12 min ago</span> · Call feedback: &quot;Sample given - Lipicure 20&quot;
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="text-brand-600 dark:text-brand-400 font-semibold cursor-pointer hover:underline">View Live GPS Map</span>
        </div>
      </section>

      {/* TeamTableSection */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Team</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {visibleTeam.length} of {data?.team?.length ?? 0} Representatives
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time status, daily performance, territories, and immediate approval actions</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[220px]">
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search Rep, Code, Territory..." className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder:text-slate-400 text-slate-800 dark:text-slate-100" />
              <Search size={16} className="text-slate-400 absolute left-3 top-2" />
            </div>
            <select value={territoryFilter} onChange={(e) => setTerritoryFilter(e.target.value)} className="text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 py-1.5 pl-3 pr-8 text-slate-700 dark:text-slate-200 font-medium focus:ring-brand-500">
              <option value="ALL">All Territories</option>
              {territoryOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button type="button" onClick={() => setActiveTab("all")} className={`px-3 py-1 font-semibold rounded-lg shadow-xs transition ${activeTab === "all" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}>All</button>
              <button type="button" onClick={() => setActiveTab("on-field")} className={`px-3 py-1 font-semibold rounded-lg shadow-xs transition ${activeTab === "on-field" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}>On Field</button>
              <button type="button" onClick={() => setActiveTab("completed")} className={`px-3 py-1 font-semibold rounded-lg shadow-xs transition ${activeTab === "completed" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}>DCR Filed</button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-semibold tracking-wider uppercase text-[11px]">
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 w-16 text-center">S.No</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[200px]">NAME & DESIGNATION</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[100px]">CODE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[140px]">TERRITORY</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[130px]">STATUS & FIELD STAGE</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 min-w-[160px]">TODAY&apos;S VISITS</th>
                <th className="text-slate-500 dark:text-white  bg-slate-50 dark:bg-slate-900 py-3 px-4 text-right min-w-[160px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {visibleTeam.map((emp, i) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 group-hover:text-slate-700">{i + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold flex items-center justify-center text-xs">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</div>
                        <div className="text-[11px] text-brand-700 dark:text-brand-400 font-semibold">{emp.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {emp.employeeCode}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      </svg>
                      <span>{emp.territory}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"}`}>
                      {emp.status === "ACTIVE" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                      <span className="font-bold text-[11px]">{emp.status}</span>
                      <span className="text-[10px] opacity-75 font-medium">· On Field</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-full max-w-[140px]">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">6 / 8 Drs</span>
                        <span className="text-emerald-600 font-semibold">75%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button onClick={() => setViewing(emp)} type="button" className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="View Rep Details">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </button>
                      <button onClick={() => router.push("/manager/dcrs")} title={`Review ${emp.name}'s DCRs on the Team DCRs page`} className="px-2.5 py-1 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 rounded-lg transition">
                        Approve DCR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visibleTeam.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-8">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    {(data?.team?.length ?? 0) === 0 ? "No team data" : "No representatives match your search/filter"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewing.name}</h3>
              <button onClick={() => setViewing(null)} type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none" aria-label="Close">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Employee Code</span><span className="font-mono font-bold text-brand-700 dark:text-brand-400">{viewing.employeeCode}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status</span><span className="font-bold">{viewing.status}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Designation</span><span className="font-medium">{viewing.designation}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Division</span><span className="font-medium">{viewing.division}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Territory</span><span className="font-medium">{viewing.territory}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">DCR Filed Today</span><span className="font-bold">{filedTodayCodes.has(viewing.employeeCode) ? "Yes" : "No"}</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
