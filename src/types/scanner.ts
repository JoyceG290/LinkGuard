import { AnalysisVerdict } from '../utils/urlAnalyzer';

export interface VeylFinding {
  title: string;
  detail: string;
  points: number;
  severity: 'info' | 'low' | 'medium' | 'high';
}

export interface VeylThreatIntelligence {
  provider: string;
  status: 'not_configured' | 'unavailable' | 'clean' | 'match';
  label: string;
  detail?: string | null;
}

export interface VeylAgentReview {
  status: 'not_configured' | 'missing_dependency' | 'ready';
  summary?: string;
  explanation?: string;
}

export interface VeylScanReport {
  submitted_url: string;
  host: string;
  verdict: string;
  level: 'unknown' | 'low' | 'medium' | 'high';
  risk_score: number;
  score_label: string;
  findings: VeylFinding[];
  recommendation: string;
  threat_intelligence: VeylThreatIntelligence;
  analysis_mode: string;
  agent?: VeylAgentReview;
  scanned_at: string;
}

export interface BackendConnectionConfig {
  backendUrl: string;
  isConnected: boolean;
  statusMessage: string;
  mode: 'remote' | 'local' | 'embedded';
  lastPingTime?: string;
}

export interface ScanResult extends AnalysisVerdict {
  aiEnhanced?: boolean;
  aiInsights?: {
    scamType: string;
    targetEntity: string;
    confidenceScore: number;
    detailedDiagnosis: string;
    psychologicalTactics: string[];
    technicalEvasionTechniques: string[];
    immediateSafetyActions: string[];
  };
  scannedAt: string;
  veylReport?: VeylScanReport;
  backendSource?: 'veyl_api' | 'veyl_render' | 'embedded_engine';
}

export interface PresetScenario {
  id: string;
  label: string;
  brand: string;
  type: 'phishing' | 'safe';
  url: string;
  messageText: string;
  description: string;
}
