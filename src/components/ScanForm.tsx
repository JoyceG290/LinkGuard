import React, { useState } from 'react';
import { Search, Clipboard, ArrowRight, MessageSquare, AlertCircle, X, Sparkles } from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/presets';
import { PresetScenario } from '../types/scanner';

interface ScanFormProps {
  onScan: (url: string, messageContext?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export const ScanForm: React.FC<ScanFormProps> = ({ onScan, isLoading, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [messageContext, setMessageContext] = useState('');
  const [showContextField, setShowContextField] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage('');
      }
    } catch {
      // In case clipboard permissions are denied
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMessage('Please paste or type a web address (e.g., https://example.com) to analyze.');
      return;
    }
    setErrorMessage('');
    onScan(url.trim(), messageContext.trim() || undefined);
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setUrl(preset.url);
    setMessageContext(preset.messageText);
    setShowContextField(true);
    setErrorMessage('');
    onScan(preset.url, preset.messageText);
  };

  const handleClear = () => {
    setUrl('');
    setMessageContext('');
    setErrorMessage('');
  };

  return (
    <div id="scanner-section" className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40 relative">
        <div className="flex flex-col gap-4">
          {/* Main URL Input Row */}
          <div>
            <label htmlFor="url-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Suspicious Link / URL
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Paste link from email, SMS, or WhatsApp (e.g. usps-track-fee.top/verify)"
                className="w-full pl-12 pr-28 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-sm sm:text-base rounded-xl font-mono transition-all outline-none"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear input"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  aria-label="Paste link from clipboard"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              </div>
            </div>
            {errorMessage && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Toggle for SMS/Email Context */}
          <div>
            {!showContextField ? (
              <button
                type="button"
                onClick={() => setShowContextField(true)}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>+ Include accompanying SMS or email text (detects urgency & social engineering)</span>
              </button>
            ) : (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="context-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Accompanying SMS / Email Message Text
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContextField(false);
                      setMessageContext('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  id="context-input"
                  rows={3}
                  value={messageContext}
                  onChange={(e) => setMessageContext(e.target.value)}
                  placeholder="e.g.: 'USPS: We tried to deliver your parcel but $2.95 fee is unpaid. Pay within 12 hours or package returned: http://...'"
                  className="w-full p-3 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 text-slate-200 placeholder-slate-500 text-xs sm:text-sm rounded-xl transition-all outline-none resize-none"
                />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Deep heuristic decomposition + AI threat intelligence</span>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Inspecting Link...</span>
                </>
              ) : (
                <>
                  <span>Inspect Link Safety</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preset Quick Tests Bar */}
      <div id="presets-section" className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick-Test Real Attack Scenarios & Safe Baselines
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_SCENARIOS.map((preset) => {
            const isPhish = preset.type === 'phishing';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                  isPhish
                    ? 'bg-slate-900/60 border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-300'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white truncate max-w-[90px]">{preset.brand}</span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isPhish ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isPhish ? 'Scam' : 'Safe'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{preset.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
