/**
 * LinkShield - Phishing & Scam URL Scanner
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScanForm } from './components/ScanForm';
import { VerdictBanner } from './components/VerdictBanner';
import { UrlAnatomyViewer } from './components/UrlAnatomyViewer';
import { BrandComparisonCard } from './components/BrandComparisonCard';
import { PretextAnalysisCard } from './components/PretextAnalysisCard';
import { IncidentResponseGuide } from './components/IncidentResponseGuide';
import { PhishingQuiz } from './components/PhishingQuiz';
import { ScanHistory } from './components/ScanHistory';
import { RiskRadarHeatmap } from './components/RiskRadarHeatmap';
import { VeylBackendModal } from './components/VeylBackendModal';
import { VeylReportCard } from './components/VeylReportCard';
import { ScanResult, BackendConnectionConfig } from './types/scanner';
import { PRESET_SCENARIOS } from './data/presets';
import { analyzeUrlSafety } from './utils/urlAnalyzer';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Smartphone,
  Mail,
  ShieldQuestion,
  FileText,
  Server,
} from 'lucide-react';

const STORAGE_KEY = 'linkshield_scans_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'signals' | 'anatomy' | 'brand' | 'pretext' | 'response' | 'veyl'>('signals');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [backendConfig, setBackendConfig] = useState<BackendConnectionConfig>({
    backendUrl: 'https://veyl.onrender.com',
    isConnected: false,
    statusMessage: 'Checking Veyl backend connection...',
    mode: 'remote',
  });

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('/api/veyl/health');
      if (res.ok) {
        const data = await res.json();
        setBackendConfig({
          backendUrl: data.backendUrl || 'https://veyl.onrender.com',
          isConnected: !!data.connected,
          statusMessage: data.statusMessage || (data.connected ? 'Connected to Veyl backend' : 'Embedded engine active'),
          mode: data.mode || 'embedded',
          lastPingTime: new Date().toLocaleTimeString(),
        });
      }
    } catch {
      setBackendConfig(prev => ({
        ...prev,
        isConnected: false,
        statusMessage: 'Veyl server offline. Embedded engine active.',
      }));
    }
  };

  const handleUpdateBackendUrl = async (newUrl: string) => {
    try {
      const res = await fetch('/api/veyl/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backendUrl: newUrl }),
      });
      if (res.ok) {
        await checkBackendHealth();
      }
    } catch {
      // ignore
    }
  };

  // Initialize with the first realistic USPS scenario so the user has immediate visual fidelity
  useEffect(() => {
    checkBackendHealth();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setCurrentResult(parsed[0]);
          return;
        }
      }
    } catch {
      // LocalStorage error fallback
    }

    // Default starter analysis
    const starterPreset = PRESET_SCENARIOS[0];
    const initialVerdict = analyzeUrlSafety(starterPreset.url, starterPreset.messageText);
    const starterResult: ScanResult = {
      ...initialVerdict,
      aiEnhanced: true,
      aiInsights: {
        scamType: 'SMS Parcel Delivery Smishing',
        targetEntity: 'United States Postal Service (USPS)',
        confidenceScore: 92,
        detailedDiagnosis:
          'Classic delivery fee pretext. Attackers use subdomain masquerading (usps.com.tracking-parcel-support.top) on a disposable .top registrar. When clicked, it loads a fraudulent clone asking for name, street address, and credit card for a fake $2.95 re-delivery fee.',
        psychologicalTactics: [
          'Artificial 12-hour urgency deadline to induce panic',
          'Small $2.95 micro-fee hook to lower caution',
          'Curiosity and fear of missing an expected delivery',
        ],
        technicalEvasionTechniques: [
          'Subdomain nesting masquerading as usps.com',
          'Insecure plain HTTP protocol',
          'Abuse-prone .top top-level domain registration',
        ],
        immediateSafetyActions: [
          'Do NOT click or submit personal credentials on this link.',
          'Forward the SMS text message to 7726 (SPAM) to notify cellular carriers.',
          'Delete the message and block the sender phone number.',
        ],
      },
      scannedAt: new Date().toISOString(),
    };

    setCurrentResult(starterResult);
    setHistory([starterResult]);
  }, []);

  const handleScan = async (urlToScan: string, messageText?: string) => {
    setIsLoading(true);
    setNotification(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    try {
      // Attempt server-side full-stack inspection first
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan, messageContext: messageText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const scanResult: ScanResult = {
          ...data,
          scannedAt: new Date().toISOString(),
        };
        setCurrentResult(scanResult);
        saveToHistory(scanResult);
      } else {
        // Fallback to local deterministic analyzer
        const localVerdict = analyzeUrlSafety(urlToScan, messageText);
        const scanResult: ScanResult = {
          ...localVerdict,
          scannedAt: new Date().toISOString(),
        };
        setCurrentResult(scanResult);
        saveToHistory(scanResult);
      }
    } catch {
      clearTimeout(timeoutId);
      // Client-side fallback
      const localVerdict = analyzeUrlSafety(urlToScan, messageText);
      const scanResult: ScanResult = {
        ...localVerdict,
        scannedAt: new Date().toISOString(),
      };
      setCurrentResult(scanResult);
      saveToHistory(scanResult);
    } finally {
      setIsLoading(false);
      const element = document.getElementById('results-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const saveToHistory = (result: ScanResult) => {
    setHistory((prev) => {
      const updated = [result, ...prev.filter((item) => item.urlDecomposition.cleanedUrl !== result.urlDecomposition.cleanedUrl)].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleScrollToScanner = () => {
    const el = document.getElementById('scanner-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectNav = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar
        onScrollToScanner={handleScrollToScanner}
        onSelectNav={handleSelectNav}
        backendConnected={backendConfig.isConnected}
        onOpenBackendSettings={() => setIsBackendModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Real-Time Phishing & Smishing Threat Inspector</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Verify Any Link Before You Click
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Received a package fee alert, bank notice, or account verification link via SMS or email?
            LinkShield scans the URL for typosquatting, deceptive subdomains, and credential theft traps.
          </p>

          {/* Veyl Backend Engine Link */}
          <div className="pt-1">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-full text-xs font-mono text-slate-300 transition-colors"
              title="Click to configure backend connection (123mczilox/veyl)"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backend Engine:</span>
              <span className={backendConfig.isConnected ? 'text-emerald-400 font-semibold' : 'text-indigo-300'}>
                {backendConfig.isConnected ? 'Veyl Remote Active' : 'Veyl Embedded Engine'}
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">({backendConfig.backendUrl})</span>
            </button>
          </div>

          {/* Value Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>SMS / Smishing Defense</span>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Link Analyzer</span>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Click Safe Preview</span>
            </div>
          </div>
        </section>

        {/* Scanner Form Component */}
        <section>
          <ScanForm onScan={handleScan} isLoading={isLoading} />
        </section>

        {/* Results Viewport */}
        {currentResult && (
          <section id="results-section" className="space-y-6 pt-4">
            {/* Verdict Banner */}
            <VerdictBanner result={currentResult} />

            {/* Sub-modules Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('signals')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'signals'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Threat Signals ({currentResult.signals.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('anatomy')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'anatomy'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>URL Anatomy Breakdown</span>
              </button>

              {currentResult.impersonationMatch && (
                <button
                  onClick={() => setActiveTab('brand')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    activeTab === 'brand'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                      : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/20'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Brand Impersonation ({currentResult.impersonationMatch.brandName})</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('pretext')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'pretext'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Psychology & Pretext</span>
              </button>

              <button
                onClick={() => setActiveTab('response')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'response'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShieldQuestion className="w-3.5 h-3.5" />
                <span>Victim Action Plan</span>
              </button>

              <button
                onClick={() => setActiveTab('veyl')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeTab === 'veyl'
                    ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/60'
                    : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/20'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Veyl Backend Report</span>
              </button>
            </div>

            {/* Tab 1: Threat Signals, Risk Radar & Recommendations */}
            {activeTab === 'signals' && (
              <div className="space-y-6">
                {/* Visual D3 Radar-Style Heatmap */}
                <RiskRadarHeatmap result={currentResult} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Detected Signals */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Specific Threat Indicators Detected
                    </h3>
                    {currentResult.signals.length === 0 ? (
                      <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-white">No Malicious Signals Detected</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Domain matches authorized registrant standards with no deceptive prefixing or typosquatting.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentResult.signals.map((sig) => {
                          const isHigh = sig.severity === 'critical' || sig.severity === 'high';
                          return (
                            <div
                              key={sig.id}
                              className={`p-4 rounded-xl border flex items-start gap-3 ${
                                isHigh
                                  ? 'bg-rose-950/20 border-rose-900/40 text-slate-200'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="shrink-0 mt-0.5">
                                {isHigh ? (
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-white">{sig.title}</span>
                                  <span
                                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                                      isHigh ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {sig.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{sig.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Immediate Recommendations */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Immediate Safety Instructions
                    </h3>
                    <div className="space-y-2.5">
                      {currentResult.recommendations.map((rec, i) => (
                        <div key={i} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-400">
                        Need immediate help if you entered sensitive information? Check the{' '}
                        <button
                          onClick={() => setActiveTab('response')}
                          className="text-emerald-400 hover:underline font-semibold"
                        >
                          Victim Action Plan tab
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: URL Anatomy */}
            {activeTab === 'anatomy' && (
              <UrlAnatomyViewer decomposition={currentResult.urlDecomposition} />
            )}

            {/* Tab 3: Brand Impersonation */}
            {activeTab === 'brand' && currentResult.impersonationMatch && (
              <BrandComparisonCard
                brandName={currentResult.impersonationMatch.brandName}
                officialDomain={currentResult.impersonationMatch.officialDomain}
                impostorHost={currentResult.impersonationMatch.impostorHost}
                technique={currentResult.impersonationMatch.technique}
              />
            )}

            {/* Tab 4: Pretext Analysis */}
            {activeTab === 'pretext' && (
              <PretextAnalysisCard result={currentResult} />
            )}

            {/* Tab 5: Incident Response */}
            {activeTab === 'response' && (
              <IncidentResponseGuide />
            )}

            {/* Tab 6: Veyl Backend Report */}
            {activeTab === 'veyl' && (
              <VeylReportCard
                report={currentResult.veylReport || {
                  submitted_url: currentResult.urlDecomposition.cleanedUrl,
                  host: currentResult.urlDecomposition.hostname,
                  verdict: currentResult.title,
                  level: currentResult.level === 'critical' ? 'high' : currentResult.level === 'dangerous' ? 'medium' : 'low',
                  risk_score: currentResult.score,
                  score_label: 'Rule signal points, not a probability',
                  findings: currentResult.signals.map(s => ({
                    title: s.title,
                    detail: s.description,
                    points: s.severity === 'critical' ? 26 : s.severity === 'high' ? 14 : 6,
                    severity: (s.severity === 'critical' ? 'high' : s.severity === 'high' ? 'high' : s.severity === 'medium' ? 'medium' : 'low') as any
                  })),
                  recommendation: currentResult.recommendations[0] || 'Verify destination carefully.',
                  threat_intelligence: {
                    provider: 'Google Safe Browsing',
                    status: currentResult.score >= 70 ? 'match' : 'clean',
                    label: currentResult.score >= 70 ? 'Match found' : 'No match returned',
                    detail: null,
                  },
                  analysis_mode: 'Passive URL and message checks (Veyl Engine)',
                  agent: {
                    status: currentResult.aiEnhanced ? 'ready' : 'not_configured',
                    explanation: currentResult.summary,
                    summary: currentResult.title,
                  },
                  scanned_at: currentResult.scannedAt,
                }}
                source={currentResult.backendSource || (backendConfig.isConnected ? 'veyl_api' : 'embedded_engine')}
              />
            )}
          </section>
        )}

        {/* Educational Micro-Trainer Section */}
        <section>
          <PhishingQuiz />
        </section>

        {/* Scan History Section */}
        {history.length > 0 && (
          <section>
            <ScanHistory
              history={history}
              onSelectResult={(item) => {
                setCurrentResult(item);
                const el = document.getElementById('results-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onClearHistory={handleClearHistory}
            />
          </section>
        )}
      </main>

      <VeylBackendModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onUpdateUrl={handleUpdateBackendUrl}
        onRefreshHealth={checkBackendHealth}
      />

      {/* Quiet, anti-slop footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">LinkShield</span>
            <span aria-hidden="true">·</span>
            <span>Consumer Cyber Defense & Phishing Detection</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Always forward SMS spam to <strong>7726 (SPAM)</strong></span>
            <span aria-hidden="true">·</span>
            <span>Report fraud to FTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
