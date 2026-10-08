"use client";

import { useEffect, useState } from "react";
import { ManagerLeaveRequests } from "@/components/manager-leave-requests";
import { ManagerTeamLeave } from "@/components/manager-team-leave";
import { ManagerTeamLeaveBalances } from "@/components/manager-team-leave-balances";

// Requests (approval queue), Team (every person below the manager: leave list + history with decision chips, Round 60) and Team Balances.
// Deep link: /manager/leave?tab=team&emp=<employeeCode> opens the Team tab on that person.
type Tab = "requests" | "team" | "balances";
const TABS: { key: Tab; label: string }[] = [{ key: "requests", label: "Requests" }, { key: "team", label: "Team" }, { key: "balances", label: "Team Balances" }];

export default function LeavePage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [emp, setEmp] = useState<string | undefined>(undefined);

  // read the deep link on the client (no useSearchParams, so the page stays statically renderable)
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const t = q.get("tab");
      if (t === "team" || t === "balances" || t === "requests") setTab(t);
      const e = q.get("emp");
      if (e) { setEmp(e); setTab("team"); }
    } catch { /* non-browser */ }
  }, []);

  const pick = (t: Tab) => {
    setTab(t);
    try { const u = new URL(window.location.href); u.searchParams.set("tab", t); if (t !== "team") u.searchParams.delete("emp"); window.history.replaceState(null, "", u.toString()); } catch { /* non-browser */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit text-sm font-semibold">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => pick(t.key)}
            className={`px-3.5 py-1.5 rounded-lg transition ${tab === t.key ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "requests" ? <ManagerLeaveRequests /> : tab === "team" ? <ManagerTeamLeave initialEmp={emp} /> : <ManagerTeamLeaveBalances />}
    </div>
  );
}
