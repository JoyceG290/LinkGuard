import 'dotenv/config';
import express from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { analyzeUrlSafety, AnalysisVerdict } from './src/utils/urlAnalyzer';
import { mapVeylReportToScanResult } from './src/utils/veylAdapter';
import { ScanResult, VeylScanReport } from './src/types/scanner';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Configurable Veyl backend endpoint (from https://github.com/123mczilox/veyl/tree/main/backend)
let currentVeylBackendUrl = (process.env.VEYL_BACKEND_URL || 'https://veyl.onrender.com').replace(/\/+$/, '');

interface ScanRequest {
  url: string;
  messageContext?: string;
}

// 1. Veyl Backend Health check & Status
app.get('/api/veyl/health', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Try /api/health or /health on Veyl backend
    const veylRes = await fetch(`${currentVeylBackendUrl}/api/health`, {
      signal: controller.signal,
    }).catch(async () => {
      return await fetch(`${currentVeylBackendUrl}/health`, { signal: controller.signal });
    });

    clearTimeout(timeoutId);

    if (veylRes && veylRes.ok) {
      const data = await veylRes.json().catch(() => ({}));
      res.json({
        connected: true,
        backendUrl: currentVeylBackendUrl,
        mode: currentVeylBackendUrl.includes('localhost') || currentVeylBackendUrl.includes('127.0.0.1') ? 'local' : 'remote',
        details: data,
        statusMessage: `Connected to Veyl backend at ${currentVeylBackendUrl}`,
      });
      return;
    }

    res.json({
      connected: false,
      backendUrl: currentVeylBackendUrl,
      mode: 'embedded',
      statusMessage: `Veyl remote instance at ${currentVeylBackendUrl} returned HTTP ${veylRes ? veylRes.status : 'offline'}. Embedded engine active.`,
    });
  } catch (err) {
    res.json({
      connected: false,
      backendUrl: currentVeylBackendUrl,
      mode: 'embedded',
      statusMessage: `Could not reach Veyl backend (${currentVeylBackendUrl}). Embedded engine active.`,
    });
  }
});

// 2. Configure Veyl Backend endpoint dynamically from UI
app.post('/api/veyl/configure', async (req, res) => {
  const { backendUrl } = req.body;
  if (!backendUrl || typeof backendUrl !== 'string' || !backendUrl.trim()) {
    res.status(400).json({ error: 'Please provide a valid backend URL.' });
    return;
  }

  currentVeylBackendUrl = backendUrl.trim().replace(/\/+$/, '');
  console.log(`Veyl backend target updated to: ${currentVeylBackendUrl}`);

  // Test ping
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const testRes = await fetch(`${currentVeylBackendUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    res.json({
      success: true,
      backendUrl: currentVeylBackendUrl,
      connected: testRes.ok,
    });
  } catch {
    res.json({
      success: true,
      backendUrl: currentVeylBackendUrl,
      connected: false,
      note: 'Saved, but could not immediately reach the host. Will fallback to embedded engine if needed.',
    });
  }
});

// 3. POST /api/scan endpoint with Veyl integration & local fallback
app.post('/api/scan', async (req, res) => {
  try {
    const { url, messageContext } = req.body as ScanRequest;

    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Please provide a valid URL to scan.' });
      return;
    }

    // Step A: Attempt to query the connected Veyl backend (FastAPI /api/scan)
    let veylReport: VeylScanReport | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${currentVeylBackendUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          message: messageContext ? messageContext.trim() : '',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        veylReport = await response.json();
      }
    } catch {
      // Veyl remote unavailable, seamlessly continue to embedded engine
    }

    // Step B: If Veyl backend answered, transform to our rich contract
    if (veylReport && veylReport.submitted_url) {
      const mappedResult = mapVeylReportToScanResult(veylReport, messageContext);

      // If Gemini AI is configured on this server and Veyl report didn't have an agent explanation, enrich it
      if (ai && (!veylReport.agent || veylReport.agent.status !== 'ready')) {
        let veylAiTimeoutId: NodeJS.Timeout | undefined;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            veylAiTimeoutId = setTimeout(() => reject(new Error('AI inspection timeout')), 6000);
          });
          const genPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Review this Veyl URL scanner report:
URL: ${mappedResult.urlDecomposition.cleanedUrl}
Risk Score: ${mappedResult.score}/100
Findings: ${mappedResult.signals.map(s => s.title).join(', ')}
Provide a concise 2-sentence plain-English safety summary for the victim.`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          const aiRes = await Promise.race([genPromise, timeoutPromise]);
          clearTimeout(veylAiTimeoutId);

          if (aiRes.text) {
            mappedResult.aiEnhanced = true;
            mappedResult.aiInsights = {
              scamType: mappedResult.title,
              targetEntity: mappedResult.urlDecomposition.hostname,
              confidenceScore: mappedResult.score,
              detailedDiagnosis: aiRes.text.trim(),
              psychologicalTactics: [],
              technicalEvasionTechniques: mappedResult.signals.map(s => s.title),
              immediateSafetyActions: mappedResult.recommendations,
            };
          }
        } catch {
          if (veylAiTimeoutId) clearTimeout(veylAiTimeoutId);
        }
      }

      res.json(mappedResult);
      return;
    }

    // Step C: Fallback to our embedded local engine (incorporates Veyl heuristics + Gemini 3.8 Flash)
    const baseVerdict = analyzeUrlSafety(url, messageContext);
    const enriched: ScanResult = {
      ...baseVerdict,
      aiEnhanced: false,
      backendSource: 'embedded_engine',
      scannedAt: new Date().toISOString(),
    };

    if (ai) {
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const prompt = `Analyze this potentially malicious URL and accompanying message text for cybersecurity threats, phishing scams, typosquatting, credential harvesting, brand impersonation, and social engineering manipulation:

Target URL: "${url}"
Decomposed Domain: "${baseVerdict.urlDecomposition.registeredDomain}"
Hostname: "${baseVerdict.urlDecomposition.hostname}"
Protocol: "${baseVerdict.urlDecomposition.protocol}"
Path: "${baseVerdict.urlDecomposition.pathname}"
Accompanying Message Text (SMS / Email Context): "${messageContext || 'No additional message context provided.'}"
Deterministic Threat Score: ${baseVerdict.score}/100

Perform expert threat intelligence analysis. Determine whether this is safe, suspicious, or dangerous phishing. Identify the targeted organization (if any), the deceptive psychological tactics, the technical evasion vectors, and clear step-by-step instructions for the victim.`;

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are an elite Senior Cybersecurity Threat Intelligence Analyst specializing in consumer phishing defense, smishing (SMS phishing), email spoofing, brand protection, and credential-theft countermeasures. Provide objective, high-accuracy analysis.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scamType: {
                  type: Type.STRING,
                  description: 'Category of scam or legitimate classification',
                },
                targetEntity: {
                  type: Type.STRING,
                  description: 'The entity being spoofed or represented',
                },
                confidenceScore: {
                  type: Type.NUMBER,
                  description: 'Risk score from 0 to 100',
                },
                detailedDiagnosis: {
                  type: Type.STRING,
                  description: 'Clear, plain-English breakdown of why this link is dangerous or safe',
                },
                psychologicalTactics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Social engineering triggers used',
                },
                technicalEvasionTechniques: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Technical evasion methods detected',
                },
                immediateSafetyActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Clear actionable steps for the user',
                },
              },
              required: [
                'scamType',
                'targetEntity',
                'confidenceScore',
                'detailedDiagnosis',
                'immediateSafetyActions',
              ],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('AI inspection timeout')), 10000);
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (response.text) {
          const aiData = JSON.parse(response.text);
          enriched.aiEnhanced = true;
          enriched.aiInsights = aiData;

          const blendedScore = Math.round((baseVerdict.score * 0.45) + (aiData.confidenceScore * 0.55));
          enriched.score = blendedScore;

          if (blendedScore >= 65) {
            enriched.level = 'critical';
            enriched.title = aiData.scamType.includes('Legitimate') ? 'Suspicious Link' : 'Dangerous Phishing Scam Detected';
          } else if (blendedScore >= 40) {
            enriched.level = 'dangerous';
            enriched.title = 'High Risk / Likely Phishing';
          } else if (blendedScore >= 20) {
            enriched.level = 'suspicious';
            enriched.title = 'Unverified / Caution Advised';
          } else {
            enriched.level = 'safe';
            enriched.title = 'Verified Safe Link';
          }

          if (aiData.detailedDiagnosis) {
            enriched.summary = aiData.detailedDiagnosis;
          }

          if (aiData.immediateSafetyActions && aiData.immediateSafetyActions.length > 0) {
            enriched.recommendations = aiData.immediateSafetyActions;
          }
        }
      } catch {
        if (timeoutId) clearTimeout(timeoutId);
        console.info('Deterministic heuristic scan active (AI enhancement deferred).');
      }
    }

    res.json(enriched);
  } catch (error) {
    console.error('Error during URL scan:', error);
    res.status(500).json({ error: 'Failed to complete URL analysis.' });
  }
});

// Compatibility with Veyl's POST /analyze endpoint
app.post('/analyze', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message required' });
    return;
  }
  const result = analyzeUrlSafety(message, message);
  res.json({
    status: 'success',
    verdict_report: result.summary,
    risk_assessment: {
      score: result.score,
      risk_level: result.level,
      evidence: result.signals.map(s => s.description),
    },
    urls: [result.urlDecomposition],
  });
});

// App Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    veylBackendUrl: currentVeylBackendUrl,
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Dev vs Production Vite handler
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkShield & Veyl Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`Targeting Veyl backend at: ${currentVeylBackendUrl}`);
  });
}

startServer();
