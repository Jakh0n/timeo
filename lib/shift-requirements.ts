import { api } from "@/lib/api";
import type { ShiftStatus } from "@/lib/dashboard";

export type ShiftRequirementListItem = {
  id: string;
  branchName: string;
  cycleLabel: string;
  status: ShiftStatus;
  submissionCount: number;
  createdAt: string;
};

export type ShiftRequirementDetail = ShiftRequirementListItem & {
  branchId: string;
  weekdayDayRequired: number;
  weekdayNightRequired: number;
  weekendDayRequired: number;
  weekendNightRequired: number;
  requiredSeniorPerShift: number;
  maxSeniorPerShift: number;
  shareUrl: string;
};

export type ShiftRequirementInput = {
  branchId: string;
  cycleLabel: string;
  weekdayDayRequired: number;
  weekdayNightRequired: number;
  weekendDayRequired: number;
  weekendNightRequired: number;
  requiredSeniorPerShift: number;
  maxSeniorPerShift: number;
};

export const shiftRequirementsQueryKey = ["shift-requirements"] as const;

export function shiftRequirementQueryKey(requirementId: string) {
  return ["shift-requirements", requirementId] as const;
}

export function fetchShiftRequirements(): Promise<ShiftRequirementListItem[]> {
  return api<ShiftRequirementListItem[]>("/api/shift-requirements");
}

export function fetchShiftRequirement(
  requirementId: string,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>(`/api/shift-requirements/${requirementId}`);
}

export function createShiftRequirement(
  input: ShiftRequirementInput,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>("/api/shift-requirements", {
    method: "POST",
    body: input,
  });
}

export function startCollecting(
  requirementId: string,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>(
    `/api/shift-requirements/${requirementId}/collect`,
    { method: "POST" },
  );
}
