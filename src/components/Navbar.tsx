import React from 'react';
import { Shield } from 'lucide-react';

interface NavbarProps {
  onScrollToScanner: () => void;
  onSelectNav: (sectionId: string) => void;
  backendConnected?: boolean;
  onOpenBackendSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onScrollToScanner,
  onSelectNav,
  backendConnected = false,
  onOpenBackendSettings,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single brand wordmark */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <span>LinkShield</span>
        </a>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectNav('scanner-section')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Scanner
          </button>
          <button
            onClick={() => onSelectNav('presets-section')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Sample Scams
          </button>
          <button
            onClick={() => onSelectNav('anatomy-section')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Phishing Anatomy
          </button>
          <button
            onClick={() => onSelectNav('guide-section')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Victim Defense Guide
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + Veyl backend connection status */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenBackendSettings && (
            <button
              onClick={onOpenBackendSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs font-mono text-slate-300 transition-colors whitespace-nowrap shrink-0"
              title="Veyl Backend Engine Connection (123mczilox/veyl)"
            >
              <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
              <span className="hidden sm:inline">Veyl Backend</span>
            </button>
          )}

          <button
            onClick={onScrollToScanner}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-emerald-500/20"
          >
            Scan a Link
          </button>
        </div>
      </div>
    </header>
  );
};
