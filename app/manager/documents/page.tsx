import { ManagerDocuments } from "@/components/manager-documents";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
          Documents
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Circulars & Manuals</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Files Admin sent to your designation, and reference manuals.</p>
      </section>
      <ManagerDocuments />
    </div>
  );
}
