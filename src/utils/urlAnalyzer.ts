/**
 * LinkShield Pure URL & Pretext Threat Analysis Engine
 */

export interface BrandTarget {
  name: string;
  officialDomain: string;
  category: 'Logistics' | 'Banking & Finance' | 'Tech & Cloud' | 'Streaming & Media' | 'Government & Telecom';
}

export const TARGETED_BRANDS: BrandTarget[] = [
  { name: 'USPS', officialDomain: 'usps.com', category: 'Logistics' },
  { name: 'UPS', officialDomain: 'ups.com', category: 'Logistics' },
  { name: 'FedEx', officialDomain: 'fedex.com', category: 'Logistics' },
  { name: 'DHL', officialDomain: 'dhl.com', category: 'Logistics' },
  { name: 'Amazon', officialDomain: 'amazon.com', category: 'Tech & Cloud' },
  { name: 'PayPal', officialDomain: 'paypal.com', category: 'Banking & Finance' },
  { name: 'Chase Bank', officialDomain: 'chase.com', category: 'Banking & Finance' },
  { name: 'Bank of America', officialDomain: 'bankofamerica.com', category: 'Banking & Finance' },
  { name: 'Wells Fargo', officialDomain: 'wellsfargo.com', category: 'Banking & Finance' },
  { name: 'Apple', officialDomain: 'apple.com', category: 'Tech & Cloud' },
  { name: 'Microsoft', officialDomain: 'microsoft.com', category: 'Tech & Cloud' },
  { name: 'Netflix', officialDomain: 'netflix.com', category: 'Streaming & Media' },
  { name: 'Google', officialDomain: 'google.com', category: 'Tech & Cloud' },
  { name: 'DocuSign', officialDomain: 'docusign.com', category: 'Tech & Cloud' },
  { name: 'Venmo', officialDomain: 'venmo.com', category: 'Banking & Finance' },
  { name: 'Coinbase', officialDomain: 'coinbase.com', category: 'Banking & Finance' },
  { name: 'IRS', officialDomain: 'irs.gov', category: 'Government & Telecom' },
  { name: 'AT&T', officialDomain: 'att.com', category: 'Government & Telecom' },
  { name: 'Verizon', officialDomain: 'verizon.com', category: 'Government & Telecom' },
];

export const HIGH_ABUSE_TLDS = new Set([
  'top', 'xyz', 'buzz', 'click', 'live', 'shop', 'work', 'rest', 'fit',
  'gq', 'cf', 'ml', 'tk', 'cc', 'cam', 'vip', 'monster', 'icu', 'sbs', 'cfd'
]);

export const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly', 'rb.gy', 'ow.ly', 'rebrand.ly', 'buff.ly', 'goo.gl'
]);

export interface ThreatSignal {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: 'protocol' | 'domain' | 'subdomain' | 'impersonation' | 'obfuscation' | 'pretext';
}

export interface UrlDecomposition {
  originalInput: string;
  cleanedUrl: string;
  protocol: string;
  hostname: string;
  port: string;
  subdomains: string[];
  registeredDomain: string;
  tld: string;
  pathname: string;
  search: string;
  hash: string;
}

export interface AnalysisVerdict {
  score: number; // 0 (safest) to 100 (most dangerous)
  level: 'safe' | 'suspicious' | 'dangerous' | 'critical';
  title: string;
  summary: string;
  urlDecomposition: UrlDecomposition;
  signals: ThreatSignal[];
  impersonationMatch?: {
    brandName: string;
    officialDomain: string;
    impostorHost: string;
    technique: string;
  };
  pretextSignals: {
    urgencyDetected: boolean;
    financialLureDetected: boolean;
    threatsOrScareDetected: boolean;
    snippets: string[];
  };
  recommendations: string[];
}

/**
 * Normalizes input text which might include quotes or leading/trailing whitespace
 */
export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  // Strip surrounding quotes or chevrons often found in emails (<http://...>)
  trimmed = trimmed.replace(/^["'<\[(]+|["'>\])]+$/g, '').trim();

  // If user pasted something like "hxxps://" or "hxxp://" used in security advisories
  trimmed = trimmed.replace(/^hxxp:\/\//i, 'http://');
  trimmed = trimmed.replace(/^hxxps:\/\//i, 'https://');

  if (!/^https?:\/\//i.test(trimmed)) {
    // If it looks like an IP or domain, prepend https://
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

/**
 * Parses and breaks down the URL safely
 */
export function decomposeUrl(rawInput: string): UrlDecomposition | null {
  try {
    const cleaned = normalizeUrl(rawInput);
    const parsed = new URL(cleaned);
    const hostname = parsed.hostname.toLowerCase();

    const parts = hostname.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : '';

    // Simple registered domain extraction
    let registeredDomain = hostname;
    const subdomains: string[] = [];

    if (parts.length >= 2) {
      // Check multi-part TLD like .co.uk or .com.br
      const secondLevel = parts.length >= 3 ? parts[parts.length - 2] : '';
      const isCountrySecond = ['co', 'com', 'org', 'net', 'gov', 'edu'].includes(secondLevel) && parts.length >= 3;

      if (isCountrySecond && parts.length >= 3) {
        registeredDomain = parts.slice(-3).join('.');
        subdomains.push(...parts.slice(0, -3));
      } else {
        registeredDomain = parts.slice(-2).join('.');
        subdomains.push(...parts.slice(0, -2));
      }
    }

    return {
      originalInput: rawInput,
      cleanedUrl: cleaned,
      protocol: parsed.protocol.replace(':', ''),
      hostname,
      port: parsed.port,
      subdomains,
      registeredDomain,
      tld,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    };
  } catch {
    return null;
  }
}

/**
 * Computes Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Checks for IP address hostnames
 */
export function isIpAddress(hostname: string): boolean {
  // IPv4 regex
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Pattern.test(hostname);
}

/**
 * Detects Punycode / IDN homoglyphs
 */
export function detectHomoglyphs(hostname: string): boolean {
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    return true;
  }
  // Check for non-ASCII characters that might resemble Latin letters
  // eslint-disable-next-line no-control-regex
  return /[^\u0000-\u007F]/.test(hostname);
}

/**
 * Normalizes common leetspeak substitutions used in typosquatting
 */
export function normalizeLeetspeak(str: string): string {
  return str
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/vv/g, 'w')
    .replace(/rn/g, 'm');
}

/**
 * Checks for brand impersonation across host, subdomains, and registered domain
 */
export function detectBrandImpersonation(decomp: UrlDecomposition) {
  const host = decomp.hostname;
  const registered = decomp.registeredDomain;
  const subdomainStr = decomp.subdomains.join('.');

  // If the registered domain belongs to ANY of our recognized official brands,
  // it is legitimate and should not be falsely flagged as a typosquat of another brand.
  const isRecognizedBrandOfficial = TARGETED_BRANDS.some(
    b => registered === b.officialDomain || host.endsWith('.' + b.officialDomain)
  );
  if (isRecognizedBrandOfficial) {
    return undefined;
  }

  const normalizedHost = normalizeLeetspeak(host);
  const normalizedRegistered = normalizeLeetspeak(registered);
  const normalizedSubdomain = normalizeLeetspeak(subdomainStr);
  const regBase = registered.split('.')[0];
  const normalizedRegBase = normalizeLeetspeak(regBase);

  for (const brand of TARGETED_BRANDS) {
    const brandLower = brand.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const officialBase = brand.officialDomain.split('.')[0];

    // Check Subdomain Masquerading:
    // e.g. paypal.com.attacker.com or usps.tracking.malicious.net or paypa1.com.scam.top
    if (
      subdomainStr.includes(officialBase) ||
      subdomainStr.includes(brandLower) ||
      normalizedSubdomain.includes(officialBase) ||
      normalizedSubdomain.includes(brandLower)
    ) {
      return {
        brandName: brand.name,
        officialDomain: brand.officialDomain,
        impostorHost: host,
        technique: `Subdomain deception: Fake subdomain contains '${brand.name}' while true destination is '${registered}'`
      };
    }

    // Check registered domain contains brand with hyphen / keywords / leetspeak
    // e.g. "usps-post-parcel.com", "netflix-verify.xyz", "appleid-support.info", "paypa1-security.xyz"
    if (
      regBase.includes(officialBase) ||
      regBase.includes(brandLower) ||
      normalizedRegBase.includes(officialBase) ||
      normalizedRegBase.includes(brandLower)
    ) {
      return {
        brandName: brand.name,
        officialDomain: brand.officialDomain,
        impostorHost: host,
        technique: `Lookalike domain: Registered domain '${registered}' falsely incorporates brand '${brand.name}'`
      };
    }

    // Check Typosquatting via Levenshtein distance on base domain name
    if (regBase.length >= 4 && Math.abs(regBase.length - officialBase.length) <= 2) {
      const dist = levenshteinDistance(regBase, officialBase);
      const normDist = levenshteinDistance(normalizedRegBase, officialBase);
      if (dist === 1 || normDist === 1 || (officialBase.length > 6 && (dist <= 2 || normDist <= 2))) {
        return {
          brandName: brand.name,
          officialDomain: brand.officialDomain,
          impostorHost: host,
          technique: `Typosquatting: Domain '${registered}' is 1-2 character typo of '${brand.officialDomain}'`
        };
      }
    }
  }

  return undefined;
}

/**
 * Evaluates message pretext / social engineering signals (SMS or email body)
 */
export function analyzePretext(messageContext?: string) {
  if (!messageContext || messageContext.trim().length === 0) {
    return {
      urgencyDetected: false,
      financialLureDetected: false,
      threatsOrScareDetected: false,
      snippets: []
    };
  }

  const text = messageContext.toLowerCase();
  const snippets: string[] = [];

  const urgencyKeywords = [
    'immediately', 'urgent', '24 hours', '12 hours', 'action required',
    'suspended within', 'final notice', 'expires today', 'last warning',
    'before account is closed', 'time sensitive', 'deadline'
  ];

  const financialKeywords = [
    'fee of', 'unpaid fee', '$', 'usd', 'eur', 'refund', 'invoice',
    'credit card', 'billing error', 'payment declined', 'claim your prize',
    'winner', 'bonus', 'lottery', 'package fee'
  ];

  const threatKeywords = [
    'account suspended', 'unauthorized login', 'security breach',
    'law enforcement', 'arrest', 'locked', 'compromised', 'fraud alert',
    'failure to verify', 'court notice'
  ];

  const urgencyDetected = urgencyKeywords.some(kw => {
    if (text.includes(kw)) {
      snippets.push(`Urgency cue: "${kw}"`);
      return true;
    }
    return false;
  });

  const financialLureDetected = financialKeywords.some(kw => {
    if (text.includes(kw)) {
      snippets.push(`Financial trigger: "${kw}"`);
      return true;
    }
    return false;
  });

  const threatsOrScareDetected = threatKeywords.some(kw => {
    if (text.includes(kw)) {
      snippets.push(`Fear / intimidation trigger: "${kw}"`);
      return true;
    }
    return false;
  });

  return {
    urgencyDetected,
    financialLureDetected,
    threatsOrScareDetected,
    snippets
  };
}

/**
 * Main pure rule engine for fast, deterministic link assessment
 */
export function analyzeUrlSafety(rawInput: string, messageContext?: string): AnalysisVerdict {
  const decomp = decomposeUrl(rawInput);
  if (!decomp) {
    return {
      score: 85,
      level: 'critical',
      title: 'Malformed or Invalid URL',
      summary: 'The submitted string could not be parsed as a valid web link. Attackers frequently use malformed URIs to trigger parser differential vulnerabilities.',
      urlDecomposition: {
        originalInput: rawInput,
        cleanedUrl: rawInput,
        protocol: 'unknown',
        hostname: 'invalid',
        port: '',
        subdomains: [],
        registeredDomain: 'invalid',
        tld: '',
        pathname: '',
        search: '',
        hash: '',
      },
      signals: [{
        id: 'malformed_url',
        severity: 'critical',
        title: 'Unparseable URL syntax',
        description: 'Target address fails standard URI specification parsing.',
        category: 'protocol',
      }],
      pretextSignals: {
        urgencyDetected: false,
        financialLureDetected: false,
        threatsOrScareDetected: false,
        snippets: [],
      },
      recommendations: [
        'Do not click or open this string in your web browser.',
        'Delete the email or SMS containing this malformed link.',
      ],
    };
  }

  const signals: ThreatSignal[] = [];
  let score = 5; // Base minimal score for baseline existence

  // 1. Protocol check
  if (decomp.protocol === 'http') {
    score += 20;
    signals.push({
      id: 'insecure_http',
      severity: 'high',
      title: 'Unencrypted HTTP Protocol',
      description: 'The link uses plain HTTP rather than encrypted HTTPS. Modern legitimate sites (banks, retailers, services) almost exclusively require HTTPS.',
      category: 'protocol',
    });
  }

  // 2. Non-standard port check
  if (decomp.port && !['80', '443'].includes(decomp.port)) {
    score += 25;
    signals.push({
      id: 'unusual_port',
      severity: 'high',
      title: `Unusual Port (:${decomp.port})`,
      description: `Traffic is directed to port ${decomp.port} rather than standard web ports (80/443). Phishing kits frequently host payloads on obscure ports.`,
      category: 'protocol',
    });
  }

  // 3. Raw IP Address check
  if (isIpAddress(decomp.hostname)) {
    score += 45;
    signals.push({
      id: 'raw_ip_host',
      severity: 'critical',
      title: 'Raw IP Address Hostname',
      description: 'The address points directly to a numeric IP address rather than a registered domain name, a hallmark tactic of phishing and malware command-and-control servers.',
      category: 'obfuscation',
    });
  }

  // 4. Homoglyphs / IDN Punycode
  if (detectHomoglyphs(decomp.hostname)) {
    score += 40;
    signals.push({
      id: 'punycode_homoglyph',
      severity: 'critical',
      title: 'Internationalized Homoglyph / Punycode Detected',
      description: 'The domain uses Punycode (xn--) or non-standard characters mimicking Latin letters (e.g. Cyrillic letters looking identical to Latin "a" or "o").',
      category: 'obfuscation',
    });
  }

  // 5. Shortener detection
  if (SHORTENER_DOMAINS.has(decomp.hostname) || SHORTENER_DOMAINS.has(decomp.registeredDomain)) {
    score += 25;
    signals.push({
      id: 'url_shortener',
      severity: 'medium',
      title: 'URL Shortener Concealment',
      description: `The link uses a shortening service (${decomp.hostname}) which conceals the ultimate target domain and landing page from your preview.`,
      category: 'obfuscation',
    });
  }

  // 6. High-abuse TLD
  if (HIGH_ABUSE_TLDS.has(decomp.tld)) {
    score += 30;
    signals.push({
      id: 'high_abuse_tld',
      severity: 'high',
      title: `Suspicious High-Abuse TLD (.${decomp.tld})`,
      description: `The top-level domain '.${decomp.tld}' is disproportionately associated with spam, phishing campaigns, and cheap throwaway domain registrations.`,
      category: 'domain',
    });
  }

  // 7. Excessive subdomains (subdomain sprawl)
  if (decomp.subdomains.length >= 3) {
    score += 15;
    signals.push({
      id: 'excessive_subdomains',
      severity: 'medium',
      title: 'Excessive Subdomain Depth',
      description: 'The link features 3 or more nested subdomains, often used to push the actual root domain off-screen on mobile devices.',
      category: 'subdomain',
    });
  }

  // 8. Brand Impersonation check
  const impersonation = detectBrandImpersonation(decomp);
  if (impersonation) {
    score += 50;
    signals.push({
      id: 'brand_impersonation',
      severity: 'critical',
      title: `Brand Impersonation: ${impersonation.brandName}`,
      description: impersonation.technique,
      category: 'impersonation',
    });
  }

  // 9. Sensitive keywords in path or query
  const fullPathAndQuery = (decomp.pathname + decomp.search).toLowerCase();
  const suspiciousKeywords = ['login', 'signin', 'verify', 'account-update', 'auth', 'passcode', 'security-check', 'parcel', 'invoice'];
  const matchedKeywords = suspiciousKeywords.filter(k => fullPathAndQuery.includes(k));
  if (matchedKeywords.length >= 2 && !['google.com', 'microsoft.com', 'apple.com', 'github.com'].includes(decomp.registeredDomain)) {
    score += 20;
    signals.push({
      id: 'credential_harvest_keywords',
      severity: 'medium',
      title: 'Credential Harvesting Pattern in URL Path',
      description: `The URL path or query contains sensitive authentication keywords: ${matchedKeywords.join(', ')}.`,
      category: 'domain',
    });
  }

  // 10. Pretext analysis (SMS / Email message context)
  const pretext = analyzePretext(messageContext);
  if (pretext.urgencyDetected) {
    score += 15;
    signals.push({
      id: 'pretext_urgency',
      severity: 'high',
      title: 'Social Engineering: Artificial Urgency',
      description: 'Message creates synthetic panic with tight deadlines to force emotional, hasty clicks.',
      category: 'pretext',
    });
  }
  if (pretext.financialLureDetected) {
    score += 15;
    signals.push({
      id: 'pretext_financial',
      severity: 'high',
      title: 'Social Engineering: Financial Hook / Small Fee Trap',
      description: 'Message references unpaid fees, prizes, or billing errors to entice immediate payment entry.',
      category: 'pretext',
    });
  }
  if (pretext.threatsOrScareDetected) {
    score += 20;
    signals.push({
      id: 'pretext_fear',
      severity: 'high',
      title: 'Social Engineering: Intimidation & Fear Appeals',
      description: 'Message threatens account closure, law enforcement, or security lockdown.',
      category: 'pretext',
    });
  }

  // Normalize score max 100
  score = Math.min(100, Math.max(0, score));

  // Determine Level & Title
  let level: AnalysisVerdict['level'] = 'safe';
  let title = 'Likely Safe Link';
  let summary = 'Our multi-vector analysis found no anomalous domain spoofing, typosquatting, deceptive subdomains, or high-abuse registrar indicators.';

  if (score >= 70) {
    level = 'critical';
    title = 'Dangerous Phishing Scam Detected';
    summary = impersonation
      ? `High-confidence phishing attack actively impersonating ${impersonation.brandName}. The true domain is '${decomp.registeredDomain}', NOT the real '${impersonation.officialDomain}'.`
      : 'Severe danger: Multiple high-confidence deception signals detected including brand spoofing, malicious hosting, or abusive infrastructure.';
  } else if (score >= 40) {
    level = 'dangerous';
    title = 'Suspicious & Potentially Malicious Link';
    summary = 'Significant warning indicators detected. The link presents anomalies such as deceptive domain structuring, insecure protocol, or high-risk TLD.';
  } else if (score >= 20) {
    level = 'suspicious';
    title = 'Uncertain / Caution Advised';
    summary = 'The link contains minor risk factors (such as a URL shortener or generic domain structure). Proceed with caution and verify the sender.';
  }

  // Generate tailored action recommendations
  const recommendations: string[] = [];
  if (level === 'critical' || level === 'dangerous') {
    recommendations.push('DO NOT click or open this link under any circumstances.');
    recommendations.push('DO NOT enter usernames, passwords, credit card numbers, or one-time passcodes (OTP).');
    if (impersonation) {
      recommendations.push(`If you need to access your ${impersonation.brandName} account, manually type 'https://${impersonation.officialDomain}' in your browser.`);
    }
    recommendations.push('Forward spam text messages to 7726 (SPAM) to alert cellular carriers.');
    recommendations.push('Delete the message and block the sender phone number or email.');
  } else if (level === 'suspicious') {
    recommendations.push('Verify the identity of the sender through a separate, known channel before clicking.');
    recommendations.push('Check the final destination before logging into any account.');
  } else {
    recommendations.push('This link appears consistent with standard legitimate infrastructure.');
    recommendations.push('Always confirm you see the lock icon and verified organization domain in your browser address bar.');
  }

  return {
    score,
    level,
    title,
    summary,
    urlDecomposition: decomp,
    signals,
    impersonationMatch: impersonation,
    pretextSignals: pretext,
    recommendations,
  };
}
