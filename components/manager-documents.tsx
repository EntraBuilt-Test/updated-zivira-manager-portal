"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Megaphone, RefreshCw } from "lucide-react";
import { apiClient, type ManagerDocument } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

type Kind = "circular" | "manual";

function DocumentList({ kind, items, loading, error, busyId, onDownload }: {
  kind: Kind;
  items: ManagerDocument[];
  loading: boolean;
  error: string;
  busyId: string | null;
  onDownload: (doc: ManagerDocument) => void;
}) {
  const Icon = kind === "circular" ? Megaphone : FileText;
  const tint = kind === "circular" ? "amber" : "emerald";
  return (
    <section className="space-y-2.5">
      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">
          {kind === "circular" ? "No circulars sent to your designation yet." : "No manuals uploaded by Admin yet."}
        </p>
      )}
      {items.map((doc) => (
        <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm flex items-center gap-3">
          <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-" + tint + "-50 dark:bg-" + tint + "-950/30 border border-" + tint + "-200/70 dark:border-" + tint + "-800 text-" + tint + "-700 dark:text-" + tint + "-400"}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{doc.subject || doc.fileName || "Document"}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">{doc.fileName}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(doc.uploadedOn)}</p>
          </div>
          <button
            type="button"
            disabled={busyId === doc.id}
            onClick={() => onDownload(doc)}
            className={"p-2 rounded-lg shrink-0 bg-" + tint + "-50 hover:bg-" + tint + "-100 dark:bg-" + tint + "-950/40 text-" + tint + "-800 dark:text-" + tint + "-300"}
            aria-label="Download"
          >
            <Download size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}

// Items 4/6 (post-launch robustness round) -- neither Circulars (File
// Upload Designation-wise) nor Manuals (User Manual Upload) had any
// manager-side screen before. Both read the same real admin-uploaded
// collections the admin's own panels write to (GET /manager/circulars,
// GET /manager/manuals), circulars already filtered server-side to this
// manager's own designation.
export function ManagerDocuments() {
  const [tab, setTab] = useState<Kind>("circular");
  const [circulars, setCirculars] = useState<ManagerDocument[]>([]);
  const [manuals, setManuals] = useState<ManagerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([apiClient.circulars(), apiClient.manuals()])
      .then(([c, m]) => {
        setCirculars(c.data);
        setManuals(m.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load documents"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function download(doc: ManagerDocument) {
    setBusyId(doc.id);
    setError("");
    try {
      if (tab === "circular") await apiClient.downloadCircular(doc.id, doc.fileName || "circular");
      else await apiClient.downloadManual(doc.id, doc.fileName || "manual");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab("circular")}
            className={"px-3 py-1.5 text-xs font-semibold rounded-md transition " + (tab === "circular" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
          >
            Circulars ({circulars.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={"px-3 py-1.5 text-xs font-semibold rounded-md transition " + (tab === "manual" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
          >
            Manuals ({manuals.length})
          </button>
        </div>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <DocumentList
        kind={tab}
        items={tab === "circular" ? circulars : manuals}
        loading={loading}
        error={error}
        busyId={busyId}
        onDownload={download}
      />
    </div>
  );
}
