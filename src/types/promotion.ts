export type PromotionStatus = "eligible" | "pending-review" | "ineligible";

export interface PromotionCandidate {
  id: string;
  name: string;
  displayId: string;
  gender: "Male" | "Female";
  averageScore: number;
  /** e.g. "Distinction", "Credit", "Pass (Borderline)", "Fail" — matches the "Academic Performance" column text. */
  performanceLabel: string;
  status: PromotionStatus;
}