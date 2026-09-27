import { api } from "@/lib/api";
import type { ShiftStatus } from "@/lib/dashboard";

export type PublicShiftLink = {
  status: ShiftStatus;
  restaurantName: string;
  branchName: string;
  cycleLabel: string;
};

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type ShiftType = "DAY" | "NIGHT";

export type AvailabilityEntryInput = {
  day: Weekday;
  shiftType: ShiftType;
  startHour: number;
  endHour: number;
};

export type OwnSubmission =
  | { found: false }
  | {
      found: true;
      workerName: string;
      entries: AvailabilityEntryInput[];
    };

export type PublicAssignedShift = {
  day: Weekday;
  shiftType: ShiftType;
  startHour: number;
  endHour: number;
  branchName: string;
};

export type MySchedule =
  | { status: "GENERATED" }
  | { status: "CONFIRMED"; found: false }
  | {
      status: "CONFIRMED";
      found: true;
      workerName: string;
      shifts: PublicAssignedShift[];
    };

export const WEEKDAY_OPTIONS: { day: Weekday; label: string }[] = [
  { day: "MON", label: "Monday" },
  { day: "TUE", label: "Tuesday" },
  { day: "WED", label: "Wednesday" },
  { day: "THU", label: "Thursday" },
  { day: "FRI", label: "Friday" },
  { day: "SAT", label: "Saturday" },
  { day: "SUN", label: "Sunday" },
];

export function hourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function publicShiftQueryKey(linkToken: string) {
  return ["public-shift", linkToken] as const;
}

export function fetchPublicShift(linkToken: string): Promise<PublicShiftLink> {
  return api<PublicShiftLink>(`/api/public/shift-requirements/${linkToken}`);
}

export function fetchOwnSubmission(
  linkToken: string,
  employeeId: string,
): Promise<OwnSubmission> {
  const params = new URLSearchParams({ employeeId });
  return api<OwnSubmission>(
    `/api/public/shift-requirements/${linkToken}/submission?${params.toString()}`,
  );
}

export function submitAvailability(
  linkToken: string,
  input: {
    workerName: string;
    employeeId: string;
    entries: AvailabilityEntryInput[];
  },
): Promise<void> {
  return api<void>(`/api/public/shift-requirements/${linkToken}/submit`, {
    method: "POST",
    body: input,
  });
}

export function fetchMySchedule(
  linkToken: string,
  employeeId: string,
): Promise<MySchedule> {
  const params = new URLSearchParams({ employeeId });
  return api<MySchedule>(
    `/api/public/shift-requirements/${linkToken}/my-schedule?${params.toString()}`,
  );
}
