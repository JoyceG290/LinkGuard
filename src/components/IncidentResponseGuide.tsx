import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, Smartphone, CheckSquare, ExternalLink } from 'lucide-react';

export const IncidentResponseGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clicked' | 'entered_pwd' | 'entered_card'>('entered_pwd');

  return (
    <div id="guide-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Victim Defense & Incident Response Action Plan
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step triage guide if you or someone you know interacted with a phishing link.
          </p>
        </div>

        {/* Action scenario tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('clicked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'clicked'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Just Clicked Link
          </button>
          <button
            onClick={() => setActiveTab('entered_pwd')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'entered_pwd'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entered Password
          </button>
          <button
            onClick={() => setActiveTab('entered_card')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'entered_card'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entered Credit Card
          </button>
        </div>
      </div>

      {/* Tab 1: Just clicked */}
      {activeTab === 'clicked' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              1. Close the browser tab immediately
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Do not click any buttons, download files, or accept notifications. Merely viewing a standard phishing page rarely compromises a device unless you download executable software.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              2. Clear recent browser cache & cookies
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clear your browser cache for the last hour to purge any tracking pixels, session redirect cookies, or cached scripts.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              3. Check your Downloads folder
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ensure the page did not silently drop an `.apk`, `.exe`, `.dmg`, or `.iso` file. If a file was downloaded, delete it immediately without opening it.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Entered password */}
      {activeTab === 'entered_pwd' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl">
            <h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              1. Immediately change password on the REAL service
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Go to the official website by typing the official address directly into your browser bar. Change your password immediately.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              2. Revoke and log out of all active sessions
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Most major services (Google, Microsoft, Banks, Apple) have a "Sign out of all other sessions / devices" button in Security Settings. Click it to invalidate hijacked session tokens.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              3. Enable Two-Factor Authentication (2FA / MFA)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prefer Authenticator apps (Google Authenticator, Microsoft Authenticator) or hardware security keys over SMS verification.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              4. Change passwords on any other accounts sharing that password
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you reuse that password on other accounts (email, social media, shopping), attackers will automatically test credentials against them (credential stuffing).
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Entered credit card */}
      {activeTab === 'entered_card' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl">
            <h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-400" />
              1. Lock or freeze your card in your banking app immediately
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open your bank mobile app and toggle "Freeze Card" or "Lock Card" right now. This instantly halts unauthorized transactions.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              2. Call your card issuer's fraud hotline
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Call the number on the back of your physical card. State: "I accidentally submitted my card details to a phishing scam website. Please cancel this card and reissue a replacement."
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              3. Review recent transactions for micro-charges
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scammers often test stolen cards with tiny $0.50 or $1.00 charges before executing larger purchases.
            </p>
          </div>
        </div>
      )}

      {/* Reporting channels */}
      <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <span>Received as SMS? Forward the spam message to <strong>7726 (SPAM)</strong> for carrier investigation.</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-emerald-400">
          <a
            href="https://reportfraud.ftc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            Report to FTC <ExternalLink className="w-3 h-3" />
          </a>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <a
            href="https://safebrowsing.google.com/safebrowsing/report_phish/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            Report to Google Safe Browsing <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
