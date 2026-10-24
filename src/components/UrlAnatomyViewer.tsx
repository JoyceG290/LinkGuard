import React from 'react';
import { UrlDecomposition } from '../utils/urlAnalyzer';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface UrlAnatomyViewerProps {
  decomposition: UrlDecomposition;
}

export const UrlAnatomyViewer: React.FC<UrlAnatomyViewerProps> = ({ decomposition }) => {
  const isHttps = decomposition.protocol === 'https';
  const hasSubdomain = decomposition.subdomains.length > 0;
  const subdomainStr = decomposition.subdomains.join('.');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Technical URL Anatomy Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Phishers manipulate domain structures to trick your eyes on mobile screens. Inspect each segment below.
          </p>
        </div>
      </div>

      {/* Segmented Color-Coded URL Bar */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs sm:text-sm overflow-x-auto whitespace-nowrap mb-6 flex items-center gap-1">
        {/* Protocol */}
        <span
          className={`px-2 py-1 rounded ${
            isHttps ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
          }`}
          title="Web Protocol"
        >
          {decomposition.protocol}://
        </span>

        {/* Subdomains */}
        {hasSubdomain && (
          <span
            className="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50"
            title="Subdomain (Often manipulated by attackers)"
          >
            {subdomainStr}.
          </span>
        )}

        {/* Root Domain */}
        <span
          className="px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 font-bold"
          title="Registered Root Domain (The true destination)"
        >
          {decomposition.registeredDomain.split('.')[0]}
        </span>

        {/* TLD */}
        <span
          className="px-2 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50"
          title="Top-Level Domain (TLD)"
        >
          .{decomposition.tld}
        </span>

        {/* Port if present */}
        {decomposition.port && (
          <span
            className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50"
            title="Port Number"
          >
            :{decomposition.port}
          </span>
        )}

        {/* Path & Query */}
        {(decomposition.pathname || decomposition.search) && (
          <span
            className="px-2 py-1 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40"
            title="Path & Query Parameters"
          >
            {decomposition.pathname}{decomposition.search}
          </span>
        )}
      </div>

      {/* Explanatory Grid of Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Protocol Card */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Protocol
            </span>
            {isHttps ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="font-mono text-sm font-semibold text-white mb-1">
            {decomposition.protocol.toUpperCase()}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isHttps
              ? 'Encrypted TLS connection. Note: modern phishing sites can also acquire free SSL certificates, so HTTPS alone does not prove legitimacy.'
              : 'Unencrypted plain HTTP! Any password, card number, or code you enter is broadcast in the clear.'}
          </p>
        </div>

        {/* Subdomain Card */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Subdomain Prefix
            </span>
            <Info className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-sm font-semibold text-amber-300 mb-1 truncate">
            {hasSubdomain ? subdomainStr : 'None (Apex Domain)'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {hasSubdomain
              ? 'Common scam trick: Attackers place a legitimate brand (like "usps.com" or "paypal.com") inside the subdomain prefix to confuse victims.'
              : 'Direct domain lookup with no prefix nesting.'}
          </p>
        </div>

        {/* Registered Root Domain */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              True Destination
            </span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Crucial</span>
          </div>
          <div className="font-mono text-sm font-semibold text-indigo-300 mb-1 truncate">
            {decomposition.registeredDomain}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            This is the ONLY domain the attacker actually purchased and controls. Regardless of what the subdomain says, your browser talks to this entity.
          </p>
        </div>

        {/* TLD Extension */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Top-Level Domain
            </span>
            <span className="font-mono text-xs text-purple-400">.{decomposition.tld}</span>
          </div>
          <div className="font-mono text-sm font-semibold text-purple-300 mb-1">
            .{decomposition.tld}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {['top', 'xyz', 'cc', 'click', 'buzz'].includes(decomposition.tld)
              ? 'High-abuse TLD frequently chosen by spammers for automated disposable domain cycling.'
              : 'Standard internet top-level domain namespace.'}
          </p>
        </div>
      </div>
    </div>
  );
};
