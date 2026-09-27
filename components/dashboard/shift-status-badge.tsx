import { Badge } from "@/components/ui/badge";
import {
  SHIFT_STATUS_LABEL,
  shiftStatusBadgeVariant,
  type ShiftStatus,
} from "@/lib/dashboard";

export function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
  return (
    <Badge variant={shiftStatusBadgeVariant(status)}>
      {SHIFT_STATUS_LABEL[status]}
    </Badge>
  );
}
