import React from 'react';
import { Clock, DollarSign, AlertOctagon, Brain, ShieldAlert } from 'lucide-react';
import { ScanResult } from '../types/scanner';

interface PretextAnalysisCardProps {
  result: ScanResult;
}

export const PretextAnalysisCard: React.FC<PretextAnalysisCardProps> = ({ result }) => {
  const { pretextSignals, aiInsights } = result;
  const hasSignals =
    pretextSignals.urgencyDetected ||
    pretextSignals.financialLureDetected ||
    pretextSignals.threatsOrScareDetected ||
    (aiInsights?.psychologicalTactics && aiInsights.psychologicalTactics.length > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Social Engineering & Pretext Psychology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Phishing relies on psychological manipulation to bypass rational caution before you even inspect the URL.
          </p>
        </div>
      </div>

      {!hasSignals ? (
        <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
          <p className="text-sm text-slate-400">
            No intense psychological pressure tactics detected, or no accompanying message text was supplied for this scan.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tip: Paste the SMS or email text alongside the link for deeper psychological trigger detection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tactic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgency */}
            <div
              className={`p-4 rounded-xl border ${
                pretextSignals.urgencyDetected
                  ? 'bg-rose-950/30 border-rose-800/50'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold tracking-wider text-rose-400">
                <Clock className="w-4 h-4" />
                <span>Synthetic Urgency</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pretextSignals.urgencyDetected
                  ? 'Imposes tight countdown deadlines ("within 12/24 hours") so your brain reacts with panic rather than analytical thought.'
                  : 'No strict countdown pressure identified.'}
              </p>
            </div>

            {/* Financial Trap */}
            <div
              className={`p-4 rounded-xl border ${
                pretextSignals.financialLureDetected
                  ? 'bg-amber-950/30 border-amber-800/50'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold tracking-wider text-amber-400">
                <DollarSign className="w-4 h-4" />
                <span>Micro-Fee / Lure Trap</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pretextSignals.financialLureDetected
                  ? 'Requests tiny fees ($1.99–$2.95) for fake re-delivery. Victims let their guard down because the amount is so small, but the site steals the full credit card number and CVV.'
                  : 'No specific financial pretext hook detected.'}
              </p>
            </div>

            {/* Fear & Intimidation */}
            <div
              className={`p-4 rounded-xl border ${
                pretextSignals.threatsOrScareDetected
                  ? 'bg-purple-950/30 border-purple-800/50'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold tracking-wider text-purple-400">
                <AlertOctagon className="w-4 h-4" />
                <span>Fear & Account Lock Threat</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pretextSignals.threatsOrScareDetected
                  ? 'Threatens account termination, frozen funds, or fraud alerts to leverage your instinct to protect your assets.'
                  : 'No overt punitive scare tactics identified.'}
              </p>
            </div>
          </div>

          {/* Extracted Cues */}
          {pretextSignals.snippets.length > 0 && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Flagged Linguistic Triggers in Message:
              </span>
              <div className="flex flex-wrap gap-2">
                {pretextSignals.snippets.map((snip, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg font-mono"
                  >
                    {snip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Deeper Insights if available */}
          {aiInsights?.psychologicalTactics && aiInsights.psychologicalTactics.length > 0 && (
            <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 block mb-2">
                Gemini Threat Intelligence Assessment:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {aiInsights.psychologicalTactics.map((tactic, idx) => (
                  <li key={idx}>{tactic}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
