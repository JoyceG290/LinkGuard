import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Share2, Check, Lock, Globe, ExternalLink } from 'lucide-react';
import { ScanResult } from '../types/scanner';

interface VerdictBannerProps {
  result: ScanResult;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const isCritical = result.level === 'critical';
  const isDangerous = result.level === 'dangerous';
  const isSuspicious = result.level === 'suspicious';
  const isSafe = result.level === 'safe';

  const badgeColor = isCritical || isDangerous
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isSuspicious
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const scoreTextColor = isCritical || isDangerous
    ? 'text-rose-400'
    : isSuspicious
    ? 'text-amber-400'
    : 'text-emerald-400';

  const barColor = isCritical || isDangerous
    ? 'bg-rose-500'
    : isSuspicious
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const handleCopySummary = async () => {
    const text = `[LinkShield Threat Analysis]
Target: ${result.urlDecomposition.cleanedUrl}
Verdict: ${result.title} (Threat Index: ${result.score}/100)
Status: ${result.level.toUpperCase()}
Diagnosis: ${result.summary}
Scanned: ${new Date(result.scannedAt).toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Threat Ribbon */}
      <div
        className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 ${
          isCritical || isDangerous
            ? 'bg-rose-950/40 border-rose-900/50'
            : isSuspicious
            ? 'bg-amber-950/40 border-amber-900/50'
            : 'bg-emerald-950/40 border-emerald-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {isCritical || isDangerous ? (
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
          ) : isSuspicious ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
              Inspection Verdict
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {result.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
            {result.level === 'critical'
              ? 'Malicious Phishing'
              : result.level === 'dangerous'
              ? 'High Threat'
              : result.level === 'suspicious'
              ? 'Proceed With Caution'
              : 'Verified Safe'}
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            title="Copy Report Summary to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Summary & Targeted Brand */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {result.impersonationMatch && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Active Brand Impersonation Alert
                </div>
                <div className="text-sm text-slate-200 mt-0.5">
                  This link attempts to mimic <strong>{result.impersonationMatch.brandName}</strong>.
                  However, the real destination is <strong>{result.urlDecomposition.registeredDomain}</strong>, not{' '}
                  <span className="text-emerald-400 font-mono underline">{result.impersonationMatch.officialDomain}</span>.
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Executive Diagnosis
            </h3>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Quick Technical Specs Strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Host:</span>
              <span className="font-mono text-slate-200">{result.urlDecomposition.hostname}</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Protocol:</span>
              <span className={`font-mono ${result.urlDecomposition.protocol === 'https' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.urlDecomposition.protocol.toUpperCase()}
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div>
              <span>TLD:</span>
              <span className="font-mono text-slate-200 ml-1">.{result.urlDecomposition.tld}</span>
            </div>
            {result.aiEnhanced && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-purple-400 font-medium">Gemini 3.8 Intelligence Verified</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Threat Index Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Threat Index Score
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight ${scoreTextColor}`}>
              {result.score}
            </span>
            <span className="text-slate-500 font-mono text-lg">/100</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 my-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(5, result.score)}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            {result.score >= 70
              ? 'High risk of credential theft, financial loss, or unauthorized account takeover.'
              : result.score >= 40
              ? 'Anomalies detected. Do not provide passwords or personal details.'
              : result.score >= 20
              ? 'Mild risk indicators present. Verify sender before interacting.'
              : 'Safe baseline: Verified legitimate domain structure and public trust signals.'}
          </p>
        </div>
      </div>
    </div>
  );
};
