import test from 'node:test';
import assert from 'node:assert/strict';
import { mapVeylReportToScanResult } from './veylAdapter';
import { VeylScanReport } from '../types/scanner';

test('mapVeylReportToScanResult maps high-risk Veyl report correctly', () => {
  const sampleVeylReport: VeylScanReport = {
    submitted_url: 'http://usps.com.tracking-parcel.top/verify',
    host: 'usps.com.tracking-parcel.top',
    verdict: 'High risk signals',
    level: 'high',
    risk_score: 85,
    score_label: 'Rule signal points, not a probability',
    findings: [
      {
        title: 'Brand name outside its usual domain',
        detail: 'The host includes “usps” but does not end in a domain listed for that brand.',
        points: 26,
        severity: 'high',
      },
      {
        title: 'Unencrypted connection',
        detail: 'The link uses HTTP rather than HTTPS.',
        points: 6,
        severity: 'low',
      },
    ],
    recommendation: 'Avoid opening this link or entering information.',
    threat_intelligence: {
      provider: 'Google Safe Browsing',
      status: 'clean',
      label: 'No match returned',
      detail: null,
    },
    analysis_mode: 'Passive URL and message checks; destination not opened',
    agent: {
      status: 'ready',
      explanation: 'This link mimics USPS using subdomain masquerading on an unencrypted HTTP endpoint.',
      summary: 'High risk spoofing attempt.',
    },
    scanned_at: new Date().toISOString(),
  };

  const result = mapVeylReportToScanResult(sampleVeylReport);
  assert.equal(result.level, 'critical');
  assert.equal(result.score, 85);
  assert.equal(result.signals.length, 2);
  assert.equal(result.signals[0].category, 'impersonation');
  assert.equal(result.signals[1].category, 'protocol');
  assert.ok(result.aiEnhanced);
  assert.equal(result.backendSource, 'veyl_api');
});
