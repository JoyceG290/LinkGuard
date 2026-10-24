import React from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';

interface BrandComparisonCardProps {
  brandName: string;
  officialDomain: string;
  impostorHost: string;
  technique: string;
}

export const BrandComparisonCard: React.FC<BrandComparisonCardProps> = ({
  brandName,
  officialDomain,
  impostorHost,
  technique,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Brand Impersonation & Counterfeit Match
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare the authentic company infrastructure against the impostor link.
          </p>
        </div>
        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg">
          Target: {brandName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Genuine Official Entity */}
        <div className="p-5 bg-slate-950/70 border border-emerald-900/40 rounded-xl relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Legitimate Official Domain
            </span>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>

          <div className="text-base font-bold text-white mb-1">
            {brandName}
          </div>
          <div className="font-mono text-sm text-emerald-400 mb-3 truncate">
            https://{officialDomain}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The certified, cryptographically validated web presence maintained by {brandName}.
          </p>
        </div>

        {/* Malicious Impostor */}
        <div className="p-5 bg-slate-950/70 border border-rose-900/40 rounded-xl relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Impostor Destination
            </span>
            <span className="text-[10px] text-rose-300 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded">
              Fraudulent
            </span>
          </div>

          <div className="text-base font-bold text-white mb-1">
            Unauthorized Third-Party
          </div>
          <div className="font-mono text-sm text-rose-400 mb-3 truncate">
            {impostorHost}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Unregistered server controlled by threat actors. Designed to siphon personal information and payment credentials.
          </p>
        </div>
      </div>

      {/* Attack Methodology Callout */}
      <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Deception Mechanism
        </h4>
        <p className="text-sm text-slate-200">
          {technique}
        </p>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-emerald-400">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>
            Safe habit: Always type <strong className="font-mono">{officialDomain}</strong> directly into your browser address bar instead of clicking message links.
          </span>
        </div>
      </div>
    </div>
  );
};
