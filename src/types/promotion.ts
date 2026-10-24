/** Mirrors PromoteStudentsDto / PromotionResultDto in the backend's src/students/dto/bulk.dto.ts. */

/**
 * POST /students/promotions. Either toClassArmId or graduate, never both. Only ACTIVE
 * students in the source arm move; studentIds narrows it to a subset (max 500).
 */
export type PromoteStudentsInput = {
  fromClassArmId: string;
  toClassArmId?: string;
  graduate?: boolean; // marks them GRADUATED and clears their arm
  studentIds?: string[];
};

export type PromotionResult = {
  promoted: number;
  graduated: number;
  from: string | null; // "JSS1 A"
  to: string | null;
};
