"use client";

import { useState } from "react";
import { ManagerLeaveRequests } from "@/components/manager-leave-requests";
import { ManagerTeamLeaveBalances } from "@/components/manager-team-leave-balances";

// Item 3 (post-launch robustness round) -- added a real "Team Balances" tab
// alongside the existing "Requests" (approval queue) tab, since the Manager
// Portal had no view of the team's leave entitlement/balance at all before.
export default function LeavePage() {
  const [tab, setTab] = useState<"requests" | "balances">("requests");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit text-sm font-semibold">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`px-3.5 py-1.5 rounded-lg transition ${tab === "requests" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
        >
          Requests
        </button>
        <button
          type="button"
          onClick={() => setTab("balances")}
          className={`px-3.5 py-1.5 rounded-lg transition ${tab === "balances" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
        >
          Team Balances
        </button>
      </div>

      {tab === "requests" ? <ManagerLeaveRequests /> : <ManagerTeamLeaveBalances />}
    </div>
  );
}
