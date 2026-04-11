// ─────────────────────────────────────────────────────────────────────────────
// rfm.data.ts
// All dummy data for the Mulya Bazzar RFM system.

// ─────────────────────────────────────────────────────────────────────────────

import {
  Customer,
  SegmentSummary,
  MatrixCell,
  TriggerEvent,
  DriftRecord,
  SegmentDeltaSummary,
  ModelHealthSnapshot,
  ShapResult,
} from './rmf.type';
import { SegmentName } from './rmf.type';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_CUSTOMERS: Customer[] = [
  // ── Champions (R:4-5, F:4-5, M:4-5) ────────────────────────────────────────
  { id: 'c001', name: 'Aisha Patel',     email: 'aisha@example.com',   city: 'Mumbai',    segment: 'Champion', churnRisk: 'Low',      churnScore: 0.08, recencyScore: 5, frequencyScore: 5, monetaryScore: 5, rfmComposite: 5.0, totalOrders: 42, totalRevenue: 8400,  avgOrderValue: 200, lastPurchase: '2025-04-08', clv90Day: 2100, clvTier: 'Platinum', campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.08, emailOpenRate: 0.72, discountSensitivity: 0.20, sessionCount30d: 38, browseToBuyRatio: 0.65 },
  { id: 'c002', name: 'Raj Mehta',       email: 'raj@example.com',     city: 'Delhi',     segment: 'Champion', churnRisk: 'Low',      churnScore: 0.11, recencyScore: 5, frequencyScore: 5, monetaryScore: 4, rfmComposite: 4.7, totalOrders: 38, totalRevenue: 6840,  avgOrderValue: 180, lastPurchase: '2025-04-07', clv90Day: 1800, clvTier: 'Platinum', campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.10, emailOpenRate: 0.68, discountSensitivity: 0.18, sessionCount30d: 34, browseToBuyRatio: 0.60 },
  { id: 'c003', name: 'Lena Kovač',      email: 'lena@example.com',    city: 'Pune',      segment: 'Champion', churnRisk: 'Low',      churnScore: 0.09, recencyScore: 5, frequencyScore: 4, monetaryScore: 5, rfmComposite: 4.7, totalOrders: 35, totalRevenue: 9100,  avgOrderValue: 260, lastPurchase: '2025-04-06', clv90Day: 2400, clvTier: 'Platinum', campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.06, emailOpenRate: 0.80, discountSensitivity: 0.12, sessionCount30d: 40, browseToBuyRatio: 0.70 },
  { id: 'c004', name: 'Marco Rossi',     email: 'marco@example.com',   city: 'Bangalore', segment: 'Champion', churnRisk: 'Low',      churnScore: 0.13, recencyScore: 4, frequencyScore: 5, monetaryScore: 5, rfmComposite: 4.7, totalOrders: 40, totalRevenue: 7600,  avgOrderValue: 190, lastPurchase: '2025-04-05', clv90Day: 1950, clvTier: 'Platinum', campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.12, emailOpenRate: 0.65, discountSensitivity: 0.22, sessionCount30d: 32, browseToBuyRatio: 0.62 },
  { id: 'c005', name: 'Yuki Tanaka',     email: 'yuki@example.com',    city: 'Hyderabad', segment: 'Champion', churnRisk: 'Medium',   churnScore: 0.38, recencyScore: 4, frequencyScore: 5, monetaryScore: 5, rfmComposite: 4.7, totalOrders: 33, totalRevenue: 7200,  avgOrderValue: 218, lastPurchase: '2025-03-28', clv90Day: 1750, clvTier: 'Gold',     campaignType: 'Loyalty Reward',     topChurnDriver: 'Slight recency drop',      cartAbandonmentRate: 0.22, emailOpenRate: 0.50, discountSensitivity: 0.30, sessionCount30d: 18, browseToBuyRatio: 0.45 },
  { id: 'c006', name: 'Elif Demir',      email: 'elif@example.com',    city: 'Chennai',   segment: 'Champion', churnRisk: 'Low',      churnScore: 0.07, recencyScore: 5, frequencyScore: 5, monetaryScore: 4, rfmComposite: 4.7, totalOrders: 45, totalRevenue: 9000,  avgOrderValue: 200, lastPurchase: '2025-04-09', clv90Day: 2250, clvTier: 'Platinum', campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.05, emailOpenRate: 0.78, discountSensitivity: 0.15, sessionCount30d: 42, browseToBuyRatio: 0.72 },
  { id: 'c007', name: 'Priya Nair',      email: 'priya.n@example.com', city: 'Kolkata',   segment: 'Champion', churnRisk: 'Low',      churnScore: 0.10, recencyScore: 5, frequencyScore: 4, monetaryScore: 4, rfmComposite: 4.3, totalOrders: 30, totalRevenue: 6000,  avgOrderValue: 200, lastPurchase: '2025-04-04', clv90Day: 1600, clvTier: 'Gold',     campaignType: 'Loyalty Reward',     topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.09, emailOpenRate: 0.70, discountSensitivity: 0.20, sessionCount30d: 28, browseToBuyRatio: 0.58 },

  // ── Loyal (R:3-4, F:3-4, M:3-4) ─────────────────────────────────────────────
  { id: 'c008', name: 'Sofia Andersen',  email: 'sofia@example.com',   city: 'Mumbai',    segment: 'Loyal',    churnRisk: 'Low',      churnScore: 0.18, recencyScore: 4, frequencyScore: 4, monetaryScore: 4, rfmComposite: 4.0, totalOrders: 22, totalRevenue: 3300,  avgOrderValue: 150, lastPurchase: '2025-04-01', clv90Day: 900,  clvTier: 'Gold',     campaignType: 'Upsell / Nurture',   topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.18, emailOpenRate: 0.55, discountSensitivity: 0.35, sessionCount30d: 20, browseToBuyRatio: 0.48 },
  { id: 'c009', name: 'Chen Wei',        email: 'chen@example.com',    city: 'Delhi',     segment: 'Loyal',    churnRisk: 'Low',      churnScore: 0.22, recencyScore: 4, frequencyScore: 3, monetaryScore: 4, rfmComposite: 3.7, totalOrders: 18, totalRevenue: 2700,  avgOrderValue: 150, lastPurchase: '2025-03-26', clv90Day: 750,  clvTier: 'Gold',     campaignType: 'Upsell / Nurture',   topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.20, emailOpenRate: 0.52, discountSensitivity: 0.38, sessionCount30d: 16, browseToBuyRatio: 0.44 },
  { id: 'c010', name: 'Emma Larsson',    email: 'emma@example.com',    city: 'Pune',      segment: 'Loyal',    churnRisk: 'Medium',   churnScore: 0.41, recencyScore: 3, frequencyScore: 4, monetaryScore: 4, rfmComposite: 3.7, totalOrders: 20, totalRevenue: 3200,  avgOrderValue: 160, lastPurchase: '2025-03-20', clv90Day: 850,  clvTier: 'Gold',     campaignType: 'Upsell / Nurture',   topChurnDriver: 'Cart abandonment rising',  cartAbandonmentRate: 0.38, emailOpenRate: 0.40, discountSensitivity: 0.48, sessionCount30d: 12, browseToBuyRatio: 0.32 },
  { id: 'c011', name: 'James Osei',      email: 'james@example.com',   city: 'Bangalore', segment: 'Loyal',    churnRisk: 'Medium',   churnScore: 0.45, recencyScore: 3, frequencyScore: 3, monetaryScore: 4, rfmComposite: 3.3, totalOrders: 16, totalRevenue: 2560,  avgOrderValue: 160, lastPurchase: '2025-03-15', clv90Day: 680,  clvTier: 'Silver',   campaignType: 'Upsell / Nurture',   topChurnDriver: 'Frequency decline',        cartAbandonmentRate: 0.40, emailOpenRate: 0.38, discountSensitivity: 0.50, sessionCount30d: 10, browseToBuyRatio: 0.30 },
  { id: 'c012', name: 'Priya Sharma',    email: 'priya@example.com',   city: 'Hyderabad', segment: 'Loyal',    churnRisk: 'Medium',   churnScore: 0.49, recencyScore: 3, frequencyScore: 3, monetaryScore: 3, rfmComposite: 3.0, totalOrders: 14, totalRevenue: 1960,  avgOrderValue: 140, lastPurchase: '2025-03-12', clv90Day: 520,  clvTier: 'Silver',   campaignType: 'Upsell / Nurture',   topChurnDriver: 'Session frequency drop',   cartAbandonmentRate: 0.42, emailOpenRate: 0.35, discountSensitivity: 0.52, sessionCount30d: 9,  browseToBuyRatio: 0.28 },
  { id: 'c013', name: 'Bruno Ferreira',  email: 'bruno@example.com',   city: 'Chennai',   segment: 'Loyal',    churnRisk: 'Low',      churnScore: 0.25, recencyScore: 4, frequencyScore: 4, monetaryScore: 3, rfmComposite: 3.7, totalOrders: 19, totalRevenue: 2850,  avgOrderValue: 150, lastPurchase: '2025-03-25', clv90Day: 760,  clvTier: 'Gold',     campaignType: 'Upsell / Nurture',   topChurnDriver: 'Stable engagement',        cartAbandonmentRate: 0.22, emailOpenRate: 0.50, discountSensitivity: 0.36, sessionCount30d: 17, browseToBuyRatio: 0.46 },
  { id: 'c014', name: 'Amina Yusuf',     email: 'amina@example.com',   city: 'Kolkata',   segment: 'Loyal',    churnRisk: 'Medium',   churnScore: 0.43, recencyScore: 3, frequencyScore: 3, monetaryScore: 3, rfmComposite: 3.0, totalOrders: 13, totalRevenue: 1820,  avgOrderValue: 140, lastPurchase: '2025-03-10', clv90Day: 490,  clvTier: 'Silver',   campaignType: 'Upsell / Nurture',   topChurnDriver: 'Email engagement drop',    cartAbandonmentRate: 0.36, emailOpenRate: 0.36, discountSensitivity: 0.46, sessionCount30d: 10, browseToBuyRatio: 0.31 },

  // ── Potential (R:3, F:2-3, M:2-3) ───────────────────────────────────────────
  { id: 'c015', name: 'Carlos Reyes',    email: 'carlos@example.com',  city: 'Mumbai',    segment: 'Potential', churnRisk: 'Medium',  churnScore: 0.42, recencyScore: 3, frequencyScore: 2, monetaryScore: 3, rfmComposite: 2.7, totalOrders: 8,  totalRevenue: 960,   avgOrderValue: 120, lastPurchase: '2025-03-18', clv90Day: 320,  clvTier: 'Silver',   campaignType: 'Category Nudge',     topChurnDriver: 'Low purchase frequency',   cartAbandonmentRate: 0.52, emailOpenRate: 0.30, discountSensitivity: 0.60, sessionCount30d: 8,  browseToBuyRatio: 0.22 },
  { id: 'c016', name: 'Fatima Hassan',   email: 'fatima@example.com',  city: 'Delhi',     segment: 'Potential', churnRisk: 'Medium',  churnScore: 0.50, recencyScore: 3, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.3, totalOrders: 6,  totalRevenue: 720,   avgOrderValue: 120, lastPurchase: '2025-03-10', clv90Day: 240,  clvTier: 'Silver',   campaignType: 'Category Nudge',     topChurnDriver: 'Browse-only sessions',     cartAbandonmentRate: 0.60, emailOpenRate: 0.28, discountSensitivity: 0.65, sessionCount30d: 7,  browseToBuyRatio: 0.18 },
  { id: 'c017', name: 'Ivan Petrov',     email: 'ivan@example.com',    city: 'Pune',      segment: 'Potential', churnRisk: 'High',    churnScore: 0.58, recencyScore: 2, frequencyScore: 3, monetaryScore: 3, rfmComposite: 2.7, totalOrders: 10, totalRevenue: 1400,  avgOrderValue: 140, lastPurchase: '2025-02-28', clv90Day: 380,  clvTier: 'Silver',   campaignType: 'Category Nudge',     topChurnDriver: 'Recency decline',          cartAbandonmentRate: 0.58, emailOpenRate: 0.25, discountSensitivity: 0.68, sessionCount30d: 6,  browseToBuyRatio: 0.20 },
  { id: 'c018', name: 'Amara Diallo',    email: 'amara@example.com',   city: 'Bangalore', segment: 'Potential', churnRisk: 'Medium',  churnScore: 0.47, recencyScore: 3, frequencyScore: 2, monetaryScore: 3, rfmComposite: 2.7, totalOrders: 7,  totalRevenue: 980,   avgOrderValue: 140, lastPurchase: '2025-03-14', clv90Day: 300,  clvTier: 'Bronze',   campaignType: 'Category Nudge',     topChurnDriver: 'Low email engagement',     cartAbandonmentRate: 0.55, emailOpenRate: 0.28, discountSensitivity: 0.62, sessionCount30d: 7,  browseToBuyRatio: 0.20 },
  { id: 'c019', name: 'Rin Yamada',      email: 'rin@example.com',     city: 'Hyderabad', segment: 'Potential', churnRisk: 'High',    churnScore: 0.56, recencyScore: 2, frequencyScore: 3, monetaryScore: 2, rfmComposite: 2.3, totalOrders: 9,  totalRevenue: 990,   avgOrderValue: 110, lastPurchase: '2025-02-26', clv90Day: 260,  clvTier: 'Bronze',   campaignType: 'Category Nudge',     topChurnDriver: 'Recency declining',        cartAbandonmentRate: 0.56, emailOpenRate: 0.26, discountSensitivity: 0.66, sessionCount30d: 5,  browseToBuyRatio: 0.19 },
  { id: 'c020', name: 'Karan Mehta',     email: 'karan@example.com',   city: 'Chennai',   segment: 'Potential', churnRisk: 'Medium',  churnScore: 0.44, recencyScore: 3, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.3, totalOrders: 5,  totalRevenue: 600,   avgOrderValue: 120, lastPurchase: '2025-03-08', clv90Day: 200,  clvTier: 'Bronze',   campaignType: 'Category Nudge',     topChurnDriver: 'Low order frequency',      cartAbandonmentRate: 0.54, emailOpenRate: 0.29, discountSensitivity: 0.64, sessionCount30d: 6,  browseToBuyRatio: 0.21 },

  // ── At Risk (R:1-2, F:2-3, M:2-3) ───────────────────────────────────────────
  { id: 'c021', name: 'Hiroshi Yamamoto',email: 'hiroshi@example.com', city: 'Mumbai',    segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.65, recencyScore: 2, frequencyScore: 2, monetaryScore: 3, rfmComposite: 2.3, totalOrders: 12, totalRevenue: 1680,  avgOrderValue: 140, lastPurchase: '2025-02-18', clv90Day: 420,  clvTier: 'Silver',   campaignType: 'Discount Rescue',    topChurnDriver: 'No purchase 50 days',      cartAbandonmentRate: 0.65, emailOpenRate: 0.20, discountSensitivity: 0.72, sessionCount30d: 4,  browseToBuyRatio: 0.14 },
  { id: 'c022', name: 'Nadia Kowalski',  email: 'nadia@example.com',   city: 'Delhi',     segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.68, recencyScore: 2, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.0, totalOrders: 9,  totalRevenue: 1080,  avgOrderValue: 120, lastPurchase: '2025-02-14', clv90Day: 270,  clvTier: 'Bronze',   campaignType: 'Discount Rescue',    topChurnDriver: 'Sessions halved',          cartAbandonmentRate: 0.68, emailOpenRate: 0.18, discountSensitivity: 0.74, sessionCount30d: 3,  browseToBuyRatio: 0.12 },
  { id: 'c023', name: 'Omar Abdullah',   email: 'omar@example.com',    city: 'Pune',      segment: 'At Risk',  churnRisk: 'Critical', churnScore: 0.74, recencyScore: 1, frequencyScore: 2, monetaryScore: 3, rfmComposite: 2.0, totalOrders: 14, totalRevenue: 2100,  avgOrderValue: 150, lastPurchase: '2025-02-04', clv90Day: 350,  clvTier: 'Silver',   campaignType: 'Discount Rescue',    topChurnDriver: 'High cart abandonment',    cartAbandonmentRate: 0.74, emailOpenRate: 0.14, discountSensitivity: 0.78, sessionCount30d: 2,  browseToBuyRatio: 0.10 },
  { id: 'c024', name: 'Selin Yıldız',   email: 'selin@example.com',   city: 'Bangalore', segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.62, recencyScore: 2, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.0, totalOrders: 8,  totalRevenue: 960,   avgOrderValue: 120, lastPurchase: '2025-02-16', clv90Day: 230,  clvTier: 'Bronze',   campaignType: 'Discount Rescue',    topChurnDriver: '3 emails unopened',        cartAbandonmentRate: 0.62, emailOpenRate: 0.15, discountSensitivity: 0.70, sessionCount30d: 3,  browseToBuyRatio: 0.11 },
  { id: 'c025', name: 'Lucas Müller',    email: 'lucas@example.com',   city: 'Hyderabad', segment: 'At Risk',  churnRisk: 'Critical', churnScore: 0.78, recencyScore: 1, frequencyScore: 1, monetaryScore: 3, rfmComposite: 1.7, totalOrders: 11, totalRevenue: 1980,  avgOrderValue: 180, lastPurchase: '2025-01-26', clv90Day: 280,  clvTier: 'Silver',   campaignType: 'Discount Rescue',    topChurnDriver: 'No sessions 60 days',      cartAbandonmentRate: 0.78, emailOpenRate: 0.10, discountSensitivity: 0.80, sessionCount30d: 1,  browseToBuyRatio: 0.08 },
  { id: 'c026', name: 'Mei Lin',         email: 'mei@example.com',     city: 'Chennai',   segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.60, recencyScore: 2, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.0, totalOrders: 7,  totalRevenue: 840,   avgOrderValue: 120, lastPurchase: '2025-02-20', clv90Day: 200,  clvTier: 'Bronze',   campaignType: 'Discount Rescue',    topChurnDriver: 'Support ticket spike',     cartAbandonmentRate: 0.60, emailOpenRate: 0.18, discountSensitivity: 0.72, sessionCount30d: 3,  browseToBuyRatio: 0.12 },
  { id: 'c027', name: 'Amelia Stone',    email: 'amelia@example.com',  city: 'Kolkata',   segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.63, recencyScore: 2, frequencyScore: 2, monetaryScore: 3, rfmComposite: 2.3, totalOrders: 13, totalRevenue: 1950,  avgOrderValue: 150, lastPurchase: '2025-02-10', clv90Day: 400,  clvTier: 'Silver',   campaignType: 'Discount Rescue',    topChurnDriver: 'Low email open rate',      cartAbandonmentRate: 0.63, emailOpenRate: 0.16, discountSensitivity: 0.71, sessionCount30d: 3,  browseToBuyRatio: 0.11 },
  { id: 'c028', name: 'Rohan Das',       email: 'rohan@example.com',   city: 'Mumbai',    segment: 'At Risk',  churnRisk: 'High',    churnScore: 0.67, recencyScore: 2, frequencyScore: 2, monetaryScore: 2, rfmComposite: 2.0, totalOrders: 8,  totalRevenue: 960,   avgOrderValue: 120, lastPurchase: '2025-02-12', clv90Day: 240,  clvTier: 'Bronze',   campaignType: 'Discount Rescue',    topChurnDriver: 'WoW sessions down 60%',    cartAbandonmentRate: 0.67, emailOpenRate: 0.17, discountSensitivity: 0.73, sessionCount30d: 2,  browseToBuyRatio: 0.10 },
  { id: 'c029', name: 'Kenji Watanabe',  email: 'kenji@example.com',   city: 'Delhi',     segment: 'At Risk',  churnRisk: 'Critical', churnScore: 0.72, recencyScore: 1, frequencyScore: 2, monetaryScore: 2, rfmComposite: 1.7, totalOrders: 10, totalRevenue: 1200,  avgOrderValue: 120, lastPurchase: '2025-01-30', clv90Day: 300,  clvTier: 'Bronze',   campaignType: 'Discount Rescue',    topChurnDriver: 'No purchase 70 days',      cartAbandonmentRate: 0.72, emailOpenRate: 0.12, discountSensitivity: 0.76, sessionCount30d: 1,  browseToBuyRatio: 0.09 },

  // ── Dormant (R:1, F:1, M:1-2) ───────────────────────────────────────────────
  { id: 'c030', name: 'Ahmed Khalil',    email: 'ahmed@example.com',   city: 'Pune',      segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.88, recencyScore: 1, frequencyScore: 1, monetaryScore: 2, rfmComposite: 1.3, totalOrders: 4,  totalRevenue: 480,   avgOrderValue: 120, lastPurchase: '2024-12-08', clv90Day: 60,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'No activity 120 days',     cartAbandonmentRate: 0.88, emailOpenRate: 0.06, discountSensitivity: 0.85, sessionCount30d: 0,  browseToBuyRatio: 0.04 },
  { id: 'c031', name: 'Ingrid Holm',     email: 'ingrid@example.com',  city: 'Bangalore', segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.91, recencyScore: 1, frequencyScore: 1, monetaryScore: 1, rfmComposite: 1.0, totalOrders: 2,  totalRevenue: 200,   avgOrderValue: 100, lastPurchase: '2024-11-18', clv90Day: 20,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'No sessions 150 days',     cartAbandonmentRate: 0.90, emailOpenRate: 0.04, discountSensitivity: 0.88, sessionCount30d: 0,  browseToBuyRatio: 0.02 },
  { id: 'c032', name: 'David Kim',       email: 'david@example.com',   city: 'Hyderabad', segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.85, recencyScore: 1, frequencyScore: 1, monetaryScore: 2, rfmComposite: 1.3, totalOrders: 3,  totalRevenue: 360,   avgOrderValue: 120, lastPurchase: '2024-12-23', clv90Day: 40,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'Zero engagement 90 days',  cartAbandonmentRate: 0.86, emailOpenRate: 0.05, discountSensitivity: 0.84, sessionCount30d: 0,  browseToBuyRatio: 0.03 },
  { id: 'c033', name: 'Zara Johnson',    email: 'zara@example.com',    city: 'Chennai',   segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.93, recencyScore: 1, frequencyScore: 1, monetaryScore: 1, rfmComposite: 1.0, totalOrders: 1,  totalRevenue: 95,    avgOrderValue: 95,  lastPurchase: '2024-11-03', clv90Day: 10,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'Single purchase user',     cartAbandonmentRate: 0.92, emailOpenRate: 0.03, discountSensitivity: 0.90, sessionCount30d: 0,  browseToBuyRatio: 0.02 },
  { id: 'c034', name: 'Mateus Costa',    email: 'mateus@example.com',  city: 'Kolkata',   segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.89, recencyScore: 1, frequencyScore: 1, monetaryScore: 2, rfmComposite: 1.3, totalOrders: 5,  totalRevenue: 600,   avgOrderValue: 120, lastPurchase: '2024-11-29', clv90Day: 50,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'No response to 5 campaigns', cartAbandonmentRate: 0.89, emailOpenRate: 0.05, discountSensitivity: 0.86, sessionCount30d: 0,  browseToBuyRatio: 0.03 },
  { id: 'c035', name: 'Kwame Asante',    email: 'kwame@example.com',   city: 'Mumbai',    segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.87, recencyScore: 1, frequencyScore: 1, monetaryScore: 2, rfmComposite: 1.3, totalOrders: 3,  totalRevenue: 330,   avgOrderValue: 110, lastPurchase: '2024-12-13', clv90Day: 35,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'No activity 115 days',     cartAbandonmentRate: 0.87, emailOpenRate: 0.05, discountSensitivity: 0.85, sessionCount30d: 0,  browseToBuyRatio: 0.03 },
  { id: 'c036', name: 'Nour Al-Rashid',  email: 'nour@example.com',    city: 'Delhi',     segment: 'Dormant',  churnRisk: 'Critical', churnScore: 0.90, recencyScore: 1, frequencyScore: 1, monetaryScore: 1, rfmComposite: 1.0, totalOrders: 2,  totalRevenue: 180,   avgOrderValue: 90,  lastPurchase: '2024-11-10', clv90Day: 18,   clvTier: 'Bronze',   campaignType: 'Win-back or Sunset', topChurnDriver: 'No login 130 days',        cartAbandonmentRate: 0.91, emailOpenRate: 0.04, discountSensitivity: 0.87, sessionCount30d: 0,  browseToBuyRatio: 0.02 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT SUMMARIES  

// ─────────────────────────────────────────────────────────────────────────────

function buildSummaries(customers: Customer[]): SegmentSummary[] {
  const segments: SegmentName[] = ['Champion', 'Loyal', 'Potential', 'At Risk', 'Dormant'];
  const config: Record<SegmentName, Omit<SegmentSummary, 'segment' | 'count' | 'percentage' | 'avgChurnScore' | 'avgRevenue' | 'totalRevenue' | 'campaignType'>> = {
    Champion:  { emoji: '🥇', colorClass: 'bg-amber-500',   ringClass: 'ring-amber-400',   textClass: 'text-amber-600',   bgClass: 'bg-amber-50'   },
    Loyal:     { emoji: '🟢', colorClass: 'bg-emerald-500', ringClass: 'ring-emerald-400', textClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
    Potential: { emoji: '🔵', colorClass: 'bg-blue-500',    ringClass: 'ring-blue-400',    textClass: 'text-blue-600',    bgClass: 'bg-blue-50'    },
    'At Risk': { emoji: '🟡', colorClass: 'bg-orange-500',  ringClass: 'ring-orange-400',  textClass: 'text-orange-600',  bgClass: 'bg-orange-50'  },
    Dormant:   { emoji: '🔴', colorClass: 'bg-rose-600',    ringClass: 'ring-rose-500',    textClass: 'text-rose-600',    bgClass: 'bg-rose-50'    },
  };
  const campaignMap: Record<SegmentName, SegmentSummary['campaignType']> = {
    Champion: 'Loyalty Reward', Loyal: 'Upsell / Nurture',
    Potential: 'Category Nudge', 'At Risk': 'Discount Rescue', Dormant: 'Win-back or Sunset',
  };
  const total = customers.length;
  return segments.map(seg => {
    const group = customers.filter(c => c.segment === seg);
    const count = group.length;
    const totalRevenue = group.reduce((s, c) => s + c.totalRevenue, 0);
    return {
      segment: seg,
      count,
      percentage: Math.round((count / total) * 100),
      avgChurnScore: group.reduce((s, c) => s + c.churnScore, 0) / (count || 1),
      avgRevenue: Math.round(totalRevenue / (count || 1)),
      totalRevenue,
      campaignType: campaignMap[seg],
      ...config[seg],
    };
  });
}

export const SEGMENT_SUMMARIES: SegmentSummary[] = buildSummaries(DUMMY_CUSTOMERS);

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN DECISION MATRIX

// ─────────────────────────────────────────────────────────────────────────────

export const CAMPAIGN_MATRIX: MatrixCell[] = [
  { segment: 'Champion',  churnRisk: 'Low',      action: 'Referral program + exclusive access',  discountDepth: '0%',   channels: ['Email', 'Push'],                urgencyLevel: 4 },
  { segment: 'Champion',  churnRisk: 'Medium',   action: 'Personalised loyalty reward',           discountDepth: '5%',   channels: ['Email', 'Push'],                urgencyLevel: 3 },
  { segment: 'Champion',  churnRisk: 'High',     action: 'VIP personal outreach',                 discountDepth: '10%',  channels: ['Email', 'Push', 'SMS'],         urgencyLevel: 2 },
  { segment: 'Champion',  churnRisk: 'Critical', action: 'VIP Rescue — premium offer',            discountDepth: '15%',  channels: ['Email', 'Push', 'SMS', 'Call'], urgencyLevel: 1 },
  { segment: 'Loyal',     churnRisk: 'Low',      action: 'Cross-sell new arrivals',               discountDepth: '0%',   channels: ['Email'],                        urgencyLevel: 4 },
  { segment: 'Loyal',     churnRisk: 'Medium',   action: 'Personalised category upsell',          discountDepth: '5%',   channels: ['Email', 'Push'],                urgencyLevel: 3 },
  { segment: 'Loyal',     churnRisk: 'High',     action: 'Urgent win-back — 48h offer',           discountDepth: '20%',  channels: ['Email', 'Push'],                urgencyLevel: 2 },
  { segment: 'Loyal',     churnRisk: 'Critical', action: 'Heavy discount + free delivery',        discountDepth: '25%',  channels: ['Email', 'Push', 'SMS'],         urgencyLevel: 1 },
  { segment: 'Potential', churnRisk: 'Low',      action: 'Category-targeted email',               discountDepth: '0%',   channels: ['Email'],                        urgencyLevel: 4 },
  { segment: 'Potential', churnRisk: 'Medium',   action: 'Category nudge + small incentive',      discountDepth: '10%',  channels: ['Email', 'Push'],                urgencyLevel: 3 },
  { segment: 'Potential', churnRisk: 'High',     action: 'Targeted push + discount offer',        discountDepth: '15%',  channels: ['Push', 'Email'],                urgencyLevel: 2 },
  { segment: 'Potential', churnRisk: 'Critical', action: 'Deep discount — last activation',       discountDepth: '25%',  channels: ['Push', 'Email', 'SMS'],         urgencyLevel: 1 },
  { segment: 'At Risk',   churnRisk: 'Low',      action: 'Re-engagement email',                   discountDepth: '5%',   channels: ['Email'],                        urgencyLevel: 3 },
  { segment: 'At Risk',   churnRisk: 'Medium',   action: 'Discount rescue campaign',              discountDepth: '20%',  channels: ['Email', 'Push'],                urgencyLevel: 2 },
  { segment: 'At Risk',   churnRisk: 'High',     action: '25% off + free delivery urgency',       discountDepth: '25%',  channels: ['Email', 'Push', 'SMS'],         urgencyLevel: 1 },
  { segment: 'At Risk',   churnRisk: 'Critical', action: '30% off + cashback — critical',         discountDepth: '30%',  channels: ['Email', 'Push', 'SMS'],         urgencyLevel: 1 },
  { segment: 'Dormant',   churnRisk: 'Low',      action: 'Gentle re-activation email',            discountDepth: '10%',  channels: ['Email'],                        urgencyLevel: 3 },
  { segment: 'Dormant',   churnRisk: 'Medium',   action: 'Win-back deal offer',                   discountDepth: '20%',  channels: ['Email'],                        urgencyLevel: 2 },
  { segment: 'Dormant',   churnRisk: 'High',     action: 'Final chance email',                    discountDepth: '30%',  channels: ['Email'],                        urgencyLevel: 1 },
  { segment: 'Dormant',   churnRisk: 'Critical', action: 'Sunset or last chance deal',            discountDepth: '30%+', channels: ['Email'],                        urgencyLevel: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME TRIGGER EVENTS

// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_TRIGGERS: TriggerEvent[] = [
  { id: 't001', customerId: 'c023', customerName: 'Omar Abdullah',    email: 'omar@example.com',    type: 'score_critical',    timestamp: '2 min ago',  churnScore: 0.74, segment: 'At Risk',  urgency: 1, recommendedAction: 'Discount Rescue — 25% off',        status: 'pending'    },
  { id: 't002', customerId: 'c025', customerName: 'Lucas Müller',     email: 'lucas@example.com',   type: 'cart_abandoned',    timestamp: '5 min ago',  churnScore: 0.78, segment: 'At Risk',  urgency: 1, recommendedAction: 'Cart recovery push + 10% off',     status: 'launched'   },
  { id: 't003', customerId: 'c010', customerName: 'Emma Larsson',     email: 'emma@example.com',    type: 'segment_downgrade', timestamp: '12 min ago', churnScore: 0.41, segment: 'Loyal',    urgency: 2, recommendedAction: 'Upsell / Nurture email',           status: 'pending',   fromSegment: 'Champion', toSegment: 'Loyal'  },
  { id: 't004', customerId: 'c030', customerName: 'Ahmed Khalil',     email: 'ahmed@example.com',   type: 'emails_unopened',   timestamp: '18 min ago', churnScore: 0.88, segment: 'Dormant', urgency: 1, recommendedAction: 'Win-back or Sunset decision',      status: 'suppressed' },
  { id: 't005', customerId: 'c015', customerName: 'Carlos Reyes',     email: 'carlos@example.com',  type: 'cart_abandoned',    timestamp: '24 min ago', churnScore: 0.42, segment: 'Potential',urgency: 2, recommendedAction: 'Category nudge + 10% off',        status: 'launched'   },
  { id: 't006', customerId: 'c005', customerName: 'Yuki Tanaka',      email: 'yuki@example.com',    type: 'score_critical',    timestamp: '31 min ago', churnScore: 0.38, segment: 'Champion', urgency: 2, recommendedAction: 'Personal VIP outreach',            status: 'pending'    },
  { id: 't007', customerId: 'c031', customerName: 'Ingrid Holm',      email: 'ingrid@example.com',  type: 'user_returned',     timestamp: '45 min ago', churnScore: 0.91, segment: 'Dormant', urgency: 1, recommendedAction: 'Welcome-back flow — 30% off',      status: 'launched'   },
  { id: 't008', customerId: 'c017', customerName: 'Ivan Petrov',      email: 'ivan@example.com',    type: 'segment_downgrade', timestamp: '1 hr ago',   churnScore: 0.58, segment: 'Potential',urgency: 2, recommendedAction: 'Category nudge email',             status: 'pending',   fromSegment: 'Loyal', toSegment: 'Potential' },
  { id: 't009', customerId: 'c022', customerName: 'Nadia Kowalski',   email: 'nadia@example.com',   type: 'emails_unopened',   timestamp: '1.5 hr ago', churnScore: 0.68, segment: 'At Risk',  urgency: 1, recommendedAction: 'SMS discount rescue',               status: 'launched'   },
  { id: 't010', customerId: 'c035', customerName: 'Kwame Asante',     email: 'kwame@example.com',   type: 'score_critical',    timestamp: '2 hr ago',   churnScore: 0.87, segment: 'Dormant', urgency: 1, recommendedAction: 'Final chance — sunset or 30% off', status: 'suppressed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT DRIFT  (month-over-month migration between segments)

// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_DRIFT: DriftRecord[] = [
  { from: 'Champion',  to: 'Loyal',     count: 42,  period: '30d' },
  { from: 'Loyal',     to: 'Potential', count: 67,  period: '30d' },
  { from: 'Loyal',     to: 'At Risk',   count: 28,  period: '30d' },
  { from: 'Potential', to: 'At Risk',   count: 89,  period: '30d' },
  { from: 'At Risk',   to: 'Dormant',   count: 54,  period: '30d' },
  { from: 'Dormant',   to: 'At Risk',   count: 12,  period: '30d' }, 
  { from: 'At Risk',   to: 'Loyal',     count: 18,  period: '30d' }, 
];

export const DUMMY_SEGMENT_DELTAS: SegmentDeltaSummary[] = [
  { segment: 'Champion',  currentCount: 7,  previousCount: 6,  delta: 1,   deltaPercent: 16.7  },
  { segment: 'Loyal',     currentCount: 7,  previousCount: 9,  delta: -2,  deltaPercent: -22.2 },
  { segment: 'Potential', currentCount: 6,  previousCount: 5,  delta: 1,   deltaPercent: 20.0  },
  { segment: 'At Risk',   currentCount: 9,  previousCount: 7,  delta: 2,   deltaPercent: 28.6  },
  { segment: 'Dormant',   currentCount: 7,  previousCount: 6,  delta: 1,   deltaPercent: 16.7  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODEL HEALTH  

// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_MODEL_HEALTH: ModelHealthSnapshot[] = [
  { weekLabel: 'W6',  aucScore: 0.82, f1Score: 0.74, churnRate: 0.24, trainedOn: '2025-02-10' },
  { weekLabel: 'W7',  aucScore: 0.83, f1Score: 0.75, churnRate: 0.23, trainedOn: '2025-02-17' },
  { weekLabel: 'W8',  aucScore: 0.81, f1Score: 0.73, churnRate: 0.25, trainedOn: '2025-02-24' },
  { weekLabel: 'W9',  aucScore: 0.80, f1Score: 0.72, churnRate: 0.26, trainedOn: '2025-03-03' },
  { weekLabel: 'W10', aucScore: 0.84, f1Score: 0.76, churnRate: 0.22, trainedOn: '2025-03-10' },
  { weekLabel: 'W11', aucScore: 0.85, f1Score: 0.77, churnRate: 0.21, trainedOn: '2025-03-17' },
  { weekLabel: 'W12', aucScore: 0.83, f1Score: 0.75, churnRate: 0.22, trainedOn: '2025-03-24' },
  { weekLabel: 'W13', aucScore: 0.86, f1Score: 0.78, churnRate: 0.20, trainedOn: '2025-03-31' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHAP RESULTS  (per-customer explainability 
// API: GET /api/rfm/customer/:id/shap
// ─────────────────────────────────────────────────────────────────────────────

export const DUMMY_SHAP: Record<string, ShapResult> = {
  c023: { // Omar Abdullah — Critical
    customerId: 'c023', baseValue: 0.22, prediction: 0.74,
    features: [
      { featureKey: 'cart_abandonment_rate',   displayName: 'Cart Abandonment Rate',    impact:  0.28, actualValue: '74%',     description: 'Share of carts not converted to orders in the last 30 days.' },
      { featureKey: 'days_since_purchase',      displayName: 'Days Since Last Purchase', impact:  0.22, actualValue: '65 days', description: 'Number of days since the customer last completed a purchase.' },
      { featureKey: 'session_count_30d',        displayName: 'Sessions (30 days)',       impact:  0.14, actualValue: '2',       description: 'Number of app or web sessions in the last 30 days.' },
      { featureKey: 'email_open_rate',          displayName: 'Email Open Rate',          impact: -0.08, actualValue: '14%',    description: 'Percentage of marketing emails opened in the last 90 days.' },
      { featureKey: 'wow_purchase_delta',       displayName: 'WoW Purchase Delta',       impact:  0.10, actualValue: '-3',      description: 'Change in purchases this week vs. last week.' },
      { featureKey: 'discount_sensitivity',     displayName: 'Discount Sensitivity',     impact: -0.06, actualValue: '78%',    description: 'Percentage of past orders that used a discount or coupon.' },
    ],
  },
  c005: { // Yuki Tanaka — Medium risk Champion
    customerId: 'c005', baseValue: 0.22, prediction: 0.38,
    features: [
      { featureKey: 'days_since_purchase',      displayName: 'Days Since Last Purchase', impact:  0.10, actualValue: '17 days', description: 'Number of days since the customer last completed a purchase.' },
      { featureKey: 'session_count_30d',        displayName: 'Sessions (30 days)',       impact:  0.08, actualValue: '18',      description: 'Number of app or web sessions in the last 30 days.' },
      { featureKey: 'email_open_rate',          displayName: 'Email Open Rate',          impact: -0.12, actualValue: '50%',    description: 'Percentage of marketing emails opened in the last 90 days.' },
      { featureKey: 'cart_abandonment_rate',    displayName: 'Cart Abandonment Rate',    impact:  0.06, actualValue: '22%',     description: 'Share of carts not converted to orders in the last 30 days.' },
      { featureKey: 'discount_sensitivity',     displayName: 'Discount Sensitivity',     impact: -0.08, actualValue: '30%',    description: 'Percentage of past orders that used a discount or coupon.' },
      { featureKey: 'wow_purchase_delta',       displayName: 'WoW Purchase Delta',       impact:  0.04, actualValue: '-1',      description: 'Change in purchases this week vs. last week.' },
    ],
  },
};

// fallback SHAP for any customer not in the above map
export function getShapResult(customerId: string, churnScore: number): ShapResult {
  if (DUMMY_SHAP[customerId]) return DUMMY_SHAP[customerId];
  const isHighRisk = churnScore > 0.55;
  return {
    customerId, baseValue: 0.22, prediction: churnScore,
    features: [
      { featureKey: 'cart_abandonment_rate', displayName: 'Cart Abandonment Rate',    impact: isHighRisk ?  0.20 : -0.12, actualValue: isHighRisk ? '65%' : '15%',     description: 'Share of carts not converted to orders in the last 30 days.' },
      { featureKey: 'days_since_purchase',   displayName: 'Days Since Last Purchase', impact: isHighRisk ?  0.18 : -0.10, actualValue: isHighRisk ? '48 days' : '4 days', description: 'Number of days since the customer last completed a purchase.' },
      { featureKey: 'email_open_rate',       displayName: 'Email Open Rate',          impact: isHighRisk ?  0.12 : -0.15, actualValue: isHighRisk ? '12%' : '58%',      description: 'Percentage of marketing emails opened in the last 90 days.' },
      { featureKey: 'session_count_30d',     displayName: 'Sessions (30 days)',       impact: isHighRisk ?  0.10 : -0.08, actualValue: isHighRisk ? '3' : '24',         description: 'Number of app or web sessions in the last 30 days.' },
      { featureKey: 'wow_purchase_delta',    displayName: 'WoW Purchase Delta',       impact: isHighRisk ?  0.08 : -0.06, actualValue: isHighRisk ? '-2' : '+1',        description: 'Change in purchases this week vs. last week.' },
    ],
  };
}