import React from 'react';
import { History, Download, Trash2, ArrowUpRight, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ScanResult } from '../types/scanner';

interface ScanHistoryProps {
  history: ScanResult[];
  onSelectResult: (result: ScanResult) => void;
  onClearHistory: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `linkshield-scan-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Recent Link Audit History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Previous link scans stored privately in your browser session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit JSON</span>
          </button>
          <button
            onClick={onClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Scan History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
        {history.map((item, idx) => {
          const isDanger = item.level === 'critical' || item.level === 'dangerous';
          const isSuspicious = item.level === 'suspicious';

          return (
            <div
              key={idx}
              onClick={() => onSelectResult(item)}
              className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-950/60 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isDanger ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                ) : isSuspicious ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                )}

                <div className="min-w-0">
                  <div className="font-mono text-xs text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                    {item.urlDecomposition.cleanedUrl}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.title}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-mono font-bold tabular-nums ${
                    isDanger ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {item.score}/100
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
