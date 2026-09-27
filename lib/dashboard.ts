import { api } from "@/lib/api";

export type ShiftStatus = "DRAFT" | "COLLECTING" | "GENERATED" | "CONFIRMED";

export type DashboardOverview = {
  branchCount: number;
  activeShiftRequirementCount: number;
  latestActive: {
    id: string;
    cycleLabel: string;
    branchName: string;
    status: ShiftStatus;
    submissionCount: number;
  } | null;
  underfilled: {
    id: string;
    cycleLabel: string;
    branchName: string;
    shortSlots: number;
    missingPeople: number;
  }[];
};

export const overviewQueryKey = ["dashboard", "overview"] as const;

export function fetchOverview(): Promise<DashboardOverview> {
  return api<DashboardOverview>("/api/dashboard/overview");
}

export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  DRAFT: "Draft",
  COLLECTING: "Collecting",
  GENERATED: "Generated",
  CONFIRMED: "Confirmed",
};

export function shiftStatusBadgeVariant(
  status: ShiftStatus,
): "outline" | "default" | "secondary" | "success" {
  if (status === "COLLECTING") {
    return "default";
  }

  if (status === "CONFIRMED") {
    return "success";
  }

  if (status === "GENERATED") {
    return "secondary";
  }

  return "outline";
}
