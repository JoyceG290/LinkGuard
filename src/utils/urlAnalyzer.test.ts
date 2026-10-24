import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decomposeUrl,
  levenshteinDistance,
  detectHomoglyphs,
  isIpAddress,
  detectBrandImpersonation,
  analyzeUrlSafety,
  analyzePretext
} from './urlAnalyzer';

test('decomposeUrl parses typical URL accurately', () => {
  const decomp = decomposeUrl('https://portal.bankofamerica.com/login?session=123');
  assert.ok(decomp);
  assert.equal(decomp.protocol, 'https');
  assert.equal(decomp.hostname, 'portal.bankofamerica.com');
  assert.equal(decomp.registeredDomain, 'bankofamerica.com');
  assert.equal(decomp.tld, 'com');
  assert.deepEqual(decomp.subdomains, ['portal']);
});

test('detectBrandImpersonation catches subdomain masquerading', () => {
  // Attacker uses usps.com as a subdomain of malicious-server.top
  const decomp = decomposeUrl('http://usps.com.tracking-parcel.top/update');
  assert.ok(decomp);
  const match = detectBrandImpersonation(decomp);
  assert.ok(match);
  assert.equal(match.brandName, 'USPS');
  assert.equal(match.officialDomain, 'usps.com');
});

test('detectBrandImpersonation ignores legitimate official domain and subdomains', () => {
  const decomp = decomposeUrl('https://tools.usps.com/go/TrackConfirmAction');
  assert.ok(decomp);
  const match = detectBrandImpersonation(decomp);
  assert.equal(match, undefined);
});

test('detectBrandImpersonation flags typosquatting lookalikes', () => {
  const decomp = decomposeUrl('https://paypa1-security.xyz/signin');
  assert.ok(decomp);
  const match = detectBrandImpersonation(decomp);
  assert.ok(match);
  assert.equal(match.brandName, 'PayPal');
});

test('detectHomoglyphs catches Punycode domains', () => {
  assert.equal(detectHomoglyphs('xn--apple-43a.com'), true);
  assert.equal(detectHomoglyphs('apple.com'), false);
});

test('isIpAddress catches raw IP targets', () => {
  assert.equal(isIpAddress('192.168.1.1'), true);
  assert.equal(isIpAddress('45.33.32.156'), true);
  assert.equal(isIpAddress('google.com'), false);
});

test('analyzePretext identifies urgency and financial scare triggers in SMS text', () => {
  const sms = 'URGENT: USPS parcel on hold due to unpaid fee of $2.95. Settle within 24 hours or package returned.';
  const result = analyzePretext(sms);
  assert.equal(result.urgencyDetected, true);
  assert.equal(result.financialLureDetected, true);
});

test('analyzeUrlSafety yields high threat score for real-world phishing pattern', () => {
  const verdict = analyzeUrlSafety(
    'http://usps-parcel-redirection.top/verify?tracking=920192',
    'Your package delivery is pending. Pay fee immediately.'
  );
  assert.equal(verdict.level, 'critical');
  assert.ok(verdict.score >= 70);
  assert.ok(verdict.impersonationMatch);
  assert.equal(verdict.impersonationMatch.brandName, 'USPS');
});

test('analyzeUrlSafety marks genuine GitHub or Google as safe', () => {
  const verdict = analyzeUrlSafety('https://github.com/facebook/react');
  assert.equal(verdict.level, 'safe');
  assert.ok(verdict.score < 25);
});
