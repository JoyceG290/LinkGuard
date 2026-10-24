import { VeylScanReport, ScanResult, VeylFinding } from '../types/scanner';
import { decomposeUrl, ThreatSignal } from './urlAnalyzer';

/**
 * Maps Veyl's ScanReport contract to LinkShield ScanResult format
 */
export function mapVeylReportToScanResult(veyl: VeylScanReport, messageContext?: string): ScanResult {
  const decomp = decomposeUrl(veyl.submitted_url) || {
    originalInput: veyl.submitted_url,
    cleanedUrl: veyl.submitted_url,
    protocol: veyl.submitted_url.startsWith('https') ? 'https' : 'http',
    hostname: veyl.host,
    port: '',
    subdomains: [],
    registeredDomain: veyl.host,
    tld: veyl.host.split('.').pop() || '',
    pathname: '',
    search: '',
    hash: '',
  };

  // Convert Veyl findings to ThreatSignals
  const signals: ThreatSignal[] = veyl.findings.map((f: VeylFinding, idx: number) => {
    let category: ThreatSignal['category'] = 'domain';
    const lower = f.title.toLowerCase();
    if (lower.includes('unencrypted') || lower.includes('port')) category = 'protocol';
    else if (lower.includes('subdomain') || lower.includes('components')) category = 'subdomain';
    else if (lower.includes('brand')) category = 'impersonation';
    else if (lower.includes('ip') || lower.includes('punycode') || lower.includes('redirect')) category = 'obfuscation';
    else if (lower.includes('urgency') || lower.includes('sensitive') || lower.includes('message')) category = 'pretext';

    return {
      id: `veyl_finding_${idx}`,
      severity: f.severity === 'info' ? 'low' : f.severity,
      title: f.title,
      description: f.detail,
      category,
    };
  });

  // Level mapping
  let level: ScanResult['level'] = 'safe';
  if (veyl.level === 'high') level = 'critical';
  else if (veyl.level === 'medium') level = 'dangerous';
  else if (veyl.level === 'unknown') level = 'suspicious';

  // Check for brand impersonation in findings
  const brandFinding = veyl.findings.find(f => f.title.toLowerCase().includes('brand'));
  let impersonationMatch = undefined;
  if (brandFinding) {
    impersonationMatch = {
      brandName: 'Brand Target',
      officialDomain: 'Official Domain',
      impostorHost: veyl.host,
      technique: brandFinding.detail,
    };
  }

  return {
    score: veyl.risk_score,
    level,
    title: veyl.verdict || (level === 'critical' ? 'Dangerous Phishing Scam' : level === 'dangerous' ? 'Suspicious Link' : 'Safe Link'),
    summary: veyl.recommendation || 'Analysis completed by Veyl / LinkGuard engine.',
    urlDecomposition: decomp,
    signals,
    impersonationMatch,
    pretextSignals: {
      urgencyDetected: veyl.findings.some(f => f.title.toLowerCase().includes('urgency')),
      financialLureDetected: veyl.findings.some(f => f.title.toLowerCase().includes('payment') || f.title.toLowerCase().includes('account')),
      threatsOrScareDetected: veyl.findings.some(f => f.title.toLowerCase().includes('threat') || f.title.toLowerCase().includes('sensitive')),
      snippets: veyl.findings.filter(f => f.title.toLowerCase().includes('message') || f.title.toLowerCase().includes('urgency')).map(f => f.detail),
    },
    recommendations: [
      veyl.recommendation,
      ...(veyl.threat_intelligence.status === 'match' ? ['Google Safe Browsing reports this destination as a known malware or phishing threat.'] : []),
      'Verify any unexpected requests for credentials or payment through a trusted, independent channel.',
    ],
    aiEnhanced: !!(veyl.agent && veyl.agent.status === 'ready' && veyl.agent.explanation),
    aiInsights: veyl.agent && veyl.agent.explanation ? {
      scamType: veyl.verdict,
      targetEntity: veyl.host,
      confidenceScore: veyl.risk_score,
      detailedDiagnosis: veyl.agent.explanation,
      psychologicalTactics: [],
      technicalEvasionTechniques: veyl.findings.map(f => f.title),
      immediateSafetyActions: [veyl.recommendation],
    } : undefined,
    scannedAt: veyl.scanned_at || new Date().toISOString(),
    veylReport: veyl,
    backendSource: 'veyl_api',
  };
}
