"use client";
import clsx from "clsx";
import { 
  BarChart3, Bell, CalendarOff, Grid3x3, Home, LogOut, MapPinned, Moon, PanelLeftClose, PanelLeftOpen, Receipt, ShieldAlert, Sun, Users, UsersRound, Megaphone, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient, clearToken } from "@/lib/api-client";

const nav = [
  { href: "/manager/dashboard",      title: "Dashboard",       icon: Home, count: null },
  { href: "/manager/dcrs",           title: "Team DCRs",        icon: BarChart3, count: "4 Today", countColor: "emerald" },
  { href: "/manager/leave",          title: "Leave Requests",   icon: CalendarOff, count: "0", countColor: "mono" },
  { href: "/manager/tour-plans",     title: "Tour Plans",       icon: MapPinned, count: "2 Pending", countColor: "amber" },
  { href: "/manager/expense-claims", title: "Expense Claims",   icon: Receipt, count: "1", countColor: "amber" },
  { href: "/manager/visit-coverage", title: "Visit Coverage",   icon: Grid3x3, count: "84%", countColor: "text" },
  { href: "/manager/compliance",     title: "Compliance",       icon: ShieldAlert, count: null },
  { href: "/manager/rep-analysis",   title: "Rep Analysis",     icon: UsersRound, count: null },
  { href: "/manager/team",           title: "My Team",          icon: Users, count: null }
];

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [theme, setTheme]       = useState<"light"|"dark">("light");
  const [managerName, setManagerName] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (pathname === "/manager/login") return;
    if (pathname === "/manager/notifications") {
      window.localStorage.setItem("zivira.manager.notices.lastSeen", new Date().toISOString());
      setHasUnread(false);
      return;
    }
    let cancelled = false;
    const check = () => {
      apiClient.notices().then((r) => {
        if (cancelled || !r.data.length) return;
        const lastSeen = window.localStorage.getItem("zivira.manager.notices.lastSeen");
        const unread = !lastSeen || new Date(r.data[0].createdAt).getTime() > new Date(lastSeen).getTime();
        setHasUnread(unread);
      }).catch(() => {});
    };
    check();
    const interval = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pathname]);

  useEffect(() => {
    const t = window.localStorage.getItem("zivira.manager.theme");
    if (t === "dark" || t === "light") {
      setTheme(t);
      document.documentElement.classList.add(t);
      document.documentElement.classList.remove(t === 'light' ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (pathname === "/manager/login") return;
    apiClient.dashboard().then((r) => setManagerName(r.data.manager.name)).catch(() => {});
  }, [pathname]);

  const toggleTheme = (newTheme: "light"|"dark") => {
    setTheme(newTheme);
    document.documentElement.classList.add(newTheme);
    document.documentElement.classList.remove(newTheme === "light" ? "dark" : "light");
    window.localStorage.setItem("zivira.manager.theme", newTheme);
  };

  if (pathname === "/manager/login") return <>{children}</>;

  function signOut() { clearToken(); router.push("/manager/login"); }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* TopBar */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link href="/manager/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-teal-800 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">Z</div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">Zivira Labs</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/80">Manager Portal</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Field Force Intelligence & Automation</p>
            </div>
          </Link>
        </div>
        
        {/* Live Status Strip */}
        <div className="hidden xl:flex items-center space-x-6 text-xs bg-slate-50 dark:bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-600 dark:text-slate-300">Live Territory GPS Sync: <strong className="text-emerald-600 dark:text-emerald-400">Optimal</strong></span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="text-slate-500 dark:text-slate-400">
            Active Roster: <span className="font-semibold text-slate-800 dark:text-slate-200">5 / 5 Deployed</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="text-slate-500 dark:text-slate-400">
            Today&apos;s Calls Target: <span className="font-semibold text-slate-800 dark:text-slate-200">38 Doctors</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button type="button" className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors border border-brand-200 dark:border-brand-800">
            <Megaphone size={14} className="mr-1.5" />
            Broadcast Alert
          </button>
          
          <div className="relative">
            <button aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition">
              <Bell size={20} />
              {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Alerts</span>
                  <span className="text-[10px] bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold px-1.5 py-0.5 rounded">3 New</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <Link href="/manager/notifications" className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <p className="font-medium text-slate-800 dark:text-slate-200">Rahul Deshmukh submitted DCR</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Chennai HQ · 6 calls recorded · 10m ago</p>
                  </Link>
                  <Link href="/manager/notifications" className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <p className="font-medium text-slate-800 dark:text-slate-200">New Tour Plan approval request</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Anjali Menon · Pune to Baramati · 45m ago</p>
                  </Link>
                  <Link href="/manager/notifications" className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Expense claim awaiting audit</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Priya dharshini · ₹3,450 travel allowance · 2h ago</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-brand-500/30">
                {managerName ? managerName.substring(0, 2).toUpperCase() : "M"}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{managerName || "Manager"}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Area Sales Manager</div>
              </div>
              <ChevronDown size={16} className="text-slate-400 hidden md:block" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-shrink-0 z-20">
          <div className="py-4 px-3 space-y-6 overflow-y-auto">
            <div>
              <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Main Operations</span>
              <nav className="mt-2 space-y-1">
                {nav.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link href={item.href} key={item.href} className={clsx("flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition group", active ? "bg-brand-50 text-brand-800 border-l-4 border-brand-600 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-500 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200")}>
                      <div className="flex items-center space-x-3">
                        <Icon size={16} className={clsx(active ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                        <span>{item.title}</span>
                      </div>
                      {item.count ? (
                        <span className={clsx(
                          "px-1.5 py-0.5 text-[10px] font-semibold rounded",
                          item.countColor === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                          item.countColor === "amber" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                          item.countColor === "mono" && "text-slate-400 font-mono bg-transparent"
                        )}>{item.count}</span>
                      ) : active ? (
                        <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div>
              <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Field Analytics</span>
              <nav className="mt-2 space-y-1">
                {nav.slice(5).map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link href={item.href} key={item.href} className={clsx("flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition group", active ? "bg-brand-50 text-brand-800 border-l-4 border-brand-600 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-500 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200")}>
                      <div className="flex items-center space-x-3">
                        <Icon size={16} className={clsx(active ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                        <span>{item.title}</span>
                      </div>
                      {item.count ? (
                        <span className={clsx(
                          "text-xs font-bold text-emerald-600"
                        )}>{item.count}</span>
                      ) : active ? (
                        <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
          
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Theme</div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
                <button onClick={() => toggleTheme("light")} className={clsx("flex items-center justify-center space-x-1.5 py-1 px-2 rounded-md text-xs font-semibold transition shadow-sm", theme === "light" ? "bg-white text-slate-800" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}>
                  <Sun size={14} className="text-amber-500" />
                  <span>Light</span>
                </button>
                <button onClick={() => toggleTheme("dark")} className={clsx("flex items-center justify-center space-x-1.5 py-1 px-2 rounded-md text-xs font-semibold transition shadow-sm", theme === "dark" ? "bg-slate-700 text-slate-200" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}>
                  <Moon size={14} className="text-indigo-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
            
            <button onClick={signOut} className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
