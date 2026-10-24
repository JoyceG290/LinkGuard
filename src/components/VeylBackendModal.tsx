import React, { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, ExternalLink } from 'lucide-react';
import { BackendConnectionConfig } from '../types/scanner';

interface VeylBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConnectionConfig;
  onUpdateUrl: (url: string) => Promise<void>;
  onRefreshHealth: () => Promise<void>;
}

export const VeylBackendModal: React.FC<VeylBackendModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateUrl,
  onRefreshHealth,
}) => {
  const [inputUrl, setInputUrl] = useState(config.backendUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setIsUpdating(true);
    setFeedback(null);
    try {
      await onUpdateUrl(inputUrl.trim());
      setFeedback('Backend endpoint updated successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to update backend endpoint.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestPing = async () => {
    setIsUpdating(true);
    await onRefreshHealth();
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Veyl Backend Engine Connection
            </h3>
            <p className="text-xs text-slate-400">
              Connected to repo: <a href="https://github.com/123mczilox/veyl/tree/main/backend" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">123mczilox/veyl/backend <ExternalLink className="w-3 h-3" /></a>
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className="my-5 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Active Connection State
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border flex items-center gap-1 ${
              config.isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {config.isConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Veyl API Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Embedded Fallback Active</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {config.statusMessage}
          </p>
        </div>

        {/* Configure Target Endpoint */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="backend-url-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Backend Endpoint URL
            </label>
            <input
              id="backend-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. https://veyl.onrender.com or http://localhost:8000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl font-mono outline-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setInputUrl('https://veyl.onrender.com')}
                className="text-[11px] text-slate-400 hover:text-indigo-400 underline font-mono"
              >
                Render Remote
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setInputUrl('http://127.0.0.1:8000')}
                className="text-[11px] text-slate-400 hover:text-indigo-400 underline font-mono"
              >
                Local Uvicorn (127.0.0.1:8000)
              </button>
            </div>
          </div>

          {feedback && (
            <p className="text-xs text-emerald-400 font-medium">
              {feedback}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isUpdating}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Ping / Test Health</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
