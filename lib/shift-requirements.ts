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

export function updateShiftRequirement(
  requirementId: string,
  input: ShiftRequirementInput,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>(`/api/shift-requirements/${requirementId}`, {
    method: "PATCH",
    body: input,
  });
}

export type SubmissionListItem = {
  workerName: string;
  employeeId: string;
  submittedAt: string;
};

export type SubmissionList = {
  count: number;
  submissions: SubmissionListItem[];
};

export type ScheduleChip = {
  id: string;
  workerName: string;
  employeeId: string;
};

export type ScheduleCandidate = {
  workerName: string;
  employeeId: string;
};

export type ScheduleSlot = {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  shiftType: "DAY" | "NIGHT";
  startHour: number;
  endHour: number;
  requiredTotal: number;
  assignments: ScheduleChip[];
  reason: string | null;
  candidates: ScheduleCandidate[];
};

export function submissionsQueryKey(requirementId: string) {
  return ["shift-requirements", requirementId, "submissions"] as const;
}

export function scheduleQueryKey(requirementId: string) {
  return ["shift-requirements", requirementId, "schedule"] as const;
}

export function fetchSubmissions(requirementId: string): Promise<SubmissionList> {
  return api<SubmissionList>(`/api/shift-requirements/${requirementId}/submissions`);
}

export function fetchSchedule(requirementId: string): Promise<ScheduleSlot[]> {
  return api<ScheduleSlot[]>(`/api/shift-requirements/${requirementId}/schedule`);
}

export function generateSchedule(
  requirementId: string,
): Promise<{ status: "ok" | "infeasible" }> {
  return api(`/api/shift-requirements/${requirementId}/generate`, {
    method: "POST",
  });
}

export function confirmSchedule(
  requirementId: string,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>(
    `/api/shift-requirements/${requirementId}/confirm`,
    { method: "POST" },
  );
}

export function reopenSchedule(
  requirementId: string,
): Promise<ShiftRequirementDetail> {
  return api<ShiftRequirementDetail>(
    `/api/shift-requirements/${requirementId}/reopen`,
    { method: "POST" },
  );
}

export function addAssignment(
  requirementId: string,
  input: { employeeId: string; day: ScheduleSlot["day"]; shiftType: ScheduleSlot["shiftType"] },
): Promise<ScheduleSlot[]> {
  return api<ScheduleSlot[]>(`/api/shift-requirements/${requirementId}/assignments`, {
    method: "POST",
    body: input,
  });
}

export function removeAssignment(
  requirementId: string,
  assignmentId: string,
): Promise<ScheduleSlot[]> {
  return api<ScheduleSlot[]>(
    `/api/shift-requirements/${requirementId}/assignments/${assignmentId}`,
    { method: "DELETE" },
  );
}
