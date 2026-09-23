"use client";
import type { Employee } from "@zivira/types";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function ManagerTeamList() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdLogin, setCreatedLogin] = useState("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "active">("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    name: "",
    employeeCode: "",
    designation: "Medical Representative",
    division: "Cardio Diabetes",
    territory: "Chennai",
    role: "MR" as Employee["role"],
    status: "ACTIVE" as Employee["status"],
    password: "zivira123"
  });

  async function load() {
    setLoading(true); setError("");
    try { setTeam((await apiClient.team()).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function createTeamMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setCreatedLogin("");
    try {
      const response = await apiClient.createTeamMember(form);
      setCreatedLogin(`Field login created: ${response.data.employeeCode.toLowerCase()} / ${response.data.demoPassword ?? form.password}`);
      setForm({ ...form, name: "", employeeCode: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create field employee");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = team.filter(e => e.status === "ACTIVE").length;
  const activePercent = team.length > 0 ? ((activeCount / team.length) * 100).toFixed(1) : "0.0";
  const visibleTeam = team
    .filter((e) => rosterFilter === "all" || e.status === "ACTIVE")
    .filter((e) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
    });

  return (
    <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50 dark:bg-[#0b1120]">
      {/* 1. EXECUTIVE HERO HEADER SECTION */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden" data-purpose="team-page-header">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-50/60 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400"></span>
                Field Force & Team Management
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="text-slate-300 dark:text-slate-600">•</span>
                Cardiological & Diabetic Divisions
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">&nbsp;Team Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Manage medical representatives, territory allocation, on-field deployment status, and provision mobile field credentials.
            </p>
            {error && <p className="text-rose-600 font-medium text-xs mt-2">{error}</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            <button onClick={load} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all" type="button">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <a className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 active:bg-slate-900 rounded-xl shadow-md shadow-teal-900/20 transition-all cursor-pointer" href="#quick-onboard-card">
              <Plus size={14} strokeWidth={2.5} />
              Quick Onboard Rep
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Representatives</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-400">Optimal Roster</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{team.length}</span>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-500">Assigned</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-500 inline-block"></span>
              {activePercent}% Reps Active
            </div>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 rounded-xl p-4 border border-emerald-200/80 dark:border-emerald-800/50 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-500">Deployed in Field</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 dark:bg-emerald-500"></span>
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-emerald-900 dark:text-emerald-400 tracking-tight">{activeCount} Reps</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-500 font-semibold">{activePercent}% Today&apos;s Check-in Logged</p>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Territory Coverage</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Coverage</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{new Set(team.map(t => t.territory)).size}</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Metros HQ</span>
            </div>
            <div className="flex items-center gap-1 overflow-hidden text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {[...new Set(team.map(t => t.territory))].slice(0, 4).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Field Activation Rate</span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activePercent}%</span>
                <span className="text-[10px] text-slate-400 font-semibold">{activeCount}/{team.length} active</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-teal-600 dark:bg-teal-500 h-1.5 rounded-full" style={{ width: `${activePercent}%` }}></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Reps currently marked active</p>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Doctor Coverage</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50">Active</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">&mdash;</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">HCPs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Per-rep doctor mapping not available in this portal yet</p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE EXPANDABLE ONBOARDING CARD */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden" id="quick-onboard-card">
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Onboard New Medical Representative</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">Active Division</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quickly provision mobile field credentials and assign doctor territories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-200/80 dark:border-teal-800/50 inline-flex items-center gap-1.5">
              Auto-generated Password Enabled
            </span>
          </div>
        </div>
        <form className="p-6" onSubmit={createTeamMember}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 font-medium transition-all" placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Employee Code <span className="text-rose-500">*</span>
              </label>
              <input required value={form.employeeCode} onChange={e => setForm({...form, employeeCode: e.target.value})} className="w-full text-xs font-mono font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-teal-800 dark:text-teal-400 transition-all" placeholder="MR-CHN-006" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation <span className="text-rose-500">*</span>
              </label>
              <select required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 font-medium transition-all">
                <option value="Medical Representative">Medical Representative</option>
                <option value="Senior Medical Representative">Senior Medical Representative</option>
                <option value="Area Business Manager">Area Business Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Division <span className="text-rose-500">*</span>
              </label>
              <input required value={form.division} onChange={e => setForm({...form, division: e.target.value})} className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 font-medium transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Territory / HQ <span className="text-rose-500">*</span>
              </label>
              <input required value={form.territory} onChange={e => setForm({...form, territory: e.target.value})} className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 font-medium transition-all" placeholder="e.g. Chennai HQ / Central" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <input required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 transition-all font-semibold" />
            </div>
          </div>
          {createdLogin && <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold">{createdLogin}</div>}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              Representative will be prompted to reset their password upon initial mobile check-in.
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" type="button" onClick={() => setForm({ ...form, name: '', employeeCode: '' })}>
                Reset
              </button>
              <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-slate-900 text-white font-bold text-xs shadow-md shadow-teal-900/15 transition-all" type="submit">
                <Plus size={14} strokeWidth={2.5} />
                {saving ? "Onboarding..." : "+ Onboard Field Rep"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* 4. PREMIUM ROSTER TABLE */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 w-fit flex-wrap">
            <button
              onClick={() => setRosterFilter("all")}
              className={rosterFilter === "all"
                ? "px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/40 dark:border-slate-600"
                : "px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700 transition-colors"}
            >
              All Members <span className="ml-1.5 text-[10px] px-2 py-0.5 bg-teal-50 dark:bg-teal-900/50 text-teal-800 dark:text-teal-400 rounded-full font-bold border border-teal-200/60 dark:border-teal-800">{team.length}</span>
            </button>
            <button
              onClick={() => setRosterFilter("active")}
              className={rosterFilter === "active"
                ? "px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/40 dark:border-slate-600"
                : "px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700 transition-colors"}
            >
              Active in Field <span className="ml-1.5 text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-full font-bold">{activeCount}</span>
            </button>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xl justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400" placeholder="Search representative name, code..." type="text" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">S.No</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Representative</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Employee Code</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Designation & Division</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Territory & HQ</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Today&apos;s Field Status</th>
                <th className="py-3 px-4 text-slate-500 dark:text-white bg-slate-50 dark:bg-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {!loading && visibleTeam.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    {team.length === 0 ? "No team members found" : "No representatives match your search/filter"}
                  </td>
                </tr>
              )}
              {visibleTeam.map((emp, i) => (
                <tr key={emp.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-900/10 transition-colors group">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{i + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-400 transition-colors">{emp.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{emp.name.toLowerCase().replace(" ", ".")}@zivira.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center font-mono font-bold text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-2 py-0.5 rounded border border-teal-200/70 dark:border-teal-800 text-[11px]">
                      {emp.employeeCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50">
                        {emp.designation}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{emp.division}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                      {emp.territory}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {emp.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 pulsing-glow"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button onClick={() => setViewing(emp)} className="px-2.5 py-1 text-[11px] font-bold text-teal-800 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 rounded-lg transition-colors border border-transparent hover:border-teal-200 dark:hover:border-teal-800" title="View Profile">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewing.name}</h3>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none" aria-label="Close">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Employee Code</span><span className="font-mono font-bold text-teal-800 dark:text-teal-400">{viewing.employeeCode}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status</span><span className="font-bold">{viewing.status}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Designation</span><span className="font-medium">{viewing.designation}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Division</span><span className="font-medium">{viewing.division}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Territory</span><span className="font-medium">{viewing.territory}</span></div>
              <div><span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email</span><span className="font-medium break-all">{viewing.name.toLowerCase().replace(" ", ".")}@zivira.com</span></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
