import type { Page } from "./management";
export const tierLabels: Record<string, string> = {
  basic: "Basic",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};
export interface LoyaltySettings {
  environment: "sandbox";
  version: number;
  tiers: { code: string; minXp: string }[];
  updatedAt: string | null;
  updatedBy: string | null;
}
export interface LoyaltyPlayer {
  id: string;
  displayName: string;
  email: string;
  xp: string;
  version: number;
  tier: string;
  tierName: string;
  nextTier: string | null;
  xpToNext: string;
  progressPercent: number;
}
export interface XpEntry {
  id: string;
  deltaXp: string;
  beforeXp: string;
  afterXp: string;
  reason: string;
  adminName: string;
  createdAt: string;
}
export interface LoyaltyDetails {
  player: LoyaltyPlayer;
  history: Page<XpEntry>;
}
export const displayXp = (value: string) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
