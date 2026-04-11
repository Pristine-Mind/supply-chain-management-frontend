// ─────────────────────────────────────────────────────────────────────────────
// rfm.types.ts
// Central type definitions for the Mulya Bazzar RFM analytics system
// ─────────────────────────────────────────────────────────────────────────────

// ── Segment & Risk ────────────────────────────────────────────────────────────

export type SegmentName = 'Champion' | 'Loyal' | 'Potential' | 'At Risk' | 'Dormant';

export type ChurnRisk = 'Low' | 'Medium' | 'High' | 'Critical';

export type CampaignType =
  | 'Loyalty Reward'
  | 'Upsell / Nurture'
  | 'Category Nudge'
  | 'Discount Rescue'
  | 'Win-back or Sunset';

export type Channel = 'Email' | 'Push' | 'SMS' | 'Call';

export type UrgencyLevel = 1 | 2 | 3 | 4; // 1 = highest urgency

export type CLVTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

// ── Core Customer ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;

  // RFM scores (1–5 each)
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmComposite: number; // weighted mean

  // Segment & churn
  segment: SegmentName;
  churnRisk: ChurnRisk;
  churnScore: number; // 0.0 – 1.0

  // Transactions
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastPurchase: string; // ISO date string e.g. "2025-03-08"

  // Predicted value
  clv90Day: number; // BG/NBD + Gamma-Gamma predicted revenue next 90 days
  clvTier: CLVTier;

  // Campaign assignment
  campaignType: CampaignType;
  topChurnDriver: string; // human-readable top SHAP feature

  // Behavioral signals (from spec Section 3.2)
  cartAbandonmentRate: number;   // 0–1
  emailOpenRate: number;         // 0–1
  discountSensitivity: number;   // 0–1
  sessionCount30d: number;
  browseToBuyRatio: number;      // 0–1
}

// ── Segment Summary (for cards + heatmap sidebar) ─────────────────────────────

export interface SegmentSummary {
  segment: SegmentName;
  emoji: string;
  count: number;
  percentage: number;
  avgChurnScore: number;
  avgRevenue: number;
  totalRevenue: number;
  campaignType: CampaignType;
  // Tailwind color classes
  colorClass: string;
  ringClass: string;
  textClass: string;
  bgClass: string;
}

// ── Heatmap Grid ──────────────────────────────────────────────────────────────

export interface HeatmapCell {
  recencyScore: number;    // 1–5
  frequencyScore: number;  // 1–5
  userCount: number;
  avgRevenue: number;
  avgOrderValue: number;
  segmentName: string;     // e.g. "Champions", "At Risk"
  segmentColor: string;    // hex
}

// ── Campaign Decision Matrix ──────────────────────────────────────────────────

export interface MatrixCell {
  segment: SegmentName;
  churnRisk: ChurnRisk;
  action: string;
  discountDepth: string;   // e.g. "20%", "0%"
  channels: Channel[];
  urgencyLevel: UrgencyLevel;
}

// ── SHAP Explainability (spec Section 5.4) ────────────────────────────────────

export interface ShapFeature {
  featureKey: string;       // e.g. "cart_abandonment_rate"
  displayName: string;      // e.g. "Cart Abandonment Rate"
  impact: number;           // SHAP value — positive pushes toward churn, negative protects
  actualValue: string;      // human-readable e.g. "74%" or "52 days"
  description: string;      // tooltip explanation
}

export interface ShapResult {
  customerId: string;
  baseValue: number;        // average model output (base churn rate)
  prediction: number;       // final predicted churn score
  features: ShapFeature[];  // sorted by |impact| descending
}

// ── Real-Time Trigger Events (spec Section 6.3) ───────────────────────────────

export type TriggerType =
  | 'cart_abandoned'       // cart abandoned, churn_prob > 0.60
  | 'score_critical'       // churn score just crossed 0.70
  | 'segment_downgrade'    // e.g. Champion → Loyal
  | 'user_returned'        // returned after 60+ days inactive
  | 'emails_unopened';     // 3 consecutive emails unopened

export type TriggerStatus = 'pending' | 'launched' | 'suppressed';

export interface TriggerEvent {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  type: TriggerType;
  timestamp: string;        // e.g. "2 min ago" (relative) or ISO string
  churnScore: number;
  segment: SegmentName;
  urgency: UrgencyLevel;
  recommendedAction: string;
  status: TriggerStatus;
  // only for segment_downgrade
  fromSegment?: SegmentName;
  toSegment?: SegmentName;
}

// ── Segment Drift  ─────────────────────────────────

export interface DriftRecord {
  from: SegmentName;
  to: SegmentName;
  count: number;
  period: '7d' | '30d' | '90d';
}

export interface SegmentDeltaSummary {
  segment: SegmentName;
  currentCount: number;
  previousCount: number;
  delta: number;           // positive = growing, negative = shrinking
  deltaPercent: number;
}

// ── Model Health  ─────────────────────────────────────────────

export interface ModelHealthSnapshot {
  weekLabel: string;       // e.g. "W12"
  aucScore: number;        // ROC-AUC, target > 0.80
  f1Score: number;
  churnRate: number;       // observed churn rate that week
  trainedOn: string;       // ISO date of last retraining
}

// ── Scatter / PCA point (K-Means Stage 2) ────────────────────────────────────

export interface ScatterPoint {
  customerId: string;
  name: string;
  pcaX: number;
  pcaY: number;
  segment: SegmentName;
  churnScore: number;
  clv90Day: number;
}