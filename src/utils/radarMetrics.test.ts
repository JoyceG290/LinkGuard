import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRadarRiskCategories } from './radarMetrics';
import { analyzeUrlSafety } from './urlAnalyzer';

test('calculateRadarRiskCategories generates high risk for phishing attack with http, abuse TLD, and impersonation', () => {
  const verdict = analyzeUrlSafety(
    'http://usps.com.tracking-parcel.top/verify',
    'URGENT: Settle $2.95 fee within 12 hours.'
  );
  const scanResult = {
    ...verdict,
    scannedAt: new Date().toISOString()
  };

  const categories = calculateRadarRiskCategories(scanResult);
  assert.equal(categories.length, 6);

  const domainAge = categories.find(c => c.key === 'domainAge')!;
  const ssl = categories.find(c => c.key === 'sslValidity')!;
  const registrar = categories.find(c => c.key === 'registrarReputation')!;
  const brand = categories.find(c => c.key === 'brandSimilarity')!;

  assert.ok(domainAge.score >= 75);
  assert.ok(ssl.score >= 80); // http
  assert.ok(registrar.score >= 75); // .top TLD
  assert.ok(brand.score >= 80); // USPS impersonation
});

test('calculateRadarRiskCategories generates low risk for legitimate HTTPS domain', () => {
  const verdict = analyzeUrlSafety('https://support.google.com/accounts');
  const scanResult = {
    ...verdict,
    scannedAt: new Date().toISOString()
  };

  const categories = calculateRadarRiskCategories(scanResult);
  const ssl = categories.find(c => c.key === 'sslValidity')!;
  const domainAge = categories.find(c => c.key === 'domainAge')!;

  assert.ok(ssl.score <= 15);
  assert.ok(domainAge.score <= 15);
});
