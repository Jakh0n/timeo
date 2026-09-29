import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hourLabel,
  type ShiftType,
  type Weekday,
} from "@/lib/public-shift";

function asShiftType(value: string): ShiftType {
  return value === "NIGHT" ? "NIGHT" : "DAY";
}

export type AvailabilityWindow = {
  shiftType: ShiftType;
  startHour: number;
  endHour: number;
};

export type AvailabilityDayState = {
  day: Weekday;
  label: string;
  available: boolean;
  windows: AvailabilityWindow[];
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const fieldClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function defaultWindow(shiftType: ShiftType = "DAY"): AvailabilityWindow {
  if (shiftType === "NIGHT") {
    return { shiftType: "NIGHT", startHour: 21, endHour: 9 };
  }

  return { shiftType: "DAY", startHour: 9, endHour: 17 };
}

export function AvailabilityDay({
  day,
  onChange,
}: {
  day: AvailabilityDayState;
  onChange: (next: AvailabilityDayState) => void;
}) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{day.label}</p>
        <button
          type="button"
          aria-pressed={day.available}
          className={
            day.available
              ? "h-10 shrink-0 rounded-lg bg-primary px-3 text-sm text-primary-foreground"
              : "h-10 shrink-0 rounded-lg border border-border px-3 text-sm"
          }
          onClick={() => {
            onChange({ ...day, available: !day.available });
          }}
        >
          Available this day?
        </button>
      </div>

      {day.available ? (
        <div className="mt-4 space-y-4">
          {day.windows.map((window, index) => (
            <div key={`${day.day}-${index}`} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">Shift</span>
                <select
                  className={fieldClassName}
                  value={window.shiftType}
                  onChange={(event) => {
                    const shiftType = asShiftType(event.target.value);
                    const windows = day.windows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, shiftType } : item,
                    );
                    onChange({ ...day, windows });
                  }}
                >
                  <option value="DAY">Day</option>
                  <option value="NIGHT">Night</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <HourField
                  label="Start"
                  value={window.startHour}
                  onChange={(startHour) => {
                    const windows = day.windows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, startHour } : item,
                    );
                    onChange({ ...day, windows });
                  }}
                />
                <HourField
                  label="End"
                  value={window.endHour}
                  onChange={(endHour) => {
                    const windows = day.windows.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, endHour } : item,
                    );
                    onChange({ ...day, windows });
                  }}
                />
              </div>
              {day.windows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-0"
                  onClick={() => {
                    onChange({
                      ...day,
                      windows: day.windows.filter((_, itemIndex) => itemIndex !== index),
                    });
                  }}
                >
                  <Trash2 />
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-0 text-primary"
            onClick={() => {
              const hasDay = day.windows.some((window) => window.shiftType === "DAY");
              onChange({
                ...day,
                windows: [
                  ...day.windows,
                  defaultWindow(hasDay ? "NIGHT" : "DAY"),
                ],
              });
            }}
          >
            <Plus />
            Add another window
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (hour: number) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select
        className={fieldClassName}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      >
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hourLabel(hour)}
          </option>
        ))}
      </select>
    </label>
  );
}
